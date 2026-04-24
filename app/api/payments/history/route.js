import { auth } from '@clerk/nextjs/server';
import { getSql } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ payments: [] });

    const sql = getSql();
    const rows = await sql`
      SELECT plan, amount, currency, payment_id, status, created_at
      FROM payments
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return Response.json({ payments: rows });
  } catch (err) {
    console.error('Payment history error:', err);
    return Response.json({ payments: [] });
  }
}
