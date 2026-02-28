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

const players: Record<string, Player> = {};
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

export const onlineGamePrototype0Handler = (ns: Namespace) => {
    ns.on('connection', (socket: Socket) => {
        console.log(`[OnlineGamePrototype0] Client connected: ${socket.id}`);
        const player = {
            id: socket.id,
            ...getRandomPosition(width, height, playerSize),
            color: getRandomBrightColor()
        };
        socket.emit('currentPlayers', Object.values(players));
        socket.emit('yourPlayer', player);
        socket.broadcast.emit('newPlayer', player);
        players[socket.id] = player;
        socket.on('playerMovement', (movementData: MovementData) => {
            if (players[socket.id]) {
                const player = players[socket.id];
                player.x = movementData.x;
                player.y = movementData.y;
                socket.broadcast.emit('playerMoved', player);
            }
        });
        socket.on('disconnect', () => {
            console.log(`[OnlineGamePrototype0] Client disconnected: ${socket.id}`);
            delete players[socket.id];
            ns.emit('playerDisconnected', socket.id);
        });
    });
}
