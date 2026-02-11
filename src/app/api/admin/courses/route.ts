import { db } from '@/lib/db';
import { certificates } from '@/lib/db/schema';
import { like, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  try {
    // SQLite distinct query using groupBy since distinct() might not be fully supported in all Drizzle drivers for SQLite as expected
    // or just use groupBy which is standard.
    // Using sql`distinct` inside select is also possible.
    
    // We want unique course names matching the query
    const results = await db.select({
      name: certificates.courseName, // We just need the name
    })
    .from(certificates)
    .where(like(certificates.courseName, `%${query}%`))
    .groupBy(certificates.courseName)
    .limit(10); // Limit usage for autocomplete

    return NextResponse.json(results.map(r => r.name));
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}
