
import json
from firebase_admin import credentials, firestore
import firebase_admin
from firebase_functions.params import StringParam
import anthropic # type: ignore
import logging
from datetime import date
from email_utils import format_email_response

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("starlis_admin_creds.json")
    firebase_admin.initialize_app(cred)
except ValueError:
    # App already initialized
    pass

# Initialize Firestore
db = firestore.client()

CLAUDE_API_KEY = StringParam('CLAUDE_API_KEY')
CLAUDE_MODEL = StringParam('CLAUDE_MODEL', 'claude-3-7-sonnet-20250219')

# Initialize Globals
MAX_TOOL_CALLS = 10  # Maximum number of tool calls allowed in a single request

def process_with_ai(secretary_info, from_address, subject, body, task_id):
    """
    Process the email with AI and generate a response.
    Uses Claude to handle the request intelligently.
    """
    try:
        # Extract relevant info from secretary_info
        secretary_name = secretary_info.get('name', 'AI Secretary')
        personality = secretary_info.get('personality', 'helpful and professional')
        custom_instructions = secretary_info.get('custom_instructions', 'None')
        user_id = secretary_info.get('user_id', '')
        user_full_name = secretary_info.get('email', '').split("-")[0]
        user_email = secretary_info.get('user_email', '')
        
        # Initialize Claude client
        client = anthropic.Anthropic(api_key=CLAUDE_API_KEY.value)
        
        # Format the email content including conversation history
        email_content = f"""
        You are {secretary_name}, an AI secretary with a {personality} personality.
        You work for {user_full_name} who's email address is: {user_email}. 
        Custom instructions: {custom_instructions}
        
        You've received an email from: {from_address}
        Subject: {subject}
        
        MOST RECENT EMAIL:
        {body}
        
        Please respond appropriately as the AI secretary, taking into account the full conversation context.
        """
        
        # Process with Claude
        ai_response, logs = process_with_claude(
            client=client,
            email_content=email_content,
            user_id=user_id,  # Pass the user_id here
            max_tool_calls=MAX_TOOL_CALLS
        )
        
        # Extract the email response from the structured output
        if isinstance(ai_response, dict):
            reasoning = ai_response.get('reasoning', '')
            email_response = ai_response.get('email_response', '')
        else:
            # Fallback in case the response is still a string for some reason
            reasoning = "No structured reasoning provided."
            email_response = ai_response
        
        # Log the AI's response in the task history
        db.collection('task_history').document(task_id).update({
            'ai_response': email_response,
            'ai_reasoning': reasoning,
            'processed_at': firestore.SERVER_TIMESTAMP
        })
        
        return email_response, logs
    
    except Exception as e:
        logging.error(f"Error processing with AI: {str(e)}")
        # Return a generic error response and minimal logs
        return "I apologize, but I encountered an error processing your request. Please try again later.", [f"Error processing with AI: {str(e)}"]

