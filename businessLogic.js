import {WebSocket} from "ws";
import {wss} from "./index.js";

const players = [];
const rooms = [];
const games = []
const shipsBoard = []
export function handlePlayerRegistration(ws, data) {
    const { name, password } = data;
    const isNameTaken = players.some(player => player.name === name);
    console.log(isNameTaken, "name")
    if (isNameTaken) {
        const response = {
            type: 'reg',
            data: {
                name: name,
                index: -1,
                error: true,
                errorText: 'Player name is already taken.',
            },
            id: data.id,
        };
        ws.send(JSON.stringify(response));
    } else {
        const player = {
            name: name,
            index: players.length,
            ws: ws,
        };
        players.push(player);
        const response = {
            type: 'reg',
            data: {
                name: name,
                index: player.index,
                error: false,
                errorText: '',
            },
            id: data.id,
            players
        };
        ws.send(JSON.stringify(response));
    }
}




//  create a room
export function handleCreateRoom(ws, data) {
    const {id} = data
    const player = getPlayerByWebSocket(id);
    if (player) {
        const room = {
            roomId: rooms.length,
            roomUsers: [{ name: player.name, index: player.index }],
        };
        rooms.push(room);
        const response = {
            type: 'create_room',
            data: room,
            id: data.id,
        };
        ws.send(JSON.stringify(response));
    } else {
        ws.send('Player not found for room creation.');

    }
}

// add user to the room
export function handleAddUserToRoom(ws, data) {
    const player = getPlayerByWebSocket(data.id);
    if (player) {
        const roomIndex = data.data.indexRoom;
        if (rooms[roomIndex]) {
            const r = { name: player.name, index: player.index }
            rooms[roomIndex].roomUsers.push(r);
            if (rooms[roomIndex].roomUsers.length === 2) {
                const game = startGame(rooms[roomIndex].roomUsers);
                const response = {
                    type: 'create_game',
                    data: {
                        idGame: game.id,
                        idPlayer: player.index,
                    },
                    id: data.id,
                };

                ws.send(JSON.stringify(response));
                broadcastRoomUpdate();
            }
        }
    } else {
        console.warn('Player not found for adding to the room.');
    }
}
//  add ships to the board
export function handleAddShips(ws, data) {
    const player = getPlayerByWebSocket(data.id);
    if (player) {
        const gameId = data.data.gameId;
        const indexPlayer = data.data.indexPlayer;
        const ships = data.data.ships;
        shipsBoard.push(ships)
        const response = {
            type: 'add_ships',
            data: {
                gameId: gameId,
                indexPlayer: indexPlayer,
            },
            id: data.id,
        };
        ws.send(JSON.stringify(response));
    } else {
        console.warn('Player not found for adding ships.');
    }
}
//  start the game
export function handleStartGame(ws, data) {
    const player = getPlayerByWebSocket(data.id);
    if (player) {
        const gameId = data.id;
        const indexPlayer = data.data.currentPlayerIndex;
        const game = games.find(g => g.id === gameId);
        if (game) {
            const response = {
                type: 'start_game',
                data: {
                    ships: game.ships,
                    currentPlayerIndex: indexPlayer,
                },
                id: data.id,
            };
            ws.send(JSON.stringify(response));
            broadcastGameUpdate(gameId);
        }
    } else {
        console.warn('Player not found for starting the game.');
    }
}

export function handlePlayerDisconnect(id) {
    const player = getPlayerByWebSocket(id);
    if (player) {
      wss.close()
    }
}
// find player among players
export function getPlayerByWebSocket(id) {
    return players.find(player =>{
        return Number(player.index) === Number(id)
    });

}


//  update the room
export function broadcastRoomUpdate(wss) {
    const roomUpdate = {
        type: 'update_room',
        data: rooms,
        players
    };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(roomUpdate));
        }
    });
}

export function broadcastGameUpdate(gameId) {
    const gameUpdate = {
        type: 'update_game',
        data: games.find(game => game.id === gameId),
        id: 0,
    };

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(gameUpdate));
        }
    });
}
