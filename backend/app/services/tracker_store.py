"""Persistence and analytics service for Application Tracker & Self-Learning Feedback Loop.

Provides LocalJsonTrackerStore storing user application records under
backend/data/applications/{user_id}.json with strict path-traversal sanitization.
"""

from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import uuid

from app.schemas.tracker import (
    ApplicationCreateRequest,
    ApplicationRecord,
    ApplicationStatus,
    ApplicationStatusUpdateRequest,
    ResumeStyleTag,
    StylePerformanceMetric,
    TrackerAnalyticsResponse,
)
from app.services.vault_store import validate_user_id

POSITIVE_CALLBACK_STATUSES = {"shortlisted", "interview", "offer"}
KNOWN_STYLE_TAGS = ["metrics_heavy", "project_first", "skills_first", "concise_startup", "formal_govt"]


class LocalJsonTrackerStore:
    """Local JSON-based application tracker persistence and deterministic callback analytics."""

    def __init__(self, base_dir: Optional[Path] = None):
        if base_dir is None:
            base_dir = Path(__file__).resolve().parent.parent.parent / "data" / "applications"
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _get_user_file_path(self, user_id: str) -> Path:
        valid_id = validate_user_id(user_id)
        return self.base_dir / f"{valid_id}.json"

    def _load_user_data(self, user_id: str) -> Dict[str, Any]:
        file_path = self._get_user_file_path(user_id)
        if not file_path.exists():
            return {"user_id": user_id, "applications": []}
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"user_id": user_id, "applications": []}

    def _save_user_data(self, user_id: str, data: Dict[str, Any]) -> None:
        file_path = self._get_user_file_path(user_id)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def create_application(self, user_id: str, request: ApplicationCreateRequest) -> ApplicationRecord:
        """Create and persist a new application record."""
        valid_id = validate_user_id(user_id)
        data = self._load_user_data(valid_id)

        app_id = f"app_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        record = ApplicationRecord(
            application_id=app_id,
            user_id=valid_id,
            company_name=request.company_name,
            role_title=request.role_title,
            detected_portal=request.detected_portal,
            source_url=request.source_url,
            ats_score=request.ats_score,
            style_tag=request.style_tag,
            selected_project_ids=request.selected_project_ids,
            status=request.status,
            notes=request.notes,
            created_at=now_iso,
            updated_at=now_iso,
        )

        data["applications"].append(record.model_dump(mode="json"))
        self._save_user_data(valid_id, data)
        return record

    def list_applications(self, user_id: str, status: Optional[str] = None) -> List[ApplicationRecord]:
        """List all applications for user, optionally filtered by status."""
        valid_id = validate_user_id(user_id)
        data = self._load_user_data(valid_id)
        raw_apps = data.get("applications", [])

        records = [ApplicationRecord.model_validate(a) for a in raw_apps]
        if status:
            clean_status = status.strip().lower()
            records = [r for r in records if r.status.lower() == clean_status]

        # Sort by creation date descending
        records.sort(key=lambda r: r.created_at, reverse=True)
        return records

    def get_application(self, user_id: str, application_id: str) -> Optional[ApplicationRecord]:
        """Fetch a specific application by application_id."""
        valid_id = validate_user_id(user_id)
        data = self._load_user_data(valid_id)
        clean_app_id = (application_id or "").strip()

        for a in data.get("applications", []):
            if a.get("application_id") == clean_app_id:
                return ApplicationRecord.model_validate(a)
        return None

    def update_status(
        self,
        user_id: str,
        application_id: str,
        update: ApplicationStatusUpdateRequest,
    ) -> Optional[ApplicationRecord]:
        """Update the lifecycle status and optional notes of an existing application."""
        valid_id = validate_user_id(user_id)
        data = self._load_user_data(valid_id)
        clean_app_id = (application_id or "").strip()

        target_idx = None
        for idx, a in enumerate(data.get("applications", [])):
            if a.get("application_id") == clean_app_id:
                target_idx = idx
                break

        if target_idx is None:
            return None

        app_dict = data["applications"][target_idx]
        app_dict["status"] = update.status
        if update.notes is not None:
            app_dict["notes"] = update.notes
        app_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

        data["applications"][target_idx] = app_dict
        self._save_user_data(valid_id, data)
        return ApplicationRecord.model_validate(app_dict)

    def compute_analytics_and_feedback(self, user_id: str) -> TrackerAnalyticsResponse:
        """Compute callback conversion rates, rank styles, and generate data-driven feedback insights.

        Pure deterministic Python analytics with zero LLM hallucination:
        - Ranks resume styles by callback rate (tie-breaking on average ATS score)
        - Highlights top-performing projects featured in shortlisted/interview rounds
        """
        valid_id = validate_user_id(user_id)
        apps = self.list_applications(valid_id)

        if not apps:
            return TrackerAnalyticsResponse(
                user_id=valid_id,
                total_applications=0,
                status_breakdown={},
                portal_breakdown={},
                overall_callback_rate_pct=0.0,
                avg_ats_score=0.0,
                style_performance=[],
                recommended_style_tag=None,
                feedback_insights=[
                    "No applications logged yet. Save or submit tailored applications to activate callback analytics."
                ],
            )

        total_apps = len(apps)
        status_breakdown: Dict[str, int] = defaultdict(int)
        portal_breakdown: Dict[str, int] = defaultdict(int)

        style_groups: Dict[ResumeStyleTag, List[ApplicationRecord]] = defaultdict(list)
        positive_callback_project_ids: List[str] = []

        total_ats = 0
        total_applied_or_progressed = 0
        total_positive_callbacks = 0

        for a in apps:
            status_breakdown[a.status] += 1
            portal_breakdown[a.detected_portal] += 1
            style_groups[a.style_tag].append(a)
            total_ats += a.ats_score

            # All statuses except 'saved' count toward active application pipeline
            if a.status != "saved":
                total_applied_or_progressed += 1
                if a.status in POSITIVE_CALLBACK_STATUSES:
                    total_positive_callbacks += 1
                    positive_callback_project_ids.extend(a.selected_project_ids)

        avg_ats = round(total_ats / total_apps, 1)
        overall_callback_rate = (
            round((total_positive_callbacks / total_applied_or_progressed) * 100.0, 1)
            if total_applied_or_progressed > 0
            else 0.0
        )

        # Style Performance Metrics Calculation
        style_metrics: List[StylePerformanceMetric] = []
        for style_tag, group in style_groups.items():
            count = len(group)
            active_count = sum(1 for g in group if g.status != "saved")
            positive_count = sum(1 for g in group if g.status in POSITIVE_CALLBACK_STATUSES)
            rate = round((positive_count / active_count * 100.0), 1) if active_count > 0 else 0.0
            avg_style_ats = round(sum(g.ats_score for g in group) / count, 1)

            style_metrics.append(
                StylePerformanceMetric(
                    style_tag=style_tag,
                    total_applications=count,
                    positive_callbacks=positive_count,
                    callback_rate_pct=rate,
                    avg_ats_score=avg_style_ats,
                )
            )

        # Sort styles: highest callback rate -> highest positive count -> highest avg ATS score
        style_metrics.sort(
            key=lambda s: (s.callback_rate_pct, s.positive_callbacks, s.avg_ats_score),
            reverse=True,
        )

        # Recommend style only if at least 1 positive callback has been achieved
        recommended_style: Optional[ResumeStyleTag] = None
        if total_positive_callbacks > 0 and style_metrics and style_metrics[0].positive_callbacks > 0:
            recommended_style = style_metrics[0].style_tag

        # Generate Data-Driven Feedback Insights
        feedback_insights: List[str] = []

        # Insight 1: Style Performance
        if recommended_style and style_metrics:
            top_style = style_metrics[0]
            feedback_insights.append(
                f"Resume style '{top_style.style_tag}' achieved the highest callback rate of {top_style.callback_rate_pct}% "
                f"({top_style.positive_callbacks} positive callbacks across {top_style.total_applications} apps) — prioritize this style for future synthesis."
            )
        else:
            feedback_insights.append(
                f"Average ATS score is {avg_ats}%. Awaiting initial interview callbacks to establish data-backed style prioritization."
            )

        # Insight 2: High-converting Truth Vault Projects
        if positive_callback_project_ids:
            proj_counts = Counter(positive_callback_project_ids)
            top_projects = proj_counts.most_common(3)
            p_desc = ", ".join(f"'{p[0]}' ({p[1]} callback{'s' if p[1] > 1 else ''})" for p in top_projects)
            feedback_insights.append(
                f"Top-converting Truth Vault projects: {p_desc}. Feature these projects prominently in relevant role applications."
            )

        # Insight 3: Portal Application Volume
        if portal_breakdown:
            top_portal, top_p_count = max(portal_breakdown.items(), key=lambda x: x[1])
            feedback_insights.append(
                f"Highest application volume recorded on '{top_portal}' ({top_p_count} application{'s' if top_p_count > 1 else ''})."
            )

        return TrackerAnalyticsResponse(
            user_id=valid_id,
            total_applications=total_apps,
            status_breakdown=dict(status_breakdown),
            portal_breakdown=dict(portal_breakdown),
            overall_callback_rate_pct=overall_callback_rate,
            avg_ats_score=avg_ats,
            style_performance=style_metrics,
            recommended_style_tag=recommended_style,
            feedback_insights=feedback_insights,
        )


_tracker_store_instance: Optional[LocalJsonTrackerStore] = None


def get_tracker_store() -> LocalJsonTrackerStore:
    """Get or create singleton LocalJsonTrackerStore."""
    global _tracker_store_instance
    if _tracker_store_instance is None:
        _tracker_store_instance = LocalJsonTrackerStore()
    return _tracker_store_instance
