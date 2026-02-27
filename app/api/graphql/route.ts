import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-auth-client';

export async function POST(req: NextRequest) {
  try {
    const { query, variables } = await req.json();
    
    // Validate the request
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get the auth token from the request
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    // If there's a token, set it in the Supabase client
    if (token) {
      supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });
    }
    // Execute the GraphQL query using Supabase's REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'GraphQL query failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('GraphQL API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 