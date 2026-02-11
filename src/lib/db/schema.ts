import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Students table - basic information only
export const students = sqliteTable('students', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cedula: text('cedula').notNull().unique(),
  documentType: text('document_type').notNull().default('CC'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Certificates table - one student can have multiple certificates
export const certificates = sqliteTable('certificates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  courseName: text('course_name').notNull(),
  certificatePath: text('certificate_path').notNull(),
  graduationYear: integer('graduation_year').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const studentsRelations = relations(students, ({ many }) => ({
  certificates: many(certificates),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  student: one(students, {
    fields: [certificates.studentId],
    references: [students.id],
  }),
}));

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
