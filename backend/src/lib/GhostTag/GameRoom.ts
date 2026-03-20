import { Namespace } from "socket.io";
import {
	ActorRole, ActorStatus, ControllerType, GameState, RoomPhase, Direction, Session, MovementState, ItemType,
	GameSnapshot, GameEvent, calcNextMovement,
	ITEM_GET_DISTANCE, ITEM_CONFIG,
	ACTOR_CONFIG, COUNTDOWN_TIME,
	GAME_DURATION,
	ItemDeck,
	sampleItemTypeByCategory,
	randomMapPosition,
	MAX_ITEMS_ON_FIELD,
	ActorType,
	ItemCategory,
	SCORE_ITEM_NORMAL, SCORE_ITEM_SPECIAL,
	GameEventType
} from "@shared/GhostTag/core";

interface MovementReport {
	socketId: string;
	role: ActorRole;
	movement: MovementState;
	time: number;
}

export class GameRoom {
	private sessions: Map<string, Session>;
	private intervalId: NodeJS.Timeout | null = null;
	private gameState: GameState;
	private receivedMovements: MovementReport[] = [];
	private updateInterval: number = 1000 / 20; // 20 FPS
	private itemDeck: ItemDeck;

	constructor(private ns: Namespace, private roomId: string) {
		this.sessions = new Map();
		this.itemDeck = new ItemDeck();
		this.gameState = {
			roomPhase: RoomPhase.WAITING,
			roomTimer: 0,
			actors: [],
			items: []
		}
		for (let i = 0; i < 4; i++) {
			this.gameState.actors[i] = {
				slotId: i,
				sessionId: null,
				role: i,
				controller: ControllerType.NONE,
				movement: {
					gridX: 0,
					gridY: 0,
					offsetX: 0,
					offsetY: 0,
					currentDir: Direction.NONE,
					nextDir: Direction.NONE,
				},
				status: ActorStatus.INACTIVE,
				statusTimer: 0,
				score: 0,
				lastUpdateTime: performance.now(),
				inventory: null,
			};
		}
		this.startGameLoop();
	}

	public findSession(socketId: string): Session | undefined {
		return this.sessions.get(socketId);
	}

	private startGameLoop() {
		let lastTime = performance.now();
		this.intervalId = setInterval(() => {
			const now = performance.now();
			const deltaTime = now - lastTime;
			lastTime = now;
			this.updateGame(deltaTime);
		}, this.updateInterval);
	}

