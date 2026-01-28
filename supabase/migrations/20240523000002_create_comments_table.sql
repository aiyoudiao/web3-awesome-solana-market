-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id TEXT NOT NULL, -- On-chain Public Key or DB ID
    user_wallet TEXT NOT NULL,
    username TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions
GRANT ALL ON TABLE comments TO anon;
GRANT ALL ON TABLE comments TO authenticated;
GRANT ALL ON TABLE comments TO service_role;

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON comments FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON comments FOR INSERT WITH CHECK (true);
