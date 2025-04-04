import os
import json
import asyncio
import httpx
from typing import List, Dict, Any, Optional, Callable, Awaitable

# --- Agent & Model Setup ---
from agents import OpenAIChatCompletionsModel
from agents_mcp import Agent # Use Agent from core MCP library
from agents.llm import UserMessage # Import UserMessage for chat interaction
from openai import AsyncOpenAI

# --- Google Auth ---
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.auth.exceptions import RefreshError

# --- Configuration ---
TOKEN_FILE = "token.json"
# !! IMPORTANT !! Update this URL to your deployed Cloudflare Worker URL
CLOUDFLARE_WORKER_URL = "YOUR_DEPLOYED_CLOUDFLARE_WORKER_URL" # e.g., "https://your-worker-name.your-subdomain.workers.dev"
MCP_ENDPOINT = f"{CLOUDFLARE_WORKER_URL}/mcp"

if CLOUDFLARE_WORKER_URL == "YOUR_DEPLOYED_CLOUDFLARE_WORKER_URL":
    print("⚠️ WARNING: Please update CLOUDFLARE_WORKER_URL in the script!")

# Ensure the Google API Key environment variable is set for the LLM
google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("Error: GOOGLE_API_KEY environment variable not set for Gemini.")

# --- Google Gemini Model Config ---
gemini_client = AsyncOpenAI(
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key=google_api_key
)
google_model = OpenAIChatCompletionsModel(
    model="gemini-2.0-flash", # Or "gemini-1.5-pro", etc.
    openai_client=gemini_client
)
print(f"Using LLM: {google_model.model}")

# --- Google Authentication Handling ---
_google_credentials: Optional[Credentials] = None

async def load_or_refresh_creds() -> Optional[Credentials]:
    """Loads credentials from token.json and refreshes if necessary."""
    global _google_credentials
    creds = None
    if os.path.exists(TOKEN_FILE):
        try:
            # Load credentials from file using the standard library method
            creds = Credentials.from_authorized_user_file(TOKEN_FILE)
        except Exception as e:
            print(f"Error loading credentials from {TOKEN_FILE}: {e}")
            return None
    else:
        print(f"Error: {TOKEN_FILE} not found. Please authenticate first.")
        return None

    # If credentials exist and require refresh (expired or no access token)
    if creds and (not creds.valid or not creds.token):
        if creds.expired and creds.refresh_token:
            print("Google credentials expired. Refreshing...")
            try:
                # Use an HTTPX transport for google-auth
                async with httpx.AsyncClient() as client:
                    google_auth_transport = GoogleAuthRequest(session=client) # type: ignore
                    creds.refresh(google_auth_transport) # Use sync refresh within async context if needed, or explore async refresh options if available directly
                print("Credentials refreshed successfully.")
                # Save the refreshed credentials
                save_creds(creds)
            except RefreshError as e:
                print(f"Error refreshing credentials: {e}")
                print("Please re-authenticate.")
                # Consider deleting the invalid token file here
                # if os.path.exists(TOKEN_FILE):
                #    os.remove(TOKEN_FILE)
                creds = None # Invalidate creds
            except Exception as e:
                 print(f"An unexpected error occurred during token refresh: {e}")
                 creds = None
        else:
            print("Credentials invalid or missing refresh token. Please re-authenticate.")
            creds = None # Cannot refresh

    _google_credentials = creds
    if not _google_credentials or not _google_credentials.token:
         print("Failed to load valid Google credentials.")
         return None

    # print(f"Using Access Token: {_google_credentials.token[:10]}...") # Debug: careful logging tokens
    return _google_credentials

def save_creds(creds: Credentials):
    """Saves credentials back to token.json."""
    try:
        # Use the standard library method to get JSON representation
        creds_json_str = creds.to_json()
        with open(TOKEN_FILE, 'w') as token_file:
            token_file.write(creds_json_str)
        print(f"Credentials saved to {TOKEN_FILE}")
    except Exception as e:
        print(f"Error saving credentials to {TOKEN_FILE}: {e}")

