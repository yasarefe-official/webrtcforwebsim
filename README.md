# WebRTC Signaling Server

This is a simple but robust WebRTC signaling server built with Node.js and the `ws` library. It allows WebRTC clients to exchange signaling messages (offers, answers, and ICE candidates) to establish peer-to-peer connections in a multi-user environment.

This server manages a single global room where all clients connect. It assigns unique IDs to clients and routes messages to specific peers, which is necessary for establishing multiple simultaneous connections.

## Features

-   WebSocket-based signaling using unique client IDs.
-   Intelligent routing for `offer`, `answer`, and `ice-candidate` messages.
-   Automatic peer discovery (`new-peer` and `peer-disconnect` notifications).
-   CORS enabled to allow connections from any origin.
-   Includes a health check endpoint at `/health`.
-   Ready for deployment on platforms like Render.

## Signaling Protocol

The server and client communicate using JSON-formatted messages. All messages must have a `type` property.

### Messages from Server to Client

#### `init-peers`
Sent to a client immediately after it connects. Provides the client with its own unique ID and a list of all other clients that are already connected.

```json
{
  "type": "init-peers",
  "payload": {
    "id": 1,
    "peerIds": [2, 3]
  }
}
```
- `payload.id`: Your new unique client ID.
- `payload.peerIds`: An array of IDs for all other clients already in the room. Your client should create offers for each of these peers.

#### `new-peer`
Sent to all existing clients when a new client joins the room.

```json
{
  "type": "new-peer",
  "payload": {
    "id": 4
  }
}
```
- `payload.id`: The ID of the new client that has just connected. Your client should create an offer for this new peer.

#### `peer-disconnect`
Sent to all remaining clients when a client disconnects.

```json
{
  "type": "peer-disconnect",
  "payload": {
    "id": 2
  }
}
```
- `payload.id`: The ID of the client that has left. Your client should clean up any connections related to this peer.

#### Forwarded Messages (`offer`, `answer`, `ice-candidate`)
When a peer sends you a message, the server forwards it and adds the sender's ID.

```json
{
  "type": "offer", // or "answer", "ice-candidate"
  "payload": {
    "senderId": 3,
    "sdp": { ... } // Original payload from the sender
  }
}
```
- `payload.senderId`: The ID of the client that sent the message.

### Messages from Client to Server

For `offer`, `answer`, and `ice-candidate` messages, the client **must** include a `targetId` field in the top-level JSON object, indicating the intended recipient.

#### `offer` / `answer`
Used to send session descriptions to a specific peer.

```json
{
  "type": "offer", // or "answer"
  "targetId": 2,
  "payload": {
    "sdp": { ... } // The SDP object
  }
}
```
- `targetId`: The ID of the peer you want to send this message to.
- `payload`: The data you want to send. For offers and answers, this typically contains the SDP.

#### `ice-candidate`
Used to send ICE candidates to a specific peer.

```json
{
  "type": "ice-candidate",
  "targetId": 2,
  "payload": {
    "candidate": { ... } // The ICE candidate object
  }
}
```
- `targetId`: The ID of the peer you want to send this candidate to.
- `payload`: The data containing the candidate.


## Running Locally

To run the signaling server on your local machine, follow these steps:

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 14 or higher)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <directory-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    npm start
    ```

The server will start on `http://localhost:8080`. Your WebSocket clients should connect to `ws://localhost:8080`.

## Deploying to Render

This project is ready to be deployed as a **Web Service** on [Render](https://render.com/).

### Steps

1.  **Push your code to a GitHub repository.**

2.  **Create a new Web Service on Render:**
    - Go to your [Render Dashboard](https://dashboard.render.com/).
    - Click **New +** and select **Web Service**.
    - Connect your GitHub account and select the repository for this project.

3.  **Configure the service:**
    - **Name:** Give your service a name (e.g., `webrtc-signaling-server`).
    - **Runtime:** Select **Node**.
    - **Build Command:** `npm install`
    - **Start Command:** `npm start`

4.  **Click "Create Web Service".**

Render will automatically build and deploy your service.

### Connecting Your Frontend

Once deployed, your service will have a public URL like `https_//your-service-name.onrender.com`. Your WebRTC application should connect to the WebSocket endpoint using `wss` (secure WebSocket):

`wss://your-service-name.onrender.com`
