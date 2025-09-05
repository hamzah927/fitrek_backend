from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta, date
from typing import Optional, Dict, Any, List
import os
import uuid
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Client Initialization
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Supabase URL and Service Role Key must be set in .env file")

from supabase import create_client, Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI(title="FiTrek API", version="1.0.0")

# Add CORS middleware
app.add_middleware( # [citation: 1]
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from .routers import workout, user, notification, goal
from .schemas import WorkoutLogRequest, UserStatusRequest, NotificationResponse
app.include_router(workout.router)
app.include_router(user.router)
app.include_router(notification.router)
app.include_router(goal.router)

# Initialize scheduler
scheduler = AsyncIOScheduler()

# Helper function to create notifications
async def create_notification(user_id: str, notification_type: str, message: str, details: dict):
    try:
        response = supabase.table("notifications").insert({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": notification_type,
            "message": message,
            "details": details,
            "is_read": False
        }).execute()
        print(f"Notification '{notification_type}' created for user {user_id}")
    except Exception as e:
        print(f"Error creating notification for user {user_id}: {e}")

# Daily check job - runs every day at 9 PM UTC
@scheduler.scheduled_job("cron", hour=21, minute=0)
async def daily_check_job():
    print(f"Running daily check job at {datetime.utcnow()} UTC")
    try:
        response = supabase.table("users").select("id, last_workout_date, user_status_flags").execute()
        
        if response.data:
            for user_data in response.data:
                user_id = user_data["id"]
                last_workout_date_str = user_data.get("last_workout_date")
                user_status_flags = user_data.get("user_status_flags") or {}

                try:
                    if not last_workout_date_str:
                        # Send initial motivation if no workout ever logged
                        if not user_status_flags.get("initial_motivation_sent"):
                            await create_notification(
                                user_id, 
                                "motivation", 
                                "⚡ Stay consistent! Log your first workout to start tracking your progress.", 
                                {"reason": "No workouts logged yet."}
                            )
                            user_status_flags["initial_motivation_sent"] = True
                            supabase.table("users").update({"user_status_flags": user_status_flags}).eq("id", user_id).execute()
                        continue

                    # Parse last_workout_date
                    last_workout_date = datetime.fromisoformat(last_workout_date_str.replace("Z", "+00:00")).date()
                    current_date = datetime.utcnow().date()
                    days_since = (current_date - last_workout_date).days

                    # Low motivation alert (3-6 days since last workout)
                    if 3 <= days_since <= 6 and not user_status_flags.get("low_motivation_sent"):
                        await create_notification(
                            user_id, 
                            "low_motivation_alert",
                            "💡 You've been away a few days. Let's get back to it!", 
                            {"days_since_last_workout": days_since}
                        )
                        user_status_flags["low_motivation_sent"] = True
                        user_status_flags["welcome_back_sent"] = False
                        supabase.table("users").update({"user_status_flags": user_status_flags}).eq("id", user_id).execute()

                    # Welcome back (7+ days since last workout)
                    elif days_since >= 7 and not user_status_flags.get("welcome_back_sent"):
                        await create_notification(
                            user_id, 
                            "welcome_back",
                            "👋 Welcome back! Let's restart your journey strong!", 
                            {"days_since_last_workout": days_since}
                        )
                        user_status_flags["welcome_back_sent"] = True
                        user_status_flags["low_motivation_sent"] = False
                        supabase.table("users").update({"user_status_flags": user_status_flags}).eq("id", user_id).execute()
                    
                    # Reset flags if user has returned (less than 3 days since last workout)
                    elif days_since < 3 and (user_status_flags.get("low_motivation_sent") or user_status_flags.get("welcome_back_sent")):
                        user_status_flags["low_motivation_sent"] = False
                        user_status_flags["welcome_back_sent"] = False
                        user_status_flags["initial_motivation_sent"] = False
                        supabase.table("users").update({"user_status_flags": user_status_flags}).eq("id", user_id).execute()

                except Exception as e:
                    print(f"Error processing user {user_id} in daily_check_job: {e}")
        else:
            print("No users found to process in daily check job.")

    except Exception as e:
        print(f"An error occurred during the daily check job: {e}")

# Weekly summary job - runs every Sunday at 11 PM UTC
@scheduler.scheduled_job("cron", day_of_week="sun", hour=23, minute=0)
async def weekly_summary_job():
    print(f"Running weekly summary job at {datetime.utcnow()} UTC")
    try:
        # Calculate date 7 days ago
        seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat() + "Z"

        users_response = supabase.table("users").select("id").execute()
        users = users_response.data

        if users:
            for user in users:
                user_id = user["id"]
                try:
                    logs_response = supabase.table("workout_logs").select("exercises, date").eq("user_id", user_id).gte("date", seven_days_ago).execute()
                    logs = logs_response.data
                    
                    total_workouts = len(logs)
                    total_volume = 0
                    unique_exercises_set = set()

                    for log in logs:
                        if 'exercises' in log and isinstance(log['exercises'], list):
                            for exercise_entry in log['exercises']:
                                if 'sets' in exercise_entry and isinstance(exercise_entry['sets'], list):
                                    for s in exercise_entry['sets']:
                                        weight = s.get("weight", 0)
                                        reps = s.get("reps", 0)
                                        total_volume += (weight * reps)
                                
                                if 'exerciseId' in exercise_entry:
                                    unique_exercises_set.add(exercise_entry['exerciseId'])

                    unique_exercises = len(unique_exercises_set)

                    await create_notification(
                        user_id,
                        "weekly_summary",
                        "📊 Your weekly summary is here!",
                        {
                            "total_workouts": total_workouts,
                            "total_volume": round(total_volume, 2),
                            "unique_exercises": unique_exercises
                        }
                    )

                except Exception as e:
                    print(f"Error processing weekly summary for user {user_id}: {e}")
        else:
            print("No users found to process in weekly summary job.")

    except Exception as e:
        print(f"An error occurred during the weekly summary job: {e}")

# --- Placeholder auth dependency ---
async def get_current_user_id(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ")[1]

    # Verify token with Supabase
    try:
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid user")
        return response.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")

# FastAPI startup and shutdown events
@app.on_event("startup")
async def startup_event():
    print("FastAPI app startup: Starting scheduler...")
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    print("FastAPI app shutdown: Shutting down scheduler...")
    scheduler.shutdown()

# Root endpoint
@app.get("/")
async def read_root():
    return {"message": "FiTrek API is running!", "version": "1.0.0"}

@app.post("/workout-logs")
async def send_workout_log(
    request_data: WorkoutLogRequest,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, str]:
    """
    Sends a workout log to the database.
    """
    try:
        # Insert the workout data into the workout_logs table
        response = supabase.table("workout_logs").insert({
            "user_id": user_id, # [citation: 2]
            "workout_id": request_data.workout_id,
            "exercises": request_data.exercises,
            "date": datetime.utcnow().isoformat() + "Z"
        }).execute()

        if response.data:
            # Update user's last_workout_date
            supabase.table("users").update({
                "last_workout_date": datetime.utcnow().isoformat() + "Z"
            }).eq("id", user_id).execute()
            
            return {"status": "success", "message": "Workout log saved successfully"}
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to save workout log"
            )
    except Exception as e:
        print(f"Error saving workout log: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {e}"
        )

@app.post("/user-status")
async def update_user_status( # [citation: 3]
    request_data: UserStatusUpdateRequest,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, str]:
    """
    Updates the user's status flags in the database.
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
                status_code=500,
                detail="Failed to update user status"
            )
    except Exception as e:
        print(f"Error updating user status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {e}"
        )

@app.get("/notifications", response_model=List[NotificationResponse])
async def fetch_notifications(
    user_id: str = Depends(get_current_user_id)
) -> List[NotificationResponse]:
    """
    Fetches all notifications for the current user.
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
            status_code=500,
            detail=f"An error occurred: {e}"
        )

@app.patch("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id)
) -> Dict[str, str]:
    """
    Marks a specific notification as read for the current user.
    """
    try:
        response = supabase.table("notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", user_id).execute()
        
        if response.data:
            return {"status": "success", "message": "Notification marked as read"}
        else:
            raise HTTPException(
                status_code=404,
                detail="Notification not found or not authorized to update"
            )
    except Exception as e:
        print(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred: {e}"
        )