import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await currentUser();
    const sql = getSql();

    await sql`
      INSERT INTO users (id, email, name, updated_at)
      VALUES (
        ${userId},
        ${user.emailAddresses[0]?.emailAddress ?? ''},
        ${user.fullName ?? ''},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
        SET email      = EXCLUDED.email,
            name       = EXCLUDED.name,
            updated_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[user/sync] error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
