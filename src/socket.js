import { io } from "socket.io-client";

let socket = null;

function getSocket() {
    if (!socket) {
        socket = io(process.env.VUE_APP_API_URL, {
            autoConnect: false,
            auth: { token: localStorage.getItem("token") },
        });
    }
    return socket;
}

function connectSocket() {
    let s = getSocket();
    s.auth.token = localStorage.getItem("token");
    if (!s.connected) {
        s.connect();
    }
}

function disconnectSocket() {
    if (socket && socket.connected) {
        socket.disconnect();
    }
}

export { getSocket, connectSocket, disconnectSocket };
