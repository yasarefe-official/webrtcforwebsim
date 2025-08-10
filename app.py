import json
from flask import Flask, render_template
from flask_sock import Sock

# Initialize the Flask application
app = Flask(__name__)
# Initialize Flask-Sock for WebSocket support
sock = Sock(app)

# --- State Management ---
# A dictionary to store connected clients, mapping client_id -> websocket connection
clients = {}
# A counter to generate unique client IDs
next_client_id = 1

# --- Helper Functions ---
def broadcast(message):
    """Sends a message to all connected clients."""
    for client_ws in clients.values():
        try:
            client_ws.send(message)
        except Exception as e:
            # It's possible a client disconnected without being properly removed
            print(f"Error sending to a client: {e}")

def notify_peer_disconnect(disconnected_id):
    """Notifies all clients that a peer has disconnected."""
    disconnect_message = json.dumps({
        "type": "peer-disconnect",
        "payload": {"id": disconnected_id}
    })
    broadcast(disconnect_message)

# --- WebSocket Route ---
@sock.route('/ws')
def websocket_route(ws):
    """Handles the WebSocket connection for a single client."""
    global next_client_id
    client_id = next_client_id
    next_client_id += 1

    print(f"Client connected with ID: {client_id}")
    clients[client_id] = ws

    try:
        # 1. On connection, send the new client its ID and a list of existing peers
        existing_peer_ids = [cid for cid in clients if cid != client_id]
        ws.send(json.dumps({
            "type": "init-peers",
            "payload": {
                "id": client_id,
                "peerIds": existing_peer_ids
            }
        }))

        # 2. Notify all other clients about the new peer
        new_peer_message = json.dumps({
            "type": "new-peer",
            "payload": {"id": client_id}
        })
        for peer_id, peer_ws in clients.items():
            if peer_id != client_id:
                try:
                    peer_ws.send(new_peer_message)
                except Exception as e:
                    print(f"Error notifying peer {peer_id}: {e}")

        # 3. Listen for messages from the client
        while True:
            message_str = ws.receive()
            if message_str is None:
                # Connection closed by client
                break

            try:
                message = json.loads(message_str)
                target_id = message.get("targetId")
                msg_type = message.get("type")
                payload = message.get("payload")

                target_ws = clients.get(target_id)
                if target_ws:
                    # Add the sender's ID to the payload for context
                    payload["senderId"] = client_id

                    # Forward the message to the target client
                    target_ws.send(json.dumps({
                        "type": msg_type,
                        "payload": payload
                    }))
                else:
                    print(f"Warning: Target client {target_id} not found.")

            except json.JSONDecodeError:
                print(f"Error: Received invalid JSON from client {client_id}")
            except Exception as e:
                print(f"An error occurred processing message from {client_id}: {e}")

    finally:
        # 4. On disconnect, remove the client and notify others
        if client_id in clients:
            del clients[client_id]
            print(f"Client {client_id} disconnected.")
            notify_peer_disconnect(client_id)

# --- HTTP Route ---
@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')
