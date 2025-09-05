/*
  # Force Recreate Notifications Table and User Fields

  This migration forcefully recreates the notifications system to resolve policy conflicts.
  
  ## WARNING: This migration is destructive!
  - All existing notifications data will be lost
  - User status flags and last workout dates will be reset
  
  1. Forceful Cleanup
     - Drop all RLS policies on notifications table
     - Drop notifications table completely with CASCADE
     - Remove last_workout_date and user_status_flags columns from users table
  
  2. User Table Updates
     - Add last_workout_date (timestamp, nullable)
     - Add user_status_flags (jsonb, default '{}')
  
  3. New Tables
     - `notifications`
       - `id` (uuid, primary key, auto-generated)
       - `user_id` (uuid, foreign key to users, cascade delete)
       - `type` (text, required)
       - `message` (text, required)
       - `details` (jsonb, default '{}')
       - `is_read` (boolean, default false)
       - `created_at` (timestamp, default now())
       - `read_at` (timestamp, nullable)
  
  4. Security
     - Enable RLS on notifications table
     - Add policies for authenticated users to manage their own notifications
  
  5. Performance Indexes
     - Index on user_id and created_at for efficient notification queries
     - Index on user_id and is_read for filtering read/unread notifications
     - Index on created_at for general sorting
     - Index on last_workout_date for workout tracking
*/

-- =====================================================
-- STEP 1: FORCEFUL CLEANUP
-- =====================================================

-- Drop all known RLS policies on notifications table
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to read their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own notifications" ON public.notifications;

-- Drop the notifications table completely with CASCADE to remove all dependencies
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Remove existing columns from users table if they exist
ALTER TABLE public.users DROP COLUMN IF EXISTS last_workout_date;
ALTER TABLE public.users DROP COLUMN IF EXISTS user_status_flags;

-- =====================================================
-- STEP 2: ADD USER TABLE COLUMNS
-- =====================================================

-- Add last_workout_date column to users table
ALTER TABLE public.users ADD COLUMN last_workout_date timestamptz;

-- Add user_status_flags column to users table with default empty object
ALTER TABLE public.users ADD COLUMN user_status_flags jsonb DEFAULT '{}'::jsonb;

-- =====================================================
-- STEP 3: CREATE NOTIFICATIONS TABLE
-- =====================================================

-- Create notifications table with all required fields
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Add foreign key constraint with cascade delete
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- Policy for SELECT: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT: Users can insert their own notifications
CREATE POLICY "Users can insert own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Additional policies for public role (for edge functions)
CREATE POLICY "Public can read own notifications"
  ON public.notifications
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Public can insert own notifications"
  ON public.notifications
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 6: CREATE PERFORMANCE INDEXES
-- =====================================================

-- Index for efficient notification queries by user and date
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON public.notifications (user_id, created_at DESC);

-- Index for filtering read/unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
ON public.notifications (user_id, is_read);

-- Index for general sorting by creation date
CREATE INDEX IF NOT EXISTS notifications_created_at_idx 
ON public.notifications (created_at DESC);

-- Index on user_id for foreign key performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx 
ON public.notifications (user_id);

-- Index on users.last_workout_date for workout tracking queries
CREATE INDEX IF NOT EXISTS idx_users_last_workout_date 
ON public.users (last_workout_date);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify the notifications table was created successfully
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
    RAISE NOTICE 'SUCCESS: notifications table created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: notifications table was not created';
  END IF;
END $$;

-- Verify user columns were added successfully
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_workout_date' AND table_schema = 'public') THEN
    RAISE NOTICE 'SUCCESS: last_workout_date column added to users table';
  ELSE
    RAISE EXCEPTION 'FAILED: last_workout_date column was not added to users table';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_status_flags' AND table_schema = 'public') THEN
    RAISE NOTICE 'SUCCESS: user_status_flags column added to users table';
  ELSE
    RAISE EXCEPTION 'FAILED: user_status_flags column was not added to users table';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications' AND schemaname = 'public' AND rowsecurity = true) THEN
    RAISE NOTICE 'SUCCESS: RLS enabled on notifications table';
  ELSE
    RAISE EXCEPTION 'FAILED: RLS not enabled on notifications table';
  END IF;
END $$;