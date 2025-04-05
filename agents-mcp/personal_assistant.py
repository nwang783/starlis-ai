import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Any
from dataclasses import dataclass
import os
import json
import pytz

# Agent SDK imports
from agents import Agent, Runner, function_tool, gen_trace_id, trace, handoff, RunContextWrapper
from agents.model_settings import ModelSettings
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

# Google API imports
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googlemaps import Client as GoogleMapsClient

# Email imports
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, Personalization

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Environment variables
TOKEN = os.environ.get("GOOGLE_TOKEN")
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")

# User settings
USER_TIMEZONE = 'America/New_York'
USER_EMAIL = "nwangbusiness783@gmail.com"
USER_FULL_NAME = "Nathan Wang"
ASSISTANT_NAME = "Starla"

###########################################
# Google Calendar Tools
###########################################

def get_calendar_service():
    """Get an authenticated Google Calendar service"""
    # Parse the TOKEN if it's a string
    if isinstance(TOKEN, str):
        token_info = json.loads(TOKEN)
    else:
        token_info = TOKEN
        
    credentials = Credentials.from_authorized_user_info(token_info)
    return build("calendar", "v3", credentials=credentials)

@function_tool
def create_event(
    summary: str,
    start_time: str,
    end_time: str,
    description: Optional[str] = None,
    location: Optional[str] = None,
    attendees: Optional[List[str]] = None,
    calendar_id: Optional[str] = None,
    send_notifications: Optional[bool] = None
) -> str:
    """Create a new event in Google Calendar
    
    Args:
        summary: Title of the event
        start_time: Start time in ISO format (e.g., '2025-04-05T10:00:00')
        end_time: End time in ISO format (e.g., '2025-04-05T11:00:00')
        description: Optional description of the event
        location: Optional location of the event
        attendees: Optional list of email addresses to invite
        calendar_id: Optional calendar ID (if not provided, primary calendar will be used)
        send_notifications: Whether to send notifications to attendees (if not provided, defaults to sending notifications)
    
    Returns:
        A string with the event ID and confirmation
    """
    # Use primary calendar if not specified
    if calendar_id is None:
        calendar_id = "primary"
    
    try:
        service = get_calendar_service()
        
        event_body = {
            'summary': summary,
            'start': {
                'dateTime': start_time,
                'timeZone': USER_TIMEZONE,
            },
            'end': {
                'dateTime': end_time,
                'timeZone': USER_TIMEZONE,
            }
        }
        
        if description:
            event_body['description'] = description
        
        if location:
            event_body['location'] = location
        
        if attendees:
            event_body['attendees'] = [{'email': email} for email in attendees]
        
        # Enable notifications for attendees
        send_updates = 'none'
        if attendees:
            send_updates = 'all' if send_notifications is None or send_notifications else 'none'
        
        event = service.events().insert(
            calendarId=calendar_id, 
            body=event_body,
            sendUpdates=send_updates
        ).execute()
        
        notification_status = "Invitations have been sent to attendees." if attendees and (send_notifications is None or send_notifications) else ""
        
        return f"Event created successfully! Event ID: {event.get('id')}. {notification_status}"
    
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

@function_tool
def update_event(
    event_id: str,
    summary: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    attendees: Optional[List[str]] = None,
    calendar_id: Optional[str] = None,
    send_notifications: Optional[bool] = None
) -> str:
    """Update an existing event in Google Calendar
    
    Args:
        event_id: ID of the event to update
        summary: Optional new title of the event
        start_time: Optional new start time in ISO format
        end_time: Optional new end time in ISO format
        description: Optional new description
        location: Optional new location
        attendees: Optional new list of attendees
        calendar_id: Optional calendar ID (if not provided, primary calendar will be used)
        send_notifications: Whether to send notifications about the update (if not provided, defaults to sending notifications)
    
    Returns:
        A confirmation message
    """
    # Use primary calendar if not specified
    if calendar_id is None:
        calendar_id = "primary"
    
    try:
        service = get_calendar_service()
        
        # Get the existing event first
        event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()
        
        # Update fields if provided
        if summary:
            event['summary'] = summary
        
        if start_time:
            event['start']['dateTime'] = start_time
            event['start']['timeZone'] = USER_TIMEZONE
        
        if end_time:
            event['end']['dateTime'] = end_time
            event['end']['timeZone'] = USER_TIMEZONE
        
        if description:
            event['description'] = description
        
        if location:
            event['location'] = location
        
        if attendees:
            # Preserve existing attendees if they exist
            existing_attendees = event.get('attendees', [])
            existing_emails = [attendee['email'] for attendee in existing_attendees]
            
            # Add new attendees
            for email in attendees:
                if email not in existing_emails:
                    existing_attendees.append({'email': email})
            
            event['attendees'] = existing_attendees
        
        # Enable notifications for attendees if requested
        send_updates_param = 'all' if send_notifications is None or send_notifications else 'none'
        
        updated_event = service.events().update(
            calendarId=calendar_id, 
            eventId=event_id, 
            body=event,
            sendUpdates=send_updates_param
        ).execute()
        
        notification_status = "Update notifications have been sent to attendees." if (send_notifications is None or send_notifications) and event.get('attendees') else ""
        
        return f"Event updated successfully! Event ID: {updated_event.get('id')}. {notification_status}"
    
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

