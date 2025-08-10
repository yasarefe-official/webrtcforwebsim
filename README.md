# WebRTC Signaling Server

This is a simple WebRTC signaling server built with Node.js and the `ws` library. It allows WebRTC clients to exchange signaling messages (offers, answers, and ICE candidates) to establish a peer-to-peer connection.

This server supports a single global room, meaning all connected clients will receive signaling messages from all other clients.

## Features

-   WebSocket-based signaling
-   Handles `offer`, `answer`, and `ice-candidate` messages
-   Broadcasts messages to all connected clients
-   CORS enabled to allow connections from any origin
-   Includes a health check endpoint at `/health`
-   Ready for deployment on platforms like Render

## Running Locally

To run the signaling server on your local machine, follow these steps:

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 14 or higher)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd webrtc-signaling-server
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
    - **Region:** Choose a region close to you.
    - **Branch:** Select the branch you want to deploy (e.g., `main`).
    - **Root Directory:** Leave this as is.
    - **Runtime:** Select **Node**.
    - **Build Command:** `npm install`
    - **Start Command:** `npm start`

4.  **Click "Create Web Service".**

Render will automatically build and deploy your service. It will also set the `PORT` environment variable, which the server is configured to use.

### Connecting Your Frontend

Once deployed, your service will have a public URL like `https_//your-service-name.onrender.com`. Your WebRTC application should connect to the WebSocket endpoint using `wss` (secure WebSocket):

`wss://your-service-name.onrender.com`

The server includes a health check endpoint at `https_//your-service-name.onrender.com/health` which you can use to confirm it's running.
