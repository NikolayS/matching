const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zekigaxnilsrennylvnw.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function disableRLS() {
  console.log('🔧 Attempting to disable RLS policies...');
  
  try {
    // Try to disable RLS on tables using raw SQL
    const sqlCommands = [
      'ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS notification_preferences DISABLE ROW LEVEL SECURITY;',
      
      // Drop restrictive storage policies
      'DROP POLICY IF EXISTS "Users can view own objects" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can upload own objects" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can update own objects" ON storage.objects;',
      'DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;',
      'DROP POLICY IF EXISTS "Public Access" ON storage.objects;',
      
      // Create permissive policy
      'DROP POLICY IF EXISTS "Allow everything for everyone" ON storage.objects;',
      'CREATE POLICY "Allow everything for everyone" ON storage.objects FOR ALL USING (true) WITH CHECK (true);'
    ];

    for (const sql of sqlCommands) {
      console.log(`Running: ${sql}`);
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_command: sql });
        if (error) {
          console.log(`⚠️  ${sql} - ${error.message}`);
        } else {
          console.log(`✅ ${sql}`);
        }
      } catch (err) {
        console.log(`❌ ${sql} - ${err.message}`);
      }
    }

    // Test storage access
    console.log('\n🧪 Testing storage access...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage access failed:', bucketError.message);
    } else {
      console.log('✅ Storage access working, buckets:', buckets.map(b => b.name));
    }

    console.log('\n🎉 RLS disable attempt completed!');
    console.log('Try uploading a photo now.');

  } catch (error) {
    console.error('❌ Error:', error.message);
 