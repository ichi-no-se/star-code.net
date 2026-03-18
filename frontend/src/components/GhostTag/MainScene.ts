import * as Phaser from "phaser"
import { Socket } from "socket.io-client";
import { ActorRole, ActorStatus, VisualActorState, Direction, MovementState, MAP, calcNextMovement, hasConnection, GameSnapshot, ACTOR_CONFIG, MAP_HEIGHT, MAP_WIDTH, RoomPhase, GameEvent, WIDTH, HEIGHT } from "@shared/GhostTag/core";


export default class MainScene extends Phaser.Scene {
    private static readonly TILE_SIZE = 40;
    private static readonly MAP_ORIGIN_X = (WIDTH - MAP_WIDTH * this.TILE_SIZE) / 2;
    private static readonly MAP_ORIGIN_Y = (HEIGHT - MAP_HEIGHT * this.TILE_SIZE) / 2;

    private static readonly EMIT_INTERVAL = 1000 / 20; // 20 FPS

    private socket!: Socket | null;

    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW?: Phaser.Input.Keyboard.Key;
    private keyA?: Phaser.Input.Keyboard.Key;
    private keyS?: Phaser.Input.Keyboard.Key;
    private keyD?: Phaser.Input.Keyboard.Key;
    private keyEsc?: Phaser.Input.Keyboard.Key;
    private roomId!: string;

    private timerText!: Phaser.GameObjects.Text;
    private actorSprites!: (Phaser.GameObjects.Sprite | null)[];
    private visualActorStates!: (VisualActorState | null)[]; // 描画用の位置
    private predictedActorMovements!: (MovementState | null)[]; // 手元での予測位置
    private lastPredictedActorMovementsUpdateTime!: number; // 予測位置を最後に更新した時間
    private actorJoinButtons!: (Phaser.GameObjects.Text | null)[];

    private localMovement!: MovementState | null; // 操作キャラの手元での位置

    private receivedGameSnapshots!: { snapshot: GameSnapshot, time: number }[]; // 受信したスナップショットと受信時間の履歴

    private timeSinceLastEmit!: number;
    private currentRole!: ActorRole | null;
    private isTransitioningToResultScene!: boolean; // 結果画面への遷移中かどうかを示すフラグ

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
        this.actorSprites = [null, null, null, null];
        this.visualActorStates = [null, null, null, null];
        this.predictedActorMovements = [null, null, null, null];
        this.lastPredictedActorMovementsUpdateTime = performance.now();
        this.actorJoinButtons = [null, null, null, null];
        this.localMovement = null;
        this.receivedGameSnapshots = [];
        this.timeSinceLastEmit = 0;
        this.currentRole = null;
        this.isTransitioningToResultScene = false;
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
        this.timerText = this.add.text(WIDTH / 2, 20, 'Loading...', { fontSize: '40px', color: '#fff' }).setOrigin(0.5, 0);
        const protoButtonStyle = { fontSize: '20px', color: '#0f0' };
        for (const { role, name, buttonInitialPos } of Object.values(ACTOR_CONFIG)) {
            const button = this.add.text(buttonInitialPos.x, buttonInitialPos.y, `Join as ${name}`, protoButtonStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => { this.joinGamePlayerRequest(role); });
            this.actorJoinButtons[role] = button;
        }

        for (const { role, spritePrefix } of Object.values(ACTOR_CONFIG)) {
            const sprite = this.add.sprite(0, 0, `${spritePrefix}_d_a`).setOrigin(0, 0);
            sprite.setVisible(false);
            this.actorSprites[role] = sprite;
        }

