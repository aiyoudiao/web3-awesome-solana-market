
-- Add missing columns if they don't exist
ALTER TABLE markets ADD COLUMN IF NOT EXISTS creator_wallet TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, approved, rejected, created_on_chain
ALTER TABLE markets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS end_time BIGINT;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS tx_signature TEXT;

-- Grant permissions to anon and authenticated roles
GRANT ALL ON TABLE markets TO anon;
GRANT ALL ON TABLE markets TO authenticated;
GRANT ALL ON TABLE markets TO service_role;

-- Optional: If you have RLS enabled, you might need policies
-- Enable RLS
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Policy for reading markets (everyone)
CREATE POLICY "Enable read access for all users" ON markets FOR SELECT USING (true);

-- Policy for inserting markets (everyone or authenticated)
-- For now allowing anon for demo purposes, but ideally should be authenticated
CREATE POLICY "Enable insert for all users" ON markets FOR INSERT WITH CHECK (true);

-- Policy for updating markets (admin/creator)
-- Allowing update for all for demo simplicity, or you can restrict it
CREATE POLICY "Enable update for all users" ON markets FOR UPDATE USING (true);