@function_tool
def list_events(
    time_min: Optional[str] = None,
    time_max: Optional[str] = None,
    max_results: Optional[int] = None,
    calendar_id: Optional[str] = None
) -> str:
    """List events from Google Calendar
    
    Args:
        time_min: Optional start time in ISO format (if not provided, current time will be used)
        time_max: Optional end time in ISO format (if not provided, one week from now will be used)
        max_results: Optional maximum number of results (if not provided, 10 will be used)
        calendar_id: Optional calendar ID (if not provided, primary calendar will be used)
    
    Returns:
        A formatted string with the list of events
    """
    # Use primary calendar if not specified
    if calendar_id is None:
        calendar_id = "primary"
    
    # Default to 10 results if not specified
    if max_results is None:
        max_results = 10
    
    try:
        service = get_calendar_service()
        
        # Get current time in user's timezone
        user_tz = pytz.timezone(USER_TIMEZONE)
        now = datetime.now(user_tz)
        
        # Ensure time parameters are correctly formatted with Z suffix if they don't have it
        if time_min:
            # If time is provided without timezone info, assume it's in user's timezone
            if not time_min.endswith('Z') and '+' not in time_min and '-' not in time_min[10:]:
                dt = datetime.fromisoformat(time_min)
                dt = user_tz.localize(dt)
                time_min = dt.isoformat()
        else:
            time_min = now.isoformat()
            
        if time_max:
            # If time is provided without timezone info, assume it's in user's timezone
            if not time_max.endswith('Z') and '+' not in time_max and '-' not in time_max[10:]:
                dt = datetime.fromisoformat(time_max)
                dt = user_tz.localize(dt)
                time_max = dt.isoformat()
        else:
            time_max = (now + timedelta(days=7)).isoformat()
        
        # Prepare the list events request
        request_params = {
            'calendarId': calendar_id,
            'timeMin': time_min,
            'timeMax': time_max,
            'maxResults': max_results,
            'singleEvents': True,
            'orderBy': 'startTime'
        }
            
        events_result = service.events().list(**request_params).execute()
        
        events = events_result.get('items', [])
        
        if not events:
            return "No upcoming events found."
        
        # Format the events in user's timezone
        result = "Upcoming events:\n"
        for event in events:
            # Get start time
            start = event['start'].get('dateTime', event['start'].get('date'))
            
            # Convert to user's timezone for display
            if 'T' in start:  # This is a datetime, not just a date
                dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                if not dt.tzinfo:
                    # If no timezone info, assume UTC
                    dt = dt.replace(tzinfo=pytz.UTC)
                # Convert to user timezone
                local_dt = dt.astimezone(user_tz)
                start_formatted = local_dt.strftime('%Y-%m-%d %I:%M %p %Z')
            else:
                # All-day event
                start_formatted = start
                
            # Include attendees in the output if they exist
            attendees_str = ""
            if 'attendees' in event:
                attendee_emails = [attendee.get('email') for attendee in event.get('attendees', [])]
                if attendee_emails:
                    attendees_str = f" - Attendees: {', '.join(attendee_emails)}"
                
            result += f"- {start_formatted}: {event['summary']} (ID: {event['id']}){attendees_str}\n"
        
        return result
    
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

@function_tool
def delete_event(
    event_id: str,
    calendar_id: Optional[str] = None,
    send_notifications: Optional[bool] = None
) -> str:
    """Delete an event from Google Calendar
    
    Args:
        event_id: ID of the event to delete
        calendar_id: Optional calendar ID (if not provided, primary calendar will be used)
        send_notifications: Whether to send notifications to attendees about the cancellation (if not provided, defaults to sending notifications)
    
    Returns:
        A confirmation message
    """
    # Use primary calendar if not specified
    if calendar_id is None:
        calendar_id = "primary"
    
    try:
        service = get_calendar_service()
        
        # First get the event to check if it has attendees
        event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()
        has_attendees = 'attendees' in event and len(event['attendees']) > 0
        
        # Delete the event
        service.events().delete(
            calendarId=calendar_id, 
            eventId=event_id,
            sendUpdates='all' if (send_notifications is None or send_notifications) and has_attendees else 'none'
        ).execute()
        
        notification_status = "Cancellation notifications have been sent to attendees." if (send_notifications is None or send_notifications) and has_attendees else ""
        
        return f"Event with ID {event_id} has been deleted successfully. {notification_status}"
    
    except HttpError as error:
        return f"An error occurred: {error}"
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"

