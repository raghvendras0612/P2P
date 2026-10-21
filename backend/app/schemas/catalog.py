from typing import Optional

from pydantic import BaseModel, ConfigDict


class SkillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    aliases: Optional[str] = None
    is_verified_seed: bool = True


class InterestRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    group: str


class CareerPathRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    description: str
