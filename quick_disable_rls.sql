-- Quick RLS disable for development
-- Copy/paste this into Supabase SQL Editor and RUN

-- Disable RLS on all tables
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences DISABLE ROW LEVEL SECURITY;

-- Drop all storage policies
DROP POLICY IF EXISTS "Users can view own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Create wide-open storage policy
CREATE POLICY "Allow everything for everyone" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- Also make bucket accessible
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Public bucket access" ON storage.objects FOR ALL USING (bucket_id = 'profile-photos') WITH CHECK (bucket_id = 'profile-photos');

SELECT 'RLS completely disabled!' as message; 