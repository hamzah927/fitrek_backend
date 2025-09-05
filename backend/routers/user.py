from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from ..utils.auth import get_current_user_id
from ..schemas import UserStatusRequest

router = APIRouter(prefix="/user-status", tags=["User Status"])

# Import supabase from main
from ..main import supabase

@router.post("/")
async def update_user_status(
    request_data: UserStatusRequest,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, str]:
    """
    Update the user's status flags in the database.
    """
    try:
        # Update the user_status_flags column for the current user
        response = supabase.table("users").update({
            "user_status_flags": request_data.status
        }).eq("id", user_id).execute()

        if response.data:
            return {"status": "success", "message": "User status updated successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user status"
            )
    except Exception as e:
        print(f"Error updating user status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )