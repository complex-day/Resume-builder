"""Repository & persistence layer for Master Truth Vault.

Provides an abstract interface and a LocalJsonVaultStore implementation
storing user vaults in backend/data/vaults/{user_id}.json.
Architected for drop-in Supabase PostgreSQL replacement via environment variables.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
import json
from pathlib import Path
import re
from typing import List, Optional, Tuple

from app.schemas.truth_vault import MasterTruthVault, Project

# Strict alphanumeric, hyphen, underscore pattern to prevent path traversal
USER_ID_REGEX = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")


def validate_user_id(user_id: str) -> str:
    """Validate user_id against path traversal and malicious characters."""
    clean_id = (user_id or "").strip()
    if not clean_id or not USER_ID_REGEX.match(clean_id):
        raise ValueError(
            f"Invalid user_id '{user_id}'. Must be 1-64 alphanumeric characters, underscores, or hyphens."
        )
    return clean_id


class VaultStore(ABC):
    """Abstract interface for Master Truth Vault storage."""

    @abstractmethod
    def save_vault(self, user_id: str, vault: MasterTruthVault) -> MasterTruthVault:
        """Persist or overwrite a user's Master Truth Vault."""
        pass

    @abstractmethod
    def get_vault(self, user_id: str) -> Optional[MasterTruthVault]:
        """Retrieve a user's Master Truth Vault by user_id."""
        pass

    @abstractmethod
    def merge_projects(self, user_id: str, new_projects: List[Project]) -> Tuple[MasterTruthVault, List[str]]:
        """Merge projects into the user vault without overwriting verified highlights or metrics (WC-5)."""
        pass


class LocalJsonVaultStore(VaultStore):
    """Local JSON-based vault persistence for dev, testing, and offline modes."""

    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            # Default to backend/data/vaults
            base_dir = Path(__file__).resolve().parent.parent.parent / "data" / "vaults"
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _get_user_file_path(self, user_id: str) -> Path:
        valid_id = validate_user_id(user_id)
        return self.base_dir / f"{valid_id}.json"

    def save_vault(self, user_id: str, vault: MasterTruthVault) -> MasterTruthVault:
        file_path = self._get_user_file_path(user_id)
        # Update updated_at timestamp
        vault.updated_at = datetime.now(timezone.utc)
        payload = vault.model_dump(mode="json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        return vault

    def get_vault(self, user_id: str) -> Optional[MasterTruthVault]:
        file_path = self._get_user_file_path(user_id)
        if not file_path.exists():
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
        return MasterTruthVault.model_validate(raw_data)

    def merge_projects(self, user_id: str, new_projects: List[Project]) -> Tuple[MasterTruthVault, List[str]]:
        """Merge projects into vault, preserving existing verified metrics and tracking skipped duplicates."""
        vault = self.get_vault(user_id)
        if not vault:
            raise FileNotFoundError(f"Vault for user '{user_id}' does not exist.")

        # Index existing project IDs
        existing_ids = {p.id.strip().lower() for p in vault.projects}
        merged_projects = list(vault.projects)
        skipped_project_ids: List[str] = []

        # Append non-duplicate projects only (never overwrite existing verified user metrics)
        for proj in new_projects:
            pid = proj.id.strip().lower()
            if pid not in existing_ids:
                existing_ids.add(pid)
                merged_projects.append(proj)
            else:
                skipped_project_ids.append(proj.id)

        vault.projects = merged_projects
        saved_vault = self.save_vault(user_id, vault)
        return saved_vault, skipped_project_ids


# Singleton factory for dependency injection
_default_store = LocalJsonVaultStore()


def get_vault_store() -> VaultStore:
    """Return the configured VaultStore instance."""
    return _default_store
