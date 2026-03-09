import * as Phaser from "phaser"
import { Socket } from "socket.io-client";

enum Direction {
    NONE = 0,
    UP = 1,
    DOWN = 2,
    LEFT = 3,
    RIGHT = 4
}

enum ActorRole {
    HUMAN_1 = 0,
    HUMAN_2 = 1,
    GHOST_1 = 2,
    GHOST_2 = 3
}

interface PlayerState {
    gridX: number;
    gridY: number;
    offsetX: number; // [-0.5, 0.5]
    offsetY: number; // [-0.5, 0.5]
    currentDir: Direction;
    nextDir: Direction;
}

export default class MainScene extends Phaser.Scene {
    private readonly WIDTH = 1920;
    private readonly HEIGHT = 1080;

    private readonly MAP_WIDTH = 42;
    private readonly MAP_HEIGHT = 18;
    private readonly TILE_SIZE = 40;

    private readonly MAP = [
        [1, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 2, 5, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 2, 3, 2, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 2, 4, 4, 0, 2, 3, 2, 2, 4, 3, 2, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 2, 2, 4, 4, 3, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 2, 4, 3, 0, 2, 4, 4, 2, 2, 3, 2, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 2, 4, 3, 2, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 3, 4, 2, 2, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 4, 4, 2, 3, 2, 4, 2, 0, 2, 4, 2, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 3, 2, 4, 4, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 4, 3, 2, 0, 2, 3, 2, 2, 3, 2, 4, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 4, 4, 2, 2, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 0, 3, 2, 4, 2, 2, 4, 4, 0, 2, 4, 3, 0, 2, 4, 2, 3, 0, 4, 4, 2, 3, 2, 2, 4, 2, 3, 0, 2, 4, 2, 0, 3, 2, 4, 0, 4, 2, 3, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
    ];

    private readonly MAP_ORIGIN_X = (this.WIDTH - this.MAP_WIDTH * this.TILE_SIZE) / 2;
    private readonly MAP_ORIGIN_Y = (this.HEIGHT - this.MAP_HEIGHT * this.TILE_SIZE) / 2;

    private readonly HUMAN_SPEED = 4 * 60 / 40;

    private socket: Socket | null = null;

    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW?: Phaser.Input.Keyboard.Key;
    private keyA?: Phaser.Input.Keyboard.Key;
    private keyS?: Phaser.Input.Keyboard.Key;
    private keyD?: Phaser.Input.Keyboard.Key;
    private keyEsc?: Phaser.Input.Keyboard.Key;
    private roomId?: string;

    private playerState?: PlayerState;
    private playerSprite?: Phaser.GameObjects.Sprite;
    private buttonHuman1Join?: Phaser.GameObjects.Text;
    private buttonHuman2Join?: Phaser.GameObjects.Text;
    private buttonGhost1Join?: Phaser.GameObjects.Text;
    private buttonGhost2Join?: Phaser.GameObjects.Text;

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


        this.MAP.forEach((row, y) => {
            row.forEach((tile, x) => {
                const tileX = this.MAP_ORIGIN_X + x * this.TILE_SIZE;
                const tileY = this.MAP_ORIGIN_Y + y * this.TILE_SIZE;

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

        this.playerState = {
            gridX: 1,
            gridY: 1,
            offsetX: 0,
            offsetY: 0,
            currentDir: Direction.NONE,
            nextDir: Direction.NONE
        };

        const { x: playerX, y: playerY } = this.calcPlayerPosition(this.playerState);

        this.playerSprite = this.add.sprite(playerX, playerY, 'char_d_a').setOrigin(0, 0);

        this.events.once('update', () => this.postCreate());
    }

    private postCreate() {
        if (!this.socket) return;
        this.socket.emit('joinRoom', this.roomId);
    }

    private getRoadTextureKey(x: number, y: number): string {
        let connections = '';
        if (this.hasConnection(x, y, Direction.UP)) connections += 'u';
        if (this.hasConnection(x, y, Direction.DOWN)) connections += 'd';
        if (this.hasConnection(x, y, Direction.LEFT)) connections += 'l';
        if (this.hasConnection(x, y, Direction.RIGHT)) connections += 'r';
        return `road_${connections || 'default'}`;
    }

    private calcPlayerPosition(playerState: PlayerState) {
        const x = this.MAP_ORIGIN_X + (playerState.gridX + playerState.offsetX) * this.TILE_SIZE;
        const y = this.MAP_ORIGIN_Y + (playerState.gridY + playerState.offsetY) * this.TILE_SIZE;
        return { x, y };
    }

    private hasConnection(x: number, y: number, dir: Direction): boolean {
        if (dir === Direction.UP) return this.MAP[y - 1]?.[x] === 0;
        if (dir === Direction.DOWN) return this.MAP[y + 1]?.[x] === 0;
        if (dir === Direction.LEFT) return this.MAP[y]?.[x - 1] === 0;
        if (dir === Direction.RIGHT) return this.MAP[y]?.[x + 1] === 0;
        return false;
    }

    private joinGamePlayerRequest(role: ActorRole) {
        if (!this.socket) return;
        this.socket.emit('joinGame', { roleId: role });
    }

    private nextPlayerState(playerStatus: PlayerState, distance: number): PlayerState {
        let { gridX, gridY, offsetX, offsetY, currentDir, nextDir } = playerStatus;
        while (distance > 0) {
            if (currentDir === Direction.NONE) {
                if (nextDir !== Direction.NONE) {
                    currentDir = nextDir;
                    nextDir = Direction.NONE;
                }
                else {
                    distance = 0;
                }
            }
            else if (currentDir === Direction.UP) {
                offsetX = 0;
                if (nextDir === Direction.DOWN) {
                    currentDir = Direction.DOWN;
                    nextDir = Direction.NONE;
                }
                else if (offsetY < 0) {
                    if (this.hasConnection(gridX, gridY, Direction.UP)) {
                        if (offsetY - distance >= -0.5) {
                            offsetY -= distance;
                            distance = 0;
                        }
                        else {
                            distance -= (offsetY + 0.5);
                            offsetY = 0.5;
                            gridY -= 1;
                        }
                    }
                    else {
                        offsetY = 0;
                    }
                }
                else if (offsetY === 0) {
                    if (this.hasConnection(gridX, gridY, nextDir)) {
                        currentDir = nextDir;
                        nextDir = Direction.NONE;
                    }
                    else if (this.hasConnection(gridX, gridY, Direction.UP)) {
                        if (distance <= 0.5) {
                            offsetY -= distance;
                            distance = 0;
                        }
                        else {
                            distance -= 0.5;
                            offsetY = 0.5;
                            gridY -= 1;
                        }
                    }
                    else {
                        distance = 0;
                    }
                }
                else {
                    if (offsetY - distance >= 0) {
                        offsetY -= distance;
                        distance = 0;
                    }
                    else {
                        distance -= offsetY;
                        offsetY = 0;
                    }
                }
            }
            else if (currentDir === Direction.DOWN) {
                offsetX = 0;
                if (nextDir === Direction.UP) {
                    currentDir = Direction.UP;
                    nextDir = Direction.NONE;
                }
                else if (offsetY > 0) {
                    if (this.hasConnection(gridX, gridY, Direction.DOWN)) {
                        if (offsetY + distance <= 0.5) {
                            offsetY += distance;
                            distance = 0;
                        }
                        else {
                            distance -= 0.5 - offsetY;
                            offsetY = -0.5;
                            gridY += 1;
                        }
                    }
                    else {
                        offsetY = 0;
                    }
                }
                else if (offsetY === 0) {
                    if (this.hasConnection(gridX, gridY, nextDir)) {
                        currentDir = nextDir;
                        nextDir = Direction.NONE;
                    }
                    else if (this.hasConnection(gridX, gridY, Direction.DOWN)) {
                        if (distance <= 0.5) {
                            offsetY += distance;
                            distance = 0;
                        }
                        else {
                            distance -= 0.5;
                            offsetY = -0.5;
                            gridY += 1;
                        }
                    }
                    else {
                        distance = 0;
                    }
                }
                else {
                    if (offsetY + distance <= 0) {
                        offsetY += distance;
                        distance = 0;
                    }
                    else {
                        distance -= -offsetY;
                        offsetY = 0;
                    }
                }
            }
            else if (currentDir === Direction.LEFT) {
                offsetY = 0;
                if (nextDir === Direction.RIGHT) {
                    currentDir = Direction.RIGHT;
                    nextDir = Direction.NONE;
                }
                else if (offsetX < 0) {
                    if (this.hasConnection(gridX, gridY, Direction.LEFT)) {
                        if (offsetX - distance >= -0.5) {
                            offsetX -= distance;
                            distance = 0;
                        }
                        else {
                            distance -= (offsetX + 0.5);
                            offsetX = 0.5;
                            gridX -= 1;
                        }
                    }
                    else {
                        offsetX = 0;
                    }
                }
                else if (offsetX === 0) {
                    if (this.hasConnection(gridX, gridY, nextDir)) {
                        currentDir = nextDir;
                        nextDir = Direction.NONE;
                    }
                    else if (this.hasConnection(gridX, gridY, Direction.LEFT)) {
                        if (distance <= 0.5) {
                            offsetX -= distance;
                            distance = 0;
                        }
                        else {
                            distance -= 0.5;
                            offsetX = 0.5;
                            gridX -= 1;
                        }
                    }
                    else {
                        distance = 0;
                    }
                }
                else {
                    if (offsetX - distance >= 0) {
                        offsetX -= distance;
                        distance = 0;
                    }
                    else {
                        distance -= offsetX;
                        offsetX = 0;
                    }
                }
            }
            else if (currentDir === Direction.RIGHT) {
                offsetY = 0;
                if (nextDir === Direction.LEFT) {
                    currentDir = Direction.LEFT;
                    nextDir = Direction.NONE;
                }
                else if (offsetX > 0) {
                    if (this.hasConnection(gridX, gridY, Direction.RIGHT)) {
                        if (offsetX + distance <= 0.5) {
                            offsetX += distance;
                            distance = 0;
                        }
                        else {
                            distance -= 0.5 - offsetX;
                            offsetX = -0.5;
                            gridX += 1;
                        }
                    }
                    else {
                        offsetX = 0;
                    }
                }
                else if (offsetX === 0) {
                    if (this.hasConnection(gridX, gridY, nextDir)) {
                        currentDir = nextDir;
                        nextDir = Direction.NONE;
                    }
                    else if (this.hasConnection(gridX, gridY, Direction.RIGHT)) {
                        if (distance <= 0.5) {
                            offsetX += distance;
                            distance = 0;
                        }
                        else {
                            distance -= 0.5;
                            offsetX = -0.5;
                            gridX += 1;
                        }
                    }
                    else {
                        distance = 0;
                    }
                }
                else {
                    if (offsetX + distance <= 0) {
                        offsetX += distance;
                        distance = 0;
                    }
                    else {
                        distance -= -offsetX;
                        offsetX = 0;
                    }
                }
            }
        }
        return { gridX, gridY, offsetX, offsetY, currentDir, nextDir };
    }

    update(_time: number, delta: number) {
        if (!this.playerState || !this.playerSprite) return;

        if (this.cursors?.up.isDown || this.keyW?.isDown) {
            this.playerState.nextDir = Direction.UP;
        }
        else if (this.cursors?.down.isDown || this.keyS?.isDown) {
            this.playerState.nextDir = Direction.DOWN;
        }
        else if (this.cursors?.left.isDown || this.keyA?.isDown) {
            this.playerState.nextDir = Direction.LEFT;
        }
        else if (this.cursors?.right.isDown || this.keyD?.isDown) {
            this.playerState.nextDir = Direction.RIGHT;
        }

        const distance = this.HUMAN_SPEED * delta / 1000;
        this.playerState = this.nextPlayerState(this.playerState, distance);
        const { x: playerX, y: playerY } = this.calcPlayerPosition(this.playerState);

        let textureKey = '';
        if (this.playerState.currentDir === Direction.UP) textureKey = 'char_u';
        else if (this.playerState.currentDir === Direction.DOWN) textureKey = 'char_d';
        else if (this.playerState.currentDir === Direction.LEFT) textureKey = 'char_l';
        else if (this.playerState.currentDir === Direction.RIGHT) textureKey = 'char_r';
        else textureKey = 'char_d';

        const textureSuffix = Math.floor((_time / 200) % 2) === 0 ? '_a' : '_b';
        this.playerSprite.setTexture(textureKey + textureSuffix);
        this.playerSprite.setPosition(playerX, playerY);
    }
}
