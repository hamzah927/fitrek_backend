/*
  # Add weight_unit column to users table

  1. Changes
    - Add `weight_unit` column to `users` table with default value 'Kgs'
    - Add check constraint to ensure only valid weight units are allowed

  2. Security
    - No changes to existing RLS policies needed
    - Column inherits existing table security
*/

-- Add weight_unit column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'weight_unit'
  ) THEN
    ALTER TABLE users ADD COLUMN weight_unit text DEFAULT 'Kgs';
  END IF;
END $$;

-- Add check constraint for valid weight units
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'users_weight_unit_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_weight_unit_check 
    CHECK (weight_unit = ANY (ARRAY['Kgs'::text, 'Pounds'::text]));
  END IF;
END $$;