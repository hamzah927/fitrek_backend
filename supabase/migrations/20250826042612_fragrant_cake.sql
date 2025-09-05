/*
  # Ultimate Notifications Migration Fix

  This migration forcefully cleans up and recreates the notifications system.
  
  ## WARNING: DESTRUCTIVE OPERATION
  This will permanently delete:
  - All existing notifications data
  - All user last_workout_date and user_status_flags data
  
  ## Changes Made:
  1. Forceful Cleanup
     - Drop all RLS policies on notifications table by exact names
     - Drop notifications table with CASCADE
     - Remove user table columns
  
  2. Recreation
     - Add last_workout_date and user_status_flags to users table
     - Create notifications table with all required fields
     - Enable RLS and create policies
     - Add performance indexes
  
  3. Verification
     - Confirm successful creation of table and policies
*/

BEGIN;

-- Step 1: Forceful Cleanup - Drop existing RLS policies by exact names
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Step 2: Forceful Cleanup - Drop the notifications table completely
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Step 3: Forceful Cleanup - Drop columns from users table if they exist
ALTER TABLE public.users DROP COLUMN IF EXISTS last_workout_date;
ALTER TABLE public.users DROP COLUMN IF EXISTS user_status_flags;

-- Step 4: Recreate columns in the users table
ALTER TABLE public.users
ADD COLUMN last_workout_date timestamp with time zone DEFAULT NULL,
ADD COLUMN user_status_flags jsonb DEFAULT '{}'::jsonb;

-- Step 5: Recreate the notifications table
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    message text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone DEFAULT NULL,
    is_read boolean DEFAULT false NOT NULL
);

-- Step 6: Enable Row Level Security (RLS) on the notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate RLS policies for the notifications table
CREATE POLICY "Users can insert their own notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
FOR DELETE USING (auth.uid() = user_id);

-- Step 8: Add performance indexes
CREATE INDEX idx_notifications_user_id_created_at ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_id_is_read ON public.notifications (user_id, is_read);
CREATE INDEX notifications_created_at_idx ON public.notifications (created_at DESC);
CREATE INDEX notifications_user_id_idx ON public.notifications (user_id);

-- Step 9: Verification - Check if table and policies were created successfully
DO $$
BEGIN
    -- Check if notifications table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
        RAISE NOTICE 'SUCCESS: notifications table created successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: notifications table was not created';
    END IF;
    
    -- Check if RLS is enabled
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'notifications' AND relrowsecurity = true) THEN
        RAISE NOTICE 'SUCCESS: RLS enabled on notifications table';
    ELSE
        RAISE EXCEPTION 'FAILED: RLS not enabled on notifications table';
    END IF;
    
    -- Check if policies exist
    IF (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'notifications' AND schemaname = 'public') >= 4 THEN
        RAISE NOTICE 'SUCCESS: RLS policies created successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: Not all RLS policies were created';
    END IF;
    
    RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY!';
END $$;

COMMIT;