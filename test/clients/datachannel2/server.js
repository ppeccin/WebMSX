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
        sendButton.addEventListener('click', sendChatMessage, false);
    }

    function startSession() {
        ws = new WebSocket("ws://localhost");
        ws.onmessage = onSessionMessage;
        ws.onopen = () => ws.send(JSON.stringify({ messageType: "createSession" }));
    }

    function stopSession() {
        ws.close();
        sessionIDField.value = "";
        sessionIDField.style.backgroundColor = "transparent";
    }

    function onSessionMessage(message) {
        const mes = JSON.parse(message.data);

        if(mes.messageType === "sessionCreated") {
            console.log("Session created: " + mes.sessionID);
            sessionID = mes.sessionID;
            sessionIDField.value = sessionID;
            sessionIDField.style.backgroundColor = "lightgreen";
        }

        if(mes.messageType === "clientJoined") {
            console.log("Client " + mes.clientID + " joined");

            let client = {id: mes.clientID};
            clients[mes.clientID] = client;
            startRTC(client);
        }

        if(mes.messageType === "clientLeft") {
            console.log("Client " + mes.clientID + " left");

            let client = clients[mes.clientID];
            if (!client) return;
            delete clients[client.id];
            closeRTC(client);
        }

        if(mes.clientSDP) {
            let client = clients[mes.fromClientID];
            if (!client) return;
            client.rtcConnection.setRemoteDescription(new RTCSessionDescription(mes.clientSDP))
                .catch(handleError);
        }
    }

    function startRTC(client) {
        // Create the local connection and its event listeners
        let rtcConnection = new RTCPeerConnection({});
        client.rtcConnection = rtcConnection;

        // Set up the ICE candidates
        rtcConnection.onicecandidate = e => {
            if (!e.candidate)
                ws.send(JSON.stringify({ toClientID: client.id, serverSDP: rtcConnection.localDescription }));
        };

        // Create the data channel and establish its event listeners
        let dataChannel = rtcConnection.createDataChannel("dataChannel", { _protocol: "tcp", _id: 29 } );
        client.dataChannel = dataChannel;
        dataChannel.onopen = event => handleChannelStatusChange(client, event);
        dataChannel.onclose = event => handleChannelStatusChange(client, event);
        dataChannel.onmessage = event => handleChannelOnMessage(client, event);

        // Create an offer to connect; this starts the process
        rtcConnection.createOffer()
            .then(desc => rtcConnection.setLocalDescription(desc))
            .catch(handleError);
    }

    function sendChatMessage() {
        const message = "Server: " + messageInputBox.value;

        printMessage(message);

        for (let cID in clients)
            clients[cID].dataChannel.send(message);

        messageInputBox.value = "";
        messageInputBox.focus();
    }

    function printMessage(mes) {
        const el = document.createElement("p");
        const txtNode = document.createTextNode(mes);
        el.appendChild(txtNode);
        receiveBox.appendChild(el);
    }

    function handleChannelStatusChange(client, event) {
        let dataChannel = client.dataChannel;
        if (dataChannel) {
            const state = dataChannel.readyState;
            console.log("Client " + client.id + " sendChannelStatusChange:", event);
        }
    }

    function handleChannelOnMessage(client, event) {
        let mes = "Client " + client.id + ": " + event.data;

        printMessage(mes);

        for (let cID in clients)
            clients[cID].dataChannel.send(mes);
    }

    function handleError(error) {
        console.log("RTC Error:", + error);
    }

    function closeRTC(client) {
        if (client.dataChannel) client.dataChannel.close();
        if (client.rtcConnection) client.rtcConnection.close();
    }

    window.addEventListener('load', onPageLoad, false);

})();