	private updateGame(deltaTime: number) {
		for (const { socketId, role, movement, time } of this.receivedMovements) {
			const actor = this.gameState.actors.find(a => a.sessionId === socketId && a.role === role);
			if (actor) {
				actor.movement = movement;
				actor.lastUpdateTime = time;
			}
			// console.log(`[GhostTag] Received movement from ${socketId} at ${time}: ${JSON.stringify(movement)}`);
		}
		this.receivedMovements = [];

		const events: GameEvent[] = [];

		switch (this.gameState.roomPhase) {
			case RoomPhase.WAITING:
				this.gameState.roomTimer = 0;
				// 全てのプレイヤーが揃ったらゲーム開始
				let activePlayerCount = 0;
				for (const actor of this.gameState.actors) {
					if (actor.controller === ControllerType.PLAYER || actor.controller === ControllerType.CPU) {
						activePlayerCount++;
					}
				}
				if (activePlayerCount === 4) {
					this.gameState.roomPhase = RoomPhase.STARTING;
					this.gameState.roomTimer = COUNTDOWN_TIME;
					for (const { role, initialPos } of ACTOR_CONFIG) {
						this.gameState.actors[role].movement = {
							gridX: initialPos.gridX,
							gridY: initialPos.gridY,
							offsetX: 0,
							offsetY: 0,
							currentDir: Direction.NONE,
							nextDir: Direction.NONE
						};
						this.gameState.actors[role].status = ActorStatus.ACTIVE;
					}
					console.log(`[GhostTag] Room ${this.roomId} starting game with 4 players`);
				}
				break;
			case RoomPhase.STARTING:
				this.gameState.roomTimer -= deltaTime;
				if (this.gameState.roomTimer <= 0) {
					this.gameState.roomPhase = RoomPhase.PLAYING;
					this.gameState.roomTimer = GAME_DURATION;
				}

				break;
			case RoomPhase.PLAYING:
				this.gameState.roomTimer -= deltaTime;
				// アイテム取得処理
				for (const actor of this.gameState.actors) {
					if (actor.status === ActorStatus.INACTIVE) {
						// ここに来るのはおかしいが、念のため非アクティブは処理しない
						// ゲーム中に途中退出すると非アクティブになってここに来る可能性がある
						// 非アクティブにする代わりに CPU 制御に今後するのでここはどのみち踏まない予定
						// TODO: 途中退出プレイヤーの処理（ここに書くわけではないが）
						continue;
					}
					if (actor.status === ActorStatus.RESPAWN) {
						continue; // リスポーン中はアイテムを取れない
					}
					for (let i = this.gameState.items.length - 1; i >= 0; i--) {
						const item = this.gameState.items[i];
						const distance = Math.abs(actor.movement.gridX + actor.movement.offsetX - item.gridX) + Math.abs(actor.movement.gridY + actor.movement.offsetY - item.gridY);
						if (distance <= ITEM_GET_DISTANCE) {
							const itemCategory = ITEM_CONFIG[item.type].category;
							const actorType = ACTOR_CONFIG[actor.role].type;
							let pickedUp = false;
							if (actorType === ActorType.GHOST && itemCategory === ItemCategory.SCORE) {
								pickedUp = true;
								let scoreToAdd;
								if (actor.status === ActorStatus.SPEED_UP) {
									scoreToAdd = SCORE_ITEM_SPECIAL;
								} else {
									scoreToAdd = SCORE_ITEM_NORMAL;
								}
								actor.score += scoreToAdd;
								events.push({
									type: GameEventType.ITEM_PICK_UP,
									role: actor.role,
									itemState: item,
									earnedScore: scoreToAdd,
								})
							}
							if (actorType === ActorType.GHOST && itemCategory === ItemCategory.SCORE_SPECIAL) {
								pickedUp = true;
								let scoreToAdd;
								if (actor.status === ActorStatus.SPEED_UP) {
									scoreToAdd = SCORE_ITEM_SPECIAL;
								} else {
									scoreToAdd = SCORE_ITEM_NORMAL;
								}
								actor.score += scoreToAdd;
								events.push({
									type: GameEventType.ITEM_PICK_UP,
									role: actor.role,
									itemState: item,
									earnedScore: scoreToAdd,
								})
							}
							// その他のアイテム：アイテムを所持しているなら拾わない，そうでないなら拾う
							if (actor.inventory === null && (itemCategory === ItemCategory.SPEED_UP || itemCategory === ItemCategory.STUN)) {
								if(item.type !== ItemType.SPEED_UP && item.type !== ItemType.STUN) {
									console.error(`Unexpected item type ${item.type} in category ${itemCategory}`);
									continue;
								}
								pickedUp = true;
								actor.inventory = item.type;
								events.push({
									type: GameEventType.ITEM_PICK_UP,
									role: actor.role,
									itemState: item,
									earnedScore: 0,
								})
							}

							if (pickedUp) {
								this.gameState.items.splice(i, 1);
							}
						}
					}
				}

				// 捕まえた判定処理
				// TODO: そのうち書く

				// アイテムスポーン処理
				while (this.gameState.items.length < MAX_ITEMS_ON_FIELD) {
					this.spawnItem();
				}
				if (this.gameState.roomTimer <= 0) {
					// 結果のイベントを将来的に追加
					events.push({
						type: GameEventType.GAME_OVER,
						scores: this.gameState.actors.map(a => ({ role: a.role, score: a.score }))
					});
					// 全員を非アクティブにして待機状態に戻す
					for (const actor of this.gameState.actors) {
						actor.status = ActorStatus.INACTIVE;
						actor.controller = ControllerType.NONE;
						actor.sessionId = null;
						actor.movement = {
							gridX: 0,
							gridY: 0,
							offsetX: 0,
							offsetY: 0,
							currentDir: Direction.NONE,
							nextDir: Direction.NONE
						};
						actor.statusTimer = 0;
						actor.score = 0;
					}
					this.gameState.roomPhase = RoomPhase.WAITING;
					this.gameState.roomTimer = 0;
					this.gameState.items = [];
					this.itemDeck.reset();
					console.log(`[GhostTag] Room ${this.roomId} game over`);
				}
				break;
		}

		const gameSnapshot: GameSnapshot = {
			roomPhase: this.gameState.roomPhase,
			roomTimer: this.gameState.roomTimer,
			actors: this.gameState.actors.map(a => {
				// 補間処理
				const timeSinceLastUpdate = performance.now() - a.lastUpdateTime;
				const speed = ACTOR_CONFIG[a.role].speed;
				const distance = speed * (timeSinceLastUpdate / 1000);
				const predictedMovement = calcNextMovement(a.movement, distance);
				return {
					movement: predictedMovement,
					status: a.status,
					statusTimer: a.statusTimer,
					sessionId: a.sessionId,
					role: a.role,
					controller: a.controller,
					score: a.score,
					inventory: a.inventory,
				};
			}),
			events,
			items: this.gameState.items
		};

		this.broadcastGameSnapshot(gameSnapshot);
	}

