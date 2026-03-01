import * as Phaser from "phaser"
import { Socket } from "socket.io-client";

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

export default class MainScene extends Phaser.Scene {
    private readonly playerSize = 10;
    private readonly width = 800;
    private readonly height = 600;
    private readonly speed = 5;

    private socket: Socket | null = null;
    private playerRects: Map<string, Phaser.GameObjects.Rectangle> = new Map();
    private myRect: Phaser.GameObjects.Rectangle | null = null;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW?: Phaser.Input.Keyboard.Key;
    private keyA?: Phaser.Input.Keyboard.Key;
    private keyS?: Phaser.Input.Keyboard.Key;
    private keyD?: Phaser.Input.Keyboard.Key;
    private keyEsc?: Phaser.Input.Keyboard.Key;
    private roomId?: string;
    private rectPositions: Map<string, {x: number, y: number}> = new Map();

    constructor() {
        super({ key: 'MainScene' });
    }

    init(data: {roomId: string}) {
        this.roomId = data.roomId;
    }
    create() {
        this.cursors = this.input.keyboard?.createCursorKeys();
        this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyEsc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.keyEsc?.on('down', () => {
            this.socket?.emit('leaveRoom');
            this.scene.start('LobbyScene');
        });

        this.socket = this.registry.get('socket') as Socket;
        if (!this.socket) {
            console.error('Socket not found in registry');
            return;
        }

        this.events.once('update', () => this.postCreate());
    }

    postCreate() {
        if (!this.socket) return;
        this.socket.on('currentPlayers', (players: Player[]) => {
            players.forEach(p => this.addPlayer(p));
        });
        this.socket.on('yourPlayer', (player: Player) => {
            this.myRect = this.add.rectangle(player.x, player.y, this.playerSize, this.playerSize, player.color);
        });
        this.socket.on('newPlayer', (player: Player) => {
            this.addPlayer(player);
        });
        this.socket.on('playerMoved', (player: Player) => {
            const rect = this.playerRects.get(player.id);
            if (rect) {
                this.rectPositions.set(player.id, {x: player.x, y: player.y});
            }
        });
        this.socket.on('playerDisconnected', (id: string) => {
            const rect = this.playerRects.get(id);
            if (rect) {
                rect.destroy();
                this.playerRects.delete(id);
                this.rectPositions.delete(id);
            }
        });
        this.events.once('shutdown', () => {
            this.socket?.off('currentPlayers');
            this.socket?.off('yourPlayer');
            this.socket?.off('newPlayer');
            this.socket?.off('playerMoved');
            this.socket?.off('playerDisconnected');
        });
        this.socket.emit('joinRoom', this.roomId);
    }

    update(_time: number, delta: number) {
        if (!this.myRect || !this.cursors || !this.socket) return;
        let moved = false;
        if (this.cursors.left?.isDown || this.keyA?.isDown) {
            this.myRect.x -= this.speed;
            moved = true;
        }
        if (this.cursors.right?.isDown || this.keyD?.isDown) {
            this.myRect.x += this.speed;
            moved = true;
        }
        if (this.cursors.up?.isDown || this.keyW?.isDown) {
            this.myRect.y -= this.speed;
            moved = true;
        }
        if (this.cursors.down?.isDown || this.keyS?.isDown) {
            this.myRect.y += this.speed;
            moved = true;
        }
        this.myRect.x = Phaser.Math.Clamp(this.myRect.x, this.playerSize / 2, this.width - this.playerSize / 2);
        this.myRect.y = Phaser.Math.Clamp(this.myRect.y, this.playerSize / 2, this.height - this.playerSize / 2);
        if (moved) {
            this.socket.emit('playerMovement', { x: this.myRect.x, y: this.myRect.y } as MovementData);
        }
        // 他プレイヤーの位置をスムーズに補間
        this.rectPositions.forEach((pos, id) => {
            const rect = this.playerRects.get(id);
            if (rect) {
                rect.x = Phaser.Math.Linear(rect.x, pos.x, 1 - Math.exp(-delta / 10));
                rect.y = Phaser.Math.Linear(rect.y, pos.y, 1 - Math.exp(-delta / 10));
            }
        });
    }

    addPlayer(player: Player) {
        const rect = this.add.rectangle(player.x, player.y, this.playerSize, this.playerSize, player.color);
        this.playerRects.set(player.id, rect);
        this.rectPositions.set(player.id, {x: player.x, y: player.y});
    }
}
