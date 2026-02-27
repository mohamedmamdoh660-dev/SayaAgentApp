import { NextRequest, NextResponse } from 'next/server';
import { GET_USER_BY_ID } from '@/modules/auth/services/auth-graphql';
import { executeGraphQL } from '@/lib/graphql-client';
import { authService } from '@/modules/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate with Supabase
    const data = await authService.signIn(email, password);
    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const user = await executeGraphQL(GET_USER_BY_ID, { id: data.user.id });
    if (user.user_profileCollection?.edges[0]?.node?.isActive === false || user.user_profileCollection?.edges[0]?.node?.is_active === false) {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 401 }
      );
    }
    // Create response with user and session data
    const response = NextResponse.json({
      user: data.user,
      session: data.session
    });
    // Set secure httpOnly cookies in the response
    response.cookies.set('auth.token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    response.cookies.set('auth.refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
   
    // Also store user data in a cookie (non-sensitive data only)
    response.cookies.set('auth.user', JSON.stringify({
      user: user
    }), {
      httpOnly: false, // Allow JavaScript access to user data
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);

    if (error.message?.includes('Invalid login credentials')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
} 