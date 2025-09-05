from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from ..utils.auth import get_current_user_id
from ..schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Import supabase from main
from ..main import supabase

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    user_id: str = Depends(get_current_user_id)
) -> List[NotificationResponse]:
    """
    Fetch all notifications for the current user.
    """
    try:
        response = supabase.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        
        if response.data:
            return [NotificationResponse(**notification) for notification in response.data]
        else:
            return []
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, str]:
    """
    Mark a specific notification as read for the current user.
    """
    try:
        response = supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", user_id).execute()
        
        if response.data:
            return {"status": "success", "message": "Notification marked as read"}
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found or not authorized to update"
            )
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )