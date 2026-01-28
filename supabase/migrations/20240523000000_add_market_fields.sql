
ALTER TABLE markets ADD COLUMN IF NOT EXISTS creator_wallet TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, approved, rejected, created_on_chain
ALTER TABLE markets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS end_time BIGINT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS tx_signature TEXT;
