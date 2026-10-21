from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.simulation import Simulation, SimulationJob
from app.models.user import User
from app.schemas.simulation import (
    CreateSimulationRequest,
    RegeneratePathRequest,
    ResimulateRequest,
    SimulationComparisonSummary,
    SimulationDetailResponse,
    SimulationJobResponse,
    SimulationOutput,
    SimulationSummaryResponse,
)
from app.services.ai import compute_simulation_comparison
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulations", tags=["AI Career Simulations"])
simulation_service = SimulationService()


@router.post("", response_model=SimulationJobResponse, status_code=status.HTTP_202_ACCEPTED)
def create_simulation(
    request: CreateSimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Initiates an AI Career Simulation run for the authenticated student.

    Supports 'auto' (best fit 3 paths) or 'custom' (up to 3 specific catalog paths).
    Enforces per-user rate limits and snapshot caching.
    """
    job = simulation_service.create_simulation_job(
        db=db,
        user_id=current_user.id,
        req=request,
    )
    return SimulationJobResponse(
        job_id=job.id,
        status=job.status,  # type: ignore[arg-type]
        simulation_id=job.simulation_id,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.get("/jobs/{job_id}", response_model=SimulationJobResponse)
def get_simulation_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Polls the status of an active or completed simulation job."""
    job = db.query(SimulationJob).filter(SimulationJob.id == job_id).first()
    if not job or job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation job not found or access denied.",
        )

    return SimulationJobResponse(
        job_id=job.id,
        status=job.status,  # type: ignore[arg-type]
        simulation_id=job.simulation_id,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.get("/history", response_model=List[SimulationSummaryResponse])
def list_simulation_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all past immutable simulations generated for the student."""
    sims = (
        db.query(Simulation)
        .filter(Simulation.user_id == current_user.id)
        .order_by(Simulation.created_at.desc())
        .all()
    )

    summaries: List[SimulationSummaryResponse] = []
    for s in sims:
        out_dict = s.output_json or {}
        paths = out_dict.get("paths", [])
        top_slug = paths[0].get("path_slug") if paths else None
        top_title = paths[0].get("title") if paths else None
        scores = {p.get("path_slug"): p.get("fit_score") for p in paths if p.get("path_slug")}

        summaries.append(
            SimulationSummaryResponse(
                id=s.id,
                user_id=s.user_id,
                mode=s.mode,
                prompt_version=s.prompt_version,
                model_name=s.model_name,
                created_at=s.created_at,
                top_path_slug=top_slug,
                top_path_title=top_title,
                fit_scores=scores,
            )
        )
    return summaries


@router.get("/{simulation_id}", response_model=SimulationDetailResponse)
def get_simulation_detail(
    simulation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetches full immutable simulation record with validated 3-path roadmap.

    Enforces strict ownership: students cannot view other students' simulations.
    """
    sim = (
        db.query(Simulation)
        .filter(Simulation.id == simulation_id, Simulation.user_id == current_user.id)
        .first()
    )
    if not sim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation record not found or access denied.",
        )

    output = SimulationOutput.model_validate(sim.output_json)

    # If there is a prior simulation for this user, compute comparison summary
    comparison: SimulationComparisonSummary | None = None
    prior_sim = (
        db.query(Simulation)
        .filter(
            Simulation.user_id == current_user.id,
            Simulation.id < sim.id,
        )
        .order_by(Simulation.id.desc())
        .first()
    )
    if prior_sim:
        try:
            prior_output = SimulationOutput.model_validate(prior_sim.output_json)
            comparison = compute_simulation_comparison(prior_output, output)
        except Exception:
            pass

    return SimulationDetailResponse(
        id=sim.id,
        user_id=sim.user_id,
        mode=sim.mode,
        prompt_version=sim.prompt_version,
        model_name=sim.model_name,
        created_at=sim.created_at,
        input_snapshot=sim.input_snapshot,
        output=output,
        comparison=comparison,
    )


@router.post(
    "/{simulation_id}/resimulate",
    response_model=SimulationJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def resimulate_with_what_if_delta(
    simulation_id: int,
    request: ResimulateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-runs simulation using the student's CURRENT profile plus an optional 'what-if' delta.

    Compares new simulation against the specified baseline simulation.
    """
    job = simulation_service.resimulate(
        db=db,
        user_id=current_user.id,
        baseline_sim_id=simulation_id,
        req=request,
    )
    return SimulationJobResponse(
        job_id=job.id,
        status=job.status,  # type: ignore[arg-type]
        simulation_id=job.simulation_id,
        error_message=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.post("/{simulation_id}/regenerate-path", response_model=SimulationDetailResponse)
def regenerate_single_career_path(
    simulation_id: int,
    request: RegeneratePathRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-simulates a single career path while keeping the other two paths intact.

    Creates a new immutable simulation record reflecting the update.
    """
    new_sim = simulation_service.regenerate_single_path(
        db=db,
        user_id=current_user.id,
        simulation_id=simulation_id,
        req=request,
    )
    output = SimulationOutput.model_validate(new_sim.output_json)
    return SimulationDetailResponse(
        id=new_sim.id,
        user_id=new_sim.user_id,
        mode=new_sim.mode,
        prompt_version=new_sim.prompt_version,
        model_name=new_sim.model_name,
        created_at=new_sim.created_at,
        input_snapshot=new_sim.input_snapshot,
        output=output,
        comparison=None,
    )
