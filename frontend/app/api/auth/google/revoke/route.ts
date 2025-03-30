// app/api/auth/google/revoke/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    // Get the access token from Firestore
    const userDoc = await adminDb
      .collection('users')
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const tokenData = userData?.google_oauth_token;
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'No token found for this user' },
        { status: 404 }
      );
    }
    
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Invalid token data' },
        { status: 400 }
      );
    }

    // Revoke the access token
    const revokeResponse = await fetch(GOOGLE_REVOKE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: accessToken,
      }),
    });

    if (!revokeResponse.ok) {
      console.error('Error revoking token:', await revokeResponse.text());
      return NextResponse.json(
        { error: 'Failed to revoke token' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in token revocation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
