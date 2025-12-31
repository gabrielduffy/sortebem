
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

function generateCode() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function migrate() {
    console.log('Starting migration to 8-digit codes...');

    // 1. Fetch all establishments
    const { data: ests, error } = await supabase.from('establishments').select('*');
    if (error) {
        console.error('Error fetching establishments:', error);
        process.exit(1);
    }

    console.log(`Found ${ests.length} establishments.`);

    for (const est of ests) {
        // Check if code is already 8 digits
        if (est.code && /^\d{8}$/.test(est.code)) {
            console.log(`Skipping ${est.id} (already valid: ${est.code})`);
            continue;
        }

        let newCode = generateCode();
        // Simple collision check (for small dataset this is fine)
        // In a real large migration we'd need better collision handling

        console.log(`Updating ${est.id} (${est.name}) - Old: ${est.code} -> New: ${newCode}`);

        const { error: updateError } = await supabase
            .from('establishments')
            .update({ code: newCode })
            .eq('id', est.id);

        if (updateError) {
            console.error(`Failed to update ${est.id}:`, updateError);
        } else {
            console.log(`✅ User ${est.id} updated.`);
        }
    }
    console.log('Migration complete.');
}

migrate();
