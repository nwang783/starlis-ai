// src/index.ts - Stateless MCP Worker

import { google } from 'googleapis';
import {
	McpRequest,
	McpResponse,
	ListToolsResponse,
	CallToolResponse,
	ToolDefinition,
	McpErrorResponse,
	ErrorCode,
} from '@modelcontextprotocol/sdk/types.js'; // Still useful for type definitions

// Define the environment interface (primarily for secrets)
export interface Env {
	// Secrets might be needed if you add OAuth helper endpoints later
	GOOGLE_CLIENT_ID?: string; // Optional now
	GOOGLE_CLIENT_SECRET?: string; // Optional now
	// Add other bindings like KV if needed
}

// ======================================================================
// Tool Definitions (Remain the same)
// ======================================================================
const availableTools: ToolDefinition[] = [
	{
		name: 'list_events',
		description: 'List upcoming Google Calendar events. Requires Bearer token.',
		inputSchema: {
			type: 'object',
			properties: {
				maxResults: { type: 'number', description: 'Max events (default: 10)' },
				timeMin: { type: 'string', format: 'date-time', description: 'Start time ISO (default: now)' },
				timeMax: { type: 'string', format: 'date-time', description: 'End time ISO' },
			},
		},
	},
	{
		name: 'create_event',
		description: 'Create a new Google Calendar event. Requires Bearer token.',
		inputSchema: {
			type: 'object',
			properties: {
				summary: { type: 'string', description: 'Event title' },
				location: { type: 'string', description: 'Event location' },
				description: { type: 'string', description: 'Event description' },
				start: { type: 'string', format: 'date-time', description: 'Start time ISO' },
				end: { type: 'string', format: 'date-time', description: 'End time ISO' },
				attendees: { type: 'array', items: { type: 'string', format: 'email' }, description: 'Attendee emails' },
			},
			required: ['summary', 'start', 'end'],
		},
	},
	{
		name: 'update_event',
		description: 'Update an existing Google Calendar event. Requires Bearer token.',
		inputSchema: {
			type: 'object',
			properties: {
				eventId: { type: 'string', description: 'Event ID to update' },
				summary: { type: 'string', description: 'New title' },
				location: { type: 'string', description: 'New location' },
				description: { type: 'string', description: 'New description' },
				start: { type: 'string', format: 'date-time', description: 'New start time' },
				end: { type: 'string', format: 'date-time', description: 'New end time' },
				attendees: { type: 'array', items: { type: 'string', format: 'email' }, description: 'New attendees' },
			},
			required: ['eventId'],
		},
	},
	{
		name: 'delete_event',
		description: 'Delete a Google Calendar event. Requires Bearer token.',
		inputSchema: {
			type: 'object',
			properties: {
				eventId: { type: 'string', description: 'Event ID to delete' },
			},
			required: ['eventId'],
		},
	},
];


