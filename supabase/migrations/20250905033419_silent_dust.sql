```sql
/*
  # Add user profile fields to users table

  1. Table Updates
    - `users` table:
      - Add `goal` (text, user's fitness goal)
      - Add `experience_level` (text, training experience)

  2. Security
    - Existing RLS policies on `users` table will automatically apply.
*/

-- Add goal column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'goal'
  ) THEN
    ALTER TABLE users ADD COLUMN goal text DEFAULT 'general_fitness';
  END IF;
END $$;

-- Add experience_level column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE users ADD COLUMN experience_level text DEFAULT 'beginner';
  END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN users.goal IS 'User''s primary fitness goal (e.g., hypertrophy, strength, weight_loss)';
COMMENT ON COLUMN users.experience_level IS 'User''s training experience level (e.g., beginner, intermediate, advanced)';

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'goal') THEN
    RAISE NOTICE 'SUCCESS: "goal" column added to users table.';
  ELSE
    RAISE EXCEPTION 'FAILED: "goal" column not added to users table.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'experience_level') THEN
    RAISE NOTICE 'SUCCESS: "experience_level" column added to users table.';
  ELSE
    RAISE EXCEPTION 'FAILED: "experience_level" column not added to users table.';
  END IF;
END $$;
```