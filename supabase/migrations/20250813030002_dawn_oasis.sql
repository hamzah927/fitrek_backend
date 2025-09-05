/*
  # Remove referral system

  1. Drop all referral-related tables and functions
  2. Clean up any referral-related data
*/

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS referral_rewards CASCADE;
DROP TABLE IF EXISTS referral_milestones CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS referral_status CASCADE;
DROP TYPE IF EXISTS reward_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS create_user_referral_code(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS process_referral_signup(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS complete_referral(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_and_award_milestones(uuid) CASCADE;