# --- HTTP Client for Worker Communication ---
# Create one client to potentially reuse connections
async_http_client = httpx.AsyncClient(timeout=30.0) # Adjust timeout as needed

# --- MCP Communication via HTTP ---

async def make_mcp_request(
    payload: Dict[str, Any],
    access_token: Optional[str] = None
) -> Dict[str, Any]:
    """Sends an MCP request to the Cloudflare worker via HTTP POST."""
    headers = {
        "Content-Type": "application/json",
    }
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"

    try:
        response = await async_http_client.post(MCP_ENDPOINT, json=payload, headers=headers)
        response.raise_for_status() # Raise exception for 4xx/5xx errors
        mcp_response = response.json()

        # Basic check for MCP error structure in the response body
        if "error" in mcp_response:
            print(f"MCP Error received from worker: {mcp_response['error']}")
            # You might want to raise a specific exception here
            raise Exception(f"MCP Error: {mcp_response['error'].get('message', 'Unknown error')}")

        return mcp_response

    except httpx.HTTPStatusError as e:
        print(f"HTTP Error calling worker: {e.response.status_code} {e.response.reason_phrase}")
        try:
            # Try to parse error details if response has JSON body
            error_details = e.response.json()
            print(f"Worker Error Body: {error_details}")
            # Extract MCP error if present
            if isinstance(error_details, dict) and "error" in error_details:
                 raise Exception(f"HTTP {e.response.status_code}: {error_details['error'].get('message', 'Worker error')}")
            else:
                 raise Exception(f"HTTP {e.response.status_code}: {e.response.text}") from e
        except Exception as parse_err:
             print(f"Could not parse error response body: {parse_err}")
             raise Exception(f"HTTP Error {e.response.status_code}") from e
    except Exception as e:
        print(f"Error making MCP request: {e}")
        raise # Re-raise other exceptions


# --- Dynamic Tool Proxy Creation ---

async def get_remote_tools() -> List[Dict[str, Any]]:
    """Fetches tool definitions from the worker."""
    print("Fetching remote tool definitions from worker...")
    payload = {
        "mcp": "1.0",
        "id": "req-listTools-client", # Static ID for listTools is fine
        "method": "listTools",
        "params": {}
    }
    try:
        mcp_response = await make_mcp_request(payload)
        tools = mcp_response.get("result", {}).get("tools", [])
        print(f"Discovered {len(tools)} remote tools.")
        # print(json.dumps(tools, indent=2)) # Debug: Print discovered tools
        return tools
    except Exception as e:
        print(f"Failed to get remote tools: {e}")
        return []


def create_remote_tool_proxy(tool_definition: Dict[str, Any]) -> Callable[..., Awaitable[Any]]:
    """Creates an async function that acts as a local proxy for a remote tool."""
    tool_name = tool_definition.get("name", "unknown_tool")

    async def tool_proxy(**kwargs: Any) -> str: # Agent framework often expects string results
        print(f"Agent decided to call tool: {tool_name} with args: {kwargs}")

        # 1. Ensure valid Google credentials
        creds = await load_or_refresh_creds()
        if not creds or not creds.token:
            error_msg = "Cannot call tool: Google authentication failed or token unavailable."
            print(error_msg)
            # Return error message back to the agent's context
            return f"Error: {error_msg}"

        # 2. Construct MCP callTool payload
        call_id = f"req-{tool_name}-{os.urandom(4).hex()}" # Unique enough ID
        payload = {
            "mcp": "1.0",
            "id": call_id,
            "method": "callTool",
            "params": {
                "name": tool_name,
                "arguments": kwargs # Pass arguments received from LLM
            }
        }

        # 3. Make authenticated MCP request
        try:
            print(f"Sending MCP request for {tool_name} to {MCP_ENDPOINT}...")
            mcp_response = await make_mcp_request(payload, access_token=creds.token)

            # 4. Extract result
            result = mcp_response.get("result", {})
            content_list = result.get("content", [])

            if not content_list:
                print("Warning: MCP response had no 'content'.")
                return "Tool executed but returned no content."

            # Process content - assuming simple text or json for now
            response_parts = []
            for item in content_list:
                item_type = item.get("type")
                if item_type == "text":
                    response_parts.append(item.get("text", ""))
                elif item_type == "json":
                    # Convert JSON content to a string for the agent context
                    json_content = item.get("json", {})
                    response_parts.append(json.dumps(json_content, indent=2))
                else:
                    response_parts.append(f"[Unsupported content type: {item_type}]")

            final_response = "\n".join(response_parts)
            print(f"Tool {tool_name} executed successfully. Result snippet: {final_response[:100]}...")
            return final_response

        except Exception as e:
            print(f"Error executing remote tool {tool_name}: {e}")
            # Return error message back to the agent's context
            return f"Error calling tool {tool_name}: {e}"

    # Set the name of the proxy function for introspection/debugging if needed
    tool_proxy.__name__ = f"proxy_{tool_name}"
    return tool_proxy


