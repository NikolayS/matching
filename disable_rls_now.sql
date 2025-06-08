ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow everything" ON storage.objects;
CREATE POLICY "Allow everything" ON storage.objects FOR ALL USING (true) WITH CHECK (true);
SELECT 'RLS completely disabled for development!' as message; 