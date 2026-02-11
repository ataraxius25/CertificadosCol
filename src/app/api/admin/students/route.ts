import { db } from '@/lib/db';
import { students, certificates } from '@/lib/db/schema';
import { desc, like, or, and, eq, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const course = searchParams.get('course') || '';
  const year = searchParams.get('year') || '';
  const status = searchParams.get('status') || ''; // 'pending' | 'completed' | 'all' (default)

  try {
    const conditions = [];

    // Basic Search
    if (search) {
      const cleanSearch = search.replace(/[^a-zA-Z0-9]/g, ''); 
      // Normalize search term: remove accents and lowercase
      const normalizedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      // SQLite/LibSQL doesn't verify accents by default. We use a SQL replace chain to normalize DB columns.
      // This is verbose but the most compatible way without extensions.
      const normalizeCol = (col: any) => 
        sql`lower(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(${col}, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'Á', 'a'), 'É', 'e'), 'Í', 'i'), 'Ó', 'o'), 'Ú', 'u'))`;

      conditions.push(or(
        like(students.cedula, `%${search}%`),
        like(students.cedula, `%${cleanSearch}%`),
        // Use custom normalized comparison
        sql`${normalizeCol(students.firstName)} LIKE ${`%${normalizedSearch}%`}`,
        sql`${normalizeCol(students.lastName)} LIKE ${`%${normalizedSearch}%`}`
      ));
    }

    // Filter by Course or Year (requires join logic via subquery)
    if (course || year || status) {
       const certConditions = [];
       if (course) certConditions.push(like(certificates.courseName, `%${course}%`));
       if (year) certConditions.push(eq(certificates.graduationYear, parseInt(year)));
       
       if (status === 'pending') {
          certConditions.push(or(eq(certificates.certificatePath, '#'), sql`${certificates.certificatePath} IS NULL`));
       } else if (status === 'completed') {
          // Check if path is NOT the placeholder '#'
          certConditions.push(sql`${certificates.certificatePath} != '#'`); 
       }

       if (certConditions.length > 0) {
          const subQuery = db.select({ studentId: certificates.studentId })
                             .from(certificates)
                             .where(and(...certConditions));
          conditions.push(inArray(students.id, subQuery));
       }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.students.findMany({
      where: whereClause,
      with: { certificates: true },
      orderBy: [desc(students.createdAt)],
      limit: 50, 
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields (removed graduationYear)
    if (!body.cedula || !body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const newStudent = await db.insert(students).values({
      cedula: body.cedula,
      documentType: body.documentType || 'CC',
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
    }).returning();

    return NextResponse.json(newStudent[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear estudiante. Verifique que la cédula no exista.' }, { status: 400 });
  }
}