# --- Main Application Logic ---

async def main():
    """Initializes and runs the agent."""

    # 1. Initial Credential Load/Refresh
    print("Checking Google credentials...")
    initial_creds = await load_or_refresh_creds()
    if not initial_creds:
        print("Exiting due to missing or invalid Google credentials.")
        return

    # 2. Discover remote tools and create local proxies
    remote_tool_defs = await get_remote_tools()
    local_tool_proxies = []
    if remote_tool_defs:
        for tool_def in remote_tool_defs:
            proxy_func = create_remote_tool_proxy(tool_def)
            # The agent needs the tool definition (schema) and the callable function
            local_tool_proxies.append({
                "schema": tool_def, # Provide schema from server
                "function": proxy_func # Provide the proxy callable
            })
        print(f"Created {len(local_tool_proxies)} local tool proxies.")
    else:
        print("Warning: No remote tools discovered. Agent will have limited capabilities.")


    # 3. Initialize the Agent
    print("Initializing agent...")
    calendar_agent = Agent(
        name="StatelessGoogleCalendarAgent",
        model=google_model,
        # Provide the schemas and proxy functions as local tools
        tools=[ tool['function'] for tool in local_tool_proxies ], # Pass only the callable functions
        # Schemas are implicitly handled by the agent framework if functions have docstrings/type hints
        # OR we might need to investigate how to provide schema explicitly if needed by the agent framework for function calling
        # This part depends on how agents-mcp registers tools internally. Let's try with functions first.
        # If function calling fails, we might need to structure `tools` differently, e.g.
        # tools = [ Tool(name=t['schema']['name'], description=t['schema']['description'], input_schema=t['schema']['inputSchema'], func=t['function']) for t in local_tool_proxies ]
        # (Assuming a Tool class exists or similar structure is expected)
    )
    # Add discovered tools dynamically *after* initialization if needed/supported
    # for tool_proxy_info in local_tool_proxies:
    #    calendar_agent.add_tool(tool_proxy_info['function'], schema=tool_proxy_info['schema']) # Check add_tool method signature
    print(f"Agent '{calendar_agent.name}' initialized.")


    # 4. Start Interaction Loop
    print("\n--- Starting Agent Chat (type 'exit' to quit) ---")
    try:
        # Use the agent's chat method for interactive use
        await calendar_agent.chat()

        # Example non-interactive call (if needed):
        # response = await calendar_agent.run("What are my events for tomorrow morning?")
        # print("\nAgent Response:", response)

    except Exception as e:
        print(f"\nAn error occurred during agent interaction: {e}")
    finally:
        # Clean up the HTTP client
        await async_http_client.aclose()
        print("\nAgent interaction finished. HTTP client closed.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except ValueError as e:
        print(f"Configuration Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
