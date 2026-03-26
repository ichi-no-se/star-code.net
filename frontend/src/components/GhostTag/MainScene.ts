import * as Phaser from "phaser"
import { Socket } from "socket.io-client";
import * as Core from "@shared/GhostTag/core";

enum RenderDepth {
    FLOOR = 0,
    ITEM = 5,
    LIGHT = 10,
    ACTOR_GHOST = 15,
    ACTOR_HUMAN = 20,
    EFFECT = 25,
    MARKER = 30,
    UI = 50,
}

export default class MainScene extends Phaser.Scene {
    private static readonly EMIT_INTERVAL = 1000 / 20; // 20 FPS

    private socket!: Socket | null;

    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyW?: Phaser.Input.Keyboard.Key;
    private keyA?: Phaser.Input.Keyboard.Key;
    private keyS?: Phaser.Input.Keyboard.Key;
    private keyD?: Phaser.Input.Keyboard.Key;
    private keySpace?: Phaser.Input.Keyboard.Key;
    private keyEnter?: Phaser.Input.Keyboard.Key;
    private keyEsc?: Phaser.Input.Keyboard.Key;
    private roomId!: string;

    private timerText!: Phaser.GameObjects.Text;
    private itemSpritesMap!: Map<string, Phaser.GameObjects.Sprite>;
    private actorSprites!: (Phaser.GameObjects.Sprite | null)[];
    private markerYouSprite!: Phaser.GameObjects.Sprite;
    private markerOffsetY!: number; // マーカーの浮き上がりのアニメーション用
    private visualActorStates!: (Core.VisualActorState | null)[]; // 描画用の位置
    private predictedActorMovements!: (Core.MovementState | null)[]; // 手元での予測位置
    private lastPredictedActorMovementsUpdateTime!: number; // 予測位置を最後に更新した時間
    private actorJoinButtons!: Phaser.GameObjects.Text[];
    private actorChangeToCPUButtons!: Phaser.GameObjects.Text[];
    private actorItemStateTexts!: Phaser.GameObjects.Text[]; // アイテム所持状態表示用テキスト

    private localMovement!: Core.MovementState | null; // 操作キャラの手元での位置

    private receivedGameSnapshots!: { snapshot: Core.GameSnapshot, time: number }[]; // 受信したスナップショットと受信時刻の履歴

    private timeSinceLastEmit!: number;
    private currentRole!: Core.ActorRole | null;
    private currentRoomPhase!: Core.RoomPhase;
    private currentActorControllers!: Core.ControllerType[];
    private currentActorStatuses!: Core.ActorStatus[];
    private currentActorInventories!: (Core.UsableItemType | null)[];
    private currentActorStatusTimers!: number[];
    private isTransitioningToResultScene!: boolean; // 結果画面への遷移中かどうかを示すフラグ


    private lightGraphicsList!: (Phaser.GameObjects.Graphics | null)[]; // ライトの当たる範囲を描画する Graphics オブジェクト
    private visionMask!: Phaser.GameObjects.Graphics; // Ghost が Human から見える領域

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        for (let i = 1; i <= 14; i++) {
            this.load.image(`wall${i}`, `/ghost-tag/tiles/wall_${i}.png`);
        }
        const roadTypes = ['ud', 'udl', 'udlr', 'udr', 'ul', 'ulr', 'ur', 'dl', 'dlr', 'dr', 'lr', 'default'];
        for (const roadType of roadTypes) {
            this.load.image(`road_${roadType}`, `/ghost-tag/tiles/road_${roadType}.png`);
        }
        const dirs = ['u', 'd', 'l', 'r'];
        for (const dir of dirs) {
            for (const { spritePrefix } of Object.values(Core.ACTOR_CONFIG)) {
                this.load.image(`${spritePrefix}_${dir}_a`, `/ghost-tag/sprites/${spritePrefix}_${dir}_a.png`);
                this.load.image(`${spritePrefix}_${dir}_b`, `/ghost-tag/sprites/${spritePrefix}_${dir}_b.png`);
            }
        }

