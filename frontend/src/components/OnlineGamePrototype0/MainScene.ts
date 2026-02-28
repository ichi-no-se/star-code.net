import Phaser from "phaser";
import { io, Socket } from "socket.io-client";

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

    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        this.cursors = this.input.keyboard?.createCursorKeys();
        this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        this.time.delayedCall(10, () => this.connectSocket());
    }

    update() {
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
        if (moved) {
            this.socket.emit('playerMovement', { x: this.myRect.x, y: this.myRect.y });
        }
    }

    connectSocket() {
        const url = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/online-game-prototype-0';
        this.socket = io(url);
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
                rect.setPosition(player.x, player.y);
            }
        });
        this.socket.on('playerDisconnected', (id: string) => {
            const rect = this.playerRects.get(id);
            if (rect) {
                rect.destroy();
                this.playerRects.delete(id);
            }
        });
    }

    addPlayer(player: Player) {
        const rect = this.add.rectangle(player.x, player.y, this.playerSize, this.playerSize, player.color);
        this.playerRects.set(player.id, rect);
    }
}
