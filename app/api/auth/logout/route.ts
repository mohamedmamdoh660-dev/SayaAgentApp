import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    message: 'Logged out successfully'
  });

  // Clear all auth cookies
  response.cookies.set('auth.token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  response.cookies.set('auth.refresh-token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  response.cookies.set('auth.user', '', {
    httpOnly: false,
    expires: new Date(0),
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return response;
} 