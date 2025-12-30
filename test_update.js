
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ctjdbnvcqcyitpydnmdt.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
    console.log('Testing update on establishment id 1...');

    // Try to update KYC status
    const { data, error, status, statusText } = await supabase
        .from('establishments')
        .update({ kyc_status: 'pending' })
        .eq('id', 1)
        .select();

    console.log('Result:', { data, error, status, statusText });

    if (data && data.length > 0) {
        console.log('Update successful, returned rows:', data.length);
    } else if (error) {
        console.error('Update failed with error:', error);
    } else {
        console.log('Update returned no rows. This usually means no match or RLS blocking representation.');
    }
}

testUpdate();
