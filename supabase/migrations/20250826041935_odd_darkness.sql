/*
  # Ultimate Notifications Migration Fix

  This migration forcefully cleans up any existing notifications table and policies,
  then recreates everything from scratch to resolve persistent policy conflicts.

  ## Changes Made

  1. **Forceful Cleanup**
     - Drop all existing RLS policies on notifications table by exact names
     - Drop notifications table completely with CASCADE
     - Remove user table columns if they exist

  2. **User Table Updates**
     - Add `last_workout_date` column (timestamp, nullable)
     - Add `user_status_flags` column (jsonb, default '{}')

  3. **Notifications Table**
     - Create complete notifications table with all fields
     - Enable Row Level Security
     - Add comprehensive RLS policies for authenticated users

  4. **Performance Optimization**
     - Add indexes for efficient querying
     - Optimize for user-based queries

  ## Security
  - RLS enabled on notifications table
  - Policies allow users to manage only their own notifications
  - Foreign key constraint to users table with CASCADE delete

  ⚠️ WARNING: This migration is destructive and will delete existing notifications data
*/

-- Step 1: Forceful cleanup of existing policies by exact names from schema
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Step 2: Drop notifications table completely with CASCADE
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Step 3: Remove user table columns if they exist
ALTER TABLE public.users DROP COLUMN IF EXISTS last_workout_date;
ALTER TABLE public.users DROP COLUMN IF EXISTS user_status_flags;

-- Step 4: Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN last_workout_date timestamptz,
ADD COLUMN user_status_flags jsonb DEFAULT '{}'::jsonb;

-- Step 5: Create notifications table from scratch
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  is_read boolean DEFAULT false NOT NULL
);

-- Step 6: Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 8: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
  ON public.notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx 
  ON public.notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx 
  ON public.notifications (user_id);

-- Step 9: Verification (these will show success messages)
DO $$
BEGIN
  -- Check if notifications table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
    RAISE NOTICE 'SUCCESS: notifications table created successfully';
  ELSE
    RAISE NOTICE 'ERROR: notifications table was not created';
  END IF;

  -- Check if user columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_workout_date' AND table_schema = 'public') THEN
    RAISE NOTICE 'SUCCESS: last_workout_date column added to users table';
  ELSE
    RAISE NOTICE 'ERROR: last_workout_date column was not added';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_status_flags' AND table_schema = 'public') THEN
    RAISE NOTICE 'SUCCESS: user_status_flags column added to users table';
  ELSE
    RAISE NOTICE 'ERROR: user_status_flags column was not added';
  END IF;

  -- Check if RLS is enabled
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'notifications' AND n.nspname = 'public' AND c.relrowsecurity = true) THEN
    RAISE NOTICE 'SUCCESS: RLS enabled on notifications table';
  ELSE
    RAISE NOTICE 'ERROR: RLS not enabled on notifications table';
  END IF;

  RAISE NOTICE 'Migration completed. Check the messages above for any errors.';
END $$;