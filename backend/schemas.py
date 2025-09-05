from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class GoalType(str, Enum):
    strength = "strength"
    weight_loss = "weight_loss"
    consistency = "consistency"
    endurance = "endurance"
    custom = "custom"

class GoalStatus(str, Enum):
    active = "active"
    completed = "completed"
    failed = "failed"
    archived = "archived"

class WorkoutExercise(BaseModel):
    exerciseId: int | str
    sets: List[Dict[str, Any]]

class WorkoutLogRequest(BaseModel):
    workout_id: str
    exercises: List[WorkoutExercise]
    date: Optional[str] = None

class UserStatusRequest(BaseModel):
    status: Dict[str, Any]

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    message: str
    details: Dict[str, Any]
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True

class GoalRequest(BaseModel):
    type: GoalType
    name: str
    target_value: float
    current_value: Optional[float] = 0
    unit: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[GoalStatus] = GoalStatus.active
    exercise_id: Optional[str] = None
    description: Optional[str] = None

class GoalUpdateRequest(BaseModel):
    type: Optional[GoalType] = None
    name: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[GoalStatus] = None
    exercise_id: Optional[str] = None
    description: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    user_id: str
    type: str
    name: str
    target_value: float
    current_value: float
    unit: str
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    exercise_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True