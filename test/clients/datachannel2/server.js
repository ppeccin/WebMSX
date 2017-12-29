function myAddIceCandidate(remoteConnection, e) {
    console.log(e.candidate);

    return remoteConnection.addIceCandidate(e.candidate);
}

(function() {

    let startButton = null;
    let stopButton = null;

    let ws = null;
    let sessionID = null;

    let clients = {};

    let sessionIDField = null;
    let sendButton = null;
    let messageInputBox = null;
    let receiveBox = null;


    function onPageLoad() {
        startButton = document.getElementById('startButton');
        stopButton = document.getElementById('stopButton');
        sessionIDField = document.getElementById('sessionIDField');
        sendButton = document.getElementById('sendButton');
        messageInputBox = document.getElementById('message');
        receiveBox = document.getElementById('receivebox');

        startButton.addEventListener('click', startSession, false);
        stopButton.addEventListener('click', stopSession, false);
        sendButton.addEventListener('click', sendMessage, false);
    }

    function startSession() {
        ws = new WebSocket("ws://localhost");
        ws.onmessage = onSessionMessage;
        ws.onopen = () => ws.send(JSON.stringify({ messageType: "createSession" }));
    }

    function stopSession() {
        ws.close();
        sessionIDField.value = "";
    }

    function onSessionMessage(message) {
        const mes = JSON.parse(message.data);

        if(mes.messageType === "sessionCreated") {
            console.log("Session created: " + mes.sessionID);
            sessionID = mes.sessionID;
            sessionIDField.value = sessionID;
        }

        if(mes.messageType === "clientJoined") {
            console.log("Client " + mes.clientID + " joined");

            connectClient(mes.clientID);
        }

        if(mes.messageType === "clientLeft") {
            console.log("Client " + mes.clientID + " left");
        }

        if(mes.client_sdp) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(mes.client_sdp))
                .catch(errorHandler);
        }
    }

    function connectClient(clientID) {
        let client = { id: clientID };
        this.clients[clientID] = client;

        startRTC(client);
    }

    function startRTC(client) {
        // Create the local connection and its event listeners
        let rtcConnection = new RTCPeerConnection();

        // Set up the ICE candidates
        rtcConnection.onicecandidate = e => {
            if (!e.candidate)
                ws.send(JSON.stringify({ clientSDP: rtcConnection.localDescription }));
        };

        // Create the data channel and establish its event listeners
        dataChannel = rtcConnection.createDataChannel("dataChannel", { _protocol: "tcp", _id: 29 } );
        dataChannel.onopen = handleChannelStatusChange;
        dataChannel.onclose = handleChannelStatusChange;
        dataChannel.onmessage = handleChannelOnMessage;

        // Create an offer to connect; this starts the process
        rtcConnection.createOffer()
            .then(desc => rtcConnection.setLocalDescription(desc))
            .catch(handleError);
    }

    function sendChatMessage() {
        const message = messageInputBox.value;
        dataChannel.send(message);

        messageInputBox.value = "";
        messageInputBox.focus();
    }

    function handleChannelStatusChange(event) {
        if (dataChannel) {
            const state = dataChannel.readyState;

            console.log("sendChannelStatusChange:", event);

            if (state === "open") {
                messageInputBox.disabled = false;
                messageInputBox.focus();
                sendButton.disabled = false;
            } else {
                messageInputBox.disabled = true;
                sendButton.disabled = true;
            }
        }
    }

    function handleChannelOnMessage(event) {
        const el = document.createElement("p");
        const txtNode = document.createTextNode(event.data);

        el.appendChild(txtNode);
        receiveBox.appendChild(el);
    }

    function handleError(error) {
        console.log("RTC Error:", + error);
    }

    function closeRTC() {

        if (dataChannel) dataChannel.close();
        if (rtcConnection) rtcConnection.close();

        dataChannel = null;
        rtcConnection = null;

        messageInputBox.value = "";
        messageInputBox.disabled = true;
        sendButton.disabled = true;
    }

    window.addEventListener('load', onPageLoad, false);

})();
