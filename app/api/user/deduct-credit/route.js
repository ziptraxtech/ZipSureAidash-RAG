import { auth } from '@clerk/nextjs/server';
import { getSql } from '@/lib/db';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const sql = getSql();
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0`;

    const rows = await sql`SELECT credits FROM users WHERE id = ${userId}`;
    const current = rows[0]?.credits ?? 0;

    if (current <= 0) {
      return Response.json({ error: 'insufficient_credits', credits: 0 }, { status: 402 });
    }

    await sql`UPDATE users SET credits = credits - 1, updated_at = NOW() WHERE id = ${userId}`;
    return Response.json({ success: true, credits: current - 1 });
  } catch (err) {
    console.error('Deduct credit error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
