/*
  # Recreate notifications table and add user fields

  This migration safely recreates the notifications system and adds missing user fields.

  ## 1. Cleanup
  - Drop existing notifications table and policies if they exist
  - Remove user table columns if they exist

  ## 2. New Tables
  - `notifications`
    - `id` (uuid, primary key, auto-generated)
    - `user_id` (uuid, foreign key to users, cascade delete)
    - `type` (text, required)
    - `message` (text, required)
    - `details` (jsonb, default '{}')
    - `is_read` (boolean, default false)
    - `created_at` (timestamp, default now())
    - `read_at` (timestamp, nullable)

  ## 3. User Table Updates
  - Add `last_workout_date` (timestamp, nullable)
  - Add `user_status_flags` (jsonb, default '{}')

  ## 4. Security
  - Enable RLS on `notifications` table
  - Add policies for authenticated users to read their own notifications
  - Add policies for authenticated users to insert their own notifications
  - Add policies for authenticated users to update their own notifications
  - Add policies for authenticated users to delete their own notifications

  ## 5. Performance
  - Add index on user_id and created_at for efficient notification queries
  - Add index on user_id and is_read for filtering read/unread notifications
  - Add index on created_at for general sorting
  - Add index on user_id for user-specific queries
  - Add index on last_workout_date for workout tracking
*/

-- Step 1: Clean up existing notifications table and policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Drop the table if it exists (this will also drop all indexes and constraints)
DROP TABLE IF EXISTS notifications;

-- Step 2: Remove existing columns from users table if they exist
DO $$
BEGIN
  -- Remove last_workout_date column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_workout_date'
  ) THEN
    ALTER TABLE users DROP COLUMN last_workout_date;
  END IF;

  -- Remove user_status_flags column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'user_status_flags'
  ) THEN
    ALTER TABLE users DROP COLUMN user_status_flags;
  END IF;
END $$;

-- Step 3: Add new columns to users table
ALTER TABLE users ADD COLUMN last_workout_date timestamptz;
ALTER TABLE users ADD COLUMN user_status_flags jsonb DEFAULT '{}'::jsonb;

-- Step 4: Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Step 5: Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 7: Create performance indexes
CREATE INDEX idx_notifications_user_id_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_id_is_read ON notifications (user_id, is_read);
CREATE INDEX notifications_created_at_idx ON notifications (created_at DESC);
CREATE INDEX notifications_user_id_idx ON notifications (user_id);
CREATE INDEX idx_users_last_workout_date ON users (last_workout_date);

-- Step 8: Add helpful comments
COMMENT ON TABLE notifications IS 'User notifications for workout reminders, progress updates, and system messages';
COMMENT ON COLUMN notifications.details IS 'Additional structured data for the notification (JSON format)';
COMMENT ON COLUMN users.last_workout_date IS 'Timestamp of the user''s most recent workout for tracking activity';
COMMENT ON COLUMN users.user_status_flags IS 'JSON object storing various user status flags and preferences';