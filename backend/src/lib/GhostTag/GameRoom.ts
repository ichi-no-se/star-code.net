import { Namespace } from "socket.io";
import * as Core from "@shared/GhostTag/core";

interface MovementReport {
	socketId: string;
	role: Core.ActorRole;
	movement: Core.MovementState;
	time: number;
}

export class GameRoom {
	private sessions: Set<string>;
	private gameState: Core.GameState;
	private receivedMovements: MovementReport[] = [];
	private itemDeck: Core.ItemDeck;
	private readonly UPDATE_INTERVAL: number = 1000 / 20; // 20 FPS
	private suspicionHeatMap: number[][]; // CPU がゴーストを追うためのヒートマップ

	constructor(private ns: Namespace, private roomId: string) {
		this.sessions = new Set();
		this.itemDeck = new Core.ItemDeck();
		this.gameState = {
			roomPhase: Core.RoomPhase.WAITING,
			roomTimer: 0,
			actors: [],
			items: []
		}
		for (let i = 0; i < 4; i++) {
			this.gameState.actors[i] = {
				slotId: i,
				sessionId: null,
				justJoined: false,
				role: i,
				controller: Core.ControllerType.NONE,
				movement: {
					gridX: 0,
					gridY: 0,
					offsetX: 0,
					offsetY: 0,
					currentDir: Core.Direction.NONE,
					nextDir: Core.Direction.NONE,
				},
				status: Core.ActorStatus.INACTIVE,
				statusTimer: 0,
				score: 0,
				lastUpdateTime: performance.now(),
				inventory: null,
			};
		}
		this.suspicionHeatMap = [];
		for(let y = 0; y < Core.MAP_HEIGHT; y++) {
			this.suspicionHeatMap[y] = [];
			for(let x = 0; x < Core.MAP_WIDTH; x++) {
				this.suspicionHeatMap[y][x] = 0;
			}
		}

		this.startGameLoop();
	}

	private startGameLoop() {
		let lastTime = performance.now();
		setInterval(() => {
			const now = performance.now();
			const deltaTime = now - lastTime;
			lastTime = now;
			this.updateGame(deltaTime);
		}, this.UPDATE_INTERVAL);
	}

