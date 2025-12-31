
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

async function createRealUsers() {
    const users = [
        {
            name: 'Gerente Sortebem',
            email: 'gerente@sortebem.com.br',
            whatsapp: '5511999999996',
            password: 'Gerente@2025',
            role: 'manager'
        },
        {
            name: 'Estabelecimento Sortebem',
            email: 'estabelecimento@sortebem.com.br',
            whatsapp: '5511988888888',
            password: 'Estabelecimento@2025',
            role: 'establishment'
        }
    ];

    for (const u of users) {
        console.log(`Checking user: ${u.email}`);
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', u.email)
            .maybeSingle();

        if (existing) {
            console.log(`User ${u.email} already exists. skipping.`);
            continue;
        }

        // 1. Create user
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                name: u.name,
                email: u.email,
                whatsapp: u.whatsapp,
                password_hash: u.password,
                role: u.role,
                is_active: true
            })
            .select();

        if (userError || !newUser?.[0]) {
            console.error(`Error creating user ${u.email}:`, userError?.message);
            continue;
        }

        const userId = newUser[0].id;

        if (u.role === 'manager') {
            const referralCode = 'SB' + Math.random().toString(36).substring(2, 6).toUpperCase();
            const code = Math.floor(10000000 + Math.random() * 90000000).toString();
            const { error: mErr } = await supabase
                .from('managers')
                .insert({
                    user_id: userId,
                    cpf: '000.000.000-00',
                    referral_code: referralCode,
                    code: code,
                    kyc_status: 'approved'
                });
            if (mErr) console.error(`Error creating manager entry for ${u.email}:`, mErr.message);
            else console.log(`Manager created with referral code: ${referralCode}`);
        } else if (u.role === 'establishment') {
            const code = Math.floor(10000000 + Math.random() * 90000000).toString();
            const { error: eErr } = await supabase
                .from('establishments')
                .insert({
                    user_id: userId,
                    name: u.name,
                    cnpj: '00.000.000/0001-00',
                    phone: u.whatsapp,
                    address: 'Endereço Real, 123',
                    city: 'São Paulo',
                    state: 'SP',
                    code: code,
                    slug: 'estabelecimento-real',
                    kyc_status: 'approved',
                    is_active: true
                });
            if (eErr) console.error(`Error creating establishment entry for ${u.email}:`, eErr.message);
            else console.log(`Establishment created with code: ${code}`);
        }
    }
}

createRealUsers();
