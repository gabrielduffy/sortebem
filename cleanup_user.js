
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

async function cleanup() {
    const { error } = await supabase.from('users').delete().eq('email', 'gerente@sortebem.com.br');
    if (error) console.error('Error deleting user:', error.message);
    else console.log('User deleted.');
}

cleanup();
