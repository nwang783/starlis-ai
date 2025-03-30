from flask import Request, Response
from firebase_functions import https_fn
import json
from firebase_functions import https_fn, options
import anthropic
from firebase_functions.params import StringParam

CLAUDE_API_KEY = StringParam('CLAUDE_API_KEY')

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST"]
    )
)
def generate_title(request: Request) -> Response:
    """
    Generate a title for a conversation using Claude.
    
    Expected request data:
    {
        "data": {
            "message": string,
            "model": string
        }
    }
    """
    try:
        data = request.get_json()
        if not data or 'data' not in data:
            return Response("Invalid request data", status=400)
            
        message = data['data'].get('message')
        model = data['data'].get('model', 'claude-3-7-sonnet-latest')
        
        if not message:
            return Response("Message is required", status=400)
            
        # Convert model name to backend format
        if model == "claude-3-7-sonnet-latest":
            backend_model = "claude-3-7-sonnet-20250219"
        elif model == "claude-3-5-haiku-latest":
            backend_model = "claude-3-5-haiku-20250604"
        else:
            backend_model = model
            
        # Initialize Anthropic client
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY.value)
        
        # Create system message for title generation
        system_message = """You are a title generation assistant. Your task is to create short, descriptive titles (max 50 characters) for conversations. The title should be concise and reflect the main topic or purpose of the conversation. Return only the title, no additional text or explanation."""
        
        # Create user message
        user_message = f"""Generate a short, descriptive title for a conversation that starts with this message: "{message}". The title should be concise and reflect the main topic or purpose of the conversation. Return only the title, no additional text."""
        
        # Call Claude API
        response = client.messages.create(
            model=backend_model,
            max_tokens=100,
            system=system_message,
            messages=[{
                "role": "user",
                "content": user_message
            }]
        )
        
        # Extract the title from the response
        title = ""
        for content_block in response.content:
            if content_block.type == "text":
                title += content_block.text
                
        # Clean up the title
        title = title.strip()
        title = title.replace(/["']/g, "")
        title = title.replace(/[*_`]/g, "")
        title = title[:50]  # Ensure it's not too long
        
        return Response(
            json.dumps({"title": title}),
            status=200,
            mimetype='application/json'
        )
        
    except Exception as e:
        print(f"Error generating title: {str(e)}")
        return Response(
            json.dumps({"error": str(e)}),
            status=500,
            mimetype='application/json'
        ) 