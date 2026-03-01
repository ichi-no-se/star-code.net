import { Namespace, Socket } from 'socket.io';

interface Player {
    id: string;
    x: number;
    y: number;
    color: number;
}

interface MovementData {
    x: number;
    y: number;
}

const rooms: Record<string, Record<string, Player>> = {
    'room1': {},
    'room2': {},
    'room3': {}
};
const width = 800;
const height = 600;
const playerSize = 10;

function getRandomPosition(width: number, height: number, playerSize: number = 10) {
    return {
        x: Math.floor(Math.random() * (width - playerSize) + playerSize / 2),
        y: Math.floor(Math.random() * (height - playerSize) + playerSize / 2)
    };
}

function hsvToRgb(h: number, s: number, v: number) {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = Math.round(v * 255 * (1 - s));
    const q = Math.round(v * 255 * (1 - f * s));
    const t = Math.round(v * 255 * (1 - (1 - f) * s));
    v = Math.round(v * 255);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return (r << 16) | (g << 8) | b;
}

function getRandomBrightColor() {
    const h = Math.random();
    const s = 0.7 + Math.random() * 0.3;
    const v = 1.0;
    return hsvToRgb(h, s, v);
}

const getRoomStats = () => {
    return Object.keys(rooms).map(roomId => ({
        id: roomId,
        playerCount: Object.keys(rooms[roomId]).length
    }));
}


export const onlineGamePrototype1Handler = (ns: Namespace) => {
    ns.on('connection', (socket: Socket) => {
        const leaveCurrentRoom = () => {
            const roomId = Object.keys(rooms).find(id => rooms[id][socket.id]);
            if (!roomId) return;
            delete rooms[roomId][socket.id];
            socket.to(roomId).emit('playerDisconnected', socket.id);
            socket.leave(roomId);
            socket.join('lobby');
            ns.to('lobby').emit('roomStatsUpdate', getRoomStats());
        }
        console.log(`[OnlineGamePrototype1] Client connected: ${socket.id}`);
        socket.join('lobby');
        socket.on('requestRoomStats', () => {
            socket.emit('roomStatsUpdate', getRoomStats());
        });
        socket.on('joinRoom', (roomId: string) => {
            leaveCurrentRoom();
            socket.leave('lobby');
            if (!rooms[roomId]) {
                socket.emit('errorMessage', 'Invalid room ID');
                return;
            }
            const player = {
                id: socket.id,
                ...getRandomPosition(width, height, playerSize),
                color: getRandomBrightColor()
            };
            socket.emit('currentPlayers', Object.values(rooms[roomId]));
            socket.emit('yourPlayer', player);
            rooms[roomId][socket.id] = player;
            socket.join(roomId);
            socket.to(roomId).emit('newPlayer', player);
            ns.to('lobby').emit('roomStatsUpdate', getRoomStats());
        });
        socket.on('playerMovement', (data: MovementData) => {
            const roomId = Object.keys(rooms).find(id => rooms[id][socket.id]);
            if (!roomId) return;
            const player = rooms[roomId][socket.id];
            if (!player) return;
            player.x = data.x;
            player.y = data.y;
            socket.to(roomId).emit('playerMoved', player);
        });
        socket.on('leaveRoom', () => {
            leaveCurrentRoom();
        });
        socket.on('disconnect', () => {
            console.log(`[OnlineGamePrototype1] Client disconnected: ${socket.id}`);
            leaveCurrentRoom();
        });
    });
}
