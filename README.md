# Full-Stack Python WebRTC Video Chat

This is a complete WebRTC video chat application built with a Python backend and a vanilla JavaScript frontend. It allows multiple users to join a single chat room and establish peer-to-peer video and audio connections.

## Features

-   **Python Backend:** Built with Flask, using `flask-sock` for WebSocket handling.
-   **Intelligent Signaling:** The server manages a multi-user room by assigning unique IDs and routing signaling messages (`offer`, `answer`, `ice-candidate`) between specific peers.
-   **Dynamic Frontend:** The frontend is built with pure JavaScript, dynamically creating video elements as new peers join the room.
-   **Peer Discovery:** The server automatically notifies all clients about new peers joining and peers leaving, allowing the UI to update in real-time.
-   **Deployment Ready:** The application is configured for easy deployment to platforms like Render using Gunicorn.

## How It Works

1.  A user loads the web page, which is served by Flask.
2.  The frontend JavaScript requests access to the user's camera and microphone.
3.  A WebSocket connection is established with the Python signaling server at the `/ws` endpoint.
4.  The server assigns the new client a unique ID and sends it a list of already connected peers (`init-peers` message).
5.  The client initiates a WebRTC connection with each existing peer by creating and sending an `offer`.
6.  When other clients receive the `offer`, they create an `answer` and send it back to the new client.
7.  Once the offer/answer exchange is complete and ICE candidates have been exchanged, a direct peer-to-peer connection is established, and video/audio streams begin.
8.  The server's only role is to "introduce" the peers by passing these initial signaling messages. The actual video and audio data flows directly between the clients.

## Running Locally

To run the application on your local machine, you need Python and pip installed.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <directory-name>
```

### 2. Set up a Virtual Environment (Recommended)
```bash
# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Development Server
The application can be run using Flask's built-in development server.

```bash
# On macOS/Linux
export FLASK_APP=app.py
flask run --port=8080

# On Windows (Command Prompt)
set FLASK_APP=app.py
flask run --port=8080

# On Windows (PowerShell)
$env:FLASK_APP = "app.py"
flask run --port=8080
```
Now, open your web browser and navigate to `http://127.0.0.1:8080`.

## Deploying to Render

This project is ready to be deployed as a **Web Service** on [Render](https://render.com/).

1.  **Push your code to a GitHub repository.**
2.  **Create a new Web Service on Render** and connect it to your GitHub repository.
3.  **Configure the service:**
    -   **Runtime:** Select **Python 3**.
    -   **Build Command:** `pip install -r requirements.txt`
    -   **Start Command:** `gunicorn app:app` (Render will automatically use the `Procfile`).
4.  **Click "Create Web Service".** Render will build and deploy your application.

Once deployed, access the public URL provided by Render. Your WebSocket connection will automatically use the secure `wss://` protocol.
