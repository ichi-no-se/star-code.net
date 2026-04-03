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
    UI_INVENTORY_ITEM = 55,
    UI_INVENTORY_FRAME = 60
}

export default class MainScene extends Phaser.Scene {
    private static readonly EMIT_INTERVAL = 1000 / 20; // 20 FPS
    private static readonly FRAME_OFFSET_BOOST = 8;
    private static readonly FRAME_OFFSET_STUNNED = 16;

    private static readonly MAIN_BUTTON_WIDTH = 260;
    private static readonly MAIN_BUTTON_HEIGHT = 60;
    private static readonly CHANGE_TO_CPU_BUTTON_WIDTH = 260;
    private static readonly CHANGE_TO_CPU_BUTTON_HEIGHT = 40;
    private static readonly BUTTON_LINE_THICKNESS = 2;

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

    private inventoryFrames!: Phaser.GameObjects.Sprite[];
    private inventoryItemSprites!: Phaser.GameObjects.Sprite[];
    private roomStateText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private itemSpritesMap!: Map<string, Phaser.GameObjects.Sprite>;
    private actorSprites!: (Phaser.GameObjects.Sprite | null)[];
    private markerYouSprite!: Phaser.GameObjects.Sprite;
    private markerOffsetY!: number; // マーカーの浮き上がりのアニメーション用
    private visualActorStates!: (Core.VisualActorState | null)[]; // 描画用の位置
    private predictedActorMovements!: (Core.MovementState | null)[]; // 手元での予測位置
    private lastPredictedActorMovementsUpdateTime!: number; // 予測位置を最後に更新した時間

    private actorMainButtonGraphicsList!: Phaser.GameObjects.Graphics[];
    private actorMainButtonTexts!: Phaser.GameObjects.Text[];
    private actorMainButtonZones!: Phaser.GameObjects.Zone[];
    private actorChangeToCPUGraphicsList!: Phaser.GameObjects.Graphics[];
    private actorChangeToCPUTexts!: Phaser.GameObjects.Text[];
    private actorChangeToCPUZones!: Phaser.GameObjects.Zone[];

    private humanScoreText!: Phaser.GameObjects.Text;
    private ghostScoreText!: Phaser.GameObjects.Text;

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
        this.cameras.main.fadeIn(100, 0, 0, 0);
        this.cursors = this.input.keyboard?.createCursorKeys();
        this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyEnter = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.keyEsc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        this.socket = this.registry.get('socket') as Socket;
        if (!this.socket) {
            console.error('Socket not found in registry');
            return;
        }

        this.keyEsc?.on('down', () => {
            this.scene.start('TitleScene');
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

        // UI アイコン
        for (const { spriteName, iconOriginPos, iconDirection } of Core.ACTOR_CONFIG) {
            const frameOffset = Core.DIRECTION_CONFIG[iconDirection].frameOffset;
            const icon = this.add.sprite(iconOriginPos.x, iconOriginPos.y, spriteName).setOrigin(0, 0).setScale(3).setDepth(RenderDepth.UI);
            const animKey = `icon-walk-${spriteName}`;
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(spriteName, { start: frameOffset, end: frameOffset + 1 }),
                frameRate: 1,
                repeat: -1
            });
            icon.play(animKey);
        }

        this.inventoryFrames = [];
        this.inventoryItemSprites = [];
        for (const { role, inventoryIconOriginPos } of Core.ACTOR_CONFIG) {
            this.inventoryFrames[role] = this.add.sprite(inventoryIconOriginPos.x, inventoryIconOriginPos.y, 'inventory').setOrigin(0, 0).setScale(3).setDepth(RenderDepth.UI_INVENTORY_FRAME).setFrame(0);
            const center = this.inventoryFrames[role].getCenter();
            this.inventoryItemSprites[role] = this.add.sprite(center.x, center.y, Core.ITEM_CONFIG[Core.ItemType.SPEED_UP].spriteName).setOrigin(0.5, 0.5).setScale(2).setDepth(RenderDepth.UI_INVENTORY_ITEM).setFrame(0).setVisible(false);
        }

