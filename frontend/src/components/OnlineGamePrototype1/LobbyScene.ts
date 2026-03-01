import * as Phaser from "phaser"
import { Socket, io } from "socket.io-client";

export default class LobbyScene extends Phaser.Scene {
    private socket: Socket | null = null;
    private roomButtons: Map<string, Phaser.GameObjects.Text> = new Map();

    private readonly roomNames: string[] = ['Room 1', 'Room 2', 'Room 3'];
    private readonly roomIds: string[] = ['room1', 'room2', 'room3'];

    constructor() {
        super({ key: 'LobbyScene' });
    }

    create() {
        this.socket = this.registry.get('socket') as Socket;
        if (!this.socket) {
            const url = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/online-game-prototype-1';
            const socket = io(url, { transports: ['websocket'] });
            this.registry.set('socket', socket);
            this.socket = socket;
        }
        this.add.text(20, 20, 'Lobby - Click a room to join', { fontSize: '24px', color: '#fff' });
        this.roomIds.forEach((roomId, index) => {
            const button = this.add.text(20, 80 + index * 40, `${this.roomNames[index]} (0)`, { fontSize: '20px', color: '#0f0' })
                .setInteractive()
                .on('pointerdown', () => {
                    this.scene.start('MainScene', { roomId });
                });
            this.roomButtons.set(roomId, button);
        });

        this.events.once('update', () => this.postCreate());
    }

    postCreate() {
        if (!this.socket) return;
        this.socket.on('roomStatsUpdate', (stats: { id: string; playerCount: number }[]) => {
            stats.forEach(room => {
                const button = this.roomButtons.get(room.id);
                if (button) {
                    const roomIndex = this.roomIds.indexOf(room.id);
                    button.setText(`${this.roomNames[roomIndex]} (${room.playerCount})`);
                }
            });
        });
        this.events.once('shutdown', () => {
            this.socket?.off('roomStatsUpdate');
        });
        this.socket?.emit('requestRoomStats');
    }
}
