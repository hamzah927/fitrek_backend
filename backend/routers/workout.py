from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from datetime import datetime
import uuid
from ..utils.auth import get_current_user_id
from ..schemas import WorkoutLogRequest

router = APIRouter(prefix="/workout-logs", tags=["Workout Logs"])

# Import supabase from main
from ..main import supabase

@router.post("/")
async def save_workout_log(
    request_data: WorkoutLogRequest,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, str]:
    """
    Save a workout log to the database.
    """
    try:
        # Use provided date or current timestamp
        workout_date = request_data.date or datetime.utcnow().isoformat()
        
        # Insert the workout log
        response = supabase.table("workout_logs").insert({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "workout_id": request_data.workout_id,
            "exercises": [ex.dict() for ex in request_data.exercises],
            "date": workout_date
        }).execute()

        if response.data:
            # Update user's last_workout_date
            supabase.table("users").update({
                "last_workout_date": workout_date
            }).eq("id", user_id).execute()
            
            return {"status": "success", "message": "Workout log saved successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save workout log"
            )
    except Exception as e:
        print(f"Error saving workout log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )