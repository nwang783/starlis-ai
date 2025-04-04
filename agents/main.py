# --- Step 1: Agent Client Implementation ---
# This script defines the user-facing AI agent client.
# It uses the openai-agents SDK (agents_mcp) to communicate
# with a remote MCP/SSE server (planned to be hosted on Cloudflare Workers).
# This agent will initiate Google Calendar operations by sending requests
# to the server via the MCP protocol over Server-Sent Events (SSE).

import os
import asyncio
from agents import OpenAIChatCompletionsModel
from agents_mcp import Agent, MCPServerSse
from openai import AsyncOpenAI

# --- 1. Google Model Configuration ---
# Configure the AsyncOpenAI client to use Google's Generative Language API
# endpoint, which offers OpenAI compatibility.
# The API key is fetched securely from the environment variables.
# An OpenAIChatCompletionsModel wrapper is used to integrate this with the agents library.

# Ensure the Google API Key environment variable is set
google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    raise ValueError("Error: GOOGLE_API_KEY environment variable not set.")

gemini_client = AsyncOpenAI(
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
    api_key=google_api_key
)

# Specify the desired Gemini model
# Example: "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro" etc.
google_model = OpenAIChatCompletionsModel(
    model="gemini-1.5-flash",
    openai_client=gemini_client
)

print(f"Configured to use Google Model: {google_model.model}")

# --- 2. MCP/SSE Connection Configuration ---
# Instantiate the MCPServerSse connection handler.
# This component manages the persistent SSE connection to the remote server.
# Replace the placeholder URL with the actual deployed Cloudflare Worker endpoint later.

# !! IMPORTANT !! Update this URL once the Cloudflare Worker (Step 2 & 5) is deployed.
CLOUDFLARE_SSE_URL = "YOUR_CLOUDFLARE_MCP_SSE_ENDPOINT_URL" # Placeholder
print(f"Configuring MCP/SSE connection to placeholder URL: {CLOUDFLARE_SSE_URL}")
sse_mcp_server_connection = MCPServerSse(url=CLOUDFLARE_SSE_URL)

# --- 3. Agent Initialization ---
# Instantiate the main Agent class from agents_mcp.
# Provide a name for the agent.
# Assign the configured language model (google_model).
# Pass the MCP server connection object(s) in a list. The agent will use
# these connections to discover and invoke remote tools.

# Requires google_model and sse_mcp_server_connection defined above
calendar_agent = Agent(
    name="CloudflareGoogleCalendarAgent",
    model=google_model,
    mcp_servers=[sse_mcp_server_connection]
    # Note: Local tools could be added here using the 'tools=[...]' parameter,
    # but the primary interaction for calendar operations relies on remote tools
    # discovered via the MCP server connection.
)

print(f"Initialized Agent: {calendar_agent.name}")
print(f"Agent Model: {calendar_agent.model.model}") # type: ignore
print(f"MCP Servers: {[s.url for s in calendar_agent.mcp_servers]}") # type: ignore

# --- Context Clarification ---
# The agent learns about available tools (like list_events, create_event)
# directly from the connected MCP server(s).
# The server defines these tools (e.g., potentially using a pattern like @mcp.tool()
# in a Python server, or equivalent registration in JS/TS on the Cloudflare Worker)
# and exposes them to connected clients like this agent.
# This client script does *not* need to define the calendar tool logic itself.

# --- Basic Usage Placeholder ---
# This is where you would typically start interacting with the agent.
# For example, you could start an interactive chat loop or run specific commands.
# Since the server isn't running yet, actually running the agent will likely fail
# to connect or find tools, but this structure shows how it would be used.

async def main():
    """
    Placeholder main function to demonstrate potential agent usage.
    """
    print("\n--- Agent Ready (Client-Side Setup Complete) ---")
    print("This script has initialized the agent client.")
    print("Next steps involve implementing and deploying the Cloudflare MCP/SSE server.")
    print("Once the server is running and the CLOUDFLARE_SSE_URL is updated,")
    print("you could uncomment and run agent interaction code below.")

    # Example Interaction (commented out until server exists):
    # try:
    #     print("\nAttempting to start agent interaction (will likely fail without server)...")
    #     # Example: Start an interactive chat session
    #     # await calendar_agent.chat()
    #
    #     # Example: Run a specific command
    #     # response = await calendar_agent.run("What are my events for tomorrow?")
    #     # print("\nAgent Response:")
    #     # print(response)
    #
    # except Exception as e:
    #     print(f"\nError during agent interaction attempt: {e}")
    #     print("This is expected if the server endpoint is not yet available or reachable.")

    # Keep the script running briefly to show output, or just exit.
    # In a real application, this would be the main event loop or interaction handler.
    print("\nExiting client script.")


if __name__ == "__main__":
    # Note: The 'agents' library uses asyncio, so interactions should be run
    # within an async context.
    try:
        asyncio.run(main())
    except ValueError as e:
        print(f"Configuration Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        