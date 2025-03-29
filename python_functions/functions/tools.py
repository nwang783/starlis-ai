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
            "client_id": "...", # Replace with your client ID later
            "client_secret": "...", # Replace with your client secret later
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

def add_event(user_id, title, description, start_day, end_day, start_time, end_time, location="", attendees=None):
    """
    Adds an event to the user's primary calendar and invites attendees.
    
    Parameters:
      title (str): Event title.
      description (str): Event description.
      start_day (str): Start day (MM/DD/YYYY).
      end_day (str): End day (MM/DD/YYYY).
      start_time (str): Start time (HH:MM AM/PM).
      end_time (str): End time (HH:MM AM/PM).
      location (str): (Optional) Event location.
      attendees (list): (Optional) List of email addresses to invite.
    """
    print(f"Adding event params: {title}, {description}, {start_day}, {end_day}, {start_time}, {end_time}, {location}, {attendees}")
    # Combine day and time and parse into datetime objects.
    try:
        start_dt = datetime.strptime(f"{start_day} {start_time}", '%m/%d/%Y %I:%M %p')
        end_dt = datetime.strptime(f"{end_day} {end_time}", '%m/%d/%Y %I:%M %p')
    except ValueError as e:
        print("Error parsing date/time:", e)
        return {"error": f"Date/time parsing error: {str(e)}"}

    # Set the timezone (adjust if necessary)
    tz = pytz.timezone('America/New_York')
    start_dt = tz.localize(start_dt)
    end_dt = tz.localize(end_dt)

    event = {
        'summary': title,
        'location': location,
        'description': description,
        'start': {
            'dateTime': start_dt.isoformat(),
            'timeZone': 'America/New_York',
        },
        'end': {
            'dateTime': end_dt.isoformat(),
            'timeZone': 'America/New_York',
        },
    }
    
    # Add attendees if provided
    if attendees:
        event['attendees'] = [{'email': email} for email in attendees]
        # Set sendUpdates to 'all' to send email notifications to attendees
        send_updates = 'all'
    else:
        send_updates = 'none'

    try:
        service = get_calendar_service(user_id=user_id)
        created_event = service.events().insert(
            calendarId='primary', 
            body=event,
            sendUpdates=send_updates
        ).execute()
        
        print('Event created: %s' % created_event.get('htmlLink'))
        
        # Return a simplified event object with key information
        return {
            'id': created_event.get('id'),
            'summary': created_event.get('summary'),
            'start': created_event.get('start', {}).get('dateTime'),
            'end': created_event.get('end', {}).get('dateTime'),
            'location': created_event.get('location', ''),
            'link': created_event.get('htmlLink')
        }
    except Exception as e:
        print(f"Error creating event: {str(e)}")
        return {"error": f"Failed to create event: {str(e)}"}