@function_tool
def get_user_timezone() -> str:
    """Get the user's current timezone setting
    
    Returns:
        The current timezone setting
    """
    return f"Your current timezone is set to: {USER_TIMEZONE}"

@function_tool
def set_user_timezone(timezone: str) -> str:
    """Set the user's timezone
    
    Args:
        timezone: The timezone to set (e.g., 'America/New_York', 'Europe/London')
    
    Returns:
        A confirmation message
    """
    try:
        # Validate the timezone
        pytz.timezone(timezone)
        
        # Update the global variable
        global USER_TIMEZONE
        USER_TIMEZONE = timezone
        
        return f"Your timezone has been updated to: {timezone}"
    except pytz.exceptions.UnknownTimeZoneError:
        return f"Invalid timezone: {timezone}. Please use a valid timezone identifier (e.g., 'America/New_York')."

###########################################
# Google Maps Tools
###########################################

def get_maps_client():
    """Get an authenticated Google Maps API client"""
    return GoogleMapsClient(key=GOOGLE_MAPS_API_KEY)

@function_tool
def search_location(query: str, region: Optional[str] = None) -> str:
    """Search for a location or place on Google Maps
    
    Args:
        query: The location or place to search for
        region: Optional region bias for the search (e.g., 'us', 'ca')
    
    Returns:
        Details about the location including name, address, and coordinates
    """
    try:
        # Get the maps client
        gmaps = get_maps_client()
        
        # Perform the geocoding request
        geocode_result = gmaps.geocode(query, region=region)
        
        if not geocode_result:
            return f"No results found for '{query}'."
        
        # Format the first result
        place = geocode_result[0]
        formatted_address = place.get('formatted_address', 'Address not available')
        place_id = place.get('place_id', 'ID not available')
        
        # Extract location coordinates
        location = place.get('geometry', {}).get('location', {})
        lat = location.get('lat', 'N/A')
        lng = location.get('lng', 'N/A')
        
        # Get place types
        types = place.get('types', [])
        types_str = ', '.join(types) if types else 'No type information available'
        
        result = f"Location found:\n"
        result += f"Address: {formatted_address}\n"
        result += f"Coordinates: {lat}, {lng}\n"
        result += f"Place ID: {place_id}\n"
        result += f"Types: {types_str}\n"
        
        return result
    
    except Exception as e:
        return f"An error occurred while searching for the location: {str(e)}"

@function_tool
def calculate_distance(
    origin: str,
    destination: str,
    mode: Optional[str] = None
) -> str:
    """Calculate distance and time between two locations
    
    Args:
        origin: Starting location (address or place name)
        destination: Ending location (address or place name)
        mode: Travel mode (driving, walking, bicycling, transit)
    
    Returns:
        Distance and estimated travel time information
    """
    try:
        # Get the maps client
        gmaps = get_maps_client()
        
        # Set default mode if not provided
        if mode is None:
            mode = "driving"
        
        # Check if mode is valid
        valid_modes = ["driving", "walking", "bicycling", "transit"]
        if mode not in valid_modes:
            return f"Invalid mode: {mode}. Please use one of: {', '.join(valid_modes)}"
        
        # Get the distance matrix
        distance_result = gmaps.distance_matrix(
            origins=[origin],
            destinations=[destination],
            mode=mode,
            units="imperial"
        )
        
        # Extract the results
        rows = distance_result.get('rows', [{}])
        if not rows:
            return "Could not calculate distance - no results returned."
        
        elements = rows[0].get('elements', [{}])
        if not elements:
            return "Could not calculate distance - no elements returned."
        
        # Get the first element
        element = elements[0]
        
        # Check the status
        if element.get('status') != 'OK':
            return f"Could not calculate distance: {element.get('status', 'Unknown error')}"
        
        # Extract distance and duration
        distance = element.get('distance', {}).get('text', 'N/A')
        duration = element.get('duration', {}).get('text', 'N/A')
        
        # Format the result
        result = f"Distance from '{origin}' to '{destination}':\n"
        result += f"Distance: {distance}\n"
        result += f"Estimated travel time ({mode}): {duration}"
        
        return result
    
    except Exception as e:
        return f"An error occurred while calculating distance: {str(e)}"

