import * as Phaser from "phaser"
import { Socket } from "socket.io-client";
import { ActorRole, ActorStatus, Direction, MovementState, MAP, HUMAN_SPEED, calcNextMovement, hasConnection, GameSnapshot } from "@shared/GhostTag/core";


export default class MainScene extends Phaser.Scene {
    private static readonly WIDTH = 1920;
    private static readonly HEIGHT = 1080;

    private static readonly MAP_WIDTH = 42;
    private static readonly MAP_HEIGHT = 18;
    private static readonly TILE_SIZE = 40;

    private static readonly MAP_ORIGIN_X = (this.WIDTH - this.MAP_WIDTH * this.TILE_SIZE) / 2;
    private static readonly MAP_ORIGIN_Y = (this.HEIGHT - this.MAP_HEIGHT * this.TILE_SIZE) / 2;

    private socket: Socket | null = null;

    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW?: Phaser.Input.Keyboard.Key;
    private keyA?: Phaser.Input.Keyboard.Key;
    private keyS?: Phaser.Input.Keyboard.Key;
    private keyD?: Phaser.Input.Keyboard.Key;
    private keyEsc?: Phaser.Input.Keyboard.Key;
    private roomId?: string;

    private movementState?: MovementState;
    private playerSprite?: Phaser.GameObjects.Sprite;
    private buttonHuman1Join?: Phaser.GameObjects.Text;
    private buttonHuman2Join?: Phaser.GameObjects.Text;
    private buttonGhost1Join?: Phaser.GameObjects.Text;
    private buttonGhost2Join?: Phaser.GameObjects.Text;