def process_with_claude(client, email_content, user_id, max_tool_calls=5):
    """Process email content with Claude and return the response."""
    logs = []  # Track execution
    
    # Define the tools we'll provide to Claude
    tools = [
        {
            "name": "add_event",
            "description": "Add an event to the user's calendar. Use this when the user wants to schedule a meeting, call, appointment, or any event with a specific time.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title or name of the event"
                    },
                    "description": {
                        "type": "string",
                        "description": "Details about the event (optional)"
                    },
                    "start_day": {
                        "type": "string",
                        "description": "Start day in MM/DD/YYYY format"
                    },
                    "end_day": {
                        "type": "string",
                        "description": "End day in MM/DD/YYYY format"
                    },
                    "start_time": {
                        "type": "string",
                        "description": "Start time in HH:MM AM/PM format"
                    },
                    "end_time": {
                        "type": "string",
                        "description": "End time in HH:MM AM/PM format"
                    },
                    "location": {
                        "type": "string",
                        "description": "Location of the event (optional)"
                    },
                    "attendees": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "List of email addresses for attendees (optional)"
                    }
                },
                "required": ["title", "start_day", "end_day", "start_time", "end_time"]
            }
        },
        {
            "name": "add_message",
            "description": "Add a message to the user's message inbox. Use this when the user requests to be reminded of something later, or when something needs to be saved for later reference.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The content of the message to save"
                    }
                },
                "required": ["message"]
            }
        },
        {
            "name": "get_events",
            "description": "Get events from the user's calendar for a specific date range.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "start_day": {
                        "type": "string",
                        "description": "Start day in MM/DD/YYYY format"
                    },
                    "end_day": {
                        "type": "string",
                        "description": "End day in MM/DD/YYYY format"
                    }
                },
                "required": ["start_day", "end_day"]
            }
        },
        {
            "name": "delete_event",
            "description": "Delete an event from the user's calendar.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "event_id": {
                        "type": "string",
                        "description": "The unique ID of the event to delete"
                    }
                },
                "required": ["event_id"]
            }
        },
        {
            "name": "update_event",
            "description": "Update an existing event in the user's calendar.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "event_id": {
                        "type": "string",
                        "description": "The unique ID of the event to update"
                    },
                    "title": {
                        "type": "string",
                        "description": "Updated title of the event (optional)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Updated description (optional)"
                    },
                    "start_day": {
                        "type": "string",
                        "description": "Updated start day in MM/DD/YYYY format (optional)"
                    },
                    "end_day": {
                        "type": "string",
                        "description": "Updated end day in MM/DD/YYYY format (optional)"
                    },
                    "start_time": {
                        "type": "string",
                        "description": "Updated start time in HH:MM AM/PM format (optional)"
                    },
                    "end_time": {
                        "type": "string",
                        "description": "Updated end time in HH:MM AM/PM format (optional)"
                    },
                    "location": {
                        "type": "string",
                        "description": "Updated location (optional)"
                    },
                    "attendees": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "Updated list of attendee email addresses (optional)"
                    }
                },
                "required": ["event_id"]
            }
        },
        {
            "name": "structured_output",
            "description": "Format the final response with separate reasoning and email response sections.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "reasoning": {
                        "type": "string",
                        "description": "Your reasoning and thought process for how you approached this email request. This will not be sent to the user but will be logged for review."
                    },
                    "email_response": {
                        "type": "string",
                        "description": "The actual email response that will be sent to the user. This should be a complete email response without any meta-commentary about the email writing process."
                    }
                },
                "required": ["reasoning", "email_response"]
            }
        }
    ]
    
    # Rest of process_with_claude function remains the same
    try:
        # Add system context with current date
        today_context = f"Today is {date.today().strftime('%B %d, %Y')}."
        logs.append(f"Added system context with today's date: {date.today().strftime('%B %d, %Y')}")
        # Get the user's first name from firestore
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            user_data = user_doc.to_dict()
            first_name = user_data.get('first_name', 'User')
        else:
            first_name = 'User'

        system_prompt = system_prompt = f'''
            You are a professional virtual assistant named Starla working on behalf of {first_name}. As {first_name}'s dedicated secretary, your role is to:

            1. MANAGE CALENDAR: Create, update, and delete events on {first_name}'s calendar. When scheduling events with other people, always add their email addresses as attendees so they receive calendar invitations.

            2. EMAIL COMMUNICATION: Draft responses to emails in a professional, friendly tone, clearly identifying yourself as {first_name}'s assistant. Always sign emails as "Starla, Assistant to {first_name}" to make it clear you are not {first_name} himself.

            3. COMMUNICATION STYLE:
            - Use phrases like "On behalf of {first_name}..." or "{first_name} asked me to..."
            - Avoid any language that might suggest you are {first_name}
            - Be courteous, clear, and concise in all communications
            - Maintain a helpful, responsive tone
            - DO NOT include the subject in your response. It will be automatically handled by the email service. 

            4. SCHEDULING PROTOCOL:
            - When scheduling meetings, always check {first_name}'s calendar first using the get_events tool
            - For meetings with multiple participants, collect all attendee emails to send proper calendar invites
            - Always include relevant attendees when creating calendar events
            - If the user doesn't specify a location, use the default location "608 E 13th Ave, Denver, CO 80203"
                - If the user doesn't specify a time, suggest some times that work with {first_name}'s schedule. ALWAYS use the get_events tool before suggesting any times or using the add_event tool because otherwise you might accept or suggest a time that conflicts with another commitment. 

            5. EMAIL ANALYSIS:
            - When presented with an email, determine if calendar actions are needed
            - Identify key information: requested meeting times, participants, topics
            - Send appropriate responses that address all points raised

            6. FORMAT OF RESPONSES:
                - Your response will be sent as an HTML email, so you can use basic formatting:
                    - Use <p> tags for paragraphs
                    - Use <br> for line breaks
                    - Use <strong> for emphasis where appropriate
                    - Use <ul> and <li> for lists when needed

            Remember that you represent {first_name} professionally but are not impersonating him. Your goal is to manage his schedule efficiently and communicate clearly as his designated assistant.
            '''
        
        # Add structured output instructions to system prompt
        structured_output_instructions = """
        IMPORTANT: When you are ready to generate your final response, please use the structured_output tool to provide:
        1. Your reasoning about the request (this will be logged but not sent to the user)
        2. The html email response (this will be sent directly to the user)
        
        Keep in mind that the email_response field should contain ONLY what will be sent to the user, with no meta-commentary about writing an email.
        """
        
        # Create system message
        system_message = system_prompt + today_context + structured_output_instructions
        
        # Start with just the initial user message
        messages = [
            {
                "role": "user",
                "content": email_content
            }
        ]
        
        # Track tool calls to prevent infinite loops
        tool_call_count = 0
        
        # Variables to store structured output
        reasoning = ""
        email_response = ""
        
        while tool_call_count < max_tool_calls:
            logs.append(f"Starting message iteration {tool_call_count + 1}")
            
            # Call Claude API with tools
            try:
                response = client.messages.create(
                    model=CLAUDE_MODEL.value,
                    max_tokens=1000,
                    system=system_message,
                    messages=messages,
                    tools=tools,
                    tool_choice={"type": "auto"}
                )
                
                # Check if Claude wants to use a tool
                if response.stop_reason == "tool_use":
                    tool_call_count += 1
                    logs.append(f"Tool call {tool_call_count}/{max_tool_calls} requested")
                    
                    # Process each tool call
                    tool_results = []
                    assistant_content = []
                    
                    # First collect all content from the response
                    for content_block in response.content:
                        if content_block.type == "text":
                            assistant_content.append({
                                "type": "text",
                                "text": content_block.text
                            })
                        elif content_block.type == "tool_use":
                            assistant_content.append({
                                "type": "tool_use",
                                "name": content_block.name,
                                "input": content_block.input,
                                "id": content_block.id
                            })
                            
                            # Process this tool call
                            tool_name = content_block.name
                            tool_input = content_block.input
                            tool_id = content_block.id
                            
                            logs.append(f"Processing tool call: {tool_name}")
                            
                            # Check if this is the structured_output tool
                            if tool_name == "structured_output":
                                # Extract reasoning and email response
                                reasoning = tool_input.get("reasoning", "")
                                email_response = tool_input.get("email_response", "")
                                
                                logs.append(f"Extracted structured output - Reasoning: {reasoning[:100]}...")
                                logs.append(f"Extracted structured output - Email: {email_response[:100]}...")
                                
                                # For this special tool, we'll create a simple success response
                                tool_results.append({
                                    "type": "tool_result",
                                    "tool_use_id": tool_id,
                                    "content": json.dumps({"status": "success"})
                                })
                            else:
                                # Execute regular tools
                                result, tool_logs = handle_tool_call(user_id, tool_name, tool_input)
                                logs.extend(tool_logs)
                                
                                # Add to tool results
                                tool_results.append({
                                    "type": "tool_result",
                                    "tool_use_id": tool_id,
                                    "content": json.dumps(result)
                                })
                    
                    # Add the assistant's message to the conversation
                    messages.append({
                        "role": "assistant",
                        "content": assistant_content
                    })
                    
                    # Add the tool results as a user message
                    if tool_results:
                        messages.append({
                            "role": "user",
                            "content": tool_results
                        })
                    
                    # If we've extracted the structured output, we can break out of the loop
                    if email_response:
                        logs.append("Structured output received, finishing process")
                        break
                    
                    # Otherwise continue the conversation
                    continue
                else:
                    # Claude has finished with a normal response - format it properly
                    raw_response = ""
                    for content_block in response.content:
                        if content_block.type == "text":
                            raw_response += content_block.text
                    
                    # Format the response as HTML email content
                    formatted_response = format_email_response(raw_response)
                    
                    logs.append(f"Final response generated and formatted")
                    return formatted_response, logs
                
            except Exception as e:
                error_msg = f"API error: {str(e)}"
                logs.append(error_msg)
                logging.error(error_msg)
                return f"I encountered an error processing this email: {str(e)}", logs
        
        # If we have the email response, return it along with logs
        if email_response:
            # Add both to logs for review (we'll only return the email part to the user)
            logs.append(f"Final reasoning: {reasoning}")
            logs.append(f"Final email response: {email_response}")
            
            # Create a structured result to return
            result = {
                "reasoning": reasoning,
                "email_response": email_response
            }
            
            return result, logs
        
        # If we exceeded max tool calls without getting structured output
        return {
            "reasoning": "Reached maximum tool calls without receiving structured output.",
            "email_response": "I'm sorry, but I was unable to complete this task due to technical limitations. Please try again later."
        }, logs
    
    except Exception as e:
        error_msg = f"Error in Claude processing: {e}"
        logging.error(error_msg)
        logs.append(error_msg)
        return {
            "reasoning": f"Error in processing: {str(e)}",
            "email_response": "I apologize, but I encountered an error processing your request. Please try again later."
        }, logs
    
