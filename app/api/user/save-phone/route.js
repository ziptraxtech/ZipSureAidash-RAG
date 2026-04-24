import { auth } from '@clerk/nextjs/server';
import { getSql } from '@/lib/db';

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { phone } = await req.json();
    if (!phone) return Response.json({ error: 'Phone required' }, { status: 400 });

    const sql = getSql();
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
    await sql`UPDATE users SET phone = ${phone}, updated_at = NOW() WHERE id = ${userId}`;

    return Response.json({ ok: true });
  } catch (err) {
    console.error('save-phone error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
