import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
};

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email?.trim() || !password || password.length < 6) {
    return NextResponse.json({ error: 'Valid email and password (min 6 chars) required' }, { status: 400 });
  }

  const normalEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalEmail);
  if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const result = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(normalEmail, passwordHash);
  const userId = result.lastInsertRowid as number;

  const token = await signToken({ userId, email: normalEmail });
  const response = NextResponse.json({ id: userId, email: normalEmail }, { status: 201 });
  response.cookies.set('auth-token', token, COOKIE_OPTS);
  return response;
}
