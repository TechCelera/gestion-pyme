const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración - leer de .env.local si existe
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:QZf7Ho35eJtZyjH6@db.raudmopfohcvcwqvkxzq.supabase.co:5432/postgres';

async function runMigrations() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔗 Conectando a Supabase...');
    await client.connect();
    console.log('✅ Conectado');

    // Leer archivo SQL
    const sqlFile = path.join(__dirname, 'setup-database.sql');
    console.log('📄 Leyendo:', sqlFile);
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ Archivo no encontrado:', sqlFile);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('📊 Ejecutando migraciones...');

    // Ejecutar SQL
    await client.query(sql);
    
    console.log('✅ Migraciones completadas exitosamente');
    console.log('');
    console.log('📋 Tablas creadas:');
    console.log('  - companies');
    console.log('  - users');
    console.log('  - accounts');
    console.log('  - categories');
    console.log('  - transactions');
    console.log('  - periods');
    console.log('  - audit_log');
    console.log('');
    console.log('🔒 RLS policies activadas');
    console.log('📝 Triggers de soft delete y audit creados');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('No se pudo conectar. Verifica:');
      console.error('1. Tienes internet');
      console.error('2. La contraseña es correcta');
      console.error('3. El proyecto Supabase está activo');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();