@function_tool
def find_nearby_places(
    location: str,
    radius: Optional[int] = None,
    type_of_place: Optional[str] = None,
    keyword: Optional[str] = None,
    max_results: Optional[int] = None
) -> str:
    """Find places near a specified location
    
    Args:
        location: Center point for the search (address, place name, or lat,lng)
        radius: Search radius in meters (max 50000)
        type_of_place: Optional type of place (e.g., 'restaurant', 'cafe', 'gas_station')
        keyword: Optional keyword to filter results
        max_results: Maximum number of results to return
    
    Returns:
        List of places matching the search criteria
    """
    try:
        # Get the maps client
        gmaps = get_maps_client()
        
        # Set default values if not provided
        if radius is None:
            radius = 1000
        
        if max_results is None:
            max_results = 5
        
        # First, geocode the location if it's not coordinates
        if ',' not in location or not all(part.strip().replace('-', '').replace('.', '').isdigit() for part in location.split(',', 1)):
            geocode_result = gmaps.geocode(location)
            if not geocode_result:
                return f"Could not find location: {location}"
            
            place = geocode_result[0]
            loc = place.get('geometry', {}).get('location', {})
            location = f"{loc.get('lat')},{loc.get('lng')}"
        
        # Perform the nearby search
        places_result = gmaps.places_nearby(
            location=location,
            radius=radius,
            type=type_of_place,
            keyword=keyword
        )
        
        # Check if we have results
        results = places_result.get('results', [])
        if not results:
            return f"No places found near {location} matching your criteria."
        
        # Limit results to the specified maximum
        results = results[:max_results]
        
        # Format the output
        output = f"Found {len(results)} places near {location}:\n\n"
        
        for i, place in enumerate(results, 1):
            name = place.get('name', 'Name not available')
            address = place.get('vicinity', 'Address not available')
            rating = place.get('rating', 'Not rated')
            place_id = place.get('place_id', 'ID not available')
            
            # Get open status if available
            open_now = place.get('opening_hours', {}).get('open_now')
            open_status = "Open now" if open_now is True else "Closed" if open_now is False else "Hours unknown"
            
            output += f"{i}. {name}\n"
            output += f"   Address: {address}\n"
            output += f"   Rating: {rating}/5\n"
            output += f"   Status: {open_status}\n"
            output += f"   Place ID: {place_id}\n\n"
        
        return output
    
    except Exception as e:
        return f"An error occurred while searching for nearby places: {str(e)}"

@function_tool
def get_place_details(place_id: str) -> str:
    """Get detailed information about a specific place
    
    Args:
        place_id: The Google Place ID for the location
    
    Returns:
        Detailed information about the place
    """
    try:
        # Get the maps client
        gmaps = get_maps_client()
        
        # Get place details
        place_details = gmaps.place(place_id=place_id, fields=[
            'name', 'formatted_address', 'international_phone_number', 
            'website', 'rating', 'reviews', 'opening_hours',
            'price_level', 'formatted_phone_number'
        ])
        
        # Check the status
        if place_details.get('status') != 'OK':
            return f"Could not get place details: {place_details.get('status', 'Unknown error')}"
        
        # Extract the result
        result = place_details.get('result', {})
        if not result:
            return f"No details found for place ID: {place_id}"
        
        # Format the output
        name = result.get('name', 'Name not available')
        address = result.get('formatted_address', 'Address not available')
        phone = result.get('formatted_phone_number', 'Phone not available')
        website = result.get('website', 'Website not available')
        rating = result.get('rating', 'Rating not available')
        
        # Price level
        price_level = result.get('price_level', None)
        price_str = 'Not available'
        if price_level is not None:
            price_str = '$' * price_level if price_level > 0 else 'Free'
        
        # Opening hours
        opening_hours = result.get('opening_hours', {})
        is_open = opening_hours.get('open_now', None)
        open_str = "Open now" if is_open is True else "Closed" if is_open is False else "Hours unknown"
        
        # Format periods if available
        periods_str = ""
        weekday_text = opening_hours.get('weekday_text', [])
        if weekday_text:
            periods_str = "\nHours:\n" + "\n".join(f"   {day}" for day in weekday_text)
        
        # Format the output
        output = f"Details for {name}:\n"
        output += f"Address: {address}\n"
        output += f"Phone: {phone}\n"
        output += f"Website: {website}\n"
        output += f"Rating: {rating}/5\n"
        output += f"Price Level: {price_str}\n"
        output += f"Status: {open_str}{periods_str}\n"
        
        # Add reviews if available
        reviews = result.get('reviews', [])
        if reviews:
            output += f"\nTop Review:\n"
            top_review = reviews[0]
            output += f"Rating: {top_review.get('rating')}/5\n"
            output += f"Author: {top_review.get('author_name', 'Anonymous')}\n"
            output += f"Comment: {top_review.get('text', 'No comment')[:150]}...\n"
        
        return output
    
    except Exception as e:
        return f"An error occurred while getting place details: {str(e)}"

