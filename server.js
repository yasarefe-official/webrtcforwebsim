// Import required modules
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Use CORS middleware to allow cross-origin requests
  cors()(req, res, () => {
    // Set a health check endpoint
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    } else {
      res.writeHead(404);
      res.end();
    }
  });
});

// Create a WebSocket server and attach it to the HTTP server
const wss = new WebSocket.Server({ server });

// Use a Map to store clients, mapping a unique ID to each WebSocket connection
const clients = new Map();
let nextClientId = 1;

// WebSocket server event listeners
wss.on('connection', (ws) => {
  // Generate a unique ID for the new client
  const clientId = nextClientId++;
  // Store the new client connection
  clients.set(clientId, ws);
  console.log(`Client connected with ID: ${clientId}`);

  // Send the client its assigned ID and a list of all existing clients
  const existingPeers = Array.from(clients.keys()).filter(id => id !== clientId);
  ws.send(JSON.stringify({
    type: 'init-peers',
    payload: {
      id: clientId,
      peerIds: existingPeers
    }
  }));

  // Notify all other clients about the new peer
  for (const [id, client] of clients) {
    if (id !== clientId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new-peer',
        payload: { id: clientId }
      }));
    }
  }

  // Handle messages from the client
  ws.on('message', (message) => {
    try {
      // Parse the message
      const { type, payload, targetId } = JSON.parse(message);

      // Check if the target client exists
      const targetClient = clients.get(targetId);

      if (targetClient && targetClient.readyState === WebSocket.OPEN) {
        // Add the sender's ID to the payload
        const outgoingPayload = {
          ...payload,
          senderId: clientId
        };

        // Forward the message to the target client
        targetClient.send(JSON.stringify({ type, payload: outgoingPayload }));
      } else {
        console.warn(`Target client ${targetId} not found or not open.`);
      }
    } catch (error) {
      console.error(`Failed to process message from ${clientId}:`, error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    // Remove the client from our map of clients
    clients.delete(clientId);
    console.log(`Client disconnected with ID: ${clientId}`);

    // Notify all other clients about the disconnection
    for (const [id, client] of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'peer-disconnect',
          payload: { id: clientId }
        }));
      }
    }
  });

  // Handle WebSocket errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Define the port to listen on
// Render provides a PORT environment variable. Default to 8080 for local development.
const PORT = process.env.PORT || 8080;

// Start the server
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
