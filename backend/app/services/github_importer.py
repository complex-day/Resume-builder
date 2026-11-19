"""GitHub API auto-importer service for public repository discovery and Project extraction.

Strictly adheres to .agent/rules/truth-vault-rule.md:
- No invented metrics or highlights.
- Factual grounding directly from repository metadata, languages, and clean README excerpts.
"""

import asyncio
import base64
import os
import re
from typing import Any, Dict, List, Optional
from fastapi import HTTPException
import httpx

from app.schemas.truth_vault import Project


def clean_markdown_readme(content: str) -> str:
    """Clean markdown text from a repository README, stripping badges, images, and HTML."""
    if not content:
        return ""

    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", content)
    # Remove linked images/badges: [![alt](img)](url)
    text = re.sub(r"\[!\[.*?\]\(.*?\)\]\(.*?\)", " ", text)
    # Remove images: ![alt](url)
    text = re.sub(r"!\[.*?\]\(.*?\)", " ", text)
    # Replace markdown links [text](url) with just text
    text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)
    # Remove code blocks ```...```
    text = re.sub(r"```[\s\S]*?```", " ", text)
    # Remove inline code `...`
    text = re.sub(r"`([^`]+)`", r"\1", text)
    # Remove markdown headings (#, ##, etc.)
    text = re.sub(r"^#+\s*", "", text, flags=re.MULTILINE)
    # Remove shields.io or common badge URLs if any remain
    text = re.sub(r"https?://(?:img\.shields\.io|badge\.fury\.io|codecov\.io|github\.com/[^\s]+/workflows)[^\s]+", " ", text)

    # Filter out empty or badge-only lines
    cleaned_lines: List[str] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        lower_line = line.lower()
        if any(badge in lower_line for badge in ["badge", "license:", "build status", "coverage", "stars"]):
            continue
        cleaned_lines.append(line)

    clean_text = " ".join(cleaned_lines)
    # Collapse consecutive whitespace
    clean_text = re.sub(r"\s+", " ", clean_text).strip()
    return clean_text


def _build_factual_description(name: str, raw_desc: Optional[str], readme_snippet: Optional[str]) -> str:
    """Construct factual project description without hallucinating or inventing capabilities."""
    desc = (raw_desc or "").strip()
    snippet = (readme_snippet or "").strip()

    if desc and snippet:
        # Avoid redundant repetition if readme begins with the same description
        if snippet.lower().startswith(desc.lower()):
            combined = snippet
        else:
            combined = f"{desc} - {snippet}"
    elif desc:
        combined = desc
    elif snippet:
        combined = snippet
    else:
        combined = f"GitHub repository: {name}"

    # Truncate cleanly to around 500 characters
    if len(combined) > 500:
        combined = combined[:497].rstrip() + "..."

    return combined or f"GitHub repository: {name}"


async def _fetch_repo_details(
    client: httpx.AsyncClient,
    owner: str,
    repo: Dict[str, Any]
) -> Project:
    """Fetch languages and README for a single repository and construct a Project model."""
    name = repo.get("name", "")
    repo_slug = name.lower()
    html_url = repo.get("html_url")
    homepage = repo.get("homepage")
    live_url = homepage.strip() if (homepage and isinstance(homepage, str) and homepage.strip()) else None
    tagline = repo.get("description")

    languages_url = repo.get("languages_url") or f"https://api.github.com/repos/{owner}/{name}/languages"
    readme_url = f"https://api.github.com/repos/{owner}/{name}/readme"

    # Fetch languages and readme concurrently
    lang_task = client.get(languages_url)
    readme_task = client.get(readme_url)

    lang_resp, readme_resp = await asyncio.gather(lang_task, readme_task, return_exceptions=True)

    # Process languages
    languages: List[str] = []
    if not isinstance(lang_resp, Exception) and lang_resp.status_code == 200:
        try:
            lang_data = lang_resp.json()
            if isinstance(lang_data, dict):
                languages = list(lang_data.keys())
        except Exception:
            languages = []

    # Process topics
    topics: List[str] = repo.get("topics") or []

    # Combine tech stack (deduplicated preserving order)
    seen_tech = set()
    tech_stack: List[str] = []
    for item in languages + topics:
        cleaned = item.strip()
        if cleaned and cleaned.lower() not in seen_tech:
            seen_tech.add(cleaned.lower())
            tech_stack.append(cleaned)

    # Process README
    readme_clean = ""
    if not isinstance(readme_resp, Exception) and readme_resp.status_code == 200:
        try:
            readme_data = readme_resp.json()
            encoded_content = readme_data.get("content", "")
            if encoded_content:
                raw_bytes = base64.b64decode(encoded_content)
                raw_markdown = raw_bytes.decode("utf-8", errors="replace")
                readme_clean = clean_markdown_readme(raw_markdown)
        except Exception:
            readme_clean = ""

    description = _build_factual_description(name, tagline, readme_clean)

    return Project(
        id=repo_slug,
        name=name,
        tagline=tagline if (tagline and tagline.strip()) else None,
        description=description,
        highlights=[],  # Strictly empty per truth-vault-rule.md (never fabricate highlights)
        tech_stack=tech_stack,
        repo_url=html_url,
        live_url=live_url,
        metrics=[],  # Strictly empty per truth-vault-rule.md (never fabricate metrics)
    )


async def fetch_github_projects(username: str, max_repos: int = 8) -> List[Project]:
    """Fetch public, non-forked GitHub repositories for a given username and map into Project schemas."""
    clean_username = username.strip()
    if not clean_username:
        raise HTTPException(status_code=400, detail="GitHub username must not be empty.")

    headers: Dict[str, str] = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "ResumeBuilder-AutoImport/1.0",
    }
    github_token = os.getenv("GITHUB_TOKEN")
    if github_token:
        headers["Authorization"] = f"Bearer {github_token.strip()}"

    repos_url = f"https://api.github.com/users/{clean_username}/repos"
    params = {
        "sort": "updated",
        "direction": "desc",
        "per_page": min(max(max_repos * 2, 10), 50),
    }

    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        try:
            resp = await client.get(repos_url, params=params)
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="GitHub API request timed out after 10 seconds.")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Failed to connect to GitHub API: {exc}")

        if resp.status_code == 404:
            raise HTTPException(status_code=404, detail=f"GitHub user '{clean_username}' was not found.")
        elif resp.status_code == 403:
            raise HTTPException(
                status_code=403,
                detail="GitHub API rate limit exceeded. Set GITHUB_TOKEN environment variable to increase limit."
            )
        elif resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"GitHub API returned error: {resp.text}"
            )

        repos_data = resp.json()
        if not isinstance(repos_data, list):
            return []

        # Filter out forked repositories and cap at max_repos
        non_forked_repos = [repo for repo in repos_data if not repo.get("fork", False)][:max_repos]

        if not non_forked_repos:
            return []

        # Fetch details for selected repos concurrently
        project_tasks = [
            _fetch_repo_details(client, clean_username, repo)
            for repo in non_forked_repos
        ]
        projects = await asyncio.gather(*project_tasks)

        return list(projects)
