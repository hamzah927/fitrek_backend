/*
  # Create SMART Goals System

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text, goal category)
      - `name` (text, goal description)
      - `target_value` (numeric, target to achieve)
      - `current_value` (numeric, current progress)
      - `unit` (text, measurement unit)
      - `start_date` (timestamp)
      - `end_date` (timestamp, deadline)
      - `status` (text, goal status)
      - `exercise_id` (text, optional exercise reference)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on goals table
    - Add policies for authenticated users to manage their own goals

  3. Performance
    - Add indexes for efficient querying by user and status
*/

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('strength', 'weight_loss', 'consistency', 'endurance', 'custom')),
  name text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text NOT NULL,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'archived')),
  exercise_id text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goals table
CREATE POLICY "Users can read their own goals"
  ON goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON goals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_end_date ON goals(end_date);
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(type);

-- Add updated_at trigger
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE goals IS 'User fitness goals with SMART criteria tracking';
COMMENT ON COLUMN goals.type IS 'Category of goal: strength, weight_loss, consistency, endurance, custom';
COMMENT ON COLUMN goals.target_value IS 'Numeric target to achieve (e.g., 100 for 100kg deadlift)';
COMMENT ON COLUMN goals.current_value IS 'Current progress towards the target';
COMMENT ON COLUMN goals.unit IS 'Unit of measurement (kg, lbs, reps, workouts, etc.)';
COMMENT ON COLUMN goals.exercise_id IS 'Optional reference to specific exercise if goal is exercise-specific';