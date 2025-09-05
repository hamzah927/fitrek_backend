```sql
/*
  # Recreate User Referral System

  This migration re-creates the referral system tables, functions, and adds necessary columns to the users table.
  It also includes RLS policies and performance indexes.

  WARNING: This migration assumes that previous referral-related tables were dropped.
  If you have existing referral data, this migration will not preserve it.
*/

-- Create enum types if they don't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'referral_status') THEN
        CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reward_type') THEN
        CREATE TYPE reward_type AS ENUM ('free_month', 'discount');
    END IF;
END $$;

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status referral_status DEFAULT 'pending',
  reward_claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  reward_type reward_type NOT NULL,
  reward_value text NOT NULL,
  claimed_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Add referral_code and completed_referrals_count to users table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'referral_code') THEN
    ALTER TABLE users ADD COLUMN referral_code text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'completed_referrals_count') THEN
    ALTER TABLE users ADD COLUMN completed_referrals_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own referral codes"
  ON referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own referral codes"
  ON referral_codes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals they're involved in"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Users can create referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referred_id = auth.uid());

CREATE POLICY "System can update referrals"
  ON referrals
  FOR UPDATE
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view their own rewards"
  ON referral_rewards
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create rewards"
  ON referral_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_name text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter int := 0;
BEGIN
  -- Create base code from user name (first 4 chars + random)
  base_code := upper(left(regexp_replace(user_name, '[^a-zA-Z0-9]', '', 'g'), 4));
  
  -- If base_code is too short, pad with random chars
  IF length(base_code) < 4 THEN
    base_code := base_code || upper(substring(md5(random()::text), 1, 4 - length(base_code)));
  END IF;
  
  -- Add random suffix
  final_code := base_code || upper(substring(md5(random()::text), 1, 4));
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM referral_codes WHERE code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || upper(substring(md5(random()::text || counter::text), 1, 4));
    
    -- Prevent infinite loop
    IF counter > 100 THEN
      final_code := 'REF' || upper(substring(md5(random()::text || now()::text), 1, 5));
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function to create referral code for user and update users table
CREATE OR REPLACE FUNCTION create_user_referral_code(p_user_id uuid, p_user_name text)
RETURNS text AS $$
DECLARE
  new_code text;
BEGIN
  -- Check if user already has an active referral code
  SELECT code INTO new_code 
  FROM referral_codes 
  WHERE user_id = p_user_id AND is_active = true 
  LIMIT 1;
  
  -- If no active code exists, create one
  IF new_code IS NULL THEN
    new_code := generate_referral_code(p_user_name);
    
    INSERT INTO referral_codes (user_id, code)
    VALUES (p_user_id, new_code);

    -- Update the users table with the new referral code
    UPDATE users
    SET referral_code = new_code
    WHERE id = p_user_id;
  END IF;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create referral code on new user insert
CREATE OR REPLACE FUNCTION generate_referral_code_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_user_referral_code(NEW.id, NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS trg_generate_referral_code_on_user_insert ON users;

CREATE TRIGGER trg_generate_referral_code_on_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code_on_user_insert();


-- Function to process referral signup
CREATE OR REPLACE FUNCTION process_referral_signup(p_referred_user_id uuid, p_referral_code text)
RETURNS boolean AS $$
DECLARE
  referrer_user_id uuid;
  referral_id uuid;
BEGIN
  -- Find the referrer
  SELECT user_id INTO referrer_user_id
  FROM referral_codes
  WHERE code = p_referral_code AND is_active = true;
  
  -- If referral code doesn't exist or user is trying to refer themselves
  IF referrer_user_id IS NULL OR referrer_user_id = p_referred_user_id THEN
    RETURN false;
  END IF;
  
  -- Check if referral already exists
  IF EXISTS (
    SELECT 1 FROM referrals 
    WHERE referrer_id = referrer_user_id AND referred_id = p_referred_user_id
  ) THEN
    RETURN false;
  END IF;
  
  -- Create the referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
  VALUES (referrer_user_id, p_referred_user_id, p_referral_code, 'pending')
  RETURNING id INTO referral_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete referral (called when referred user subscribes)
CREATE OR REPLACE FUNCTION complete_referral(p_referred_user_id uuid)
RETURNS void AS $$
DECLARE
  referral_record record;
BEGIN
  -- Find pending referral for this user
  SELECT * INTO referral_record
  FROM referrals
  WHERE referred_id = p_referred_user_id AND status = 'pending'
  LIMIT 1;
  
  IF referral_record.id IS NOT NULL THEN
    -- Update referral status
    UPDATE referrals
    SET status = 'completed', completed_at = now()
    WHERE id = referral_record.id;
    
    -- Increment referrer's completed_referrals_count
    UPDATE users
    SET completed_referrals_count = completed_referrals_count + 1
    WHERE id = referral_record.referrer_id;
    
    -- Create reward for referrer (1 month free) - This is now handled by webhook
    -- INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, expires_at)
    -- VALUES (
    --   referral_record.referrer_id,
    --   referral_record.id,
    --   'free_month',
    --   '1 month free FiTrek Pro subscription',
    --   now() + interval '1 year'
    -- );
    
    -- Create reward for referred user (50% off first month) - This is now handled by promotion code
    -- INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, expires_at)
    -- VALUES (
    --   referral_record.referred_id,
    --   referral_record.id,
    --   'discount',
    --   '50% off first month of FiTrek Pro',
    --   now() + interval '30 days'
    -- );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award milestones (not directly used by webhook, but good to have)
CREATE OR REPLACE FUNCTION check_and_award_milestones(p_user_id uuid)
RETURNS void AS $$
DECLARE
  current_referrals_count integer;
  milestone_level integer;
  reward_label text;
  reward_months numeric;
BEGIN
  SELECT completed_referrals_count INTO current_referrals_count
  FROM users
  WHERE id = p_user_id;

  -- This function would typically iterate through defined milestones
  -- and insert into referral_rewards if a new milestone is hit.
  -- For this implementation, the actual subscription extension is handled by the webhook.
  -- This function is kept for completeness if you want to track rewards in DB.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);

-- Add helpful comments
COMMENT ON TABLE referral_codes IS 'Stores unique referral codes generated for users';
COMMENT ON TABLE referrals IS 'Tracks referral relationships between users';
COMMENT ON TABLE referral_rewards IS 'Records rewards granted to users for referrals';
COMMENT ON COLUMN users.referral_code IS 'Unique code for user referrals';
COMMENT ON COLUMN users.completed_referrals_count IS 'Number of successful referrals made by the user';
```