	private spawnItem() {
		const newItemCategory = this.itemDeck.pick();
		const newItemType = sampleItemTypeByCategory(newItemCategory);
		// なるべく既存のアイテム，プレイヤーと被らない位置を選ぶ
		let bestPos = randomMapPosition();
		let maxMinDist = -1;
		for (let attempt = 0; attempt < 10; attempt++) {
			const pos = randomMapPosition();
			let minDistanceToActorOrItem = Infinity;
			for (const actor of this.gameState.actors) {
				const actorPos = {
					gridX: actor.movement.gridX,
					gridY: actor.movement.gridY
				};
				const distance = Math.abs(pos.gridX - actorPos.gridX) + Math.abs(pos.gridY - actorPos.gridY);
				if (distance < minDistanceToActorOrItem) {
					minDistanceToActorOrItem = distance;
				}
			}
			for (const item of this.gameState.items) {
				const distance = Math.abs(pos.gridX - item.gridX) + Math.abs(pos.gridY - item.gridY);
				if (distance < minDistanceToActorOrItem) {
					minDistanceToActorOrItem = distance;
				}
			}
			if (minDistanceToActorOrItem > maxMinDist) {
				maxMinDist = minDistanceToActorOrItem;
				bestPos = pos;
			}
		}
		const newItem = {
			type: newItemType,
			...bestPos
		};
		this.gameState.items.push(newItem);
	}

	private broadcastGameSnapshot(gameSnapshot: GameSnapshot) {
		this.ns.to(this.roomId).emit("gameSnapshot", gameSnapshot);
	}

	public joinGamePlayer(socketId: string, role: ActorRole) {
		const session = this.sessions.get(socketId);
		if (!session) {
			console.log(`[GhostTag] joinGamePlayer: Session not found for socket ${socketId}`);
			return;
		}
		const slotId = session.joinedSlotId;
		if (slotId !== null) {
			this.leaveGamePlayer(socketId);
		}
		const actor = this.gameState.actors.find(a => a.role === role);
		if (!actor) {
			console.log(`[GhostTag] joinGamePlayer: Actor not found for role ${role}`);
			return;
		}
		if (actor.sessionId) {
			console.log(`[GhostTag] joinGamePlayer: Actor for role ${role} is already occupied by session ${actor.sessionId}`);
			return;
		}
		console.log(`[GhostTag] joinGamePlayer: Socket ${socketId} joined as role ${role} in ${this.roomId}`);
		actor.sessionId = socketId;
		actor.controller = ControllerType.PLAYER;
		actor.status = ActorStatus.ACTIVE;
		session.joinedSlotId = actor.slotId;
		console.log(`${JSON.stringify(actor)}`);
		actor.movement = {
			gridX: ACTOR_CONFIG[role].initialPos.gridX,
			gridY: ACTOR_CONFIG[role].initialPos.gridY,
			offsetX: 0,
			offsetY: 0,
			currentDir: Direction.NONE,
			nextDir: Direction.NONE
		};
	}

	public leaveGamePlayer(socketId: string) {
		const session = this.sessions.get(socketId);
		if (!session) {
			console.log(`[GhostTag] leaveGamePlayer: Session not found for socket ${socketId}`);
			return;
		}
		const slotId = session.joinedSlotId;
		if (slotId === null) {
			return;
		}
		console.log(`[GhostTag] leaveGamePlayer: Socket ${socketId} left game player role ${slotId} in ${this.roomId}`);
		const actor = this.gameState.actors[slotId];
		// TODO この辺まずいので直す というか 毎ループごとに session から確認する方が堅実
		actor.sessionId = null;
		actor.controller = ControllerType.NONE;
		actor.status = ActorStatus.INACTIVE;
		session.joinedSlotId = null;
	}

	public addPlayer(socketId: string) {
		console.log(`[GhostTag] addPlayer: Socket ${socketId} added to ${this.roomId}`);
		const newSession: Session = {
			id: socketId,
			joinedSlotId: null
		};
		this.sessions.set(socketId, newSession);
	}

	public removePlayer(socketId: string) {
		this.sessions.delete(socketId);
		console.log(`[GhostTag] removePlayer: Socket ${socketId} removed from ${this.roomId}`);
	}

	public receivePlayerMovement(socketId: string, role: ActorRole, movement: MovementState) {
		this.receivedMovements.push({ socketId, role, movement, time: performance.now() });
	}

	public getPlayerCount(): number {
		return this.sessions.size;
	}

	public getRoomId(): string {
		return this.roomId;
	}
}