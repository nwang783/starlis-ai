from flask import Request, Response
import json
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content
from firebase_functions.params import StringParam

# Initialize SendGrid API key and domain
SENDGRID_API_KEY = StringParam('SENDGRID_API_KEY')

def parse_sendgrid_inbound_email(request: Request) -> dict:
    """
    Parse the email data from SendGrid's Inbound Parse webhook.
    This improved version handles typical SendGrid webhook formats better.
    """
    try:
        # Extract Message-ID and References headers for threading
        message_id = None
        references = None
        
        # For multipart/form-data (most common SendGrid format)
        if request.content_type and 'multipart/form-data' in request.content_type:
            form = request.form.to_dict()
            
            # Extract from the 'email' field if that's where the content is
            if 'email' in form and (not form.get('text') and not form.get('html')):
                email_raw = form.get('email', '')
                # Simple extraction of essential parts from the raw email
                from_address = extract_header(email_raw, 'From')
                to_address = extract_header(email_raw, 'To')
                subject = extract_header(email_raw, 'Subject')
                message_id = extract_header(email_raw, 'Message-ID')
                references = extract_header(email_raw, 'References')
                
                # Try to extract body by looking for double newline after headers
                body = ""
                parts = email_raw.split('\r\n\r\n', 1)
                if len(parts) > 1:
                    body = parts[1]
                
                email_data = {
                    'to': to_address,
                    'from': from_address,
                    'subject': subject,
                    'text': body,
                    'html': ''  # We don't extract HTML separately in this simple parser
                }
            else:
                # Standard form fields from SendGrid
                email_data = {
                    'to': form.get('to', ''),
                    'from': form.get('from', ''),
                    'subject': form.get('subject', ''),
                    'text': form.get('text', ''),
                    'html': form.get('html', '')
                }
            
            # Process envelope if available (more reliable sender/recipient info)
            if 'envelope' in form:
                try:
                    envelope = json.loads(form['envelope'])
                    if not email_data['from'] and 'from' in envelope:
                        email_data['from'] = envelope['from']
                    if not email_data['to'] and 'to' in envelope and envelope['to']:
                        email_data['to'] = envelope['to'][0]  # Take the first recipient
                except json.JSONDecodeError:
                    print("Could not parse envelope JSON")
            
            # If we still don't have text content but have a body field, use that
            if not email_data['text'] and 'body-plain' in form:
                email_data['text'] = form['body-plain']
            
            # Last resort - try to find any field that might contain the message body
            if not email_data['text']:
                for key in form:
                    if key.lower() in ['body', 'content', 'message', 'text_body', 'body_text']:
                        email_data['text'] = form[key]
                        break
            
            # Add the message ID and references to the email_data
            email_data['message_id'] = message_id
            email_data['references'] = references
            
            return email_data
        print("Could not determine how to parse the request")
        return None
    
    except Exception as e:
        print(f"Error parsing email: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def extract_header(raw_email, header_name):
    """
    Improved helper to extract headers from raw email text.
    Handles both single-line and multi-line headers.
    """
    lines = raw_email.splitlines()
    header_value = ""
    found_header = False
    
    for i, line in enumerate(lines):
        if line.startswith(f"{header_name}:"):
            header_value = line[len(header_name)+1:].strip()
            found_header = True
            # Check for continuation lines (indented with space or tab)
            for j in range(i+1, len(lines)):
                if lines[j].startswith((' ', '\t')):
                    header_value += ' ' + lines[j].strip()
                else:
                    break
            break
    
    if found_header:
        print(f"Extracted header {header_name}: {header_value}")
    return header_value

def extract_secretary_id_from_email(email_address, sending_domain):
    """
    Extract the AI secretary ID from the email address.
    
    Expected formats:
    - username-uniqueid@ourdomain.com
    - ai-uniqueid@ourdomain.com
    - "Name" <username-uniqueid@ourdomain.com>
    
    Returns the uniqueid part.
    """
    try:
        # First handle the case with display name format: "Name" <email@example.com>
        if '<' in email_address and '>' in email_address:
            # Extract just the email part between < >
            email_address = email_address.split('<')[1].split('>')[0].strip()
            
        # Split the email address at the @ symbol
        local_part, domain = email_address.split('@')
        
        # Check if it's our domain
        if not domain.endswith(sending_domain):  # Use your verified domain
            return None
        
        # Extract the unique ID after the hyphen
        if '-' in local_part:
            _, unique_id = local_part.split('-', 1)
            return unique_id
        
        return None
    except Exception as e:
        print(f"Error extracting secretary ID: {str(e)}")
        return None
    
def get_secretary_info(secretary_id, db):
    """
    Get the AI secretary information from Firestore.
    """
    try:
        # Query the AI secretaries collection
        secretary_ref = db.collection('ai_secretaries').document(secretary_id)
        secretary_doc = secretary_ref.get()
        
        if secretary_doc.exists:
            return secretary_doc.to_dict()
        
        return None
    except Exception as e:
        print(f"Error getting secretary info: {str(e)}")
        return None

def log_task(user_id, secretary_id, task_data, db):
    """
    Log the task in Firestore task history.
    Returns the task ID.
    """
    try:
        # Create a new task entry
        task_ref = db.collection('task_history').document()
        
        # Add user and secretary IDs
        task_data.update({
            'user_id': user_id,
            'secretary_id': secretary_id
        })
        
        # Save to Firestore
        task_ref.set(task_data)
            
        return task_ref.id
    except Exception as e:
        print(f"Error logging task: {str(e)}")
        return None

def send_email_response(to_email, from_email, subject, content, message_id=None, references=None, domain=None):
    """
    Send an email response using SendGrid.
    Threading headers temporarily disabled for demo.
    """
    try:
        # Create SendGrid client inside the function
        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY.value)
        
        # Extract the local part (before @) from the from_email
        local_part = from_email.split('@')[0]
        
        # Ensure we're using the verified domain for sending
        sender_email = f"{local_part}@{domain}"
        
        # Prepare email - using the verified sender domain
        message = Mail(
            from_email=sender_email,
            to_emails=to_email,
            subject=subject,
            html_content=Content("text/html", content)
        )
        
        # Add a reply-to header with the original AI secretary email
        # But use standard Email object creation to avoid errors
        message.reply_to = from_email
        
        # Send email
        response = sg.send(message)
        
        # Log the response code
        print(f"SendGrid response code: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False