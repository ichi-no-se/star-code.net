import * as Phaser from "phaser"
import { Socket, io } from "socket.io-client";
import { ROOM_CONFIG } from "@shared/GhostTag/core";

export default class LobbyScene extends Phaser.Scene {
    private socket: Socket | null = null;
    private roomButtons: Map<string, Phaser.GameObjects.Text> = new Map();

    constructor() {
        super({ key: 'LobbyScene' });
    }

    create() {
        this.socket = this.registry.get('socket') as Socket;
        if (!this.socket) {
            const url = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/ghost-tag';
            const socket = io(url, { transports: ['websocket'] });
            this.registry.set('socket', socket);
            this.socket = socket;
        }
        this.add.text(20, 20, 'Lobby - Click a room to join', { fontSize: '24px', color: '#fff' });
        ROOM_CONFIG.forEach(({ id, name }, index) => {
            const button = this.add.text(20, 80 + index * 40, `${name} (0)`, { fontSize: '20px', color: '#0f0' })
                .setInteractive()
                .on('pointerdown', () => {
                    this.scene.start('MainScene', { roomId: id });
                });
            this.roomButtons.set(id, button);
        });

        this.events.once('update', () => this.postCreate());
    }

    postCreate() {
        if (!this.socket) return;
        this.socket.on('roomStatsUpdate', (stats: { id: string; playerCount: number }[]) => {
            stats.forEach(room => {
                const button = this.roomButtons.get(room.id);
                if (button) {
                    const { name } = ROOM_CONFIG.find(config => config.id === room.id) || { name: "Unknown" };
                    button.setText(`${name} (${room.playerCount})`);
                }
            });
        });
        this.events.once('shutdown', () => {
            this.socket?.off('roomStatsUpdate');
        });
        this.socket.emit('connectLobby');
        this.socket.emit('requestRoomStats');
    }
}
