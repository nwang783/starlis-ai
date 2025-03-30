// app/api/auth/google/token/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, redirect_uri } = body;

    if (!code || !redirect_uri) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Error from Google OAuth:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange code for token', details: errorData },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error('Error in token exchange:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}