from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from datetime import datetime
import uuid
from ..utils.auth import get_current_user_id
from ..schemas import GoalRequest, GoalUpdateRequest, GoalResponse

router = APIRouter(prefix="/goals", tags=["Goals"])

# Import supabase from main
from ..main import supabase

@router.get("/", response_model=List[GoalResponse])
async def get_goals(
    user_id: str = Depends(get_current_user_id)
) -> List[GoalResponse]:
    """
    Fetch all goals for the current user.
    """
    try:
        response = supabase.table("goals").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        if response.data:
            return [GoalResponse(**goal) for goal in response.data]
        else:
            return []
    except Exception as e:
        print(f"Error fetching goals: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/", response_model=GoalResponse)
async def create_goal(
    request_data: GoalRequest,
    user_id: str = Depends(get_current_user_id)
) -> GoalResponse:
    """
    Create a new goal for the current user.
    """
    try:
        goal_id = str(uuid.uuid4())
        start_date = request_data.start_date or datetime.utcnow().isoformat()
        
        goal_data = {
            "id": goal_id,
            "user_id": user_id,
            "type": request_data.type,
            "name": request_data.name,
            "target_value": request_data.target_value,
            "current_value": request_data.current_value,
            "unit": request_data.unit,
            "start_date": start_date,
            "end_date": request_data.end_date,
            "status": request_data.status,
            "exercise_id": request_data.exercise_id,
            "description": request_data.description,
        }
        
        response = supabase.table("goals").insert(goal_data).execute()
        
        if response.data:
            return GoalResponse(**response.data[0])
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create goal"
            )
    except Exception as e:
        print(f"Error creating goal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    request_data: GoalUpdateRequest,
    user_id: str = Depends(get_current_user_id)
) -> GoalResponse:
    """
    Update an existing goal for the current user.
    """
    try:
        # Build update data from non-None fields
        update_data = {}
        for field, value in request_data.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        response = supabase.table("goals").update(update_data).eq("id", goal_id).eq("user_id", user_id).execute()
        
        if response.data:
            return GoalResponse(**response.data[0])
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found or not authorized to update"
            )
    except Exception as e:
        print(f"Error updating goal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, str]:
    """
    Delete a goal for the current user.
    """
    try:
        response = supabase.table("goals").delete().eq("id", goal_id).eq("user_id", user_id).execute()
        
        if response.data:
            return {"status": "success", "message": "Goal deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found or not authorized to delete"
            )
    except Exception as e:
        print(f"Error deleting goal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.patch("/{goal_id}/progress")
async def update_goal_progress(
    goal_id: str,
    progress_data: Dict[str, float],
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, str]:
    """
    Update the current progress value for a goal.
    """
    try:
        new_value = progress_data.get("current_value")
        if new_value is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="current_value is required"
            )
        
        # Fetch the goal to check target value
        goal_response = supabase.table("goals").select("target_value, status").eq("id", goal_id).eq("user_id", user_id).single().execute()
        
        if not goal_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found"
            )
        
        goal = goal_response.data
        target_value = goal["target_value"]
        current_status = goal["status"]
        
        # Determine if goal is completed
        is_completed = new_value >= target_value
        new_status = "completed" if is_completed else current_status
        
        # Update the goal
        response = supabase.table("goals").update({
            "current_value": new_value,
            "status": new_status
        }).eq("id", goal_id).eq("user_id", user_id).execute()
        
        if response.data:
            return {
                "status": "success", 
                "message": "Goal progress updated successfully",
                "goal_completed": str(is_completed).lower()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update goal progress"
            )
    except Exception as e:
        print(f"Error updating goal progress: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )