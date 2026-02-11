import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:local.db',
});

async function migrate() {
  console.log('🚀 Starting migration...\n');

  try {
    // Step 1: Create certificates table
    console.log('📋 Creating certificates table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_name TEXT NOT NULL,
        certificate_path TEXT NOT NULL,
        graduation_year INTEGER NOT NULL,
        created_at INTEGER,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table created\n');

    // Step 2: Migrate data
    console.log('📦 Migrating existing data...');
    const result = await client.execute(`
      INSERT INTO certificates (student_id, course_name, certificate_path, graduation_year, created_at)
      SELECT 
        id,
        'Certificado General',
        certificate_path,
        graduation_year,
        created_at
      FROM students
      WHERE certificate_path IS NOT NULL 
        AND certificate_path != '#'
        AND certificate_path != ''
    `);
    console.log(`✅ Migrated ${result.rowsAffected} certificates\n`);

    // Step 3: Verify
    const count = await client.execute('SELECT COUNT(*) as count FROM certificates');
    console.log(`🔍 Total certificates: ${count.rows[0].count}\n`);

    console.log('🎉 Migration complete!');
    console.log('📝 Next: Run "npx drizzle-kit push" and accept column removal\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

migrate();