        Core.ITEM_CONFIG.forEach(({ spriteName }) => {
            this.load.image(spriteName, `/ghost-tag/sprites/${spriteName}.png`);
        });

        this.load.image('marker_you', '/ghost-tag/sprites/marker_you.png');
        this.load.spritesheet('ghost_item_pick_up_effect', '/ghost-tag/effects/ghost_item_pick_up_effect.png', { frameWidth: 160, frameHeight: 160 });
        this.load.spritesheet('human_item_pick_up_effect', '/ghost-tag/effects/human_item_pick_up_effect.png', { frameWidth: 80, frameHeight: 80 });
    }

    init(data: { roomId: string }) {
        this.roomId = data.roomId;
        this.itemSpritesMap = new Map();
        this.actorSprites = [null, null, null, null];
        this.visualActorStates = [null, null, null, null];
        this.predictedActorMovements = [null, null, null, null];
        this.lastPredictedActorMovementsUpdateTime = performance.now();
        this.localMovement = null;
        this.receivedGameSnapshots = [];
        this.timeSinceLastEmit = 0;
        this.currentRole = null;
        this.currentRoomPhase = Core.RoomPhase.WAITING;
        this.currentActorControllers = [Core.ControllerType.NONE, Core.ControllerType.NONE, Core.ControllerType.NONE, Core.ControllerType.NONE];
        this.currentActorStatuses = [Core.ActorStatus.INACTIVE, Core.ActorStatus.INACTIVE, Core.ActorStatus.INACTIVE, Core.ActorStatus.INACTIVE];
        this.currentActorInventories = [null, null, null, null];
        this.currentActorStatusTimers = [0, 0, 0, 0];
        this.isTransitioningToResultScene = false;
    }
    create() {
        this.cameras.main.fadeIn(200, 0, 0, 0);
        this.cursors = this.input.keyboard?.createCursorKeys();
        this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyEsc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEnter = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.socket = this.registry.get('socket') as Socket;
        if (!this.socket) {
            console.error('Socket not found in registry');
            return;
        }

        this.keyEsc?.on('down', () => {
            this.scene.start('LobbyScene');
        });


        Core.MAP.forEach((row, i) => {
            row.forEach((tile, j) => {
                const { x, y } = Core.gridToPixel(j, i);
                let textureKey = '';
                if (tile === 0) {
                    textureKey = this.getRoadTextureKey(j, i);
                }
                else {
                    textureKey = `wall${tile}`;
                }
                if (textureKey) {
                    this.add.image(x, y, textureKey).setOrigin(0, 0).setDepth(RenderDepth.FLOOR);
                }
            });
        });
        // 仮の UI 後でちゃんとしたのに差し替える
        this.timerText = this.add.text(Core.WIDTH / 2, 780, 'Loading...', { fontSize: '40px', color: '#fff', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0.5, 0).setDepth(RenderDepth.UI);
        const protoButtonStyle = { fontSize: '20px', color: '#0f0', fontFamily: Core.FONT_FAMILY_EN };
        this.actorJoinButtons = [];
        this.actorChangeToCPUButtons = [];
        this.actorItemStateTexts = [];
        for (const { role, name, buttonOriginPos } of Object.values(Core.ACTOR_CONFIG)) {
            const joinButton = this.add.text(buttonOriginPos.x, buttonOriginPos.y, `Join as ${name}`, protoButtonStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => { this.joinGamePlayerRequest(role); }).setDepth(RenderDepth.UI);
            this.actorJoinButtons[role] = joinButton;
            const changeToCPUButton = this.add.text(buttonOriginPos.x, buttonOriginPos.y + 30, `Change ${name} to CPU`, protoButtonStyle)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => { this.changeToCPURequest(role); }).setDepth(RenderDepth.UI);
            this.actorChangeToCPUButtons[role] = changeToCPUButton;
            const itemStateText = this.add.text(buttonOriginPos.x, buttonOriginPos.y + 60, 'Item: None, StatusTimer: 0', { fontSize: '18px', color: '#ff0', fontFamily: Core.FONT_FAMILY_EN }).setDepth(RenderDepth.UI);
            this.actorItemStateTexts[role] = itemStateText;
        }

        for (const { role, spritePrefix } of Object.values(Core.ACTOR_CONFIG)) {
            const sprite = this.add.sprite(0, 0, `${spritePrefix}_d_a`).setOrigin(0, 0);
            const depth = Core.ACTOR_CONFIG[role].type === Core.ActorType.HUMAN ? RenderDepth.ACTOR_HUMAN : RenderDepth.ACTOR_GHOST;
            sprite.setDepth(depth);
            sprite.setVisible(false);
            this.actorSprites[role] = sprite;
        }

        this.markerYouSprite = this.add.sprite(0, 0, 'marker_you').setOrigin(0, 0).setDepth(RenderDepth.MARKER);
        this.markerYouSprite.setVisible(false);

        this.markerOffsetY = -Core.TILE_SIZE + 5;
        this.tweens.add({
            targets: this,
            markerOffsetY: -Core.TILE_SIZE - 3,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.anims.create({
            key: 'ghost_item_pick_up_effect_anim',
            frames: this.anims.generateFrameNumbers('ghost_item_pick_up_effect', { start: 0, end: 7 }),
            frameRate: 15,
            repeat: 0
        });

        this.anims.create({
            key: 'human_item_pick_up_effect_anim',
            frames: this.anims.generateFrameNumbers('human_item_pick_up_effect', { start: 0, end: 7 }),
            frameRate: 30,
            repeat: 0
        });

        this.lightGraphicsList = [this.add.graphics().setDepth(RenderDepth.LIGHT), this.add.graphics().setDepth(RenderDepth.LIGHT), null, null]; // Ghost は null
        this.visionMask = this.add.graphics().setVisible(false);

        this.events.once('update', () => this.postCreate());
    }

    private postCreate() {
        if (!this.socket) return;
        this.socket.emit('joinRoom', { roomId: this.roomId });
        this.socket.on('gameSnapshot', (snapshot: Core.GameSnapshot) => {
            this.receivedGameSnapshots.push({ snapshot, time: performance.now() });
        });
        this.events.once('shutdown', () => {
            this.leaveGamePlayerRequest();
        });
    }

    private getRoadTextureKey(x: number, y: number): string {
        let connections = '';
        if (Core.hasConnection(x, y, Core.Direction.UP)) connections += 'u';
        if (Core.hasConnection(x, y, Core.Direction.DOWN)) connections += 'd';
        if (Core.hasConnection(x, y, Core.Direction.LEFT)) connections += 'l';
        if (Core.hasConnection(x, y, Core.Direction.RIGHT)) connections += 'r';
        return `road_${connections || 'default'}`;
    }

    private joinGamePlayerRequest(role: Core.ActorRole) {
        if (!this.socket) return;
        this.socket.emit('joinGamePlayer', { role: role });
    }

    private changeToCPURequest(role: Core.ActorRole) {
        if (!this.socket) return;
        this.socket.emit('changeToCPU', { role: role });
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
        let newRole: Core.ActorRole | null = null;
        let latestRoomTimer: number | null = null;
        const events: Core.GameEvent[] = [];
        for (const { snapshot, time: snapshotTime } of this.receivedGameSnapshots) {
            this.lastPredictedActorMovementsUpdateTime = snapshotTime;
            for (const { role } of Object.values(Core.ACTOR_CONFIG)) {
                const receivedActorState = snapshot.actors[role]; // 受信した状態
                if (receivedActorState.status === Core.ActorStatus.INACTIVE) {
                    this.predictedActorMovements[role] = null;
                }
                else {
                    this.predictedActorMovements[role] = receivedActorState.movement;
                }
                if (receivedActorState.sessionId === this.socket.id) {
                    newRole = role;
                }
                this.currentActorControllers[role] = snapshot.actors[role].controller;
                this.currentActorStatuses[role] = snapshot.actors[role].status;
                this.currentActorInventories[role] = snapshot.actors[role].inventory;
                this.currentActorStatusTimers[role] = snapshot.actors[role].statusTimer;
            }
            latestRoomTimer = snapshot.roomTimer;
            this.currentRoomPhase = snapshot.roomPhase;
            events.push(...snapshot.events);

            // アイテムのスプライトを更新
            // もし role が変わっている場合は，全てを作り直す（透明度が変わるため）
            if (newRole !== this.currentRole) {
                this.itemSpritesMap.forEach(sprite => sprite.destroy());
                this.itemSpritesMap.clear();
            }
            const currentItemKeys = new Set<string>();
            for (const item of snapshot.items) {
                const key = Core.keyFromItemState(item);
                currentItemKeys.add(key);
                // 新たに出現したアイテムのスプライトを作成
                if (!this.itemSpritesMap.has(key)) {
                    const config = Core.ITEM_CONFIG[item.type];
                    if (config) {
                        const { x, y } = Core.gridToPixel(item.gridX, item.gridY);
                        const sprite = this.add.sprite(x, y, config.spriteName).setOrigin(0, 0);
                        let targetAlpha = 0.0;
                        if (newRole === null) {
                            targetAlpha = config.alphaConfig.spectator;
                        }
                        else if (Core.ACTOR_CONFIG[newRole].type === Core.ActorType.HUMAN) {
                            targetAlpha = config.alphaConfig.human;
                        }
                        else if (Core.ACTOR_CONFIG[newRole].type === Core.ActorType.GHOST) {
                            targetAlpha = config.alphaConfig.ghost;
                        }
                        else {
                            console.error(`Unknown actor type for role ${newRole}: ${Core.ACTOR_CONFIG[newRole].type}`);
                        }
                        sprite.setAlpha(0).setDepth(RenderDepth.ITEM);
                        this.tweens.add({
                            targets: sprite,
                            alpha: targetAlpha,
                            duration: 100,
                            ease: 'Linear',
                        })
                        this.itemSpritesMap.set(key, sprite);
                    }
                    else {
                        console.error(`Unknown item type: ${item.type}`);
                    }
                }
            };
            // 存在しないアイテムのスプライトを削除
            this.itemSpritesMap.forEach((sprite, key) => {
                if (!currentItemKeys.has(key)) {
                    this.tweens.add({
                        targets: sprite,
                        alpha: 0,
                        duration: 100,
                        ease: 'Linear',
                        onComplete: () => {
                            sprite.destroy();
                        }
                    })
                    this.itemSpritesMap.delete(key);
                }
            });
        }
        this.receivedGameSnapshots = [];

        if (hasNewSnapshot) {
            if (newRole !== null && newRole !== this.currentRole) {
                // 新たにプレイヤー役になった場合，受信したスナップショットの位置を手元の位置として採用する
                this.localMovement = structuredClone(this.predictedActorMovements[newRole]);
            }
            this.currentRole = newRole;

            // イベントの処理
            events.forEach(event => {
                switch (event.type) {
                    case Core.GameEventType.ITEM_PICK_UP:
                        // アイテム取得のエフェクトなどをここに書く
                        const itemPickupEvent = event as Core.ItemPickUpEvent;
                        const itemState = itemPickupEvent.itemState;
                        const itemType = itemState.type;
                        const itemCategory = Core.ITEM_CONFIG[itemType].category;

                        const { x, y } = Core.gridToCenterPixel(itemState.gridX, itemState.gridY);
                        if (Core.ACTOR_CONFIG[event.role].type === Core.ActorType.HUMAN) {
                            const effect = this.add.sprite(x, y, 'human_item_pick_up_effect').setOrigin(0.5, 0.5).setDepth(RenderDepth.EFFECT);
                            effect.play('human_item_pick_up_effect_anim');
                            effect.on('animationcomplete', () => {
                                effect.destroy();
                            });
                        }
                        else if (Core.ACTOR_CONFIG[event.role].type === Core.ActorType.GHOST) {
                            const effect = this.add.sprite(x, y, 'ghost_item_pick_up_effect').setOrigin(0.5, 0.5).setDepth(RenderDepth.EFFECT);
                            effect.play('ghost_item_pick_up_effect_anim');
                            effect.on('animationcomplete', () => {
                                effect.destroy();
                            });
                        }

                        if (event.role === this.currentRole) {
                            if (itemCategory === Core.ItemCategory.SCORE || itemCategory === Core.ItemCategory.SCORE_SPECIAL) {
                                // 自分がスコアアイテムを取った場合はスコア加算のエフェクトを出す
                            }
                        }

                        /*
                        switch (itemCategory) {
                            case Core.ItemCategory.SCORE:
                            case Core.ItemCategory.SCORE_SPECIAL:
                                const { x, y } = Core.gridToCenterPixel(itemState.gridX, itemState.gridY);
                                const effect = this.add.sprite(x, y, 'ghost_item_pick_up_effect').setOrigin(0.5, 0.5).setDepth(RenderDepth.EFFECT);
                                effect.play('ghost_item_pick_up_effect_anim');
                                effect.on('animationcomplete', () => {
                                    effect.destroy();
                                });
                                // TODO: 自分ならスコア加算のエフェクトを出す
                                break;
                            case Core.ItemCategory.SPEED_UP:
                                // スピードアップアイテムのエフェクト
                                break;
                            case Core.ItemCategory.STUN:
                                // スタンアイテムのエフェクト
                                break;
                        }*/
                        break;
                    case Core.GameEventType.PLAYER_TAGGED:
                        // TODO: エフェクト処理
                        if (event.taggedRole === this.currentRole) {
                            this.localMovement = { ...event.respawnPosition, currentDir: Core.Direction.NONE, nextDir: Core.Direction.NONE, offsetX: 0, offsetY: 0 };
                        }
                        break;
                    case Core.GameEventType.GAME_OVER:
                        // 結果画面に遷移
                        this.isTransitioningToResultScene = true;
                        this.input.enabled = false; // 入力を無効化して多重遷移を防止
                        this.cameras.main.fadeOut(100, 0, 0, 0);
                        const scores = (event as Core.GameOverEvent).scores;
                        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                            this.scene.start('ResultScene', { roomId: this.roomId, scores });
                        });
                        return; // 以降の処理は行わない
                }
            }
            );

            // タイマーの更新
            if (latestRoomTimer !== null) {
                const seconds = Math.ceil(latestRoomTimer / 1000);
                switch (this.currentRoomPhase) {
                    case Core.RoomPhase.WAITING:
                        this.timerText.setText(`Waiting...`);
                        break;
                    case Core.RoomPhase.STARTING:
                        this.timerText.setText(`Starting... ${seconds}`);
                        break;
                    case Core.RoomPhase.PLAYING:
                        this.timerText.setText(`Time: ${seconds}`);
                        break;
                }
            }
        }
        // スタン状態の判定
        let isGhostStunned = false;
        for (const human of Core.HUMAN_ROLES) {
            const status = this.currentActorStatuses[human];
            if (status === Core.ActorStatus.STUN_ATTACKING) {
                isGhostStunned = true;
            }
        }
        let isHumanStunned = false;
        for (const ghost of Core.GHOST_ROLES) {
            const status = this.currentActorStatuses[ghost];
            if (status === Core.ActorStatus.STUN_ATTACKING) {
                isHumanStunned = true;
            }
        }
        const isStunned = Core.ACTOR_CONFIG.map(({ type }) => { if (type === Core.ActorType.HUMAN) { return isHumanStunned } else { return isGhostStunned } });


        // 予測位置の更新
        const sinceLastUpdate = now - this.lastPredictedActorMovementsUpdateTime;
        this.lastPredictedActorMovementsUpdateTime = now;
        for (const { role } of Object.values(Core.ACTOR_CONFIG)) {
            const predictedMovement = this.predictedActorMovements[role];
            if (predictedMovement !== null) {
                const currentSpeed = Core.calcSpeed(role, this.currentActorStatuses[role], isStunned[role]);
                Object.assign(predictedMovement, Core.calcNextMovement(predictedMovement, currentSpeed * (sinceLastUpdate / 1000)));
            }
        }

        // プレイヤー役であれば入力を処理して位置を更新する
        if (this.localMovement && this.currentRole !== null && (this.currentRoomPhase === Core.RoomPhase.WAITING || this.currentRoomPhase === Core.RoomPhase.PLAYING) && this.currentActorControllers[this.currentRole] === Core.ControllerType.PLAYER && this.currentActorStatuses[this.currentRole] !== Core.ActorStatus.RESPAWN) {
            if (this.cursors?.up.isDown || this.keyW?.isDown) {
                this.localMovement.nextDir = Core.Direction.UP;
            }
            else if (this.cursors?.down.isDown || this.keyS?.isDown) {
                this.localMovement.nextDir = Core.Direction.DOWN;
            }
            else if (this.cursors?.left.isDown || this.keyA?.isDown) {
                this.localMovement.nextDir = Core.Direction.LEFT;
            }
            else if (this.cursors?.right.isDown || this.keyD?.isDown) {
                this.localMovement.nextDir = Core.Direction.RIGHT;
            }

            const currentSpeed = Core.calcSpeed(this.currentRole, this.currentActorStatuses[this.currentRole], isStunned[this.currentRole]);

            const distance = currentSpeed * delta / 1000;
            this.localMovement = Core.calcNextMovement(this.localMovement, distance);
            this.timeSinceLastEmit += delta;
            while (this.timeSinceLastEmit >= MainScene.EMIT_INTERVAL) {
                this.socket.emit('reportMovement', { role: this.currentRole, movement: this.localMovement });
                this.timeSinceLastEmit -= MainScene.EMIT_INTERVAL;
            }
            // 予測位置を上書き
            this.predictedActorMovements[this.currentRole] = structuredClone(this.localMovement);

            // アイテム使用の入力
            if ((this.keySpace?.isDown || this.keyEnter?.isDown) && this.currentActorInventories[this.currentRole] !== null && this.currentActorStatuses[this.currentRole] === Core.ActorStatus.ACTIVE) {
                this.socket.emit('useItemRequest', { role: this.currentRole });
            }
        }

        // ゲーム開始時
        if (this.currentRoomPhase === Core.RoomPhase.STARTING) {
            // すべての役の予測位置を初期化する
            Object.values(Core.ACTOR_CONFIG).forEach(({ role, initialPos }) => {
                this.predictedActorMovements[role] = { ...initialPos, currentDir: Core.Direction.NONE, nextDir: Core.Direction.NONE, offsetX: 0, offsetY: 0 };
            });
            if (this.localMovement !== null && this.currentRole !== null) {
                this.localMovement = { ...Core.ACTOR_CONFIG[this.currentRole].initialPos, currentDir: Core.Direction.NONE, nextDir: Core.Direction.NONE, offsetX: 0, offsetY: 0 };
            }
        }

        // VisualActorState の更新
        for (const { role } of Object.values(Core.ACTOR_CONFIG)) {
            const predictedMovement = this.predictedActorMovements[role];
            if (predictedMovement !== null) {
                if (this.currentRole === role && this.localMovement) {
                    const { x, y } = Core.movementToPixel(this.localMovement);
                    this.visualActorStates[role] = { x, y, dir: this.localMovement.currentDir };
                }
                else {
                    const { x: targetX, y: targetY } = Core.movementToPixel(predictedMovement);
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
        if (this.currentRole === null) {
            this.markerYouSprite.setVisible(false);
        }
        else if (this.visualActorStates[this.currentRole]) {
            const visualState = this.visualActorStates[this.currentRole]!;
            this.markerYouSprite.setPosition(visualState.x, visualState.y + this.markerOffsetY);
            this.markerYouSprite.setVisible(true);
        }

        // ライトの描画
        if (this.currentRoomPhase === Core.RoomPhase.PLAYING) {
            this.visionMask.clear();
            this.visionMask.fillStyle(0x000000, 1);
            for (const humanRole of Core.HUMAN_ROLES) {
                const lightGraphics = this.lightGraphicsList[humanRole];
                const visualState = this.visualActorStates[humanRole];
                if (lightGraphics && visualState) {
                    const points = this.calcLightPoints(visualState);
                    if (points) {
                        lightGraphics.clear();
                        lightGraphics.fillStyle(0xffff55, 0.4);
                        lightGraphics.fillPoints(points);
                        this.visionMask.fillPoints(points);
                    }
                }
            }
        }
        else {
            // ゲーム中以外はライトの描画を消す
            this.lightGraphicsList.forEach(graphics => {
                if (graphics) {
                    graphics.clear();
                }
            });
            this.visionMask.clear();
        }

        for (const { role, name, spritePrefix } of Object.values(Core.ACTOR_CONFIG)) {
            const visualState = this.visualActorStates[role];
            const sprite = this.actorSprites[role];
            const joinButton = this.actorJoinButtons[role];
            const cpuButton = this.actorChangeToCPUButtons[role];
            const itemStateText = this.actorItemStateTexts[role];
            const status = this.currentActorStatuses[role];
            if (sprite === null) continue;

            let itemStateTextContent = 'Item: ';
            const inventory = this.currentActorInventories[role];
            if (inventory) {
                const config = Core.ITEM_CONFIG[inventory];
                const itemName = config.spriteName;
                itemStateTextContent += itemName;
            }
            else {
                itemStateTextContent += 'None';
            }
            itemStateTextContent += `, StatusTimer: ${Math.ceil(this.currentActorStatusTimers[role] / 1000)}`;
            itemStateText.setText(itemStateTextContent);
            switch (this.currentActorControllers[role]) {
                case Core.ControllerType.NONE:
                    joinButton.setText(`Join as ${name}`);
                    joinButton.off('pointerdown');
                    joinButton.on('pointerdown', () => { this.joinGamePlayerRequest(role); });
                    cpuButton.setText(`Change ${name} to CPU`);
                    cpuButton.off('pointerdown');
                    cpuButton.on('pointerdown', () => { this.changeToCPURequest(role); });
                    break;
                case Core.ControllerType.PLAYER:
                    if (this.currentRole === role) {
                        joinButton.setText(`Leave ${name}`);
                        joinButton.off('pointerdown');
                        joinButton.on('pointerdown', () => { this.leaveGamePlayerRequest(); });
                        cpuButton.setText(`Change ${name} to CPU`);
                        cpuButton.off('pointerdown');
                        cpuButton.on('pointerdown', () => { this.changeToCPURequest(role); });
                    }
                    else {
                        joinButton.setText(`Taken: ${name}`);
                        joinButton.off('pointerdown');
                        // 他のプレイヤーが操作中の役はCPU に変更できない
                        cpuButton.setText(`Taken: ${name}`);
                        cpuButton.off('pointerdown');
                    }
                    break;
                case Core.ControllerType.CPU:
                    joinButton.setText(`Join as ${name}`); // 仮の表示
                    joinButton.off('pointerdown');
                    joinButton.on('pointerdown', () => { this.joinGamePlayerRequest(role); });
                    cpuButton.setText(`CPU: ${name}`); // 仮の表示
                    cpuButton.off('pointerdown');
                    break;
            }
            if (visualState === null) {
                sprite.setVisible(false);
            }
            else {
                switch (status) {
                    case Core.ActorStatus.ACTIVE:
                        sprite.setVisible(true);
                        break;
                    case Core.ActorStatus.INACTIVE:
                        sprite.setVisible(false);
                        break;
                    case Core.ActorStatus.STUN_ATTACKING:
                        sprite.setVisible(true);
                        break;
                    case Core.ActorStatus.SPEED_UP:
                        // TODO: textureKey を変える
                        sprite.setVisible(true);
                        break;
                    case Core.ActorStatus.RESPAWN:
                        // TODO: エフェクト入れる ここかは微妙
                        sprite.setVisible(false);
                        break;
                }
                if (isStunned[role]) {
                    // TODO: スタン状態の見た目を変える
                    // Speed up より優先される
                }
                const { x, y } = visualState;
                sprite.setPosition(x, y);

                let textureKey = '';
                if (visualState.dir === Core.Direction.UP) textureKey = `${spritePrefix}_u`;
                else if (visualState.dir === Core.Direction.DOWN) textureKey = `${spritePrefix}_d`;
                else if (visualState.dir === Core.Direction.LEFT) textureKey = `${spritePrefix}_l`;
                else if (visualState.dir === Core.Direction.RIGHT) textureKey = `${spritePrefix}_r`;
                else textureKey = `${spritePrefix}_d`;

                const textureSuffix = Math.floor((time / 200) % 2) === 0 ? '_a' : '_b';
                sprite.setTexture(textureKey + textureSuffix);

                // もし プレイ中 かつ プレイヤーが Human かつ 描画中の役が Ghost なら，ライトの当たる範囲のみ見えるようにする
                if (this.currentRoomPhase === Core.RoomPhase.PLAYING && this.currentRole !== null && Core.ACTOR_CONFIG[this.currentRole].type === Core.ActorType.HUMAN && Core.ACTOR_CONFIG[role].type === Core.ActorType.GHOST) {
                    const mask = this.visionMask.createGeometryMask();
                    sprite.setMask(mask);
                }
                else {
                    sprite.clearMask();
                }
            }
        }
    }

    private calcLightPoints(visualState: Core.VisualActorState): Phaser.Math.Vector2[] | null {
        const dir = visualState.dir === Core.Direction.NONE ? Core.Direction.DOWN : visualState.dir; // 方向がない場合は下向きとみなす
        const { dx, dy } = Core.DIRECTION_CONFIG[dir];

        const cx = visualState.x + Core.TILE_SIZE / 2;
        const cy = visualState.y + Core.TILE_SIZE / 2;

        let gridX = Math.floor((cx - Core.MAP_ORIGIN_X) / Core.TILE_SIZE);
        let gridY = Math.floor((cy - Core.MAP_ORIGIN_Y) / Core.TILE_SIZE);
        if (gridX < 0 || gridX >= Core.MAP_WIDTH || gridY < 0 || gridY >= Core.MAP_HEIGHT || Core.MAP[gridY][gridX] !== 0) {
            // もし現在の位置がマップ外か壁の中なら、ライトを表示しない
            return null;
        }

        // ライトが到達しうるマスを計算
        while (Core.hasConnection(gridX, gridY, dir)) {
            gridX += dx;
            gridY += dy;
        }
        const reachGridCenter = Core.gridToCenterPixel(gridX, gridY);

        const leftCornerVec = { x: (dx + dy) * Core.TILE_SIZE / 2, y: (-dx + dy) * Core.TILE_SIZE / 2 };
        const rightCornerVec = { x: (dx - dy) * Core.TILE_SIZE / 2, y: (dx + dy) * Core.TILE_SIZE / 2 };

        const { x: rx, y: ry } = reachGridCenter;

        const centerOffset = {x: (dx * Core.TILE_SIZE / 4), y: (dy * Core.TILE_SIZE / 4)};

        return [
            new Phaser.Math.Vector2(cx + centerOffset.x, cy + centerOffset.y),
            new Phaser.Math.Vector2(cx + leftCornerVec.x, cy + leftCornerVec.y),
            new Phaser.Math.Vector2(rx + leftCornerVec.x, ry + leftCornerVec.y),
            new Phaser.Math.Vector2(rx + rightCornerVec.x, ry + rightCornerVec.y),
            new Phaser.Math.Vector2(cx + rightCornerVec.x, cy + rightCornerVec.y),
        ];
    }
}
