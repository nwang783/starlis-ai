import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# --- Configuration ---
# Scope for full read/write access to Google Calendar
SCOPES = ['https://www.googleapis.com/auth/calendar']
# The file downloaded from Google Cloud Console
CLIENT_SECRETS_FILE = 'client_secrets.json' # Make sure this matches your file name
# File to store the obtained tokens for future use
TOKEN_FILE = 'token.json'

def get_credentials():
    """Gets valid user credentials from storage or runs the OAuth flow."""
    creds = None
    # Check if token file exists
    if os.path.exists(TOKEN_FILE):
        try:
            creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
            print(f"Loaded credentials from {TOKEN_FILE}")
        except Exception as e:
            print(f"Error loading token file ({TOKEN_FILE}): {e}. Need to re-authenticate.")
            creds = None # Force re-authentication

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Credentials expired, attempting to refresh...")
            try:
                creds.refresh(Request())
                print("Credentials refreshed successfully.")
            except Exception as e:
                print(f"Error refreshing token: {e}")
                print("Could not refresh credentials. Need to re-authenticate.")
                creds = None # Force re-authentication
                # Optional: Delete the invalid token file
                # if os.path.exists(TOKEN_FILE):
                #    os.remove(TOKEN_FILE)
        else:
            # No valid/refreshable token file, run the OAuth flow
            print(f"No valid token file found or refresh failed. Starting OAuth flow...")
            if not os.path.exists(CLIENT_SECRETS_FILE):
                 print(f"ERROR: Client secrets file '{CLIENT_SECRETS_FILE}' not found.")
                 print("Please download it from Google Cloud Console and place it here.")
                 return None

            # Create the flow using the client secrets file
            flow = InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRETS_FILE, SCOPES)

            # Run the local server flow, which will open a browser window/tab
            # for the user to authorize the application.
            # It handles starting a local server to receive the redirect.
            try:
                # Specify a port or let it choose automatically (port=0)
                creds = flow.run_local_server(port=0)
                print("OAuth flow completed.")
            except Exception as e:
                 print(f"Error during OAuth flow: {e}")
                 return None

        # Save the credentials for the next run
        if creds:
            try:
                with open(TOKEN_FILE, 'w') as token_f:
                    # Use built-in method to serialize credentials securely
                    token_f.write(creds.to_json())
                print(f"Credentials saved to {TOKEN_FILE}")
            except Exception as e:
                print(f"Error saving token file: {e}")

    # Check final credentials validity
    if not creds or not creds.valid:
        print("Failed to obtain valid credentials.")
        return None

    return creds

if __name__ == '__main__':
    print("--- Google Calendar OAuth Token Retriever ---")
    credentials = get_credentials()

    if credentials:
        print("\n--- Obtained Credentials ---")
        print(f"Access Token: {credentials.token}")
        print(f"\nRefresh Token: {credentials.refresh_token}")
        print(f"Expiry: {credentials.expiry}")
        print("\nExpiry is UTC time. Token will be refreshed automatically if possible.")
        print(f"\nUse the Access Token above in the 'Authorization: Bearer <token>' header.")
        if not credentials.refresh_token:
            print("\nWARNING: No refresh token received. You will need to re-authorize")
            print("         manually when the access token expires (usually after 1 hour).")
            print("         Ensure 'offline' access was requested or granted.")
    else:
        print("\nCould not retrieve credentials.")
        