def handle_tool_call(user_id, function_name, arguments):
    """Handle individual tool calls and return the appropriate response."""
    logs = []  # Track execution
    try:
        log_msg = f"Handling tool call: {function_name} with arguments: {arguments}"
        logging.info(log_msg)
        logs.append(log_msg)
        # Import tools only when needed to avoid circular imports
        import sys
        from tools import add_event, get_events, delete_event, update_event, add_message
        
        if function_name == "add_event":
            try:
                result = add_event(
                    user_id=user_id,
                    title=arguments["title"],
                    description=arguments.get("description", ""),
                    start_day=arguments["start_day"],
                    end_day=arguments["end_day"],
                    start_time=arguments["start_time"],
                    end_time=arguments["end_time"],
                    location=arguments.get("location", ""),
                    attendees=arguments.get("attendees", None)
                )
                logs.append(f"Added event successfully: {json.dumps(result)}")
                return result, logs
            except Exception as e:
                error_msg = f"Error in add_event: {str(e)}"
                logging.error(error_msg)
                logs.append(error_msg)
                return {"error": "Failed to add event due to invalid scope or configuration"}, logs
        elif function_name == "add_message":
            try:
                result = add_message(
                    message=arguments["message"],
                    user_id=user_id  
                )
                logs.append(f"Added message successfully: {json.dumps(result)}")
                return result, logs
            except Exception as e:
                error_msg = f"Error in add_message: {str(e)}"
                logging.error(error_msg)
                logs.append(error_msg)
                return {"error": f"Failed to add message: {str(e)}"}, logs
        elif function_name == "get_events":
            try:
                result = get_events(
                    user_id=user_id,
                    start_day=arguments["start_day"],
                    end_day=arguments["end_day"]
                )
                logs.append(f"Got events successfully: {json.dumps(result)}")
                return result, logs
            except Exception as e:
                error_msg = f"Error in get_events: {str(e)}"
                logging.error(error_msg)
                logs.append(error_msg)
                return {"error": "Failed to get events due to invalid scope or configuration"}, logs
        elif function_name == "delete_event":
            try:
                delete_event(
                    user_id=user_id,
                    event_id=arguments["event_id"]
                )
                # Since delete_event doesn't return anything, create an appropriate result
                result = {"status": "success", "message": f"Event {arguments['event_id']} deleted successfully"}
                logs.append(f"Deleted event successfully: {json.dumps(result)}")
                return result, logs
            except Exception as e:
                error_msg = f"Error in delete_event: {str(e)}"
                logging.error(error_msg)
                logs.append(error_msg)
                return {"error": f"Failed to delete event: {str(e)}"}, logs
        elif function_name == "update_event":
            try:
                result = update_event(
                    user_id=user_id,
                    event_id=arguments["event_id"],
                    title=arguments.get("title"),
                    description=arguments.get("description"),
                    start_day=arguments.get("start_day"),
                    end_day=arguments.get("end_day"),
                    start_time=arguments.get("start_time"),
                    end_time=arguments.get("end_time"),
                    location=arguments.get("location"),
                    attendees=arguments.get("attendees", None)
                )
                logs.append(f"Updated event successfully: {json.dumps(result)}")
                return result, logs
            except Exception as e:
                error_msg = f"Error in update_event: {str(e)}"
                logging.error(error_msg)
                logs.append(error_msg)
                return {"error": f"Failed to update event: {str(e)}"}, logs
        else:
            error_msg = f"Unknown function call: {function_name}"
            logging.warning(error_msg)
            logs.append(error_msg)
            return {"error": "Unknown function call"}, logs

    except Exception as e:
        error_msg = f"Error in tool call handling: {e}"
        logging.error(error_msg)
        logs.append(error_msg)
        return {"error": f"Error in tool call handling: {str(e)}"}, logs
    