        // ボタン
        this.actorMainButtonGraphicsList = [];
        this.actorMainButtonTexts = [];
        this.actorMainButtonZones = [];

        this.actorChangeToCPUGraphicsList = [];
        this.actorChangeToCPUTexts = [];
        this.actorChangeToCPUZones = [];

        for (const { role, buttonOriginPos } of Core.ACTOR_CONFIG) {
            const graphics = this.add.graphics().setDepth(RenderDepth.UI);
            graphics.lineStyle(MainScene.BUTTON_LINE_THICKNESS, 0xeeeeee);
            graphics.strokeRect(buttonOriginPos.x, buttonOriginPos.y, MainScene.MAIN_BUTTON_WIDTH, MainScene.MAIN_BUTTON_HEIGHT);
            this.actorMainButtonGraphicsList[role] = graphics;

            const text = this.add.text(buttonOriginPos.x + MainScene.MAIN_BUTTON_WIDTH / 2, buttonOriginPos.y + MainScene.MAIN_BUTTON_HEIGHT / 2, 'JOIN', { fontSize: '24px', color: '#eee', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0.5, 0.5).setDepth(RenderDepth.UI);
            this.actorMainButtonTexts[role] = text;

            const zone = this.add.zone(buttonOriginPos.x, buttonOriginPos.y, MainScene.MAIN_BUTTON_WIDTH, MainScene.MAIN_BUTTON_HEIGHT).setOrigin(0, 0).setDepth(RenderDepth.UI).setInteractive({ useHandCursor: true });
            this.actorMainButtonZones[role] = zone;

            const changeToCPUOriginX = buttonOriginPos.x;
            const changeToCPUOriginY = buttonOriginPos.y + MainScene.MAIN_BUTTON_HEIGHT + 10;
            const changeToCPUGraphics = this.add.graphics().setDepth(RenderDepth.UI);
            changeToCPUGraphics.lineStyle(MainScene.BUTTON_LINE_THICKNESS, 0xeeeeee);
            changeToCPUGraphics.strokeRect(changeToCPUOriginX, changeToCPUOriginY, MainScene.CHANGE_TO_CPU_BUTTON_WIDTH, MainScene.CHANGE_TO_CPU_BUTTON_HEIGHT);
            this.actorChangeToCPUGraphicsList[role] = changeToCPUGraphics;

            const changeToCPUText = this.add.text(changeToCPUOriginX + MainScene.CHANGE_TO_CPU_BUTTON_WIDTH / 2, changeToCPUOriginY + MainScene.CHANGE_TO_CPU_BUTTON_HEIGHT / 2, 'SET CPU', { fontSize: '18px', color: '#eee', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0.5, 0.5).setDepth(RenderDepth.UI);
            this.actorChangeToCPUTexts[role] = changeToCPUText;

            const changeToCPUZone = this.add.zone(changeToCPUOriginX, changeToCPUOriginY, MainScene.CHANGE_TO_CPU_BUTTON_WIDTH, MainScene.CHANGE_TO_CPU_BUTTON_HEIGHT).setOrigin(0, 0).setDepth(RenderDepth.UI).setInteractive({ useHandCursor: true });
            this.actorChangeToCPUZones[role] = changeToCPUZone;
        }

        // 得点表示
        this.add.text(Core.WIDTH / 2 - 200, 960, 'HUMAN TEAM', { fontSize: '32px', color: '#fee', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0.5, 0.5).setDepth(RenderDepth.UI);
        this.humanScoreText = this.add.text(Core.WIDTH / 2 - 200, 1020, '00000', { fontSize: '64px', color: '#fcc', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0.5, 0.5).setDepth(RenderDepth.UI);

        this.add.text(Core.WIDTH / 2 + 200, 960, 'GHOST TEAM', { fontSize: '32px', color: '#eef', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0.5, 0.5).setDepth(RenderDepth.UI);
        this.ghostScoreText = this.add.text(Core.WIDTH / 2 + 200, 1020, '00000', { fontSize: '64px', color: '#ccf', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0.5, 0.5).setDepth(RenderDepth.UI);

        // 仮の UI 後でちゃんとしたのに差し替える

        this.roomStateText = this.add.text(Core.WIDTH / 2, 740, 'Loading...', { fontSize: '32px', color: '#ccc', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0.5, 0).setDepth(RenderDepth.UI);
        this.add.text(Core.WIDTH / 2 - 50, 890, 'TIME:', { fontSize: '48px', color: '#eee', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(1, 1).setDepth(RenderDepth.UI);
        this.timerText = this.add.text(Core.WIDTH / 2 - 50, 890, '000', { fontSize: '80px', color: '#eee', fontFamily: Core.FONT_FAMILY_EN }).setOrigin(0, 1).setDepth(RenderDepth.UI);

        // キャラクターアニメーション作成
        for (const { spriteName } of Object.values(Core.ACTOR_CONFIG)) {
            for (const { suffix, frameOffset } of Object.values(Core.DIRECTION_CONFIG)) {
                this.anims.create({
                    key: `${spriteName}_${suffix}_normal`,
                    frames: this.anims.generateFrameNumbers(spriteName, { start: frameOffset, end: frameOffset + 1 }),
                    frameRate: 4,
                    repeat: -1
                });
                this.anims.create({
                    key: `${spriteName}_${suffix}_boost`,
                    frames: this.anims.generateFrameNumbers(spriteName, {
                        start: frameOffset + MainScene.FRAME_OFFSET_BOOST, end: frameOffset + MainScene.FRAME_OFFSET_BOOST + 1
                    }),
                    frameRate: 6,
                    repeat: -1
                });
            }
        }
        for (const { role, spriteName } of Object.values(Core.ACTOR_CONFIG)) {
            const sprite = this.add.sprite(0, 0, `${spriteName}`).setOrigin(0, 0);
            sprite.setFrame(2); // 下向き
            const depth = Core.ACTOR_CONFIG[role].type === Core.ActorType.HUMAN ? RenderDepth.ACTOR_HUMAN : RenderDepth.ACTOR_GHOST;
            sprite.setDepth(depth);
            sprite.setVisible(false);
            this.actorSprites[role] = sprite;
        }

        this.markerYouSprite = this.add.sprite(0, 0, 'marker_you').setOrigin(0, 0).setDepth(RenderDepth.MARKER).setScale(1.0);
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
        let latestHumanScore: number = 0;
        let latestGhostScore: number = 0;
        const events: Core.GameEvent[] = [];
        for (const { snapshot, time: snapshotTime } of this.receivedGameSnapshots) {
            this.lastPredictedActorMovementsUpdateTime = snapshotTime;
            latestHumanScore = 0;
            latestGhostScore = 0;
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
                // もし誰かがスタンアイテムを使用したならば，効果音を鳴らす
                if (this.currentActorStatuses[role] !== Core.ActorStatus.STUN_ATTACKING && snapshot.actors[role].status === Core.ActorStatus.STUN_ATTACKING) {
                    this.sound.play('stun');
                }
                // もし誰かが加速アイテムを使用したならば，効果音を鳴らす
                if (this.currentActorStatuses[role] !== Core.ActorStatus.SPEED_UP && snapshot.actors[role].status === Core.ActorStatus.SPEED_UP) {
                    this.sound.play('boost');
                }
                this.currentActorStatuses[role] = snapshot.actors[role].status;
                this.currentActorInventories[role] = snapshot.actors[role].inventory;
                this.currentActorStatusTimers[role] = snapshot.actors[role].statusTimer;
                if (Core.ACTOR_CONFIG[role].type === Core.ActorType.HUMAN) {
                    latestHumanScore += snapshot.actors[role].score;
                }
                else if (Core.ACTOR_CONFIG[role].type === Core.ActorType.GHOST) {
                    latestGhostScore += snapshot.actors[role].score;
                }
            }
            latestRoomTimer = snapshot.roomTimer;
            // ゲーム中からは遷移させない（イベントとしてリザルトに飛ぶので）
            if (this.currentRoomPhase !== Core.RoomPhase.PLAYING) {
                this.currentRoomPhase = snapshot.roomPhase;
            }
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
                        {
                            this.sound.play('item_get');
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
                                    // 自分がスコアアイテムを取った場合スコア加算のエフェクトを出す
                                    let key = '';
                                    switch (itemPickupEvent.earnedScore) {
                                        case Core.SCORE_ITEM_NORMAL:
                                            key = 'score_100';
                                            break;
                                        case Core.SCORE_ITEM_SPECIAL:
                                            key = 'score_200';
                                            break;
                                        case Core.SCORE_SPEED_UP_NORMAL:
                                            key = 'score_150';
                                            break;
                                        case Core.SCORE_SPEED_UP_SPECIAL:
                                            key = 'score_300';
                                            break;
                                    }
                                    this.spawnScoreEffect(x, y, key);
                                }
                            }
                            break;
                        }
                    case Core.GameEventType.PLAYER_TAGGED:
                        {
                            this.sound.play('tag');
                            const { x, y } = Core.gridToCenterPixel(event.taggedPosition.gridX, event.taggedPosition.gridY);
                            const directions = [{ x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }];
                            const taggedSprite = this.actorSprites[event.taggedRole];
                            if (taggedSprite === null) {
                                console.error(`Tagged sprite not found for role ${event.taggedRole}`);
                                break;
                            }
                            const spriteKey = taggedSprite.texture.key;

                            directions.forEach((dir) => {
                                let frame: number;
                                if (dir.x === -1) {
                                    frame = Core.DIRECTION_CONFIG[Core.Direction.LEFT].frameOffset;
                                }
                                else {
                                    frame = Core.DIRECTION_CONFIG[Core.Direction.RIGHT].frameOffset;
                                }
                                const characterEffect = this.add.sprite(x, y, spriteKey, frame).setDepth(RenderDepth.EFFECT).setOrigin(0.5, 0.5).setAlpha(1.0);
                                this.tweens.add({
                                    targets: characterEffect,
                                    x: characterEffect.x + dir.x * 60,
                                    y: characterEffect.y + dir.y * 60,
                                    alpha: 0.0,
                                    scale: 1.5,
                                    duration: 1000,
                                    ease: 'Linear',
                                    onComplete: () => {
                                        characterEffect.destroy();
                                    }
                                });
                            });
                            if (this.currentRole === null || Core.ACTOR_CONFIG[this.currentRole].type !== Core.ActorType.HUMAN) {
                                // 復活エフェクト
                                const { x: respawnX, y: respawnY } = Core.gridToCenterPixel(event.respawnPosition.gridX, event.respawnPosition.gridY);
                                directions.forEach(dir => {
                                    // 復活エフェクト
                                    let frame: number;
                                    if (dir.x === -1) {
                                        frame = Core.DIRECTION_CONFIG[Core.Direction.RIGHT].frameOffset;
                                    }
                                    else {
                                        frame = Core.DIRECTION_CONFIG[Core.Direction.LEFT].frameOffset;
                                    }
                                    const RESPAWN_EFFECT_DURATION = 1500;
                                    this.time.delayedCall(Core.RESPAWN_DURATION - RESPAWN_EFFECT_DURATION, () => {
                                        if (this.scene.isActive()) {
                                            const characterEffect = this.add.sprite(respawnX + dir.x * 60, respawnY + dir.y * 60, spriteKey, frame).setDepth(RenderDepth.EFFECT).setOrigin(0.5, 0.5).setAlpha(0.0).setScale(1.5);
                                            this.tweens.add({
                                                targets: characterEffect,
                                                x: respawnX,
                                                y: respawnY,
                                                alpha: 1.0,
                                                scale: 1.0,
                                                duration: RESPAWN_EFFECT_DURATION,
                                                ease: 'Linear',
                                                onComplete: () => {
                                                    this.tweens.add({
                                                        targets: characterEffect,
                                                        alpha: 0.0,
                                                        duration: 100,
                                                        ease: 'Linear',
                                                        onComplete: () => {
                                                            characterEffect.destroy();
                                                        },
                                                    });
                                                },
                                            });
                                        }
                                    });
                                });
                            }
                            if (event.taggedRole === this.currentRole) {
                                this.localMovement = { ...event.respawnPosition, currentDir: Core.Direction.NONE, nextDir: Core.Direction.NONE, offsetX: 0, offsetY: 0 };
                            }
                            if (event.taggerRole === this.currentRole) {
                                this.spawnScoreEffect(x, y, 'score_500');
                            }
                            break;
                        }
                    case Core.GameEventType.GAME_OVER:
                        {
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
            }
            );

            // タイマーの更新
            if (latestRoomTimer !== null) {
                const seconds = Math.ceil(latestRoomTimer / 1000);
                const secondsText = seconds.toString().padStart(3, '0');

                switch (this.currentRoomPhase) {
                    case Core.RoomPhase.WAITING:
                        this.roomStateText.setText('Waiting for players...');
                        this.timerText.setText(secondsText);
                        break;
                    case Core.RoomPhase.STARTING:
                        this.roomStateText.setText('Starting...');
                        this.roomStateText.setColor('#ee5');
                        this.timerText.setText(secondsText);
                        this.timerText.setColor('#ee5');
                        break;
                    case Core.RoomPhase.PLAYING:
                        this.roomStateText.setText('');
                        this.timerText.setText(secondsText);
                        const timerColor = seconds <= 10 ? '#f55' :seconds <= 30 ? '#ee5' : '#eee';
                        this.timerText.setColor(timerColor);
                        break;
                }
            }

            // スコアの更新
            // 0 への更新は受け付けない（0 になるのはゲーム終了時のみで，ゲーム終了画面に遷移するため）
            if (latestHumanScore !== 0) {
                this.humanScoreText.setText(latestHumanScore.toString().padStart(5, '0'));
            }
            if (latestGhostScore !== 0) {
                this.ghostScoreText.setText(latestGhostScore.toString().padStart(5, '0'));
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
        if (this.currentRoomPhase === Core.RoomPhase.PLAYING && !isHumanStunned) {
            this.visionMask.clear();
            this.visionMask.fillStyle(0x000000, 1);
            for (const humanRole of Core.HUMAN_ROLES) {
                const lightGraphics = this.lightGraphicsList[humanRole];
                const visualState = this.visualActorStates[humanRole];
                if (lightGraphics && visualState) {
                    const points = this.calcLightPoints(visualState);
                    if (points) {
                        lightGraphics.clear();
                        lightGraphics.fillStyle(0xffffdd, 0.2);
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

        for (const { role, spriteName } of Object.values(Core.ACTOR_CONFIG)) {
            const visualState = this.visualActorStates[role];
            const sprite = this.actorSprites[role];
            const status = this.currentActorStatuses[role];
            if (sprite === null) continue;

            const inventory = this.currentActorInventories[role];
            if (inventory) {
                const config = Core.ITEM_CONFIG[inventory];
                this.inventoryItemSprites[role].setTexture(config.spriteName).setVisible(true);
                if (this.currentActorStatusTimers[role] > 0) {
                    let frameOffset;
                    let itemDuration;
                    if (config.type === Core.ItemType.SPEED_UP) {
                        // speed up
                        frameOffset = 1;
                        if (Core.ACTOR_CONFIG[role].type === Core.ActorType.HUMAN) {
                            itemDuration = Core.HUMAN_BOOST_DURATION;
                        }
                        else {
                            itemDuration = Core.GHOST_BOOST_DURATION;
                        }
                    }
                    else {
                        // stun
                        frameOffset = 5;
                        if (Core.ACTOR_CONFIG[role].type === Core.ActorType.HUMAN) {
                            itemDuration = Core.HUMAN_STUN_ATTACKING_DURATION;
                        }
                        else {
                            itemDuration = Core.GHOST_STUN_ATTACKING_DURATION;
                        }
                    }
                    const elapsed = itemDuration - this.currentActorStatusTimers[role];
                    const frame = frameOffset + Math.floor(elapsed / itemDuration * 4);
                    this.inventoryFrames[role].setFrame(frame);
                }
                else {
                    this.inventoryFrames[role].setFrame(0);
                }
            }
            else {
                this.inventoryItemSprites[role].setVisible(false);
                this.inventoryFrames[role].setFrame(0);
            }

            const mainButtonGraphics = this.actorMainButtonGraphicsList[role];
            const mainButtonText = this.actorMainButtonTexts[role];
            const mainButtonZone = this.actorMainButtonZones[role];

            let mainButtonColor = 0xeeeeee;
            let mainButtonLabel = 'JOIN';

            switch (this.currentActorControllers[role]) {
                case Core.ControllerType.NONE:
                    mainButtonColor = 0xeeeeee;
                    mainButtonLabel = 'JOIN';
                    break;
                case Core.ControllerType.PLAYER:
                    if (this.currentRole === role) {
                        mainButtonColor = 0x00eeee;
                        mainButtonLabel = 'LEAVE';
                    }
                    else {
                        mainButtonColor = 0x555555;
                        mainButtonLabel = 'TAKEN';
                        // 他のプレイヤーが操作中の役はCPU に変更できない
                    }
                    break;
                case Core.ControllerType.CPU:
                    mainButtonColor = 0xeeeeee;
                    mainButtonLabel = 'JOIN';
                    break;
            }

            const isMainButtonHovered = mainButtonZone.input && mainButtonZone.input.enabled && mainButtonZone.getBounds().contains(this.input.x, this.input.y);
            if (isMainButtonHovered && mainButtonLabel !== 'TAKEN') {
                mainButtonColor = 0xeeee00;
            }
            mainButtonGraphics.clear();
            mainButtonGraphics.lineStyle(MainScene.BUTTON_LINE_THICKNESS, mainButtonColor);
            mainButtonGraphics.strokeRect(mainButtonZone.x, mainButtonZone.y, MainScene.MAIN_BUTTON_WIDTH, MainScene.MAIN_BUTTON_HEIGHT);
            mainButtonText.setText(mainButtonLabel).setColor(Phaser.Display.Color.IntegerToColor(mainButtonColor).rgba);

            switch (mainButtonLabel) {
                case 'JOIN':
                    mainButtonZone.off('pointerdown');
                    mainButtonZone.on('pointerdown', () => {
                        this.sound.play('select');
                        this.joinGamePlayerRequest(role);
                    });
                    mainButtonZone.setInteractive({ useHandCursor: true });
                    break;
                case 'LEAVE':
                    mainButtonZone.off('pointerdown');
                    mainButtonZone.on('pointerdown', () => {
                        this.sound.play('select');
                        this.leaveGamePlayerRequest();
                    });
                    mainButtonZone.setInteractive({ useHandCursor: true });
                    break;
                case 'TAKEN':
                    mainButtonZone.off('pointerdown');
                    mainButtonZone.setInteractive(false);
                    break;
            }

            const changeToCPUGraphics = this.actorChangeToCPUGraphicsList[role];
            const changeToCPUText = this.actorChangeToCPUTexts[role];
            const changeToCPUZone = this.actorChangeToCPUZones[role];
            let changeToCPUColor = 0xeeeeee;
            let changeToCPULabel = changeToCPUText.text;

            switch (this.currentActorControllers[role]) {
                case Core.ControllerType.NONE:
                    changeToCPUColor = 0xeeeeee;
                    changeToCPULabel = 'SET CPU';
                    break;
                case Core.ControllerType.PLAYER:
                    if (this.currentRole === role) {
                        changeToCPUColor = 0xeeeeee;
                        changeToCPULabel = 'SET CPU';
                    }
                    else {
                        changeToCPUColor = 0x555555;
                        changeToCPULabel = '';
                    }
                    break;
                case Core.ControllerType.CPU:
                    changeToCPUColor = 0x555555;
                    changeToCPULabel = 'CPU ACTIVE';
                    break;
            }
            const isCPUButtonHovered = changeToCPUZone.input && changeToCPUZone.input.enabled && changeToCPUZone.getBounds().contains(this.input.x, this.input.y);
            if (isCPUButtonHovered && changeToCPULabel === 'SET CPU') {
                changeToCPUColor = 0xeeee00;
            }
            changeToCPUGraphics.clear();
            changeToCPUGraphics.lineStyle(MainScene.BUTTON_LINE_THICKNESS, changeToCPUColor);
            changeToCPUGraphics.strokeRect(changeToCPUZone.x, changeToCPUZone.y, MainScene.CHANGE_TO_CPU_BUTTON_WIDTH, MainScene.CHANGE_TO_CPU_BUTTON_HEIGHT);
            changeToCPUText.setText(changeToCPULabel).setColor(Phaser.Display.Color.IntegerToColor(changeToCPUColor).rgba);

            switch (changeToCPULabel) {
                case 'SET CPU':
                    changeToCPUZone.off('pointerdown');
                    changeToCPUZone.on('pointerdown', () => {
                        this.sound.play('select');
                        this.changeToCPURequest(role);
                    });
                    changeToCPUZone.setInteractive({ useHandCursor: true });
                    break;
                default:
                    changeToCPUZone.off('pointerdown');
                    changeToCPUZone.setInteractive(false);
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
                        sprite.setVisible(true);
                        break;
                    case Core.ActorStatus.RESPAWN:
                        sprite.setVisible(false);
                        break;
                }

                const dir = visualState.dir === Core.Direction.NONE ? Core.Direction.DOWN : visualState.dir; // 方向がない場合は下向きとみなす
                const dirConfig = Core.DIRECTION_CONFIG[dir];

                const { x, y } = visualState;
                sprite.setPosition(x, y);
                if (isStunned[role]) {
                    // Stun は Speed up より優先される
                    sprite.stop();
                    sprite.setFrame(dirConfig.frameOffset + MainScene.FRAME_OFFSET_STUNNED);
                }
                else if ((this.currentRoomPhase === Core.RoomPhase.PLAYING || this.currentRoomPhase === Core.RoomPhase.WAITING) && visualState.dir !== Core.Direction.NONE) {
                    // 動いているときはアニメーションさせる
                    const animKeyBase = spriteName + '_' + dirConfig.suffix + '_';
                    if (status === Core.ActorStatus.SPEED_UP) {
                        sprite.anims.play(animKeyBase + 'boost', true);
                    }
                    else {
                        sprite.anims.play(animKeyBase + 'normal', true);
                    }
                }
                else {
                    sprite.stop();
                    sprite.setFrame(dirConfig.frameOffset);
                }
                // もし プレイ中 かつ プレイヤーが Human かつ 描画中の役が Ghost かつ Stun 状態でないなら，ライトの当たる範囲のみ見えるようにする
                if (this.currentRoomPhase === Core.RoomPhase.PLAYING && this.currentRole !== null && Core.ACTOR_CONFIG[this.currentRole].type === Core.ActorType.HUMAN && Core.ACTOR_CONFIG[role].type === Core.ActorType.GHOST && !isStunned[role]) {
                    const mask = this.visionMask.createGeometryMask();
                    sprite.setMask(mask);
                }
                else {
                    sprite.clearMask();
                }
            }
        }
    }

    private spawnScoreEffect(x: number, y: number, key: string) {
        const scoreEffect = this.add.image(x, y, key);
        scoreEffect.setOrigin(0.5, 1.0).setDepth(RenderDepth.EFFECT).setAlpha(0.0).setScale(2.0);
        this.tweens.add({
            targets: scoreEffect,
            y: scoreEffect.y - 30,
            alpha: { from: 0.0, to: 1.0 },
            duration: 700,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: scoreEffect,
                    alpha: 0.0,
                    duration: 400,
                    ease: 'Linear',
                    onComplete: () => {
                        scoreEffect.destroy();
                    }
                });
            }
        });
    }


    private calcLightPoints(visualState: Core.VisualActorState): Phaser.Math.Vector2[] | null {
        const dir = visualState.dir === Core.Direction.NONE ? Core.Direction.DOWN : visualState.dir; // 方向がない場合は下向きとみなす
        const { dx, dy, axis, lightPixelOffsetX, lightPixelOffsetY } = Core.DIRECTION_CONFIG[dir];

        const cx = visualState.x + Core.TILE_SIZE / 2;
        const cy = visualState.y + Core.TILE_SIZE / 2;

        const lightX = visualState.x + lightPixelOffsetX;
        const lightY = visualState.y + lightPixelOffsetY;

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

        const leftCornerVec = { x: dx + dy, y: -dx + dy };
        const rightCornerVec = { x: dx - dy, y: dx + dy };

        const { x: rx, y: ry } = reachGridCenter;
        const farLeft = { x: rx + leftCornerVec.x * Core.TILE_SIZE / 2, y: ry + leftCornerVec.y * Core.TILE_SIZE / 2 }; // 進行方向から見て左奥角
        const farRight = { x: rx + rightCornerVec.x * Core.TILE_SIZE / 2, y: ry + rightCornerVec.y * Core.TILE_SIZE / 2 }; // 進行方向から見て右奥角

        const distToWallLeft = Math.abs(axis === 'x' ? lightY - farLeft.y : lightX - farLeft.x);
        const distToWallRight = Math.abs(axis === 'x' ? lightY - farRight.y : lightX - farRight.x);
        const distToWallFront = Math.abs(axis === 'x' ? lightX - farLeft.x : lightY - farLeft.y);

        const points = [
            new Phaser.Math.Vector2(lightX, lightY),
        ];

        if (distToWallFront > distToWallLeft) {
            const nearLeft = { x: lightX + leftCornerVec.x * distToWallLeft, y: lightY + leftCornerVec.y * distToWallLeft };
            points.push(new Phaser.Math.Vector2(nearLeft.x, nearLeft.y));
            points.push(new Phaser.Math.Vector2(farLeft.x, farLeft.y));
        }
        else {
            const leftPoint = { x: lightX + leftCornerVec.x * distToWallFront, y: lightY + leftCornerVec.y * distToWallFront };
            points.push(new Phaser.Math.Vector2(leftPoint.x, leftPoint.y));
        }

        if (distToWallFront > distToWallRight) {
            const nearRight = { x: lightX + rightCornerVec.x * distToWallRight, y: lightY + rightCornerVec.y * distToWallRight };
            points.push(new Phaser.Math.Vector2(farRight.x, farRight.y));
            points.push(new Phaser.Math.Vector2(nearRight.x, nearRight.y));
        }
        else {
            const rightPoint = { x: lightX + rightCornerVec.x * distToWallFront, y: lightY + rightCornerVec.y * distToWallFront };
            points.push(new Phaser.Math.Vector2(rightPoint.x, rightPoint.y));
        }

        return points;
    }
}