	private updateGame(deltaTime: number) {
		const now = performance.now();
		// セッション管理
		// 2 つ以上のキャラクターを同一セッションが占有している場合は両方とも切断する
		for (let i = 0; i < this.gameState.actors.length; i++) {
			const actor = this.gameState.actors[i];
			const sessionId = actor.sessionId;
			if (sessionId === null) {
				continue;
			}
			for (let j = i + 1; j < this.gameState.actors.length; j++) {
				const otherActor = this.gameState.actors[j];
				if (otherActor.sessionId === sessionId) {
					actor.sessionId = null;
					otherActor.sessionId = null;
				}
			}
		}
		// セッションとキャラクターの対応の管理
		for (const actor of this.gameState.actors) {
			if (actor.sessionId !== null && !this.sessions.has(actor.sessionId)) {
				actor.sessionId = null;
				console.log(`[GhostTag] Actor ${actor.role} in room ${this.roomId} session ${actor.sessionId} not found in sessions, setting to null`);
			}
			if (actor.sessionId === null) {
				switch (this.gameState.roomPhase) {
					case Core.RoomPhase.WAITING:
						if (actor.controller === Core.ControllerType.PLAYER) {
							actor.controller = Core.ControllerType.NONE;
							actor.status = Core.ActorStatus.INACTIVE;
						}
						else if (actor.controller === Core.ControllerType.CPU) {
							actor.movement = {
								...Core.ACTOR_CONFIG[actor.role].initialPos,
								offsetX: 0,
								offsetY: 0,
								currentDir: Core.Direction.NONE,
								nextDir: Core.Direction.NONE
							};
							actor.status = Core.ActorStatus.ACTIVE;
						}
						break;
					case Core.RoomPhase.STARTING:
						actor.controller = Core.ControllerType.CPU;
						break;
					case Core.RoomPhase.PLAYING:
						actor.controller = Core.ControllerType.CPU;
						break;
				}
			}
			else {
				if (actor.justJoined) {
					switch (this.gameState.roomPhase) {
						case Core.RoomPhase.WAITING:
							actor.controller = Core.ControllerType.PLAYER;
							actor.status = Core.ActorStatus.ACTIVE;
							actor.movement = {
								gridX: Core.ACTOR_CONFIG[actor.role].initialPos.gridX,
								gridY: Core.ACTOR_CONFIG[actor.role].initialPos.gridY,
								offsetX: 0,
								offsetY: 0,
								currentDir: Core.Direction.NONE,
								nextDir: Core.Direction.NONE
							};
							console.log(`[GhostTag] Actor ${actor.role} in room ${this.roomId} initialized for new player ${actor.sessionId}`);
							break;
						case Core.RoomPhase.STARTING:
							actor.controller = Core.ControllerType.PLAYER;
							break;
						case Core.RoomPhase.PLAYING:
							actor.controller = Core.ControllerType.PLAYER;
							break;
					}
				}
			}
			actor.justJoined = false;
		}

		// スタン状態の判定
		let isGhostStunned = false;
		for (const human of Core.HUMAN_ROLES) {
			const humanActor = this.gameState.actors[human];
			if (humanActor.status === Core.ActorStatus.STUN_ATTACKING) {
				isGhostStunned = true;
			}
		}
		let isHumanStunned = false;
		for (const ghost of Core.GHOST_ROLES) {
			const ghostActor = this.gameState.actors[ghost];
			if (ghostActor.status === Core.ActorStatus.STUN_ATTACKING) {
				isHumanStunned = true;
			}
		}
		const isStunned = Core.ACTOR_CONFIG.map(({ type }) => { if (type === Core.ActorType.HUMAN) { return isHumanStunned } else { return isGhostStunned } });

		// プレイヤーからの移動入力の反映
		for (const { socketId, role, movement, time } of this.receivedMovements) {
			const actor = this.gameState.actors[role];
			if (actor === undefined || actor.sessionId !== socketId) {
				continue;
			}
			// コントローラーが異なる，リスポーン中，スタン中，非アクティブ，ゲーム開始処理中は移動を反映しない
			if (actor.controller !== Core.ControllerType.PLAYER || actor.status === Core.ActorStatus.RESPAWN || isStunned[actor.role] || actor.status === Core.ActorStatus.INACTIVE || this.gameState.roomPhase === Core.RoomPhase.STARTING) {
				continue;
			}
			actor.movement = movement;
			actor.lastUpdateTime = time;
			// console.log(`[GhostTag] Received movement from ${socketId} at ${time}: ${JSON.stringify(movement)}`);
		}
		this.receivedMovements = [];

		const events: Core.GameEvent[] = [];

		switch (this.gameState.roomPhase) {
			case Core.RoomPhase.WAITING:
				this.gameState.roomTimer = 0;
				// 全てのプレイヤーが揃ったらゲーム開始
				let activePlayerCount = 0;
				for (const actor of this.gameState.actors) {
					if (actor.controller === Core.ControllerType.PLAYER || actor.controller === Core.ControllerType.CPU) {
						activePlayerCount++;
					}
				}
				if (activePlayerCount === 4) {
					this.gameState.roomPhase = Core.RoomPhase.STARTING;
					this.gameState.roomTimer = Core.COUNTDOWN_TIME;
					for (const { role, initialPos } of Core.ACTOR_CONFIG) {
						this.gameState.actors[role].movement = {
							gridX: initialPos.gridX,
							gridY: initialPos.gridY,
							offsetX: 0,
							offsetY: 0,
							currentDir: Core.Direction.NONE,
							nextDir: Core.Direction.NONE
						};
						this.gameState.actors[role].status = Core.ActorStatus.ACTIVE;
					}
					console.log(`[GhostTag] Room ${this.roomId} starting game with 4 players`);
				}
				break;
			case Core.RoomPhase.STARTING:
				this.gameState.roomTimer -= deltaTime;
				if (this.gameState.roomTimer <= 0) {
					this.gameState.roomPhase = Core.RoomPhase.PLAYING;
					this.gameState.roomTimer = Core.GAME_DURATION;

					// ヒートマップの初期化
					for (let y = 0; y < Core.MAP_HEIGHT; y++) {
						this.suspicionHeatMap[y] = [];
						for (let x = 0; x < Core.MAP_WIDTH; x++) {
							this.suspicionHeatMap[y][x] = Math.random() * 0.1;
						}
					}
				}
				break;
			case Core.RoomPhase.PLAYING:
				this.gameState.roomTimer -= deltaTime;
				// CPU の移動処理
				// ヒートマップの更新
				for (const role of Core.HUMAN_ROLES) {
					this.suspicionHeatMap[this.gameState.actors[role].movement.gridY][this.gameState.actors[role].movement.gridX] = 0;
				}
				if (isGhostStunned) {
					for (const role of Core.GHOST_ROLES) {
						this.suspicionHeatMap[this.gameState.actors[role].movement.gridY][this.gameState.actors[role].movement.gridX] = 1;
					}
				}
				if (!isHumanStunned) {
					const visibleGrids = new Set<string>();
					for (const role of Core.HUMAN_ROLES) {
						const humanActor = this.gameState.actors[role];
						let dir = humanActor.movement.currentDir;
						if (dir === Core.Direction.NONE) {
							dir = Core.Direction.DOWN;
						}
						let gridX = humanActor.movement.gridX;
						let gridY = humanActor.movement.gridY;
						while (true) {
							gridX += Core.DIRECTION_CONFIG[dir].dx;
							gridY += Core.DIRECTION_CONFIG[dir].dy;
							if (gridX < 0 || gridX >= Core.MAP_WIDTH || gridY < 0 || gridY >= Core.MAP_HEIGHT || Core.MAP[gridY][gridX] !== 0) {
								break;
							}
							visibleGrids.add(`${gridX},${gridY}`);
							this.suspicionHeatMap[gridY][gridX] *= 0.98; // 視界に入っているグリッドの疑いを減らす
						}
					}
					for (const role of Core.GHOST_ROLES) {
						const ghostActor = this.gameState.actors[role];
						if (ghostActor.status === Core.ActorStatus.RESPAWN || ghostActor.status === Core.ActorStatus.INACTIVE) {
							continue;
						}
						if (visibleGrids.has(`${ghostActor.movement.gridX},${ghostActor.movement.gridY}`)) {
							this.suspicionHeatMap[ghostActor.movement.gridY][ghostActor.movement.gridX] = 1;
						}
					}
				}

				const nextHeatMap: number[][] = [];
				for (let y = 0; y < Core.MAP_HEIGHT; y++) {
					nextHeatMap[y] = [];
					for (let x = 0; x < Core.MAP_WIDTH; x++) {
						if (Core.MAP[y][x] !== 0) {
							nextHeatMap[y][x] = 0;
							continue;
						}
						let count = 1;
						let heat = this.suspicionHeatMap[y][x];
						for (const { dx,dy} of Object.values(Core.DIRECTION_CONFIG)) {
							const nextX = x + dx;
							const nextY = y + dy;
							if (nextX >= 0 && nextX < Core.MAP_WIDTH && nextY >= 0 && nextY < Core.MAP_HEIGHT && Core.MAP[nextY][nextX] === 0) {
								count++;
								heat += this.suspicionHeatMap[nextY][nextX];
							}
						}
						nextHeatMap[y][x] = heat / count;
					}
				}
				this.suspicionHeatMap = nextHeatMap;

				for (const actor of this.gameState.actors) {
					if (actor.controller === Core.ControllerType.CPU) {
						if (actor.status === Core.ActorStatus.RESPAWN || actor.status === Core.ActorStatus.INACTIVE || isStunned[actor.role]) {
							continue;
						}
						let nextDir = Core.Direction.NONE;
						if (Core.ACTOR_CONFIG[actor.role].type === Core.ActorType.GHOST) {
							nextDir = this.computeGhostCPUMovement(actor.role);
						}
						else {
							nextDir = this.computeHumanCPUMovement(actor.role);
						}
						if (nextDir !== Core.Direction.NONE) {
							actor.movement.nextDir = nextDir;
						}
						actor.movement = Core.calcNextMovement(actor.movement, Core.calcSpeed(actor.role, actor.status, isStunned[actor.role]) * (deltaTime / 1000));
						actor.lastUpdateTime = now;
						if (actor.inventory !== null) {
							// アイテム使用はランダム
							if (Math.random() < 0.05) {
								this.executeUseItem(actor.role);
							}
						}
					}
				}
				// アイテム取得処理
				for (const actor of this.gameState.actors) {
					if (actor.status === Core.ActorStatus.INACTIVE) {
						console.error(`Actor ${actor.role} is inactive during playing phase`);
						continue;
					}
					if (actor.status === Core.ActorStatus.RESPAWN) {
						continue; // リスポーン中はアイテムを取れない
					}
					for (let i = this.gameState.items.length - 1; i >= 0; i--) {
						const item = this.gameState.items[i];
						const distance = Math.abs(actor.movement.gridX + actor.movement.offsetX - item.gridX) + Math.abs(actor.movement.gridY + actor.movement.offsetY - item.gridY);
						if (distance <= Core.ITEM_GET_DISTANCE) {
							const itemCategory = Core.ITEM_CONFIG[item.type].category;
							const actorType = Core.ACTOR_CONFIG[actor.role].type;
							let pickedUp = false;
							if (actorType === Core.ActorType.GHOST && itemCategory === Core.ItemCategory.SCORE) {
								pickedUp = true;
								let scoreToAdd: Core.ItemScore;
								if (actor.status === Core.ActorStatus.SPEED_UP) {
									scoreToAdd = Core.SCORE_SPEED_UP_NORMAL;
								} else {
									scoreToAdd = Core.SCORE_ITEM_NORMAL;
								}
								actor.score += scoreToAdd;
								events.push({
									type: Core.GameEventType.ITEM_PICK_UP,
									role: actor.role,
									itemState: item,
									earnedScore: scoreToAdd,
								})
							}
							if (actorType === Core.ActorType.GHOST && itemCategory === Core.ItemCategory.SCORE_SPECIAL) {
								pickedUp = true;
								let scoreToAdd: Core.ItemScore;
								if (actor.status === Core.ActorStatus.SPEED_UP) {
									scoreToAdd = Core.SCORE_SPEED_UP_SPECIAL;
								} else {
									scoreToAdd = Core.SCORE_ITEM_SPECIAL;
								}
								actor.score += scoreToAdd;
								events.push({
									type: Core.GameEventType.ITEM_PICK_UP,
									role: actor.role,
									itemState: item,
									earnedScore: scoreToAdd,
								})
							}
							// その他のアイテム：アイテムを所持しているなら拾わない，そうでないなら拾う
							if (actor.inventory === null && (itemCategory === Core.ItemCategory.SPEED_UP || itemCategory === Core.ItemCategory.STUN)) {
								if (item.type !== Core.ItemType.SPEED_UP && item.type !== Core.ItemType.STUN) {
									console.error(`Unexpected item type ${item.type} in category ${itemCategory}`);
									continue;
								}
								pickedUp = true;
								actor.inventory = item.type;
								events.push({
									type: Core.GameEventType.ITEM_PICK_UP,
									role: actor.role,
									itemState: item,
								})
							}

							if (pickedUp) {
								this.gameState.items.splice(i, 1);
								if (Core.ACTOR_CONFIG[actor.role].type === Core.ActorType.GHOST) {
									this.suspicionHeatMap[actor.movement.gridY][actor.movement.gridX] = 1;
								}
							}
						}
					}
				}

				// 捕まえた判定処理
				for (const humanRole of Core.HUMAN_ROLES) {
					const humanActor = this.gameState.actors[humanRole];
					if (isStunned[humanActor.role]) {
						continue;
					}
					if (humanActor.status === Core.ActorStatus.INACTIVE) {
						console.error(`Human actor ${humanRole} is inactive during playing phase`);
						continue;
					}
					for (const ghostRole of Core.GHOST_ROLES) {
						const ghostActor = this.gameState.actors[ghostRole];
						if (ghostActor.status === Core.ActorStatus.RESPAWN) {
							continue; // リスポーン中は捕まえられない
						}
						if (ghostActor.status === Core.ActorStatus.INACTIVE) {
							console.error(`Ghost actor ${ghostRole} is inactive during playing phase`);
							continue;
						}
						const distance = Math.abs(humanActor.movement.gridX + humanActor.movement.offsetX - ghostActor.movement.gridX - ghostActor.movement.offsetX) + Math.abs(humanActor.movement.gridY + humanActor.movement.offsetY - ghostActor.movement.gridY - ghostActor.movement.offsetY);
						if (distance <= Core.TAG_DISTANCE) {
							humanActor.score += Core.SCORE_TAG;
							const respawnPosition = this.randomGhostSpawnPosition();

							ghostActor.status = Core.ActorStatus.RESPAWN;
							ghostActor.statusTimer = Core.RESPAWN_DURATION;
							ghostActor.inventory = null; // 捕まったらアイテムも消える
							const taggedEvent: Core.PlayerTaggedEvent = {
								type: Core.GameEventType.PLAYER_TAGGED,
								taggerRole: humanRole,
								taggedRole: ghostRole,
								taggedPosition: {
									gridX: ghostActor.movement.gridX,
									offsetX: ghostActor.movement.offsetX,
									gridY: ghostActor.movement.gridY,
									offsetY: ghostActor.movement.offsetY
								},
								respawnPosition: {
									gridX: respawnPosition.gridX,
									gridY: respawnPosition.gridY
								}
							};
							ghostActor.movement = {
								gridX: respawnPosition.gridX,
								gridY: respawnPosition.gridY,
								offsetX: 0,
								offsetY: 0,
								currentDir: Core.Direction.NONE,
								nextDir: Core.Direction.NONE
							};
							events.push(taggedEvent);
						}
					}
				}

				// アイテムスポーン処理
				while (this.gameState.items.length < Core.MAX_ITEMS_ON_FIELD) {
					this.spawnItem();
				}

				// プレイヤーの状態（スタン，スピードアップ，リスポーン）の経過時間処理
				for (const actor of this.gameState.actors) {
					if (actor.status === Core.ActorStatus.STUN_ATTACKING || actor.status === Core.ActorStatus.SPEED_UP || actor.status === Core.ActorStatus.RESPAWN) {
						actor.statusTimer -= deltaTime;
						if (actor.statusTimer <= 0) {
							actor.statusTimer = 0;
							actor.status = Core.ActorStatus.ACTIVE;
							actor.inventory = null;
						}
					}
				}

				if (this.gameState.roomTimer <= 0) {
					// 結果のイベントを送る
					events.push({
						type: Core.GameEventType.GAME_OVER,
						scores: this.gameState.actors.map(a => ({ role: a.role, score: a.score }))
					});
					// 全員を非アクティブにして待機状態に戻す
					for (const actor of this.gameState.actors) {
						actor.status = Core.ActorStatus.INACTIVE;
						actor.controller = Core.ControllerType.NONE;
						actor.sessionId = null;
						actor.movement = {
							gridX: 0,
							gridY: 0,
							offsetX: 0,
							offsetY: 0,
							currentDir: Core.Direction.NONE,
							nextDir: Core.Direction.NONE
						};
						actor.statusTimer = 0;
						actor.score = 0;
						actor.inventory = null;
					}
					this.gameState.roomPhase = Core.RoomPhase.WAITING;
					this.gameState.roomTimer = 0;
					this.gameState.items = [];
					this.itemDeck.reset();
					console.log(`[GhostTag] Room ${this.roomId} game over`);
				}
				break;
		}

		const gameSnapshot: Core.GameSnapshot = {
			roomPhase: this.gameState.roomPhase,
			roomTimer: this.gameState.roomTimer,
			actors: this.gameState.actors.map(a => {
				// 補間処理
				const timeSinceLastUpdate = now - a.lastUpdateTime;
				const currentSpeed = Core.calcSpeed(a.role, a.status, isStunned[a.role]);
				const distance = currentSpeed * (timeSinceLastUpdate / 1000);
				const predictedMovement = Core.calcNextMovement(a.movement, distance);
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
		const newItemType = Core.sampleItemTypeByCategory(newItemCategory);
		// なるべく既存のアイテムと被らない位置を選ぶ
		let bestPos = Core.randomMapPosition();
		let maxMinDist = -1;

		const ITEM_SPAWN_SAFE_DISTANCE = 2; // アイテムがスポーンする位置は既存のキャラクターからこの距離以上離す
		for (let attempt = 0; attempt < 10; attempt++) {
			let pos: { gridX: number; gridY: number };
			// キャラクターと被らないようにする
			let intersectionWithExistingActor: boolean;
			do {
				pos = Core.randomMapPosition();
				intersectionWithExistingActor = false;
				for (const actor of this.gameState.actors) {
					const { gridX, offsetX, gridY, offsetY } = actor.movement;
					const distance = Math.abs(pos.gridX - (gridX + offsetX)) + Math.abs(pos.gridY - (gridY + offsetY));
					if (distance < ITEM_SPAWN_SAFE_DISTANCE) {
						intersectionWithExistingActor = true;
						break;
					}
				}
			} while (intersectionWithExistingActor);
			let minDistanceToItem = Infinity;
			for (const actor of this.gameState.actors) {
				const actorPos = {
					gridX: actor.movement.gridX,
					gridY: actor.movement.gridY
				};
				const distance = Math.abs(pos.gridX - actorPos.gridX) + Math.abs(pos.gridY - actorPos.gridY);
				if (distance < minDistanceToItem) {
					minDistanceToItem = distance;
				}
			}
			for (const item of this.gameState.items) {
				const distance = Math.abs(pos.gridX - item.gridX) + Math.abs(pos.gridY - item.gridY);
				if (distance < minDistanceToItem) {
					minDistanceToItem = distance;
				}
			}
			if (minDistanceToItem > maxMinDist) {
				maxMinDist = minDistanceToItem;
				bestPos = pos;
			}
		}
		const newItem = {
			type: newItemType,
			...bestPos
		};
		this.gameState.items.push(newItem);
	}

	private randomGhostSpawnPosition(): { gridX: number; gridY: number } {
		// ゴーストのスポーン位置は人間からなるべく遠い位置にする
		let bestPos = Core.randomMapPosition();
		let maxMinDistToHuman = -1;
		for (let attempt = 0; attempt < 5; attempt++) {
			let intersectionWithExistingItem = false;
			let pos: { gridX: number; gridY: number };
			do {
				pos = Core.randomMapPosition();
				intersectionWithExistingItem = this.gameState.items.some(item => item.gridX === pos.gridX && item.gridY === pos.gridY);
			} while (intersectionWithExistingItem);
			let minDistanceToHuman = Infinity;
			for (const actor of this.gameState.actors) {
				if (Core.ACTOR_CONFIG[actor.role].type === Core.ActorType.HUMAN) {
					const actorPos = {
						gridX: actor.movement.gridX,
						gridY: actor.movement.gridY
					};
					const distance = Math.abs(pos.gridX - actorPos.gridX) + Math.abs(pos.gridY - actorPos.gridY);
					if (distance < minDistanceToHuman) {
						minDistanceToHuman = distance;
					}
				}
			}
			if (minDistanceToHuman > maxMinDistToHuman) {
				maxMinDistToHuman = minDistanceToHuman;
				bestPos = pos;
			}
		}
		return bestPos;
	}

	private computeHumanCPUMovement(role: Core.ActorRole): Core.Direction {
		// 周囲のヒートマップを見て，最も値が高い方向に移動する
		const { gridX, gridY } = this.gameState.actors[role].movement;
	 	let bestHeat = -1;
		let bestDir: Core.Direction = Core.Direction.NONE;
		for (const [dir, { dx, dy }] of Object.entries(Core.DIRECTION_CONFIG)) {
			const nextX = gridX + dx;
			const nextY = gridY + dy;
			if (nextX < 0 || nextX >= Core.MAP_WIDTH || nextY < 0 || nextY >= Core.MAP_HEIGHT || Core.MAP[nextY][nextX] !== 0) {
				continue;
			}
			if (this.suspicionHeatMap[nextY][nextX] > bestHeat) {
				bestHeat = this.suspicionHeatMap[nextY][nextX];
				bestDir = parseInt(dir) as Core.Direction;
			}
			else if (this.suspicionHeatMap[nextY][nextX] === bestHeat && Math.random() < 0.5) {
				bestDir = parseInt(dir) as Core.Direction;
			}
		}
		return bestDir;
	}

	private computeGhostCPUMovement(role: Core.ActorRole): Core.Direction {
		// なるべく人間から遠ざかる方向に移動する
		// BFS で人間からの距離を計算
		const distanceMap: number[][] = [];
		for (let y = 0; y < Core.MAP_HEIGHT; y++) {
			distanceMap[y] = [];
			for (let x = 0; x < Core.MAP_WIDTH; x++) {
				distanceMap[y][x] = Infinity;
			}
		}
		const queue: { gridX: number; gridY: number, distance: number }[] = [];
		for (const role of Core.HUMAN_ROLES) {
			const actor = this.gameState.actors[role];
			if (actor.status === Core.ActorStatus.INACTIVE) {
				continue;
			}
			queue.push({ gridX: actor.movement.gridX, gridY: actor.movement.gridY, distance: 0 });
			distanceMap[actor.movement.gridY][actor.movement.gridX] = 0;
		}
		while (queue.length > 0) {
			const { gridX, gridY, distance } = queue.shift()!;
			for (const { dx, dy } of Object.values(Core.DIRECTION_CONFIG)) {
				const nextX = gridX + dx;
				const nextY = gridY + dy;
				if (nextX < 0 || nextX >= Core.MAP_WIDTH || nextY < 0 || nextY >= Core.MAP_HEIGHT || Core.MAP[nextY][nextX] !== 0) {
					continue;
				}
				if (distance + 1 < distanceMap[nextY][nextX]) {
					distanceMap[nextY][nextX] = distance + 1;
					queue.push({ gridX: nextX, gridY: nextY, distance: distance + 1 });
				}
			}
		}

		const { gridX, gridY } = this.gameState.actors[role].movement;
		const currentDistance = distanceMap[gridY][gridX];
		if (currentDistance >= 12) {
			// 人間から十分遠い場合はランダムウォーク
			const currentDir = this.gameState.actors[role].movement.currentDir;
			const currentDirOpposite = currentDir === Core.Direction.NONE ? Core.Direction.NONE : Core.DIRECTION_CONFIG[currentDir].opposite;
			while (true) {
				const dir = Math.floor(Math.random() * 5) as Core.Direction;
				if (dir === currentDirOpposite || dir === Core.Direction.NONE) {
					continue; // 逆方向には行かない
				}
				return dir;
			}
		}

		let bestDistance = -1;
		let bestDir: Core.Direction = Core.Direction.NONE;
		for (const [dir, { dx, dy }] of Object.entries(Core.DIRECTION_CONFIG)) {
			const nextX = gridX + dx;
			const nextY = gridY + dy;
			if (nextX < 0 || nextX >= Core.MAP_WIDTH || nextY < 0 || nextY >= Core.MAP_HEIGHT || Core.MAP[nextY][nextX] !== 0) {
				continue;
			}
			if (distanceMap[nextY][nextX] > bestDistance) {
				bestDistance = distanceMap[nextY][nextX];
				bestDir = parseInt(dir) as Core.Direction;
			}
			else if (distanceMap[nextY][nextX] === bestDistance && Math.random() < 0.5) {
				bestDir = parseInt(dir) as Core.Direction;
			}
		}
		return bestDir;
	}

	private broadcastGameSnapshot(gameSnapshot: Core.GameSnapshot) {
		this.ns.to(this.roomId).emit("gameSnapshot", gameSnapshot);
	}

	public joinGamePlayer(socketId: string, role: Core.ActorRole) {
		if (!this.sessions.has(socketId)) {
			console.log(`[GhostTag] joinGamePlayer: Session not found for socket ${socketId}`);
			return;
		}
		this.leaveGamePlayer(socketId); // 既にどこかの役割についている場合は一旦切断する
		const actor = this.gameState.actors[role];
		if (actor === undefined) {
			console.log(`[GhostTag] joinGamePlayer: Actor not found for role ${role}`);
			return;
		}
		if (actor.sessionId !== null) {
			console.log(`[GhostTag] joinGamePlayer: Actor for role ${role} is already occupied by session ${actor.sessionId}`);
			return;
		}
		console.log(`[GhostTag] joinGamePlayer: Socket ${socketId} joined as role ${role} in ${this.roomId}`);
		actor.sessionId = socketId;
		actor.justJoined = true;
	}

	public changePlayerToCPU(socketId: string, role: Core.ActorRole) {
		if (!this.sessions.has(socketId)) {
			console.log(`[GhostTag] changePlayerToCPU: Session not found for socket ${socketId}`);
			return;
		}
		const actor = this.gameState.actors[role];
		if (actor === undefined) {
			console.log(`[GhostTag] changePlayerToCPU: Actor not found for role ${role}`);
			return;
		}
		if (actor.sessionId === null) {
			actor.controller = Core.ControllerType.CPU;
			console.log(`[GhostTag] changePlayerToCPU: Socket ${socketId} changed to CPU for role ${role} in ${this.roomId}`);
		}
		else if (actor.sessionId === socketId) {
			actor.sessionId = null;
			actor.controller = Core.ControllerType.CPU;
			console.log(`[GhostTag] changePlayerToCPU: Socket ${socketId} changed to CPU for role ${role} in ${this.roomId}`);
		}
		else {
			console.log(`[GhostTag] changePlayerToCPU: Socket ${socketId} attempted to change to CPU for role ${role} in ${this.roomId}, but that role is occupied by another session ${actor.sessionId}`);
		}
	}

	public leaveGamePlayer(socketId: string) {
		if (!this.sessions.has(socketId)) {
			console.log(`[GhostTag] leaveGamePlayer: Session not found for socket ${socketId}`);
			return;
		}
		const actors = this.gameState.actors.filter(a => a.sessionId === socketId);
		// 本来は 0 か 1 のはずだが，念のため複数あった場合は全て切断する
		for (const actor of actors) {
			console.log(`[GhostTag] leaveGamePlayer: Socket ${socketId} left from role ${actor.role} in ${this.roomId}`);
			actor.sessionId = null;
		}
	}

	private executeUseItem(role: Core.ActorRole) {
		const actor = this.gameState.actors[role];
		if (actor.inventory === null || actor.status === Core.ActorStatus.STUN_ATTACKING || actor.status === Core.ActorStatus.SPEED_UP || actor.status === Core.ActorStatus.RESPAWN) {
			return;
		}
		const itemType = actor.inventory;
		switch (itemType) {
			case Core.ItemType.SPEED_UP:
				actor.status = Core.ActorStatus.SPEED_UP;
				actor.statusTimer = Core.ACTOR_CONFIG[actor.role].boostDuration;
				break;
			case Core.ItemType.STUN:
				actor.status = Core.ActorStatus.STUN_ATTACKING;
				actor.statusTimer = Core.ACTOR_CONFIG[actor.role].stunAttackingDuration;
				break;
		}
	}

	public useItemRequest(socketId: string, role: Core.ActorRole) {
		if (!this.sessions.has(socketId)) {
			console.log(`[GhostTag] useItemRequest: Session not found for socket ${socketId}`);
			return;
		}
		const actor = this.gameState.actors[role];
		if (actor === undefined) {
			console.log(`[GhostTag] useItemRequest: Actor not found for role ${role}`);
			return;
		}
		if (actor.sessionId !== socketId) {
			console.log(`[GhostTag] useItemRequest: Socket ${socketId} attempted to use item for role ${role} in ${this.roomId}, but that role is occupied by another session ${actor.sessionId}`);
			return;
		}
		this.executeUseItem(role);
	}

	public addPlayer(socketId: string) {
		console.log(`[GhostTag] addPlayer: Socket ${socketId} added to ${this.roomId}`);
		this.sessions.add(socketId);
	}

	public removePlayer(socketId: string) {
		this.sessions.delete(socketId);
		console.log(`[GhostTag] removePlayer: Socket ${socketId} removed from ${this.roomId}`);
	}

	public receivePlayerMovement(socketId: string, role: Core.ActorRole, movement: Core.MovementState) {
		this.receivedMovements.push({ socketId, role, movement, time: performance.now() });
	}

	public getPlayerCount(): number {
		return this.sessions.size;
	}

	public getRoomId(): string {
		return this.roomId;
	}

	public findSession(socketId: string): boolean {
		return this.sessions.has(socketId);
	}
}