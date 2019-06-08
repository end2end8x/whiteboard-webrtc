import io from 'socket.io-client';

// const url = "http://127.0.0.1:8000";
const url = "http://103.9.158.176:8000"

const socket = io(url);

export default socket;
