-- Migration: Create certificates table and preserve data
-- Run this SQL before pushing schema changes

-- Step 1: Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  certificate_path TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  created_at INTEGER,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Step 2: Migrate existing certificate data
INSERT INTO certificates (student_id, course_name, certificate_path, graduation_year, created_at)
SELECT 
  id,
  'Certificado General' as course_name,
  certificate_path,
  graduation_year,
  created_at
FROM students
WHERE certificate_path IS NOT NULL 
  AND certificate_path != '#'
  AND certificate_path != '';

-- Step 3: Verify migration
SELECT 'Migration complete. Certificates migrated:' as status, COUNT(*) as count FROM certificates;
