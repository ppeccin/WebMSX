let localVideo;
let remoteVideo;
let serverConnection;
let peerConnection;
let localStream;
let descriptionSet;

const peerConnectionConfig = null;
// {
    //     'iceServers': [
    //         {'urls': 'stun:stun.services.mozilla.com'},
    //         {'urls': 'stun:stun.l.google.com:19302'},
    //     ]
    // };

function pageReady() {
    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');

    serverConnection = new WebSocket('ws://localhost');
    // serverConnection = new WebSocket('ws://ppeccin-websockets.herokuapp.com');
    serverConnection.onmessage = gotMessageFromServer;

    const constraints = {
        video: true,
        audio: true,
    };

    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
}

function join() {
    if (!localStream) return;

    const sessionID = document.getElementById("SessionIDField").value;
    serverConnection.send(JSON.stringify({ sessionControl: "joinSession", sessionID }));

    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);
}

function gotMessageFromServer(message) {
    const signal = JSON.parse(message.data);

    if(signal.sessionControl === "sessionJoined") {
        console.log("Session joined: " + signal.sessionID);
        document.getElementById("SessionIDField").style.backgroundColor = "lightgreen";
    }

    if(signal.sessionControl === "sessionDestroyed") {
        console.log("Session destroyed");
    }

    if(signal.server_sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.server_sdp))
            .then(function() {
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            })
            .catch(errorHandler);
    }
}

function gotIceCandidate(event) {
    console.log("got local IceCandidate: " + event);

    if(event.candidate == null)
        sendDescription();
}

function createdDescription(desc) {
    console.log('got local Description: ' + desc);

    peerConnection.setLocalDescription(desc)
        .then(function() {
            descriptionSet = true;
        })
        .catch(errorHandler);
}

function sendDescription() {
    console.log('sending Description: ' + peerConnection.localDescription);

}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log(error);
}
