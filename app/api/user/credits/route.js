import { auth } from '@clerk/nextjs/server';
import { getSql } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ credits: 0 });

    const sql = getSql();
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0`;

    const rows = await sql`SELECT credits FROM users WHERE id = ${userId}`;
    const credits = rows[0]?.credits ?? 0;
    return Response.json({ credits });
  } catch (err) {
    console.error('Credits fetch error:', err);
    return Response.json({ credits: 0 });
  }
}
