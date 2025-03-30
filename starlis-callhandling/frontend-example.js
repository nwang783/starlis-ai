// Example of how to use JWT in your frontend application

// Function to generate a token (this should be done in your backend)
const generateToken = (source) => {
  // In a real application, this would be an API call to your backend
  return fetch('https://your-backend.com/generate-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source: 'frontend' }),
  }).then(res => res.json());
};

// Example of making an authenticated API call
const makeAuthenticatedCall = async () => {
  try {
    // Get the token (in a real app, you'd store this securely)
    const { token } = await generateToken('frontend');

    // Make the API call with the token
    const response = await fetch('https://voip.starlis.tech/outbound-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Origin': 'https://your-frontend-domain.com'
      },
      body: JSON.stringify({
        user_id: 'your-user-id',
        number: '+1234567890',
        prompt: 'You are a helpful assistant',
        first_message: 'Hello, this is an automated call'
      })
    });

    const data = await response.json();
    console.log('Call initiated:', data);
  } catch (error) {
    console.error('Error making call:', error);
  }
};

// Example of WebSocket connection with JWT
const connectWebSocket = async () => {
  try {
    // Get the token
    const { token } = await generateToken('frontend');

    // Create WebSocket connection with token
    const ws = new WebSocket(`wss://voip.starlis.tech/outbound-media-stream?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };
  } catch (error) {
    console.error('Error connecting to WebSocket:', error);
  }
}; 