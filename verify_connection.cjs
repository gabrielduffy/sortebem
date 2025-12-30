const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('Reading .env file...');
  const envPath = path.resolve(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
      envVars[key] = value;
    }
  });

  const supabaseUrl = envVars.VITE_SUPABASE_URL;
  const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing credentials in .env file.');
    if (!supabaseUrl) console.error('   - VITE_SUPABASE_URL is missing');
    if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY is missing');
    process.exit(1);
  }

  if (serviceRoleKey.length < 20) { 
     console.error('❌ SUPABASE_SERVICE_ROLE_KEY looks too short / empty.');
     process.exit(1);
  }

  console.log('Credentials found. Connecting to Supabase...');
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Try to access a table that requires admin or is generally available
    // 'users' is usually a good target. We just want to see if we can read without error.
    // Using count instead of fetching data to be minimal.
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }

    console.log(`✅ Connection Successful! Found ${count} users in the database.`);
    
    // Check if we can bypass RLS (Service Role Check)
    // We don't want to modify data effectively, but let's try a safe "dry run" or simple select that might be restricted.
    // Actually, simply connecting with service_role mostly guarantees it, but let's double check querying 'managers' which might be protected.
    const { error: managerError } = await supabase.from('managers').select('id').limit(1);
    
    if (managerError) {
       console.warn('⚠️ Connected, but encountered error reading managers:', managerError.message);
    } else {
       console.log('✅ Service Role Access Verified (read managers success).');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();
