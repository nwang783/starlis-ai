import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Define the scopes required for Google Calendar access
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
]

def initialize_firebase():
    """Initialize Firebase Admin SDK if not already initialized."""
    try:
        # Check if app is already initialized
        firebase_admin.get_app()
    except ValueError:
        # Initialize the app
        cred = credentials.Certificate("starlis_admin_creds.json")
        firebase_admin.initialize_app(cred)

def get_token(user_id):
    """
    Gets a Google API token with calendar scopes using OAuth2 flow.
    Saves the credentials to token.pickle for reuse and to Firebase for the specific user.
    
    Parameters:
        user_id (str): Firebase user ID to store the token with
    """
    creds = None
    
    # Check if token.pickle exists with saved credentials
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    
    # If no valid credentials available, request new ones
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Check for client secrets file
            if not os.path.exists('google_credentials.json'):
                print("ERROR: google_credentials.json file not found!")
                print("Please download OAuth 2.0 credentials from Google Cloud Console")
                print("and save as 'google_credentials.json' in the same directory.")
                return None
                
            flow = InstalledAppFlow.from_client_secrets_file(
                'google_credentials.json', SCOPES)
            
            print("Opening browser for authentication...")
            print("Please authorize the application.")
            
            try:
                creds = flow.run_local_server(port=8080)
            except Exception as e:
                print(f"Error with local server flow: {e}")
                print("Trying console-based authentication instead...")
                creds = flow.run_console()
            
        # Save the credentials for the next run
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    
    # Print token info
    print("Access token obtained successfully!")
    print(f"Token: {creds.token[:20]}...")
    if creds.refresh_token:
        print(f"Refresh token: {creds.refresh_token[:10]}...")
    
    # Extract client ID and client secret for storage
    client_id = creds.client_id
    client_secret = creds.client_secret
    
    # Create a JSON representation of the token
    token_info = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": client_id,
        "client_secret": client_secret,
        "scopes": creds.scopes
    }
    
    # Save as JSON for easier access in other applications
    with open('token.json', 'w') as f:
        json.dump(token_info, f)
    
    # Save to Firebase under the user's ID
    initialize_firebase()
    db = firestore.client()
    
    # Structure the calendar credentials in the user document
    user_ref = db.collection('users').document(user_id)
    
    # Get current user data or create a new document
    user_doc = user_ref.get()
    if user_doc.exists:
        # Update existing user document
        user_ref.update({
            'calendar': {
                'token': creds.token,
                'refresh_token': creds.refresh_token,
                'client_id': client_id,
                'client_secret': client_secret,
                'last_updated': firestore.SERVER_TIMESTAMP
            }
        })
    else:
        # Create new user document
        user_ref.set({
            'calendar': {
                'token': creds.token,
                'refresh_token': creds.refresh_token,
                'client_id': client_id,
                'client_secret': client_secret,
                'last_updated': firestore.SERVER_TIMESTAMP
            }
        })
    
    print(f"Token saved to Firebase for user {user_id}")
    return creds

if __name__ == '__main__':
    print("Google Calendar API Token Generator")
    print("-----------------------------------")
    print(f"Requesting token with scopes: {', '.join(SCOPES)}")
    
    # Prompt for user ID
    user_id = input("Enter your Firebase User ID: ")
    
    if not user_id:
        print("Error: User ID is required.")
        exit(1)
        
    get_token(user_id)
    print("\nToken saved to token.pickle, token.json, and Firebase")
    print("You can now use these tokens in your application.")