@function_tool
def get_directions(
    origin: str,
    destination: str,
    mode: Optional[str] = None,
    waypoints: Optional[List[str]] = None,
    alternatives: Optional[bool] = None
) -> str:
    """Get directions between two locations
    
    Args:
        origin: Starting location (address or place name)
        destination: Ending location (address or place name)
        mode: Travel mode (driving, walking, bicycling, transit)
        waypoints: Optional list of waypoints to include in the route
        alternatives: Whether to return alternative routes
    
    Returns:
        Step-by-step directions and route information
    """
    try:
        # Get the maps client
        gmaps = get_maps_client()
        
        # Set default values if not provided
        if mode is None:
            mode = "driving"
            
        if alternatives is None:
            alternatives = False
        
        # Check if mode is valid
        valid_modes = ["driving", "walking", "bicycling", "transit"]
        if mode not in valid_modes:
            return f"Invalid mode: {mode}. Please use one of: {', '.join(valid_modes)}"
        
        # Convert waypoints to list if not None
        if waypoints is None:
            waypoints = []
        
        # Get the directions
        directions_result = gmaps.directions(
            origin=origin,
            destination=destination,
            mode=mode,
            waypoints=waypoints,
            alternatives=alternatives
        )
        
        # Check if we have results
        if not directions_result:
            return f"No directions found from {origin} to {destination}."
        
        # Format the output for the first route
        route = directions_result[0]
        
        # Get the overall distance and duration
        legs = route.get('legs', [])
        if not legs:
            return "No route legs found."
        
        # Format the output
        output = f"Directions from {origin} to {destination} ({mode}):\n\n"
        
        total_distance = 0
        total_duration = 0
        
        for i, leg in enumerate(legs):
            start_address = leg.get('start_address', 'Start location')
            end_address = leg.get('end_address', 'End location')
            
            distance = leg.get('distance', {}).get('text', 'Unknown distance')
            duration = leg.get('duration', {}).get('text', 'Unknown duration')
            
            # Add to totals if we have multiple legs
            distance_value = leg.get('distance', {}).get('value', 0)
            duration_value = leg.get('duration', {}).get('value', 0)
            total_distance += distance_value
            total_duration += duration_value
            
            output += f"Leg {i+1}: {start_address} to {end_address}\n"
            output += f"Distance: {distance}, Duration: {duration}\n\n"
            
            # Add steps
            steps = leg.get('steps', [])
            for j, step in enumerate(steps):
                instruction = step.get('html_instructions', 'No instruction available')
                # Remove HTML tags
                instruction = instruction.replace('<b>', '').replace('</b>', '')
                instruction = instruction.replace('<div>', '\n  ').replace('</div>', '')
                
                step_distance = step.get('distance', {}).get('text', 'Unknown distance')
                step_duration = step.get('duration', {}).get('text', 'Unknown duration')
                
                output += f"{j+1}. {instruction}\n"
                output += f"   ({step_distance}, {step_duration})\n"
            
            output += "\n"
        
        # Add alternative routes summary if requested
        if alternatives and len(directions_result) > 1:
            output += "Alternative routes:\n"
            for i, alt_route in enumerate(directions_result[1:], 2):
                alt_legs = alt_route.get('legs', [])
                if not alt_legs:
                    continue
                
                alt_distance = alt_legs[0].get('distance', {}).get('text', 'Unknown distance')
                alt_duration = alt_legs[0].get('duration', {}).get('text', 'Unknown duration')
                
                output += f"Route {i}: Distance: {alt_distance}, Duration: {alt_duration}\n"
        
        return output
    
    except Exception as e:
        return f"An error occurred while getting directions: {str(e)}"

###########################################
# Email Tools
###########################################

@function_tool
def send_email(
    recipients: List[str],
    subject: str,
    body: str,
    html_content: Optional[str] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    from_name: Optional[str] = None
) -> str:
    """Send an email using SendGrid
    
    Args:
        recipients: List of email addresses to send to
        subject: Email subject line
        body: Plain text email content (used as fallback if HTML isn't provided)
        html_content: Optional HTML content for the email (recommended for better formatting)
        cc: Optional list of email addresses to CC
        bcc: Optional list of email addresses to BCC
        from_name: Optional sender name (defaults to 'Personal Assistant')
    
    Returns:
        A confirmation message
    """
    try:
        # Get API key from environment
        api_key = SENDGRID_API_KEY
        if not api_key:
            return "Error: SendGrid API key not found in environment variables"
        
        # Set up the SendGrid client
        sg = SendGridAPIClient(api_key)
        
        # Set up default from address
        from_email = Email("assistant@stormcdn.net")
        if from_name:
            from_email.name = from_name
        else:
            from_email.name = "Personal Assistant"
        
        # Create the email
        message = Mail(
            from_email=from_email,
            subject=subject,
            is_multiple=True
        )
        
        # Add personalization for each recipient
        personalization = Personalization()
        for recipient in recipients:
            personalization.add_to(To(recipient))
        
        # Add CC recipients if provided
        if cc:
            for cc_address in cc:
                personalization.add_cc(To(cc_address))
        
        # Add BCC recipients if provided
        if bcc:
            for bcc_address in bcc:
                personalization.add_bcc(To(bcc_address))
        
        # Add the personalization to the message
        message.add_personalization(personalization)
        
        # Add content to the message - if HTML content is provided, use it
        if html_content:
            message.add_content(Content("text/html", html_content))
        else:
            # Convert the plain text to basic HTML if no HTML content is provided
            html_body = body.replace("\n", "<br>")
            formatted_html = f"""
            <html>
            <body>
                {html_body}
            </body>
            </html>
            """
            message.add_content(Content("text/html", formatted_html))
        
        # Send the email
        response = sg.send(message)
        
        # Return a success message with status code
        return f"Email sent successfully to {', '.join(recipients)}. Status code: {response.status_code}"
    
    except Exception as e:
        # Return error message
        return f"Failed to send email: {str(e)}"

