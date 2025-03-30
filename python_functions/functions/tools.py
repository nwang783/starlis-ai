from datetime import datetime, timedelta
import pytz
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import json
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_functions.params import StringParam

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

GOOGLE_CLIENT_ID = StringParam('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = StringParam('GOOGLE_CLIENT_SECRET')

def get_calendar_token(user_id):
    """
    Get the user's Google Calendar API tokens from Firestore.
    
    Parameters:
      user_id (str): The Firebase user ID
      
    Returns:
      tuple: (access_token, refresh_token)
    """
    try:
        # Initialize Firestore client
        db = firestore.client()
        
        # Get the user's document from Firestore
        user_doc = db.collection('users').document(user_id).get()
        
        if not user_doc.exists:
            raise ValueError(f"No user found with ID: {user_id}")
            
        user_data = user_doc.to_dict()
        
        # Check if the user has Google Calendar tokens
        if 'google_oauth_token' not in user_data or 'access_token' not in user_data['google_oauth_token']:
            raise ValueError(f"User {user_id} has no Google Calendar tokens")
            
        return user_data['google_oauth_token']['access_token'], user_data['google_oauth_token']['refresh_token']
    except Exception as e:
        print(f"Error getting calendar token: {e}")
        # For testing/development only - would remove in production
        return "ya29.a0ARrdaM8...", "1//0g2..."

def get_calendar_service(user_id):
    """
    Authenticates and returns a Google Calendar API service instance.
    Uses credentials from Firestore and client details from google_credentials.json.
    """
    try:
        # Get the token from Firestore
        token, refresh_token = get_calendar_token(user_id)
        
        # Get client ID and client secret from the credentials file
        client_id = GOOGLE_CLIENT_ID.value
        client_secret = GOOGLE_CLIENT_SECRET.value

        # Create a proper credentials info dictionary
        credentials_info = {
            "token": token,
            "refresh_token": refresh_token, 
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": client_id,
            "client_secret": client_secret,
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

def get_events(user_id, start_day, end_day):
    """
    Retrieves events from the user's primary calendar within a specific date range.
    
    Parameters:
      start_day (str): Start day for the query period (MM/DD/YYYY).
      end_day (str): End day for the query period (MM/DD/YYYY).
      
    Returns:
      List of events.
    """
    print(f"Getting events from {start_day} to {end_day}")
    tz = pytz.timezone('America/New_York')
    try:
        start_dt = tz.localize(datetime.strptime(start_day, '%m/%d/%Y').replace(hour=0, minute=0, second=0))
        end_dt = tz.localize(datetime.strptime(end_day, '%m/%d/%Y').replace(hour=23, minute=59, second=59))
    except ValueError as e:
        print("Error parsing dates:", e)
        return {"error": f"Date parsing error: {str(e)}"}

    try:
        service = get_calendar_service(user_id)
        events_result = service.events().list(
            calendarId='primary',
            timeMin=start_dt.isoformat(),
            timeMax=end_dt.isoformat(),
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        events = events_result.get('items', [])
        
        if not events:
            print('No events found.')
            return []
        
        # Return simplified event objects with key information
        simplified_events = []
        for event in events:
            simplified_events.append({
                'id': event.get('id'),
                'summary': event.get('summary', 'No Title'),
                'start': event['start'].get('dateTime', event['start'].get('date')),
                'end': event['end'].get('dateTime', event['end'].get('date')),
                'location': event.get('location', ''),
                'description': event.get('description', '')
            })
        
        return simplified_events
    except Exception as e:
        print(f"Error retrieving events: {str(e)}")
        return {"error": f"Failed to retrieve events: {str(e)}"}
    
def delete_event(user_id, event_id):
    """
    Deletes an event from the user's primary calendar.
    
    Parameters:
      event_id (str): The unique identifier of the event to delete.
    """
    try:
        service = get_calendar_service(user_id)
        service.events().delete(calendarId='primary', eventId=event_id).execute()
        print(f"Event {event_id} deleted.")
        return {"status": "success", "message": f"Event {event_id} deleted successfully"}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"error": f"Failed to delete event: {str(e)}"}

def update_event(user_id, event_id, title=None, description=None, start_day=None, end_day=None, 
                start_time=None, end_time=None, location=None, attendees=None):
    """
    Updates an existing event in the user's primary calendar.
    
    Parameters:
      event_id (str): The unique identifier of the event to update.
      title (str): (Optional) Updated event title.
      description (str): (Optional) Updated event description.
      start_day (str): (Optional) Updated start day (MM/DD/YYYY).
      end_day (str): (Optional) Updated end day (MM/DD/YYYY).
      start_time (str): (Optional) Updated start time (HH:MM AM/PM).
      end_time (str): (Optional) Updated end time (HH:MM AM/PM).
      location (str): (Optional) Updated event location.
      attendees (list): (Optional) Updated list of email addresses to invite.
    """
    print(f"Updating event params: {event_id}, {title}, {description}, {start_day}, {end_day}, {start_time}, {end_time}, {location}, {attendees}")
    
    try:
        service = get_calendar_service(user_id)
        event = service.events().get(calendarId='primary', eventId=event_id).execute()
    except Exception as e:
        print(f"Error retrieving event: {e}")
        return {"error": f"Failed to retrieve event: {str(e)}"}

    # Update fields if provided
    if title is not None:
        event['summary'] = title
    if description is not None:
        event['description'] = description
    if location is not None:
        event['location'] = location
        
    # Update attendees if provided
    if attendees is not None:
        event['attendees'] = [{'email': email} for email in attendees]
        # Set sendUpdates to 'all' when modifying attendees
        send_updates = 'all'
    else:
        send_updates = 'none'

    tz = pytz.timezone('America/New_York')
    if start_day and start_time:
        try:
            start_dt = tz.localize(datetime.strptime(f"{start_day} {start_time}", '%m/%d/%Y %I:%M %p'))
            event['start'] = {
                'dateTime': start_dt.isoformat(),
                'timeZone': 'America/New_York'
            }
        except ValueError as e:
            print("Error parsing start date/time:", e)
            return {"error": f"Start date/time parsing error: {str(e)}"}
    if end_day and end_time:
        try:
            end_dt = tz.localize(datetime.strptime(f"{end_day} {end_time}", '%m/%d/%Y %I:%M %p'))
            event['end'] = {
                'dateTime': end_dt.isoformat(),
                'timeZone': 'America/New_York'
            }
        except ValueError as e:
            print("Error parsing end date/time:", e)
            return {"error": f"End date/time parsing error: {str(e)}"}

    try:
        updated_event = service.events().update(
            calendarId='primary', 
            eventId=event_id, 
            body=event,
            sendUpdates=send_updates
        ).execute()
        
        print('Event updated: %s' % updated_event.get('htmlLink'))
        
        # Return a simplified event object with key information
        return {
            'id': updated_event.get('id'),
            'summary': updated_event.get('summary'),
            'start': updated_event.get('start', {}).get('dateTime'),
            'end': updated_event.get('end', {}).get('dateTime'),
            'location': updated_event.get('location', ''),
            'link': updated_event.get('htmlLink')
        }
    except Exception as e:
        print(f"Error updating event: {e}")
        return {"error": f"Failed to update event: {str(e)}"}
    