        this.events.once('update', () => this.postCreate());
    }

    private postCreate() {
        if (!this.socket) return;
        this.socket.emit('joinRoom', { roomId: this.roomId });
        this.socket.on('gameSnapshot', (snapshot: GameSnapshot) => {
            this.receivedGameSnapshots.push({ snapshot, time: performance.now() });
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
        if (this.isTransitioningToResultScene) return;
        const now = performance.now();
        const hasNewSnapshot = this.receivedGameSnapshots.length > 0;
        let newRole: ActorRole | null = null;
        let latestRoomTimer: number | null = null;
        let latestRoomPhase: RoomPhase | null = null;
        const events: GameEvent[] = [];
        for (const { snapshot, time: snapshotTime } of this.receivedGameSnapshots) {
            this.lastPredictedActorMovementsUpdateTime = snapshotTime;
            for (const { role } of Object.values(ACTOR_CONFIG)) {
                const receivedActorState = snapshot.actors[role]; // 受信した状態
                if (receivedActorState.status === ActorStatus.INACTIVE) {
                    this.predictedActorMovements[role] = null;
                }
                else {
                    this.predictedActorMovements[role] = receivedActorState.movement;
                }
                if (receivedActorState.sessionId === this.socket.id) {
                    newRole = role;
                }
            }
            latestRoomTimer = snapshot.roomTimer;
            latestRoomPhase = snapshot.roomPhase;
            events.push(...snapshot.events);
        }
        this.receivedGameSnapshots = [];

        if (hasNewSnapshot) {
            if (newRole !== null && newRole !== this.currentRole) {
                // 新たにプレイヤー役になった場合，受信したスナップショットの位置を手元の位置として採用する
                this.localMovement = structuredClone(this.predictedActorMovements[newRole]);
            }
            this.currentRole = newRole;

            // タイマーの更新
            if (latestRoomTimer !== null && latestRoomPhase !== null) {
                const seconds = Math.ceil(latestRoomTimer / 1000);
                switch (latestRoomPhase) {
                    case RoomPhase.WAITING:
                        this.timerText.setText(`Waiting...`);
                        break;
                    case RoomPhase.STARTING:
                        this.timerText.setText(`Starting... ${seconds}`);
                        break;
                    case RoomPhase.PLAYING:
                        this.timerText.setText(`Time: ${seconds}`);
                        break;
                }
            }

            // イベントの処理
            events.forEach(event => {
                switch (event.type) {
                    case 'GAME_OVER':
                        // 結果画面に遷移するなどの処理をここに書く
                        this.isTransitioningToResultScene = true;
                        this.input.enabled = false; // 入力を無効化して多重遷移を防止
                        this.cameras.main.fadeOut(200, 0, 0, 0);
                        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                            this.scene.start('ResultScene', { roomId: this.roomId, scores: event.scores });
                        });
                        break;
                    // 将来的にアイテム取得やプレイヤーが捕まったイベントなどもここで処理する
                }
            }
            );
        }
        // 予測位置の更新
        const sinceLastUpdate = now - this.lastPredictedActorMovementsUpdateTime;
        this.lastPredictedActorMovementsUpdateTime = now;
        for (const { role, speed } of Object.values(ACTOR_CONFIG)) {
            const predictedMovement = this.predictedActorMovements[role];
            if (predictedMovement) {
                Object.assign(predictedMovement, calcNextMovement(predictedMovement, speed * (sinceLastUpdate / 1000)));
            }
        }

        // プレイヤー役であれば入力を処理して位置を更新する
        if (this.localMovement && this.currentRole !== null && latestRoomPhase !== RoomPhase.WAITING) {
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

            const speed = ACTOR_CONFIG[this.currentRole].speed; // 仮実装 アイテムなどの追加により将来的に変動する可能性がある

            const distance = speed * delta / 1000;
            this.localMovement = calcNextMovement(this.localMovement, distance);
            this.timeSinceLastEmit += delta;
            while (this.timeSinceLastEmit >= MainScene.EMIT_INTERVAL) {
                this.socket.emit('reportMovement', { role: this.currentRole, movement: this.localMovement });
                this.timeSinceLastEmit -= MainScene.EMIT_INTERVAL;
            }
            // 予測位置を上書き
            this.predictedActorMovements[this.currentRole] = this.localMovement;
        }

        // ゲーム開始時
        if (latestRoomPhase === RoomPhase.STARTING) {
            // すべての役の予測位置を初期化する
            Object.values(ACTOR_CONFIG).forEach(({ role, initialPos }) => {
                this.predictedActorMovements[role] = { ...initialPos, currentDir: Direction.NONE, nextDir: Direction.NONE, offsetX: 0, offsetY: 0 };
            });
            if (this.localMovement !== null && this.currentRole !== null) {
                this.localMovement = { ...ACTOR_CONFIG[this.currentRole].initialPos, currentDir: Direction.NONE, nextDir: Direction.NONE, offsetX: 0, offsetY: 0 };
            }
        }

        // VisualActorState の更新
        for (const { role } of Object.values(ACTOR_CONFIG)) {
            const predictedMovement = this.predictedActorMovements[role];
            if (predictedMovement) {
                if (this.currentRole === role && this.localMovement) {
                    const { x, y } = this.calcPlayerPosition(this.localMovement);
                    this.visualActorStates[role] = { x, y, dir: this.localMovement.currentDir };
                }
                else {
                    const { x: targetX, y: targetY } = this.calcPlayerPosition(predictedMovement);
                    if (this.visualActorStates[role]) {
                        // 補間して滑らかに移動させる
                        const { x, y } = this.visualActorStates[role]!;
                        const k = 0.05;
                        const t = 1 - Math.exp(-k * delta);
                        let newX: number;
                        if (Math.abs(x - targetX) < 0.5) {
                            newX = targetX;
                        }
                        else {
                            newX = x + (targetX - x) * t;
                        }
                        let newY: number;
                        if (Math.abs(y - targetY) < 0.5) {
                            newY = targetY;
                        }
                        else {
                            newY = y + (targetY - y) * t;
                        }

                        this.visualActorStates[role] = { x: newX, y: newY, dir: predictedMovement.currentDir };
                    }
                    else {
                        this.visualActorStates[role] = { x: targetX, y: targetY, dir: predictedMovement.currentDir };
                    }
                }
            }
            else {
                this.visualActorStates[role] = null;
            }
        }

        // 描画の更新
        for (const { role, name, spritePrefix } of Object.values(ACTOR_CONFIG)) {
            const visualState = this.visualActorStates[role];
            const sprite = this.actorSprites[role];
            const joinButton = this.actorJoinButtons[role];
            if (!sprite || !joinButton) continue;
            if (visualState) {
                if (this.currentRole === role) {
                    joinButton.setText(`Leave ${name}`);
                    joinButton.off('pointerdown');
                    joinButton.on('pointerdown', () => { this.leaveGamePlayerRequest(); });
                }
                else {
                    joinButton.setText(`Taken: ${name}`);
                    joinButton.off('pointerdown');
                }

                sprite.setVisible(true);
                const { x, y } = visualState;
                sprite.setPosition(x, y);

                let textureKey = '';
                if (visualState.dir === Direction.UP) textureKey = `${spritePrefix}_u`;
                else if (visualState.dir === Direction.DOWN) textureKey = `${spritePrefix}_d`;
                else if (visualState.dir === Direction.LEFT) textureKey = `${spritePrefix}_l`;
                else if (visualState.dir === Direction.RIGHT) textureKey = `${spritePrefix}_r`;
                else textureKey = `${spritePrefix}_d`;

                const textureSuffix = Math.floor((time / 200) % 2) === 0 ? '_a' : '_b';
                sprite.setTexture(textureKey + textureSuffix);

            }
            else {
                joinButton.setText(`Join as ${name}`);
                joinButton.off('pointerdown');
                joinButton.on('pointerdown', () => { this.joinGamePlayerRequest(role); });

                sprite.setVisible(false);
            }
        }
    }
}