    private gameSnapshot?: GameSnapshot;
    private lastSnapshotTime?: number;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        for (let i = 1; i <= 5; i++) {
            this.load.image(`wall${i}`, `/ghost-tag/tiles/wall_${i}.png`);
        }
        const roadTypes = ['ud', 'udl', 'udlr', 'udr', 'ul', 'ulr', 'ur', 'dl', 'dlr', 'dr', 'lr', 'default'];
        for (const roadType of roadTypes) {
            this.load.image(`road_${roadType}`, `/ghost-tag/tiles/road_${roadType}.png`);
        }
        const dirs = ['u', 'd', 'l', 'r'];
        for (const dir of dirs) {
            this.load.image(`char_${dir}_a`, `/ghost-tag/sprites/char_${dir}_a.png`);
            this.load.image(`char_${dir}_b`, `/ghost-tag/sprites/char_${dir}_b.png`);
        }
    }

    init(data: { roomId: string }) {
        this.roomId = data.roomId;
    }
    create() {
        this.cursors = this.input.keyboard?.createCursorKeys();
        this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyEsc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.socket = this.registry.get('socket') as Socket;
        if (!this.socket) {
            console.error('Socket not found in registry');
            return;
        }

        this.keyEsc?.on('down', () => {
            this.socket?.emit('leaveRoom');
            this.scene.start('LobbyScene');
        });


        MAP.forEach((row, y) => {
            row.forEach((tile, x) => {
                const tileX = MainScene.MAP_ORIGIN_X + x * MainScene.TILE_SIZE;
                const tileY = MainScene.MAP_ORIGIN_Y + y * MainScene.TILE_SIZE;

                let textureKey = '';
                if (tile === 0) {
                    textureKey = this.getRoadTextureKey(x, y);
                }
                else {
                    textureKey = `wall${tile}`;
                }
                if (textureKey) {
                    this.add.image(tileX, tileY, textureKey).setOrigin(0, 0);
                }
            });
        });

        const protoButtonStyle = { fontSize: '20px', color: '#0f0', backgroundColor: '#000' };
        this.buttonHuman1Join = this.add.text(20, 20, 'Join as Human 1', protoButtonStyle).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.joinGamePlayerRequest(ActorRole.HUMAN_1) });
        this.buttonHuman2Join = this.add.text(20, 60, 'Join as Human 2', protoButtonStyle).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.joinGamePlayerRequest(ActorRole.HUMAN_2) });
        this.buttonGhost1Join = this.add.text(20, 100, 'Join as Ghost 1', protoButtonStyle).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.joinGamePlayerRequest(ActorRole.GHOST_1) });
        this.buttonGhost2Join = this.add.text(20, 140, 'Join as Ghost 2', protoButtonStyle).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.joinGamePlayerRequest(ActorRole.GHOST_2) });

        this.movementState = {
            gridX: 1,
            gridY: 1,
            offsetX: 0,
            offsetY: 0,
            currentDir: Direction.NONE,
            nextDir: Direction.NONE
        };

        const { x: playerX, y: playerY } = this.calcPlayerPosition(this.movementState);

        this.playerSprite = this.add.sprite(playerX, playerY, 'char_d_a').setOrigin(0, 0);
        this.events.once('update', () => this.postCreate());
    }

    private postCreate() {
        if (!this.socket) return;
        this.socket.emit('joinRoom', this.roomId);
        this.socket.on('gameSnapshot', (snapshot: GameSnapshot) => {
            this.gameSnapshot = snapshot;
            this.lastSnapshotTime = Date.now();
        });
    }

    private getRoadTextureKey(x: number, y: number): string {
        let connections = '';
        if (hasConnection(x, y, Direction.UP)) connections += 'u';
        if (hasConnection(x, y, Direction.DOWN)) connections += 'd';
        if (hasConnection(x, y, Direction.LEFT)) connections += 'l';
        if (hasConnection(x, y, Direction.RIGHT)) connections += 'r';
        return `road_${connections || 'default'}`;
    }

    private calcPlayerPosition(movementState: MovementState): { x: number, y: number } {
        const x = MainScene.MAP_ORIGIN_X + (movementState.gridX + movementState.offsetX) * MainScene.TILE_SIZE;
        const y = MainScene.MAP_ORIGIN_Y + (movementState.gridY + movementState.offsetY) * MainScene.TILE_SIZE;
        return { x, y };
    }

    private joinGamePlayerRequest(role: ActorRole) {
        if (!this.socket) return;
        this.socket.emit('joinGamePlayer', { roleId: role });
    }

    private leaveGamePlayerRequest() {
        if (!this.socket) return;
        this.socket.emit('leaveGamePlayer');
    }

    update(time: number, delta: number) {
        if (!this.movementState || !this.playerSprite) return;

        if (this.cursors?.up.isDown || this.keyW?.isDown) {
            this.movementState.nextDir = Direction.UP;
        }
        else if (this.cursors?.down.isDown || this.keyS?.isDown) {
            this.movementState.nextDir = Direction.DOWN;
        }
        else if (this.cursors?.left.isDown || this.keyA?.isDown) {
            this.movementState.nextDir = Direction.LEFT;
        }
        else if (this.cursors?.right.isDown || this.keyD?.isDown) {
            this.movementState.nextDir = Direction.RIGHT;
        }

        // 仮
        if (this.gameSnapshot) {
            if (this.gameSnapshot.actors[ActorRole.HUMAN_1].sessionId === this.socket?.id) {
                this.buttonHuman1Join?.setText('Leave Human 1')
                this.buttonHuman1Join?.off('pointerdown');
                this.buttonHuman1Join?.on('pointerdown', () => { this.leaveGamePlayerRequest(); });
            }
            else if (this.gameSnapshot.actors[ActorRole.HUMAN_1].status !== ActorStatus.INACTIVE) {
                this.buttonHuman1Join?.setText('Human 1: Taken')
                this.buttonHuman1Join?.off('pointerdown');
            }
            else {
                this.buttonHuman1Join?.setText('Join as Human 1')
                this.buttonHuman1Join?.off('pointerdown');
                this.buttonHuman1Join?.on('pointerdown', () => { this.joinGamePlayerRequest(ActorRole.HUMAN_1); });
            }

            if (this.gameSnapshot.actors[ActorRole.HUMAN_2].sessionId === this.socket?.id) {
                this.buttonHuman2Join?.setText('Leave Human 2')
                this.buttonHuman2Join?.off('pointerdown');
                this.buttonHuman2Join?.on('pointerdown', () => { this.leaveGamePlayerRequest(); });
            }
            else if (this.gameSnapshot.actors[ActorRole.HUMAN_2].status !== ActorStatus.INACTIVE) {
                this.buttonHuman2Join?.setText('Human 2: Taken')
                this.buttonHuman2Join?.off('pointerdown');
            }
            else {
                this.buttonHuman2Join?.setText('Join as Human 2')
                this.buttonHuman2Join?.off('pointerdown');
                this.buttonHuman2Join?.on('pointerdown', () => { this.joinGamePlayerRequest(ActorRole.HUMAN_2); });
            }

            if (this.gameSnapshot.actors[ActorRole.GHOST_1].sessionId === this.socket?.id) {
                this.buttonGhost1Join?.setText('Leave Ghost 1')
                this.buttonGhost1Join?.off('pointerdown');
                this.buttonGhost1Join?.on('pointerdown', () => { this.leaveGamePlayerRequest(); });
            }
            else if (this.gameSnapshot.actors[ActorRole.GHOST_1].status !== ActorStatus.INACTIVE) {
                this.buttonGhost1Join?.setText('Ghost 1: Taken')
                this.buttonGhost1Join?.off('pointerdown');
            }
            else {
                this.buttonGhost1Join?.setText('Join as Ghost 1')
                this.buttonGhost1Join?.off('pointerdown');
                this.buttonGhost1Join?.on('pointerdown', () => { this.joinGamePlayerRequest(ActorRole.GHOST_1); });
            }

            if (this.gameSnapshot.actors[ActorRole.GHOST_2].sessionId === this.socket?.id) {
                this.buttonGhost2Join?.setText('Leave Ghost 2')
                this.buttonGhost2Join?.off('pointerdown');
                this.buttonGhost2Join?.on('pointerdown', () => { this.leaveGamePlayerRequest(); });
            }
            else if (this.gameSnapshot.actors[ActorRole.GHOST_2].status !== ActorStatus.INACTIVE) {
                this.buttonGhost2Join?.setText('Ghost 2: Taken')
                this.buttonGhost2Join?.off('pointerdown');
            }
            else {
                this.buttonGhost2Join?.setText('Join as Ghost 2')
                this.buttonGhost2Join?.off('pointerdown');
                this.buttonGhost2Join?.on('pointerdown', () => { this.joinGamePlayerRequest(ActorRole.GHOST_2); });
            }
        }

        const distance = HUMAN_SPEED * delta / 1000;
        this.movementState = calcNextMovement(this.movementState, distance);
        const { x: playerX, y: playerY } = this.calcPlayerPosition(this.movementState);

        let textureKey = '';
        if (this.movementState.currentDir === Direction.UP) textureKey = 'char_u';
        else if (this.movementState.currentDir === Direction.DOWN) textureKey = 'char_d';
        else if (this.movementState.currentDir === Direction.LEFT) textureKey = 'char_l';
        else if (this.movementState.currentDir === Direction.RIGHT) textureKey = 'char_r';
        else textureKey = 'char_d';

        const textureSuffix = Math.floor((time / 200) % 2) === 0 ? '_a' : '_b';
        this.playerSprite.setTexture(textureKey + textureSuffix);
        this.playerSprite.setPosition(playerX, playerY);
    }
}
