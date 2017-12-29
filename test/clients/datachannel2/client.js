
(function() {

    let connectButton = null;
    let disconnectButton = null;

    let ws = null;

    let sessionIDField = null;
    let sendButton = null;
    let messageInputBox = null;
    let receiveBox = null;

    let rtcConnection = null;
    let dataChannel = null;

    function onPageLoad() {
        connectButton = document.getElementById('connectButton');
        disconnectButton = document.getElementById('disconnectButton');
        sessionIDField = document.getElementById('sessionIDField');
        sendButton = document.getElementById('sendButton');
        messageInputBox = document.getElementById('message');
        receiveBox = document.getElementById('receivebox');

        connectButton.addEventListener('click', connectSession, false);
        disconnectButton.addEventListener('click', disconnectSession, false);
        sendButton.addEventListener('click', sendChatMessage, false);
    }

    function connectSession() {
        ws = new WebSocket("ws://localhost");
        ws.onmessage = onSessionMessage;
        ws.onopen = () => ws.send(JSON.stringify({ messageType: "joinSession", sessionID: sessionIDField.value }));
    }

    function disconnectSession() {
        ws.close();
        sessionIDField.value = "";
        sessionIDField.style.backgroundColor = "transparent";
        closeRTC();
    }

    function onSessionMessage(message) {
        const mes = JSON.parse(message.data);

        if(mes.messageType === "sessionJoined") {
            console.log("Session joined: " + mes.sessionID);
            sessionIDField.style.backgroundColor = "lightgreen";

            startRTC();
        }

        if(mes.messageType === "sessionDestroyed") {
            console.log("Session destroyed");
            disconnectSession();
        }

        if(mes.serverSDP) {
            rtcConnection.setRemoteDescription(new RTCSessionDescription(mes.serverSDP))
                .catch(handleError);
        }
    }

    function startRTC() {
        // Create the local connection and its event listeners
        rtcConnection = new RTCPeerConnection();

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
