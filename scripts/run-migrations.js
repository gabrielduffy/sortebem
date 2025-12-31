#!/usr/bin/env node

/**
 * Script para executar migrations SQL automaticamente no Supabase
 *
 * Uso:
 *   npm run migrate
 *   # ou
 *   node scripts/run-migrations.js
 *
 * Este script:
 * 1. Lê todos os arquivos .sql da pasta supabase/migrations/
 * 2. Executa em ordem numérica (001, 002, 003, etc)
 * 3. Usa Supabase CLI para executar
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Executa um arquivo SQL no Supabase usando CLI
 */
function executeSqlFile(filePath) {
  const fileName = path.basename(filePath);
  log(`\n📄 Executando: ${fileName}...`, 'cyan');

  try {
    // Executar usando npx supabase db execute
    const command = `npx supabase@latest db execute -f "${filePath}" --db-url "${getDatabaseUrl()}"`;

    execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8'
    });

    log(`   ✅ ${fileName} executado com sucesso!`, 'green');
    return true;
  } catch (error) {
    log(`   ❌ Erro ao executar ${fileName}:`, 'red');
    log(`   ${error.message}`, 'red');

    if (error.stderr) {
      log(`   ${error.stderr}`, 'red');
    }
    if (error.stdout) {
      log(`   ${error.stdout}`, 'yellow');
    }

    return false;
  }
}

/**
 * Obtém a URL de conexão do banco de dados
 */
function getDatabaseUrl() {
  // Tentar ler do .env
  const envPath = path.join(__dirname, '..', '.env');

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/SUPABASE_DB_URL=(.+)/);
    if (match) {
      return match[1].trim();
    }
  }

  // URL padrão (pooler connection)
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;

  if (!dbPassword) {
    log('\n❌ ERRO: Senha do banco não configurada!', 'red');
    log('', 'reset');
    log('Para executar este script, você precisa:', 'yellow');
    log('1. Acessar: https://app.supabase.com/project/ctjdbnvcqcyitpydnmdt/settings/database', 'yellow');
    log('2. Na seção "Connection string" > "URI", copiar a senha', 'yellow');
    log('3. Executar:', 'yellow');
    log('   export SUPABASE_DB_PASSWORD="sua-senha-aqui"', 'cyan');
    log('   npm run migrate', 'cyan');
    log('', 'reset');
    log('OU adicionar no arquivo .env:', 'yellow');
    log('   SUPABASE_DB_PASSWORD=sua-senha-aqui', 'cyan');
    process.exit(1);
  }

  return `postgresql://postgres.ctjdbnvcqcyitpydnmdt:${dbPassword}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;
}

/**
 * Executa todas as migrations em ordem
 */
function runMigrations() {
  log('🚀 Iniciando execução de migrations...\n', 'blue');

  // Pasta de migrations
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

  // Verificar se a pasta existe
  if (!fs.existsSync(migrationsDir)) {
    log(`\n❌ Pasta não encontrada: ${migrationsDir}`, 'red');
    process.exit(1);
  }

  // Listar todos os arquivos .sql
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Ordena alfabeticamente (001, 002, 003, etc)

  if (files.length === 0) {
    log('\n⚠️  Nenhum arquivo .sql encontrado em supabase/migrations/', 'yellow');
    process.exit(0);
  }

  log(`📦 Encontradas ${files.length} migration(s):\n`, 'cyan');
  files.forEach(f => log(`   - ${f}`, 'reset'));

  // Executar cada migration
  let success = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const result = executeSqlFile(filePath);

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  // Resumo
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESUMO DA EXECUÇÃO:', 'blue');
  log(`   ✅ Sucesso: ${success}`, success > 0 ? 'green' : 'reset');
  log(`   ❌ Falhas: ${failed}`, failed > 0 ? 'red' : 'reset');
  log('='.repeat(60), 'cyan');

  if (failed > 0) {
    log('\n⚠️  Algumas migrations falharam. Verifique os erros acima.', 'yellow');
    process.exit(1);
  } else {
    log('\n🎉 Todas as migrations foram executadas com sucesso!', 'green');
    process.exit(0);
  }
}

// Executar
try {
  runMigrations();
} catch (error) {
  log('\n💥 Erro fatal:', 'red');
  log(error.message, 'red');
  process.exit(1);
}
