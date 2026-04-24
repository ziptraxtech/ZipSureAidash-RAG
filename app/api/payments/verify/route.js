import crypto from 'crypto';
import { getSql } from '@/lib/db';

const PLAN_CREDITS = { basic: 3, pro: 10, enterprise: 30 };

export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, email, plan, amount } = await req.json();

    // Verify signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return Response.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const sql = getSql();
    const creditsToAdd = PLAN_CREDITS[plan] ?? 0;

    // Ensure payments table exists
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        email TEXT,
        plan TEXT,
        amount INTEGER,
        currency TEXT DEFAULT 'INR',
        order_id TEXT NOT NULL,
        payment_id TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'success',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Ensure users table has credits column
    await sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0
    `;

    // Record payment
    await sql`
      INSERT INTO payments (user_id, email, plan, amount, order_id, payment_id)
      VALUES (${userId || null}, ${email || null}, ${plan || null}, ${amount || null}, ${razorpay_order_id}, ${razorpay_payment_id})
      ON CONFLICT (payment_id) DO NOTHING
    `;

    // Add credits to user
    if (userId && creditsToAdd > 0) {
      await sql`
        UPDATE users SET credits = credits + ${creditsToAdd}, updated_at = NOW()
        WHERE id = ${userId}
      `;
    }

    return Response.json({ success: true, paymentId: razorpay_payment_id, creditsAdded: creditsToAdd });
  } catch (err) {
    console.error('Payment verify error:', err);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}
