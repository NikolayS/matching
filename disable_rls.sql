-- Disable RLS for development
-- Run this in Supabase SQL Editor

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles table  
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on notifications table (if exists)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on notification_preferences table (if exists)
ALTER TABLE notification_preferences DISABLE ROW LEVEL SECURITY;

-- Allow all operations on storage.objects (profile photos)
DROP POLICY IF EXISTS "Allow all operations" ON storage.objects;
CREATE POLICY "Allow all operations" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on storage.buckets
DROP POLICY IF EXISTS "Allow all bucket operations" ON storage.buckets;
CREATE POLICY "Allow all bucket operations" ON storage.buckets FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to authenticated and anon users
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.buckets TO authenticated; 
GRANT ALL ON storage.buckets TO anon;

SELECT 'RLS disabled successfully!' as status; 