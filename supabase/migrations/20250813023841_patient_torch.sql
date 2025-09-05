/*
  # User Referral System

  1. New Tables
    - `referral_codes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `code` (text, unique referral code)
      - `created_at` (timestamp)
      - `is_active` (boolean)
    
    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, user who referred)
      - `referred_id` (uuid, user who was referred)
      - `referral_code` (text, code used)
      - `status` (enum: pending, completed, expired)
      - `reward_claimed` (boolean)
      - `created_at` (timestamp)
      - `completed_at` (timestamp)

    - `referral_rewards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, user receiving reward)
      - `referral_id` (uuid, related referral)
      - `reward_type` (enum: free_month, discount)
      - `reward_value` (text, description of reward)
      - `claimed_at` (timestamp)
      - `expires_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own referrals
    - Add functions for referral code generation
*/

-- Create enum types
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired');
CREATE TYPE reward_type AS ENUM ('free_month', 'discount');

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

-- Function to create referral code for user
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
  END IF;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    
    -- Create reward for referrer (1 month free)
    INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, expires_at)
    VALUES (
      referral_record.referrer_id,
      referral_record.id,
      'free_month',
      '1 month free FiTrek Pro subscription',
      now() + interval '1 year'
    );
    
    -- Create reward for referred user (50% off first month)
    INSERT INTO referral_rewards (user_id, referral_id, reward_type, reward_value, expires_at)
    VALUES (
      referral_record.referred_id,
      referral_record.id,
      'discount',
      '50% off first month of FiTrek Pro',
      now() + interval '30 days'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);