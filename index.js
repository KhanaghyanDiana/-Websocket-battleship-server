import { httpServer } from "./src/http_server/index.js";
import {WebSocketServer, WebSocket} from "ws";
import dotenv from 'dotenv';
import {
    broadcastRoomUpdate,
    handleAddShips,
    handleAddUserToRoom,
    handleCreateRoom,
    handlePlayerDisconnect,
    handlePlayerRegistration, handleStartGame
} from "./businessLogic.js";

dotenv.config();

const HTTP_PORT = process.env.LOCAL_PORT;
console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

export const wss = new WebSocketServer({ port: process.env.WS_PORT });


wss.on('connection', (ws) => {
    console.log('New connection');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message)
            handleWebSocketMessage(ws, data)
        } catch (error) {
            console.error('Invalid JSON format:', error);
        }
    });

    ws.on('close', () => {
        console.log('Connection closed');
        handlePlayerDisconnect(ws);
    });
});

function handleWebSocketMessage(ws, data) {
    switch (data.type) {
        case 'reg':
            handlePlayerRegistration(ws, data);
            break;
        case 'create_room':
            handleCreateRoom(ws, data);
            break;
        case 'add_user_to_room':
            handleAddUserToRoom(ws, data);
            break;
        case 'add_ships':
            handleAddShips(ws, data);
            break;
        case 'finish':
            handlePlayerDisconnect(ws, data);
            break;
        case 'update_room':
            broadcastRoomUpdate(ws, data);
            break;
        case 'start_game':
            handleStartGame(ws, data);
            break;
            default:
            console.warn('Unhandled message type:', data.type);
    }
}
//  register a user
