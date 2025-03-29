from __future__ import print_function
import os.path
from datetime import datetime, timedelta
import pytz
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("starlis_admin_creds.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    # App already initialized
    pass

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
]

def get_calendar_token(user_id):
    # Return hardcoded token for testing purposes
    # In production, this should fetch the token from Firestore
    return "ya29.a0ARrdaM8...", "1//0g2..."

def get_calendar_service(user_id):
    """
    Authenticates and returns a Google Calendar API service instance.
    Uses hardcoded credentials in cloud function environment.
    """
    try:
        # Get the token from Firestore
        token, refresh_token = get_calendar_token(user_id)
        
        # Create a proper credentials info dictionary
        credentials_info = {
            "token": token,
            "refresh_token": refresh_token, 
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": "...",
            "client_secret": "...",
            "scopes": SCOPES
        }
        
        creds = Credentials.from_authorized_user_info(credentials_info)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
        service = build('calendar', 'v3', credentials=creds)
        return service
    except Exception as e:
        print(f"Error setting up calendar service: {e}")
        raise