// ======================================================================
// Main Worker Fetch Handler (Router)
// ======================================================================
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// --- Route: POST /mcp (Main MCP Handler) ---
		if (request.method === 'POST' && url.pathname === '/mcp') {
			return handleMcpPost(request, env);
		}

		// --- Route: GET / (Simple Info) ---
		if (request.method === 'GET' && url.pathname === '/') {
			return new Response('Stateless MCP Google Calendar Server. Use POST /mcp.', {
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		// --- Not Found ---
		return new Response('Not Found', { status: 404 });
	},
};


// ======================================================================
// MCP POST Request Handler
// ======================================================================
async function handleMcpPost(request: Request, env: Env): Promise<Response> {
	let mcpRequest: McpRequest;
	const clientRequestId = request.headers.get('x-request-id') || crypto.randomUUID(); // Optional client trace ID

	// 1. Parse MCP Request Body
	try {
		mcpRequest = await request.json();
		if (!mcpRequest || mcpRequest.mcp !== '1.0' || !mcpRequest.id || !mcpRequest.method) {
			return createMcpErrorResponse(mcpRequest?.id || clientRequestId, ErrorCode.InvalidRequest, "Invalid MCP request structure", 400);
		}
	} catch (e) {
		return createMcpErrorResponse(clientRequestId, ErrorCode.ParseError, "Failed to parse request JSON", 400);
	}

	const mcpRequestId = mcpRequest.id; // Use the ID from the MCP request payload

	try {
		// 2. Handle listTools (Doesn't require auth)
		if (mcpRequest.method === 'listTools') {
			const responsePayload: ListToolsResponse = {
				mcp: '1.0',
				id: mcpRequestId,
				result: { tools: availableTools }
			};
			return new Response(JSON.stringify(responsePayload), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// 3. Handle callTool (Requires auth)
		if (mcpRequest.method === 'callTool') {
			const callRequest = mcpRequest as Extract<McpRequest, { method: 'callTool' }>; // Type assertion
			const { name: toolName, arguments: toolArgs } = callRequest.params;

			// 3a. Check Tool Exists
			if (!availableTools.some(tool => tool.name === toolName)) {
				return createMcpErrorResponse(mcpRequestId, ErrorCode.MethodNotFound, `Tool '${toolName}' not found`, 404);
			}

			// 3b. Extract Bearer Token
			const authHeader = request.headers.get('Authorization');
			if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
				return createMcpErrorResponse(mcpRequestId, ErrorCode.Unauthorized, "Missing or invalid Authorization header (Bearer token required)", 401);
			}
			const accessToken = authHeader.substring(7).trim(); // Extract token after "Bearer "
			if (!accessToken) {
				return createMcpErrorResponse(mcpRequestId, ErrorCode.Unauthorized, "Empty Bearer token provided", 401);
			}

			// 3c. Initialize Google API Client with the token
			// We don't need client_id/secret here as we're using the provided access token directly.
			const authClient = new google.auth.OAuth2();
			authClient.setCredentials({ access_token: accessToken });
			const calendar = google.calendar({ version: 'v3', auth: authClient });

			// 3d. Execute Google Calendar API Call
			try {
				let apiResult: any;

				switch (toolName) {
					case 'list_events':
						const listParams = { /* ... params from toolArgs ... */ }; // Copy logic from previous UserSession.handleMcpRequest
						console.log(`Calling calendar.events.list with params:`, listParams);
						const listResponse = await calendar.events.list({
                            calendarId: 'primary',
                            timeMin: toolArgs?.timeMin || (new Date()).toISOString(),
                            timeMax: toolArgs?.timeMax,
                            maxResults: toolArgs?.maxResults || 10,
                            singleEvents: true,
                            orderBy: 'startTime',
                        });
						apiResult = listResponse.data.items?.map(event => ({ // Select relevant fields
							id: event.id,
							summary: event.summary,
							start: event.start?.dateTime || event.start?.date,
							end: event.end?.dateTime || event.end?.date,
							location: event.location,
							description: event.description,
						})) || [];
						break;

					case 'create_event':
						if (!toolArgs?.summary || !toolArgs?.start || !toolArgs?.end) throw new Error("Missing required fields: summary, start, end");
						const createParams = { /* ... params from toolArgs ... */ }; // Copy logic
						console.log(`Calling calendar.events.insert with params:`, createParams.requestBody);
						const createResponse = await calendar.events.insert({
                            calendarId: 'primary',
                            requestBody: {
                                summary: toolArgs.summary,
                                location: toolArgs.location,
                                description: toolArgs.description,
                                start: { dateTime: toolArgs.start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
                                end: { dateTime: toolArgs.end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
                                attendees: toolArgs.attendees?.map((email: string) => ({ email })) || [],
                            },
                        });
						apiResult = { id: createResponse.data.id, summary: createResponse.data.summary, htmlLink: createResponse.data.htmlLink };
						break;

					case 'update_event':
						if (!toolArgs?.eventId) throw new Error("Missing required field: eventId");
						const eventPatch: any = { /* ... construct patch from toolArgs ... */ }; // Copy logic
                        if (toolArgs.summary) eventPatch.summary = toolArgs.summary;
                        if (toolArgs.location) eventPatch.location = toolArgs.location;
                        if (toolArgs.description) eventPatch.description = toolArgs.description;
                        if (toolArgs.start) eventPatch.start = { dateTime: toolArgs.start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
                        if (toolArgs.end) eventPatch.end = { dateTime: toolArgs.end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
                        if (toolArgs.attendees) eventPatch.attendees = toolArgs.attendees.map((email: string) => ({ email }));
						if (Object.keys(eventPatch).length === 0) throw new Error("No fields provided to update.");

						const patchParams = { calendarId: 'primary', eventId: toolArgs.eventId, requestBody: eventPatch };
						console.log(`Calling calendar.events.patch for event ${toolArgs.eventId} with patch:`, eventPatch);
						const patchResponse = await calendar.events.patch(patchParams);
						apiResult = { id: patchResponse.data.id, summary: patchResponse.data.summary, htmlLink: patchResponse.data.htmlLink };
						break;

					case 'delete_event':
						if (!toolArgs?.eventId) throw new Error("Missing required field: eventId");
						const deleteParams = { calendarId: 'primary', eventId: toolArgs.eventId };
						console.log(`Calling calendar.events.delete for event ${toolArgs.eventId}`);
						await calendar.events.delete(deleteParams);
						apiResult = { success: true, deletedEventId: toolArgs.eventId };
						break;

					default:
						// Should be caught by earlier check, but included for safety
						return createMcpErrorResponse(mcpRequestId, ErrorCode.MethodNotFound, `Tool '${toolName}' not found`, 404);
				}

				// 3e. Format and Return Success Response
				const responsePayload: CallToolResponse = {
					mcp: '1.0',
					id: mcpRequestId,
					result: { content: [{ type: 'json', json: apiResult }] }
				};
				return new Response(JSON.stringify(responsePayload), {
					status: 200, // OK
					headers: { 'Content-Type': 'application/json' },
				});

			} catch (error: any) {
				// 3f. Handle Google API Errors (or internal tool errors)
				console.error(`Error executing tool '${toolName}':`, error.response?.data || error.message || error);
				const gapiError = error.response?.data?.error;
				const errorMessage = gapiError?.message || error.message || 'Tool execution failed';
				let errorCode = ErrorCode.InternalError;
				let httpStatus = 500;

				if (error.code === 401 || gapiError?.code === 401) {
					errorCode = ErrorCode.Unauthorized;
					httpStatus = 401; // Unauthorized - Token likely expired or invalid
				} else if (error.code === 403 || gapiError?.code === 403) {
					errorCode = ErrorCode.PermissionDenied; // More specific than Unauthorized
					httpStatus = 403; // Forbidden - Token valid, but insufficient permissions
				} else if (error.code === 404 || gapiError?.code === 404) {
					errorCode = ErrorCode.NotFound; // e.g., Event ID not found
					httpStatus = 404;
				} else if (error.code === 400 || gapiError?.code === 400) {
					errorCode = ErrorCode.InvalidParams; // Bad request to Google
					httpStatus = 400;
				}
				// Add more specific mappings? 429 -> RateLimitExceeded?

				return createMcpErrorResponse(mcpRequestId, errorCode, `Google API Error: ${errorMessage}`, httpStatus);
			}
		}

		// 4. Handle Unknown MCP Method
		return createMcpErrorResponse(mcpRequestId, ErrorCode.MethodNotFound, `Unsupported MCP method: ${mcpRequest.method}`, 405); // 405 Method Not Allowed

	} catch (error: any) {
		// Catch unexpected errors during request processing
		console.error("Unexpected error handling MCP request:", error);
		return createMcpErrorResponse(mcpRequestId || clientRequestId, ErrorCode.InternalError, `Internal server error: ${error.message}`, 500);
	}
}

// ======================================================================
// Helper to Create MCP Error Responses
// ======================================================================
function createMcpErrorResponse(requestId: string, code: ErrorCode, message: string, httpStatus: number): Response {
	const errorPayload: McpErrorResponse = {
		mcp: '1.0',
		id: requestId,
		error: { code: code, message: message },
	};
	console.error(`MCP Error Response (HTTP ${httpStatus}):`, JSON.stringify(errorPayload));
	return new Response(JSON.stringify(errorPayload), {
		status: httpStatus,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}
