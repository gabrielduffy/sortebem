
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8').replace(/\r/g, '');
const envVars = {};
envContent.split('\n').forEach(line => {
    if (!line.trim() || line.startsWith('#')) return;
    const match = line.match(/^\s*([^=]+)\s*=\s*(.*)$/);
    if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
    const tables = ['establishments', 'managers', 'rounds', 'charities', 'users'];
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`Table ${table}: ${count} rows (Error: ${error?.message || 'none'})`);
    }

    console.log('\nSample Establishment:');
    const { data: est } = await supabase.from('establishments').select('*').limit(1);
    console.log(est);

    console.log('\nSample User:');
    const { data: usr } = await supabase.from('users').select('*').limit(1);
    console.log(usr);

    console.log('\nManager Columns (from information_schema):');
    const { data: cols, error: cErr } = await supabase.rpc('get_table_info', { t_name: 'managers' });
    // If RPC doesn't exist, try manual query
    if (cErr) {
        const { data: cols2, error: err2 } = await supabase
            .from('managers')
            .select('*')
            .limit(0);
        console.log('Error calling RPC, trying select limit 0:', err2 ? 'Select failed' : 'Select success');
        // Unfortunately Supabase doesn't return column names on empty select unless row is returned
    }
    console.log(cols);
}

inspect();
