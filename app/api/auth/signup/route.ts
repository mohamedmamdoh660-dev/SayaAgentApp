import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthSignupData } from '@/modules/auth/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const { email, password, firstName, lastName } = body as AuthSignupData;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Call the signup service
    const data = await authService.signUp({ email, password, firstName, lastName });
    
    return NextResponse.json(
      { message: 'User registered successfully', userId: data.user?.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to register user' },
      { status: 500 }
    );
  }
} 