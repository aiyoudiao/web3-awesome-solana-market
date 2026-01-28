
-- Set default value for id column to gen_random_uuid() if not already set
-- This ensures that if the client doesn't provide an ID, the database generates one.
ALTER TABLE markets ALTER COLUMN id SET DEFAULT gen_random_uuid();
