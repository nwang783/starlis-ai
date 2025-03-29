from flask import Request, Response
from firebase_functions import https_fn
import json
from firebase_functions import https_fn, options
from firebase_admin import credentials, firestore
import firebase_admin
from firebase_functions.params import StringParam
from email_utils import parse_sendgrid_inbound_email, extract_secretary_id_from_email, get_secretary_info, log_task, send_email_response
from ai_utils import process_with_ai

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("starlis_admin_creds.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    # App already initialized
    pass

# Initialize Firestore
db = firestore.client()

SENDING_DOMAIN = StringParam('SENDING_DOMAIN', 'starlis.com')


@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST"]
    )
)
def create_ai_secretary_email(request: Request) -> Response:
    """
    Create a new AI secretary email address.
    
    Expected POST payload:
    {
        "user_id": "user123",
        "secretary_name": "Alex",
        "username": "john"  # Optional, uses 'ai' if not provided
        "personality": "friendly and helpful",
        "custom_instructions": "Be polite and concise."
    }
    
    Returns:
    {
        "email": "john-abc123@aisecretary.com",
        "secretary_id": "abc123"
    }
    """
    if request.method != 'POST':
        return Response("Method not allowed", status=405)
    
    try:
        # Get request data
        request_data = request.get_json()
        
        if not request_data:
            return Response("Invalid request data", status=400)
        
        user_id = request_data.get('user_id')
        secretary_name = request_data.get('secretary_name', 'AI Secretary')
        username = request_data.get('username', 'ai')
        
        if not user_id:
            return Response("Missing user_id", status=400)
        
        user_ref = db.collection('users').document(user_id)
        if not user_ref.get().exists:
            return Response("User not found", status=404)
        user_doc = user_ref.get()
        user_full_name = user_doc.get('firstName') + ' ' + user_doc.get('lastName')
        user_email = user_doc.get('email')
        
        # Generate a unique ID for the secretary
        secretary_id = generate_unique_id()
        
        # Create the email address using your verified domain
        email_address = f"{username}-{secretary_id}@{SENDING_DOMAIN.value}"
        
        # Create the secretary document in Firestore
        secretary_data = {
            'user_id': user_id,
            'name': secretary_name,
            'email': email_address,
            'secretary_id': secretary_id,
            'user_full_name': user_full_name,
            'user_email': user_email,
            'created_at': firestore.SERVER_TIMESTAMP,
            'personality': request_data.get('personality', 'helpful and professional'),
            'custom_instructions': request_data.get('custom_instructions', '')
        }
        
        # Save to Firestore
        db.collection('ai_secretaries').document(secretary_id).set(secretary_data)
        
        # Return the email address and secretary ID
        return Response(
            json.dumps({
                'email': email_address,
                'secretary_id': secretary_id
            }),
            status=200,
            content_type='application/json'
        )
    
    except Exception as e:
        print(f"Error creating AI secretary email: {str(e)}")
        return Response(f"Error: {str(e)}", status=500)

def generate_unique_id(length=8):
    """
    Generate a unique ID for the secretary.
    In production, use a more robust method.
    """
    import random
    import string
    
    characters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST"]
    )
)
def process_sendgrid_inbound_email(request: Request) -> Response:
    """
    Process incoming emails from SendGrid's Inbound Parse webhook.
    
    Expected payload format from SendGrid:
    - Headers and email content in multipart form data or JSON
    - Attachments (if any)
    
    Function will:
    1. Parse the incoming email
    2. Identify which AI secretary should handle it
    3. Log the request in Firestore
    4. Process with AI
    5. Send a response email
    """
    try:
        # Parse the incoming email from SendGrid's webhook
        email_data = parse_sendgrid_inbound_email(request)
        if not email_data:
            return Response("Invalid email data", status=400)
        
        # Extract relevant information
        to_address = email_data.get('to', '')
        from_address = email_data.get('from', '')
        subject = email_data.get('subject', '(No Subject)')
        text_content = email_data.get('text', '')
        print(f"Email content (text): {text_content}")
        html_content = email_data.get('html', '')
        
        # Extract message ID and references for threading
        message_id = email_data.get('message_id')
        references = email_data.get('references')
        
        # Get the AI secretary ID from the email address
        ai_secretary_id = extract_secretary_id_from_email(to_address, SENDING_DOMAIN.value)
        if not ai_secretary_id:
            print(f"Could not extract AI secretary ID from: {to_address}")
            return Response("Invalid recipient", status=400)
        
        # Look up the secretary info in Firestore
        secretary_info = get_secretary_info(ai_secretary_id, db)
        if not secretary_info:
            print(f"No secretary found with ID: {ai_secretary_id}")
            return Response("Secretary not found", status=404)
        
        # Log the incoming email in task history
        task_id = log_task(secretary_info['user_id'], ai_secretary_id, {
            'type': 'email',
            'from': from_address,
            'to': to_address,
            'subject': subject,
            'body': text_content or html_content,  # Store the body for history
            'message_id': message_id,
            'references': references,
            'received_at': firestore.SERVER_TIMESTAMP,
            'status': 'received'
        }, db)

        # Process the email with AI and get response
        response_content, debug_logs = process_with_ai(
            secretary_info=secretary_info,
            from_address=from_address,
            subject=subject,
            body=text_content or html_content,
            task_id=task_id
        )
        
        # Print debug logs
        print("=== DEBUG LOGS START ===")
        for i, log in enumerate(debug_logs):
            print(f"[{i}] {log}")
        print("=== DEBUG LOGS END ===")
        
        # Send the response email with thread headers
        send_email_response(
            to_email=from_address,
            from_email=to_address,
            subject=f"Re: {subject}",
            content=response_content,
            message_id=message_id,
            references=references, 
            domain=SENDING_DOMAIN.value
        )
        
        return Response("Email processed successfully", status=200)
    
    except Exception as e:
        print(f"Error processing email: {str(e)}")
        return Response(f"Error processing email: {str(e)}", status=500)


