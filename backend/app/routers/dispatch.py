"""Dispatch ranking and saved-brief endpoints.

/ranking just computes and returns; /dispatch saves the current result as a
DispatchPlan row so there's a history of committed decisions.
"""

from __future__ import annotations

import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas, scoring
from ..database import get_db
from .incidents import get_incident_or_404

router = APIRouter(prefix="/api", tags=["dispatch"])


@router.get("/incidents/{incident_id}/ranking", response_model=schemas.RankingOut)
def rank_incident(incident_id: int, db: Session = Depends(get_db)) -> schemas.RankingOut:
    incident = get_incident_or_404(incident_id, db)
    result = scoring.compute(incident)
    return schemas.RankingOut(
        incident_id=incident.id,
        incident_name=incident.name,
        ranked=result["ranked"],
        metrics=result["metrics"],
        top_mission=result["top_mission"],
        action_plan=result["action_plan"],
        brief_text=result["brief_text"],
    )


@router.post(
    "/incidents/{incident_id}/dispatch",
    response_model=schemas.DispatchPlanOut,
    status_code=status.HTTP_201_CREATED,
)
def commit_dispatch(incident_id: int, db: Session = Depends(get_db)) -> models.DispatchPlan:
    incident = get_incident_or_404(incident_id, db)
    result = scoring.compute(incident)
    if not result["ranked"]:
        raise HTTPException(status_code=400, detail="Cannot commit a dispatch with no zones")

    top = result["ranked"][0]
    plan = models.DispatchPlan(
        incident_id=incident.id,
        top_zone_name=top["name"],
        top_need=top["need"],
        impact_score=result["metrics"]["impact"],
        coverage=result["metrics"]["coverage"],
        residual_risk=result["metrics"]["residual_risk"],
        brief_text=result["brief_text"],
        payload=json.dumps({
            "ranked": result["ranked"],
            "action_plan": result["action_plan"],
            "top_mission": result["top_mission"],
        }),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/incidents/{incident_id}/dispatch-plans", response_model=List[schemas.DispatchPlanOut])
def list_dispatch_plans(incident_id: int, db: Session = Depends(get_db)) -> List[models.DispatchPlan]:
    get_incident_or_404(incident_id, db)
    return list(
        db.scalars(
            select(models.DispatchPlan)
            .where(models.DispatchPlan.incident_id == incident_id)
            .order_by(models.DispatchPlan.created_at.desc())
        )
    )


@router.delete("/dispatch-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dispatch_plan(plan_id: int, db: Session = Depends(get_db)) -> Response:
    plan = db.get(models.DispatchPlan, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Dispatch plan not found")
    db.delete(plan)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
