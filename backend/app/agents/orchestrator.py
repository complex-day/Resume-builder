"""LangGraph Multi-Agent Orchestrator for Step 2.

Pipelines: JD Decoder -> Resume Architect -> ATS Critic
With automatic iterative retry loop (max 2 retries) if ATS score < 85%.
"""

from typing import Any, Dict, List, Optional, TypedDict
from langgraph.graph import StateGraph, END

from app.schemas.pipeline import (
    ATSCritique,
    DecodedJD,
    PipelineRunResponse,
    TailoredResume,
)
from app.schemas.truth_vault import MasterTruthVault
from app.agents.jd_decoder import decode_jd
from app.agents.resume_architect import build_tailored_resume
from app.agents.ats_critic import critique_resume


class ResumePipelineState(TypedDict, total=False):
    """Execution state passed through the LangGraph pipeline."""
    vault: MasterTruthVault
    raw_jd_text: str
    source_url: Optional[str]
    decoded_jd: DecodedJD
    tailored_resume: TailoredResume
    ats_critique: ATSCritique
    critic_feedback: List[str]
    attempts: int
    decoder_override: Optional[Any]
    architect_override: Optional[Any]
    critic_override: Optional[Any]


async def decode_jd_node(state: ResumePipelineState) -> Dict[str, Any]:
    """Node 1: Extract criteria, skills, and portal info from raw JD text."""
    decoded = await decode_jd(
        raw_jd_text=state["raw_jd_text"],
        source_url=state.get("source_url"),
        llm_override=state.get("decoder_override"),
    )
    return {"decoded_jd": decoded}


async def architect_node(state: ResumePipelineState) -> Dict[str, Any]:
    """Node 2: Select projects and write STAR/XYZ tailored resume bullets."""
    current_attempts = state.get("attempts", 0) + 1
    tailored = await build_tailored_resume(
        vault=state["vault"],
        decoded_jd=state["decoded_jd"],
        critic_feedback=state.get("critic_feedback"),
        llm_override=state.get("architect_override"),
    )
    return {
        "tailored_resume": tailored,
        "attempts": current_attempts,
    }


async def critic_node(state: ResumePipelineState) -> Dict[str, Any]:
    """Node 3: Deterministically score keyword coverage and verify grounding."""
    critique = await critique_resume(
        vault=state["vault"],
        decoded_jd=state["decoded_jd"],
        tailored=state["tailored_resume"],
        llm_override=state.get("critic_override"),
    )
    return {
        "ats_critique": critique,
        "critic_feedback": critique.actionable_feedback,
    }


def route_critique(state: ResumePipelineState) -> str:
    """Conditional Edge: Route to END if passed or max 2 retries (total 3 attempts) reached."""
    critique = state["ats_critique"]
    attempts = state.get("attempts", 1)

    # If score >= 85 and no hallucinations, or max 3 attempts reached
    if critique.passed or attempts >= 3:
        return "end"

    return "retry"


def build_pipeline_graph():
    """Construct and compile the LangGraph StateGraph."""
    workflow = StateGraph(ResumePipelineState)

    # Register Nodes
    workflow.add_node("decode_jd_node", decode_jd_node)
    workflow.add_node("architect_node", architect_node)
    workflow.add_node("critic_node", critic_node)

    # Configure Edges
    workflow.set_entry_point("decode_jd_node")
    workflow.add_edge("decode_jd_node", "architect_node")
    workflow.add_edge("architect_node", "critic_node")

    # Conditional feedback loop
    workflow.add_conditional_edges(
        "critic_node",
        route_critique,
        {
            "end": END,
            "retry": "architect_node",
        },
    )

    return workflow.compile()


# Compiled singleton graph
_compiled_pipeline = build_pipeline_graph()


async def run_resume_pipeline(
    vault: MasterTruthVault,
    raw_jd_text: str,
    source_url: Optional[str] = None,
    decoder_override: Optional[Any] = None,
    architect_override: Optional[Any] = None,
    critic_override: Optional[Any] = None,
) -> PipelineRunResponse:
    """Execute the 3-agent orchestration pipeline with retry loop."""
    initial_state: ResumePipelineState = {
        "vault": vault,
        "raw_jd_text": raw_jd_text,
        "source_url": source_url,
        "critic_feedback": [],
        "attempts": 0,
        "decoder_override": decoder_override,
        "architect_override": architect_override,
        "critic_override": critic_override,
    }

    final_state = await _compiled_pipeline.ainvoke(initial_state)

    critique = final_state["ats_critique"]
    status = "passed" if critique.passed else "best_effort_after_max_retries"

    return PipelineRunResponse(
        decoded_jd=final_state["decoded_jd"],
        tailored_resume=final_state["tailored_resume"],
        ats_critique=critique,
        attempts=final_state.get("attempts", 1),
        status=status,
    )
