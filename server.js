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

// Store all connected clients in a Set
const clients = new Set();

// WebSocket server event listeners
wss.on('connection', (ws) => {
  // Add the new client to our set of clients
  clients.add(ws);
  console.log('Client connected');

  // Handle messages from the client
  ws.on('message', (message) => {
    // We iterate over all connected clients
    for (const client of clients) {
      // We check if the client is not the sender and is in a ready state
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // We broadcast the message to the client
        client.send(message.toString());
      }
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    // Remove the client from our set of clients
    clients.delete(ws);
    console.log('Client disconnected');
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
