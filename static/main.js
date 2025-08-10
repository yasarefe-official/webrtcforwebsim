// --- DOM Elements ---
const videoGrid = document.getElementById('video-grid');
const localVideo = document.getElementById('local-video');

// --- State Management ---
let myId = null;
let localStream = null;
const peerConnections = {}; // { peerId: RTCPeerConnection }

// --- WebRTC Configuration ---
// Using a public STUN server provided by Google.
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

// --- WebSocket Connection ---
// Determine WebSocket protocol based on page protocol
const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const ws = new WebSocket(`${wsProtocol}${window.location.host}/ws`);

ws.onopen = () => {
    console.log("WebSocket connection established.");
};

ws.onclose = () => {
    console.log("WebSocket connection closed.");
};

ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};

// --- Main Entry Point ---
async function init() {
    try {
        // Get user's camera and microphone
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error("Error accessing media devices.", error);
        alert("Could not access camera and microphone. Please check permissions.");
    }
}

// --- Signaling Logic (Handling messages from server) ---
ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const { type, payload } = message;

    switch (type) {
        case 'init-peers':
            handleInitPeers(payload);
            break;
        case 'new-peer':
            handleNewPeer(payload);
            break;
        case 'peer-disconnect':
            handlePeerDisconnect(payload);
            break;
        case 'offer':
            handleOffer(payload);
            break;
        case 'answer':
            handleAnswer(payload);
            break;
        case 'ice-candidate':
            handleIceCandidate(payload);
            break;
        default:
            console.warn("Unknown message type received:", type);
    }
};

function handleInitPeers(payload) {
    myId = payload.id;
    console.log(`Received our ID: ${myId}`);
    // For each existing peer, create a connection and an offer
    for (const peerId of payload.peerIds) {
        createPeerConnection(peerId, true);
    }
}

function handleNewPeer(payload) {
    const { id: peerId } = payload;
    console.log(`New peer connected: ${peerId}`);
    // Create a connection for the new peer, but don't create an offer.
    // The new peer will be the one to initiate the offer.
    // This avoids "glare" where both peers create offers simultaneously.
    createPeerConnection(peerId, false);
}

function handlePeerDisconnect(payload) {
    const { id: peerId } = payload;
    console.log(`Peer disconnected: ${peerId}`);
    if (peerConnections[peerId]) {
        peerConnections[peerId].close();
        delete peerConnections[peerId];
    }
    const videoElement = document.getElementById(`video-${peerId}`);
    if (videoElement) {
        videoElement.parentElement.remove();
    }
}

async function handleOffer(payload) {
    const { senderId, sdp } = payload;
    console.log(`Received offer from ${senderId}`);

    const pc = createPeerConnection(senderId, false);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // Send the answer back to the sender
    ws.send(JSON.stringify({
        type: 'answer',
        targetId: senderId,
        payload: { sdp: pc.localDescription }
    }));
}

async function handleAnswer(payload) {
    const { senderId, sdp } = payload;
    console.log(`Received answer from ${senderId}`);

    const pc = peerConnections[senderId];
    if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    }
}

async function handleIceCandidate(payload) {
    const { senderId, candidate } = payload;

    const pc = peerConnections[senderId];
    if (pc && candidate) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding received ice candidate', e);
        }
    }
}

// --- WebRTC Helper Functions ---
function createPeerConnection(peerId, isInitiator) {
    if (peerConnections[peerId]) {
        console.warn(`Peer connection for ${peerId} already exists.`);
        return peerConnections[peerId];
    }

    const pc = new RTCPeerConnection(configuration);
    peerConnections[peerId] = pc;

    // Add local stream tracks to the connection
    localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
        if (event.candidate) {
            // Send the candidate to the other peer
            ws.send(JSON.stringify({
                type: 'ice-candidate',
                targetId: peerId,
                payload: { candidate: event.candidate }
            }));
        }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
        let videoElement = document.getElementById(`video-${peerId}`);
        if (!videoElement) {
            // Create a new video element for the remote peer
            const container = document.createElement('div');
            container.className = 'video-container';

            const title = document.createElement('h2');
            title.innerText = `Peer ${peerId}`;

            videoElement = document.createElement('video');
            videoElement.id = `video-${peerId}`;
            videoElement.autoplay = true;
            videoElement.playsInline = true;

            container.appendChild(title);
            container.appendChild(videoElement);
            videoGrid.appendChild(container);
        }
        videoElement.srcObject = event.streams[0];
    };

    // If this peer is the one initiating the connection, create an offer
    if (isInitiator) {
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
                // Send the offer to the other peer
                ws.send(JSON.stringify({
                    type: 'offer',
                    targetId: peerId,
                    payload: { sdp: pc.localDescription }
                }));
            })
            .catch(e => console.error("Error creating offer:", e));
    }

    return pc;
}

// --- Start the application ---
init();