@function_tool
def create_html_email(
    content: str,
    style: Optional[str] = None
) -> str:
    """Create formatted HTML email content
    
    Args:
        content: The plain text content to format as HTML
        style: The style template to use (standard, professional, casual, formal)
    
    Returns:
        Formatted HTML content for use with send_email
    """
    # Get the base styling based on the selected template
    base_style = """
    body { font-family: Arial, sans-serif; color: #333333; line-height: 1.5; }
    h1 { color: #2c3e50; font-size: 22px; margin-bottom: 15px; }
    h2 { color: #3498db; font-size: 18px; margin-bottom: 12px; }
    p { margin-bottom: 15px; }
    .signature { margin-top: 25px; color: #666666; }
    .container { max-width: 600px; padding: 20px; }
    """
    
    # Override with selected style if provided
    if style == "professional":
        base_style = """
        body { font-family: Arial, sans-serif; color: #333333; line-height: 1.6; }
        h1 { color: #0066cc; font-size: 22px; margin-bottom: 15px; }
        h2 { color: #0077cc; font-size: 18px; margin-bottom: 12px; }
        p { margin-bottom: 15px; }
        .signature { margin-top: 30px; border-top: 1px solid #dddddd; padding-top: 10px; color: #666666; }
        .container { max-width: 600px; padding: 20px; }
        """
    elif style == "casual":
        base_style = """
        body { font-family: 'Trebuchet MS', sans-serif; color: #444444; line-height: 1.6; }
        h1 { color: #ff6600; font-size: 24px; margin-bottom: 15px; }
        h2 { color: #ff9900; font-size: 20px; margin-bottom: 12px; }
        p { margin-bottom: 15px; }
        .signature { margin-top: 25px; font-style: italic; color: #777777; }
        .container { max-width: 600px; padding: 20px; background-color: #fffaf0; }
        """
    elif style == "formal":
        base_style = """
        body { font-family: 'Times New Roman', serif; color: #222222; line-height: 1.6; }
        h1 { color: #000066; font-size: 22px; margin-bottom: 15px; font-weight: normal; }
        h2 { color: #000077; font-size: 18px; margin-bottom: 12px; font-weight: normal; }
        p { margin-bottom: 15px; }
        .signature { margin-top: 30px; border-top: 1px solid #cccccc; padding-top: 10px; color: #444444; }
        .container { max-width: 600px; padding: 25px; background-color: #f9f9f9; }
        """
    
    # Convert plain text to HTML
    # Split paragraphs
    paragraphs = content.split('\n\n')
    html_paragraphs = []
    
    for paragraph in paragraphs:
        # Check if it looks like a header (less than 60 chars, no period at end)
        if len(paragraph) < 60 and not paragraph.strip().endswith('.'):
            # Check if it's a main heading (all caps or first few words are all caps)
            if paragraph.isupper() or ' '.join(paragraph.split()[:2]).isupper():
                html_paragraphs.append(f"<h1>{paragraph}</h1>")
            else:
                html_paragraphs.append(f"<h2>{paragraph}</h2>")
        else:
            # Regular paragraph with line breaks preserved
            formatted_para = paragraph.replace('\n', '<br>')
            html_paragraphs.append(f"<p>{formatted_para}</p>")
    
    html_body = '\n'.join(html_paragraphs)
    
    # Generate the full HTML email
    html_email = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            {base_style}
        </style>
    </head>
    <body>
        <div class="container">
            {html_body}
        </div>
    </body>
    </html>
    """
    
    return html_email

@function_tool
def send_event_invitation_email(
    event_summary: str,
    event_date: str,
    event_time: str,
    event_location: str,
    recipients: List[str],
    description: Optional[str] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    from_name: Optional[str] = None
) -> str:
    """Send a nicely formatted event invitation email
    
    Args:
        event_summary: Title of the event
        event_date: Date of the event (e.g. 'April 10, 2025')
        event_time: Time of the event (e.g. '3:00 PM - 4:30 PM')
        event_location: Location of the event
        recipients: List of email addresses to invite
        description: Optional description of the event
        cc: Optional list of email addresses to CC
        bcc: Optional list of email addresses to BCC
        from_name: Optional sender name
    
    Returns:
        A confirmation message
    """
    # Create a subject line
    subject = f"Invitation: {event_summary} - {event_date}"
    
    # Create the HTML content for the invitation
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{ font-family: Arial, sans-serif; color: #333333; line-height: 1.5; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #3498db; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0; }}
            .content {{ background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }}
            .event-details {{ margin: 20px 0; }}
            .event-item {{ padding: 10px; border-bottom: 1px solid #e0e0e0; }}
            .event-label {{ font-weight: bold; color: #3498db; width: 100px; display: inline-block; }}
            .footer {{ margin-top: 20px; font-size: 12px; color: #777777; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>You're Invited!</h2>
            </div>
            <div class="content">
                <h3>{event_summary}</h3>
                
                <div class="event-details">
                    <div class="event-item">
                        <span class="event-label">Date:</span> {event_date}
                    </div>
                    <div class="event-item">
                        <span class="event-label">Time:</span> {event_time}
                    </div>
                    <div class="event-item">
                        <span class="event-label">Location:</span> {event_location}
                    </div>
                </div>
                
                {f'<p><strong>Details:</strong><br>{description.replace(chr(10), "<br>")}</p>' if description else ''}
                
                <p>Please let me know if you can attend.</p>
                
                <div class="footer">
                    <p>This invitation was sent using Personal Assistant.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version as fallback
    plain_text = f"""
