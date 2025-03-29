from flask import Request, Response
from firebase_functions import https_fn
import json
from firebase_functions import https_fn, options
from firebase_admin import credentials, firestore
import firebase_admin
from firebase_functions.params import StringParam


# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("starlis_admin_creds.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    # App already initialized
    pass

# Initialize Firestore
db = firestore.client()

SENDING_DOMAIN = StringParam('SENDING_DOMAIN', 'placeholder.com')


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
