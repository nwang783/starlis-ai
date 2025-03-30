// app/api/auth/google/callback/route.ts
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  // Get the query parameters
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  // Determine the redirect path based on the state parameter
  let redirectPath = '/onboarding'; // Default fallback
  
  if (state) {
    try {
      const stateObj = JSON.parse(decodeURIComponent(state));
      if (stateObj.origin === 'settings') {
        redirectPath = '/settings?tab=integrations';
      } else if (stateObj.origin === 'onboarding') {
        redirectPath = '/onboarding?step=calendar';
      }
    } catch (e) {
      console.error('Error parsing state:', e);
      // If parsing fails, keep the default redirect
    }
  }
  
  // Build the redirect URL with appropriate parameters
  const redirectUrl = new URL(redirectPath, url.origin);
  
  // Add the code and state if they exist
  if (code) {
    redirectUrl.searchParams.set('code', code);
  }
  
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }
  
  // Add the error if it exists
  if (error) {
    redirectUrl.searchParams.set('error', error);
  }
  
  // Redirect to the appropriate page
  return NextResponse.redirect(redirectUrl);
}