You're Invited: {event_summary}

Date: {event_date}
Time: {event_time}
Location: {event_location}

{f'Details: {description}' if description else ''}

Please let me know if you can attend.

This invitation was sent using Personal Assistant.
    """
    
    # Use the send_email function to send the invitation
    return send_email(
        recipients=recipients,
        subject=subject,
        body=plain_text,
        html_content=html_content,
        cc=cc,
        bcc=bcc,
        from_name=from_name
    )

###########################################
# Create Specialized Agents
###########################################

def create_calendar_agent():
    """Create a specialized Calendar agent"""
    
    calendar_agent = Agent(
        name="Calendar Assistant",
        instructions=f"""
        You are a specialized Calendar Assistant. Your purpose is to help manage and organize
        the user's calendar using Google Calendar services.
        
        The user's name is {USER_FULL_NAME} and their email is {USER_EMAIL}.
        The user's timezone is set to {USER_TIMEZONE}.
        Today's date is {datetime.now(pytz.timezone(USER_TIMEZONE)).strftime('%Y-%m-%d')}.
        
        You have the following capabilities:
        - Create new calendar events with all necessary details
        - Update existing events (change time, description, attendees, etc.)
        - List upcoming events from the calendar
        - Delete events when requested
        - Send calendar invitations to attendees
        
        When managing calendar events:
        - Extract all relevant details from the user's request
        - Format dates and times in ISO format for API calls
        - Always confirm details before creating or modifying events
        - Send notifications to attendees for events when appropriate
        - Always use the user's timezone ({USER_TIMEZONE}) when interpreting dates and times
        
        Provide clear and concise responses about the actions you've taken.
        """,
        tools=[
            create_event,
            update_event,
            list_events,
            delete_event,
            get_user_timezone,
            set_user_timezone
        ],
        model_settings=ModelSettings(tool_choice="auto"),
    )
    
    return calendar_agent

def create_maps_agent():
    """Create a specialized Maps agent"""
    
    maps_agent = Agent(
        name="Maps Assistant",
        instructions=f"""
        You are a specialized Maps Assistant. Your purpose is to help with location-based queries
        including finding places, calculating distances, and providing directions.
        
        You have the following capabilities:
        - Search for locations and places
        - Calculate distances and travel times between locations
        - Find nearby places (restaurants, cafes, gas stations, etc.)
        - Get detailed information about specific places
        - Generate directions between locations
        
        When handling location requests:
        - Request specific addresses or locations when queries are ambiguous
        - Provide comprehensive details about places when available
        - Format directions clearly with step-by-step instructions
        - Include relevant information like distance, travel time, or business hours
        
        Always provide concise, accurate responses with relevant location details.
        After completing a maps-related task, summarize the key information clearly.
        """,
        tools=[
            search_location,
            calculate_distance,
            find_nearby_places,
            get_place_details,
            get_directions
        ],
        model_settings=ModelSettings(tool_choice="auto"),
    )
    
    return maps_agent

def create_email_agent():
    """Create a specialized Email agent"""
    
    email_agent = Agent(
        name="Email Assistant",
        instructions=f"""
        You are a specialized Email Assistant. Your purpose is to help the user compose and send
        emails with professional formatting.
        
        The user's name is {USER_FULL_NAME} and their email is {USER_EMAIL}.
        
        You have the following capabilities:
        - Send emails to individuals or groups
        - Create professionally formatted HTML emails
        - Send event invitations via email
        - Support CC and BCC recipients
        
        When sending emails:
        - Format emails in HTML for better readability
        - Use appropriate styling based on the email's context
        - Include all necessary information
        - Structure emails with proper headings, paragraphs, etc.
        - IMPORTANT: Make sure to specify that you are an AI assistant that is sending an email
          on behalf of the user. DO NOT pretend to be the user.
        
        Provide clear confirmations when emails have been sent successfully.
        """,
        tools=[
            send_email,
            create_html_email,
            send_event_invitation_email
        ],
        model_settings=ModelSettings(tool_choice="auto"),
    )
    
    return email_agent

###########################################
# Main Personal Assistant
###########################################

def create_personal_assistant():
    """Create the main personal assistant with handoffs to specialized agents"""
    
    # Create specialized agents
    calendar_agent = create_calendar_agent()
    maps_agent = create_maps_agent()
    email_agent = create_email_agent()
    
    # Define handoff callbacks (optional)
    def on_calendar_handoff(ctx: RunContextWrapper[Any]):
        print("[DEBUG] Handing off to Calendar Assistant...")
        
    def on_maps_handoff(ctx: RunContextWrapper[Any]):
        print("[DEBUG] Handing off to Maps Assistant...")
        
    def on_email_handoff(ctx: RunContextWrapper[Any]):
        print("[DEBUG] Handing off to Email Assistant...")
    
    # Create customized handoffs
    calendar_handoff = handoff(
        agent=calendar_agent,
        on_handoff=on_calendar_handoff,
        tool_name_override="ask_calendar_assistant",
        tool_description_override="Hand off to the Calendar Assistant for schedule and event management"
    )
    
    maps_handoff = handoff(
        agent=maps_agent,
        on_handoff=on_maps_handoff,
        tool_name_override="ask_maps_assistant", 
        tool_description_override="Hand off to the Maps Assistant for location-based queries"
    )
    
    email_handoff = handoff(
        agent=email_agent,
        on_handoff=on_email_handoff,
        tool_name_override="ask_email_assistant",
        tool_description_override="Hand off to the Email Assistant for email composition and sending"
    )
    
    # Create main personal assistant with handoffs
    assistant = Agent(
        name=f"{ASSISTANT_NAME}",
        instructions=f"""
        {RECOMMENDED_PROMPT_PREFIX}
        
        Your name is {ASSISTANT_NAME}, and you are a helpful personal assistant.
        The user's name is {USER_FULL_NAME} and their email is {USER_EMAIL}.
        
        You have the following specialized assistants you can hand off to:
        
        1. CALENDAR ASSISTANT:
           Hand off to this assistant for:
           - Creating, updating, listing, or deleting calendar events
           - Managing schedule and appointments
           - Sending calendar invitations
           - Any time-management tasks
        
        2. MAPS ASSISTANT:
           Hand off to this assistant for:
           - Finding locations or places
           - Calculating distances or travel times
           - Getting directions between places
           - Finding nearby businesses or points of interest
           - Getting details about specific places
        
        3. EMAIL ASSISTANT:
           Hand off to this assistant for:
           - Composing and sending emails
           - Creating formatted HTML emails
           - Sending event invitations via email
        
        WHEN TO USE HANDOFFS:
        - When a request clearly belongs to one of the specialized assistants
        - When a task requires specific tools that only a specialized assistant has
        - When a complex request can be better handled by a focused assistant
        
        Important user information:
        - Timezone: {USER_TIMEZONE}
        - Today's date: {datetime.now(pytz.timezone(USER_TIMEZONE)).strftime('%Y-%m-%d')}
        
        Remember to be helpful, conversational, and responsive to the user's needs.
        """,
        handoffs=[calendar_handoff, maps_handoff, email_handoff],
        model_settings=ModelSettings(tool_choice="auto"),
    )
    
    return assistant

###########################################
# Main Function
###########################################

async def run_personal_assistant():
    """Run the personal assistant in an interactive conversation loop"""
    
    # Create the main assistant with specialized handoffs
    agent = create_personal_assistant()
    
    # Trace ID for OpenAI trace visualization
    trace_id = gen_trace_id()
    
    print(f"\n{ASSISTANT_NAME} is ready to assist you!")
    print(f"View trace: https://platform.openai.com/traces/trace?trace_id={trace_id}")
    print(f"Type 'exit' to quit the conversation.\n")
    
    # Interactive conversation loop
    result = None
    
    with trace(workflow_name="Personal Assistant", trace_id=trace_id):
        while True:
            # Get user input
            user_input = input("\nYou: ")
            
            # Check if user wants to exit
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print(f"\n{ASSISTANT_NAME}: Goodbye! Have a great day!")
                break
            
            try:
                # For the first interaction, we don't have previous results
                if result is None:
                    result = await Runner.run(starting_agent=agent, input=user_input)
                else:
                    # For subsequent interactions, include the conversation history
                    result = await Runner.run(
                        starting_agent=agent, 
                        input=result.to_input_list() + [{"role": "user", "content": user_input}]
                    )
                
                # Print the assistant's response
                print(f"\n{ASSISTANT_NAME}: {result.final_output}")
                
            except Exception as e:
                print(f"\nError: {str(e)}")
                print("Let's start a new conversation.")
                result = None

if __name__ == "__main__":
    asyncio.run(run_personal_assistant())
    