# Set up

<<<<<<< HEAD:frontend/README.md
1. Add .env with these values
NEXT_PUBLIC_FIREBASE_API_KEY=..
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=..
NEXT_PUBLIC_FIREBASE_PROJECT_ID=..
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=..
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=..
NEXT_PUBLIC_FIREBASE_APP_ID=..
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=..
NEXT_PUBLIC_GOOGLE_CLIENT_ID=..
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=..
GOOGLE_CLIENT_ID=..
GOOGLE_CLIENT_SECRET=..
FIREBASE_SERVICE_ACCOUNT_KEY= <JSON KEY>
FIREBASE_DATABASE_URL=

2. Download firebase-admin key to a file called "firebase-admin-creds.json"
=======
1. Make a file called .env.starlis-ai with these values
SENDING_DOMAIN=starlis.tech
SENDGRID_API_KEY=SG....
CLAUDE_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-7-sonnet-20250219
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=GOCSPX-...

2. download credentials.json from GCP and place it in the functions directory
3. Download service account key from firebase and name in "starlis_admin_creds.json"
4. (No longer necessary) Run the get_token.py script with a valid userID
>>>>>>> main:python_functions/README.md
