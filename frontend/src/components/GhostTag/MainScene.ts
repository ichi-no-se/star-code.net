import * as Phaser from "phaser"
import { Socket } from "socket.io-client";
import { ActorRole, ActorStatus, Direction, MovementState, MAP, calcNextMovement, hasConnection, GameSnapshot, ACTOR_CONFIG } from "@shared/GhostTag/core";


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

    private actorSprites: Phaser.GameObjects.Sprite[] = [];
    private actorMovements: MovementState[] = []; // 手元での位置
    private actorJoinButtons: Phaser.GameObjects.Text[] = [];

    private localMovement?: MovementState; // 操作キャラの手元での位置
    private gameSnapshot?: GameSnapshot;
    private lastSnapshotTime?: number;

    private currentRole: ActorRole | null = null;
    private currentSpeed: number = 0;

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
            for (const { spritePrefix } of Object.values(ACTOR_CONFIG)) {
                this.load.image(`${spritePrefix}_${dir}_a`, `/ghost-tag/sprites/${spritePrefix}_${dir}_a.png`);
                this.load.image(`${spritePrefix}_${dir}_b`, `/ghost-tag/sprites/${spritePrefix}_${dir}_b.png`);
            }
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

        // 仮の UI 後でちゃんとしたのに差し替える
        const protoButtonStyle = { fontSize: '20px', color: '#0f0', backgroundColor: '#000' };
        for (const { role, name, buttonInitialPos } of Object.values(ACTOR_CONFIG)) {
            const button = this.add.text(buttonInitialPos.x, buttonInitialPos.y, `Join as ${name}`, protoButtonStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => { this.joinGamePlayerRequest(role); });
            this.actorJoinButtons[role] = button;
        }

        for (const { role, initialPos } of Object.values(ACTOR_CONFIG)) {
            this.actorMovements[role] = {
                gridX: initialPos.gridX,
                gridY: initialPos.gridY,
                offsetX: 0,
                offsetY: 0,
                currentDir: Direction.NONE,
                nextDir: Direction.NONE
            };
        }

        for (const { role, spritePrefix } of Object.values(ACTOR_CONFIG)) {
            const movementState = this.actorMovements[role];
            const { x, y } = this.calcPlayerPosition(movementState);
            const sprite = this.add.sprite(x, y, `${spritePrefix}_d_a`).setOrigin(0, 0);
            this.actorSprites[role] = sprite;
        }

        this.events.once('update', () => this.postCreate());
    }

    private postCreate() {
        if (!this.socket) return;
        this.socket.emit('joinRoom', { roomId: this.roomId });
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
        this.socket.emit('joinGamePlayer', { role: role });
    }

    private leaveGamePlayerRequest() {
        if (!this.socket) return;
        this.socket.emit('leaveGamePlayer');
    }

    update(time: number, delta: number) {
        if (!this.socket) return;

        if (this.localMovement && this.currentRole !== null) {
            if (this.cursors?.up.isDown || this.keyW?.isDown) {
                this.localMovement.nextDir = Direction.UP;
            }
            else if (this.cursors?.down.isDown || this.keyS?.isDown) {
                this.localMovement.nextDir = Direction.DOWN;
            }
            else if (this.cursors?.left.isDown || this.keyA?.isDown) {
                this.localMovement.nextDir = Direction.LEFT;
            }
            else if (this.cursors?.right.isDown || this.keyD?.isDown) {
                this.localMovement.nextDir = Direction.RIGHT;
            }
            const distance = this.currentSpeed * delta / 1000;
            this.localMovement = calcNextMovement(this.localMovement, distance);
            this.socket.emit('reportMovement', { role: this.currentRole, movement: this.localMovement });
        }

        // 仮
        if (this.gameSnapshot) {
            const prevRole = this.currentRole;
            this.currentRole = null;
            for (const { role, name, speed, spritePrefix } of Object.values(ACTOR_CONFIG)) {
                const actorState = this.gameSnapshot.actors[role]; // 受信した状態
                const sprite = this.actorSprites[role];
                const joinButton = this.actorJoinButtons[role];
                const movementState = this.actorMovements[role];
                console.log(`[GhostTag] Actor ${name} state: ${JSON.stringify(actorState)}`);
                if (actorState.status === ActorStatus.INACTIVE) {
                    sprite.setVisible(false);
                    joinButton.setText(`Join as ${name}`);
                    joinButton.off('pointerdown');
                    joinButton.on('pointerdown', () => { this.joinGamePlayerRequest(role); });
                }
                else {
                    sprite.setVisible(true);
                    if (actorState.sessionId === this.socket.id) {
                        this.currentRole = role;
                        this.currentSpeed = speed;
                        if (prevRole === role && this.localMovement) {
                            Object.assign(movementState, this.localMovement);
                        }
                        else {
                            this.localMovement = structuredClone(actorState.movement);
                            joinButton.setText(`Leave ${name}`);
                            joinButton.off('pointerdown');
                            joinButton.on('pointerdown', () => { this.leaveGamePlayerRequest(); });
                        }
                    }
                    else {
                        Object.assign(movementState, actorState.movement);
                        // TODO: 補間処理を入れる
                        joinButton.setText(`Taken: ${name}`);
                        joinButton.off('pointerdown');
                    }
                    let textureKey = '';
                    if (movementState.currentDir === Direction.UP) textureKey = `${spritePrefix}_u`;
                    else if (movementState.currentDir === Direction.DOWN) textureKey = `${spritePrefix}_d`;
                    else if (movementState.currentDir === Direction.LEFT) textureKey = `${spritePrefix}_l`;
                    else if (movementState.currentDir === Direction.RIGHT) textureKey = `${spritePrefix}_r`;
                    else textureKey = `${spritePrefix}_d`;

                    const textureSuffix = Math.floor((time / 200) % 2) === 0 ? '_a' : '_b';
                    sprite.setTexture(textureKey + textureSuffix);
                    const { x, y } = this.calcPlayerPosition(movementState);
                    sprite.setPosition(x, y);
                }
            }

            if (this.currentRole === null) {
                this.localMovement = undefined;
                this.currentSpeed = 0;
            }
        }
    }
}
