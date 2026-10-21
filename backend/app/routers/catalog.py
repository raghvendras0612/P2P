from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.catalog import CareerPath, Interest, Skill
from app.schemas.catalog import CareerPathRead, InterestRead, SkillRead

router = APIRouter(prefix="/catalog", tags=["Catalogs"])


@router.get("/skills", response_model=List[SkillRead])
def get_skills_catalog(
    q: Optional[str] = Query(None, description="Search term matching skill name or aliases"),
    category: Optional[str] = Query(None, description="Filter skills by exact category"),
    db: Session = Depends(get_db),
):
    """Retrieve catalog skills with optional search and category filtering."""
    query = db.query(Skill)

    if category:
        query = query.filter(Skill.category == category)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Skill.name.ilike(search_pattern),
                Skill.aliases.ilike(search_pattern),
            )
        )

    return query.order_by(Skill.category, Skill.name).all()


@router.get("/interests", response_model=List[InterestRead])
def get_interests_catalog(db: Session = Depends(get_db)):
    """Retrieve all available interest options grouped by category."""
    return db.query(Interest).order_by(Interest.group, Interest.name).all()


@router.get("/paths", response_model=List[CareerPathRead])
def get_career_paths_catalog(db: Session = Depends(get_db)):
    """Retrieve all standard engineering career paths."""
    return db.query(CareerPath).order_by(CareerPath.name).all()
