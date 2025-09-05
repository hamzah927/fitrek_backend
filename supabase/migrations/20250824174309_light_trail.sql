/*
  # Add notifications table and user status tracking

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text, notification type)
      - `message` (text, notification message)
      - `details` (jsonb, additional data)
      - `is_read` (boolean, read status)
      - `created_at` (timestamp)

  2. Table Updates
    - `users` table:
      - Add `last_workout_date` (timestamp, nullable)
      - Add `user_status_flags` (jsonb, for tracking notification states)

  3. Security
    - Enable RLS on `notifications` table
    - Add policies for authenticated users to read/update their own notifications
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Add policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add columns to users table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_workout_date'
  ) THEN
    ALTER TABLE users ADD COLUMN last_workout_date timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'user_status_flags'
  ) THEN
    ALTER TABLE users ADD COLUMN user_status_flags jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
  ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_users_last_workout_date 
  ON users(last_workout_date);