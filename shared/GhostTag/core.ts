export enum Direction {
	NONE = 0,
	UP = 1,
	DOWN = 2,
	LEFT = 3,
	RIGHT = 4
}

export enum ControllerType {
	NONE = 0,
	PLAYER = 1,
	CPU = 2
}

export enum ActorRole {
	HUMAN_1 = 0,
	HUMAN_2 = 1,
	GHOST_1 = 2,
	GHOST_2 = 3
}

export enum RoomPhase {
	WAITING = 0,
	STARTING = 1,
	PLAYING = 2,
}

export enum ActorStatus {
	ACTIVE = 0,
	INACTIVE = 1,
	STUNNED = 2,
	SPEED_UP = 3,
	RESPAWN = 4,
}

export enum ActorType {
	HUMAN = 0,
	GHOST = 1
}

export enum ItemCategory {
	SCORE = 0,
	SCORE_SPECIAL = 1,
	SPEED_UP = 2,
	STUN = 3
}

export enum ItemType {
	SCORE_CANDY = 0,
	SCORE_CHOCOLATE = 1,
	SCORE_DONUT = 2,
	SCORE_SPECIAL_CANDY = 3,
	SCORE_SPECIAL_CHOCOLATE = 4,
	SCORE_SPECIAL_DONUT = 5,
	SPEED_UP = 6,
	STUN = 7
}

export type UsableItemType = ItemType.SPEED_UP | ItemType.STUN;

export interface Session {
	id: string;
	joinedSlotId: number | null;
}

export interface VisualActorState {
	x: number;
	y: number;
	dir: Direction;
}

export interface MovementState {
	gridX: number;
	gridY: number;
	offsetX: number; // [-0.5, 0.5]
	offsetY: number; // [-0.5, 0.5]
	currentDir: Direction;
	nextDir: Direction;
}

// Client から Server へ
export interface ActorUpdatePayload {
	movement: MovementState;
	status: ActorStatus;
	statusTimer: number;
}

// Server から Client へ
export interface ActorSnapshot {
	movement: MovementState;
	status: ActorStatus;
	statusTimer: number;
	sessionId: string | null;
	role: ActorRole;
	controller: ControllerType;
	score: number;
	inventory: UsableItemType | null;
}

export enum GameEventType {
	ITEM_PICK_UP = 0,
	PLAYER_TAGGED = 1,
	GAME_OVER = 2,
	ITEM_USE = 3, // アイテム使用イベント（未実装）
}

export interface BaseGameEvent {
	type: GameEventType;
}

export interface ItemPickUpEvent extends BaseGameEvent {
	type: GameEventType.ITEM_PICK_UP;
	role: ActorRole;
	itemState: ItemState;
	earnedScore?: number;
}

export interface PlayerTaggedEvent extends BaseGameEvent {
	type: GameEventType.PLAYER_TAGGED;
	taggerRole: ActorRole; // 捕まえた人
	taggedRole: ActorRole; // 捕まったお化け
	gridX: number;
	offsetX: number;
	gridY: number;
	offsetY: number;
}

export interface GameOverEvent extends BaseGameEvent {
	type: GameEventType.GAME_OVER;
	scores: { role: ActorRole, score: number }[];
}

export interface ItemUseEvent extends BaseGameEvent {
	type: GameEventType.ITEM_USE;
	role: ActorRole;
	itemType: UsableItemType;
}

export type GameEvent = ItemPickUpEvent | PlayerTaggedEvent | GameOverEvent | ItemUseEvent;

export interface ItemState {
	type: ItemType;
	gridX: number;
	gridY: number;
}

export interface GameSnapshot {
	roomPhase: RoomPhase;
	roomTimer: number;
	actors: ActorSnapshot[];
	items: ItemState[];
	events: GameEvent[];
}


// サーバーが管理する状態
export interface ActorState {
	movement: MovementState;

	status: ActorStatus;
	statusTimer: number;

	slotId: number; // 0 - 3
	sessionId: string | null;
	role: ActorRole;
	controller: ControllerType;
	inventory: UsableItemType | null;
	score: number;
	lastUpdateTime: number;
}

export interface GameState {
	roomPhase: RoomPhase;
	roomTimer: number;
	actors: ActorState[];
	items: ItemState[];
}

export const ROOM_CONFIG = [
	{ id: 'room1', name: 'Room 1' },
	{ id: 'room2', name: 'Room 2' },
	{ id: 'room3', name: 'Room 3' },
	{ id: 'room4', name: 'Room 4' },
	{ id: 'room5', name: 'Room 5' }
]

export const WIDTH = 1920;
export const HEIGHT = 1080;

// 0: 通行可能 その他: 通行不可
export const MAP = [
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
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const MAP_WIDTH = 42;
export const MAP_HEIGHT = 18;

export const TILE_SIZE = 40;
export const MAP_ORIGIN_X = (WIDTH - MAP_WIDTH * TILE_SIZE) / 2;
export const MAP_ORIGIN_Y = (HEIGHT - MAP_HEIGHT * TILE_SIZE) / 2;


export const HUMAN_SPEED = 4 * 60 / 40;
export const GHOST_SPEED = 3 * 60 / 40;

export const COUNTDOWN_TIME = 5000; // ms
// export const GAME_DURATION = 120000; // ms
export const GAME_DURATION = 30000; // テスト用

export const MAX_ITEMS_ON_FIELD = 15;

// 得点
export const SCORE_ITEM_NORMAL = 100;
export const SCORE_ITEM_SPECIAL = 200;
// スピードアップ中の得点アイテム取得時のボーナス
export const SCORE_SPEED_UP_NORMAL = 50;
export const SCORE_SPEED_UP_SPECIAL = 100;

// 捕まえた時の得点
export const SCORE_TAG = 700;

export const ITEM_GET_DISTANCE = 0.75; // アイテム取得の距離
export const TAG_DISTANCE = 0.75; // 捕まえた判定の距離

interface ActorConfig {
	role: ActorRole;
	name: string;
	speed: number;
	type: ActorType;
	spritePrefix: string;
	initialPos: { gridX: number, gridY: number };
	buttonInitialPos: { x: number, y: number };
}

export const ACTOR_CONFIG: ActorConfig[] = [
	{ role: ActorRole.HUMAN_1, name: "Human 1", speed: HUMAN_SPEED, type: ActorType.HUMAN, spritePrefix: 'human_1', initialPos: { gridX: 1, gridY: 1 }, buttonInitialPos: { x: 20, y: 20 } },
	{ role: ActorRole.HUMAN_2, name: "Human 2", speed: HUMAN_SPEED, type: ActorType.HUMAN, spritePrefix: 'human_2', initialPos: { gridX: 40, gridY: 16 }, buttonInitialPos: { x: 20, y: 60 } },
	{ role: ActorRole.GHOST_1, name: "Ghost 1", speed: GHOST_SPEED, type: ActorType.GHOST, spritePrefix: 'ghost_1', initialPos: { gridX: 40, gridY: 1 }, buttonInitialPos: { x: 20, y: 100 } },
	{ role: ActorRole.GHOST_2, name: "Ghost 2", speed: GHOST_SPEED, type: ActorType.GHOST, spritePrefix: 'ghost_2', initialPos: { gridX: 1, gridY: 16 }, buttonInitialPos: { x: 20, y: 140 } }
];

interface ItemConfig {
	type: ItemType;
	category: ItemCategory;
	spriteName: string;
	alphaConfig: {
		ghost: number;
		human: number;
		spectator: number;
	}
}

const ITEM_SCORE_ALPHA_CONFIG = { ghost: 1, human: 0.3, spectator: 1 };
const ITEM_SPEED_ALPHA_CONFIG = { ghost: 1, human: 1, spectator: 1 };
const ITEM_STUN_ALPHA_CONFIG = { ghost: 1, human: 1, spectator: 1 };

export const ITEM_CONFIG: ItemConfig[] = [
	{ type: ItemType.SCORE_CANDY, category: ItemCategory.SCORE, spriteName: 'item_score_candy', alphaConfig: ITEM_SCORE_ALPHA_CONFIG },
	{ type: ItemType.SCORE_CHOCOLATE, category: ItemCategory.SCORE, spriteName: 'item_score_chocolate', alphaConfig: ITEM_SCORE_ALPHA_CONFIG },
	{ type: ItemType.SCORE_DONUT, category: ItemCategory.SCORE, spriteName: 'item_score_donut', alphaConfig: ITEM_SCORE_ALPHA_CONFIG },
	{ type: ItemType.SCORE_SPECIAL_CANDY, category: ItemCategory.SCORE_SPECIAL, spriteName: 'item_score_special_candy', alphaConfig: ITEM_SCORE_ALPHA_CONFIG },
	{ type: ItemType.SCORE_SPECIAL_CHOCOLATE, category: ItemCategory.SCORE_SPECIAL, spriteName: 'item_score_special_chocolate', alphaConfig: ITEM_SCORE_ALPHA_CONFIG },
	{ type: ItemType.SCORE_SPECIAL_DONUT, category: ItemCategory.SCORE_SPECIAL, spriteName: 'item_score_special_donut', alphaConfig: ITEM_SCORE_ALPHA_CONFIG },
	{ type: ItemType.SPEED_UP, category: ItemCategory.SPEED_UP, spriteName: 'item_speed_up', alphaConfig: ITEM_SPEED_ALPHA_CONFIG },
	{ type: ItemType.STUN, category: ItemCategory.STUN, spriteName: 'item_stun', alphaConfig: ITEM_STUN_ALPHA_CONFIG }
];

export const hasConnection = (x: number, y: number, dir: Direction): boolean => {
	if (dir === Direction.UP) return MAP[y - 1]?.[x] === 0;
	if (dir === Direction.DOWN) return MAP[y + 1]?.[x] === 0;
	if (dir === Direction.LEFT) return MAP[y]?.[x - 1] === 0;
	if (dir === Direction.RIGHT) return MAP[y]?.[x + 1] === 0;
	return false;
}

export const calcNextMovement = (currentMovement: MovementState, distance: number): MovementState => {
	let { gridX, gridY, offsetX, offsetY, currentDir, nextDir } = currentMovement;
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
				if (hasConnection(gridX, gridY, Direction.UP)) {
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
				if (hasConnection(gridX, gridY, nextDir)) {
					currentDir = nextDir;
					nextDir = Direction.NONE;
				}
				else if (hasConnection(gridX, gridY, Direction.UP)) {
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
				if (hasConnection(gridX, gridY, Direction.DOWN)) {
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
				if (hasConnection(gridX, gridY, nextDir)) {
					currentDir = nextDir;
					nextDir = Direction.NONE;
				}
				else if (hasConnection(gridX, gridY, Direction.DOWN)) {
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
				if (hasConnection(gridX, gridY, Direction.LEFT)) {
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
				if (hasConnection(gridX, gridY, nextDir)) {
					currentDir = nextDir;
					nextDir = Direction.NONE;
				}
				else if (hasConnection(gridX, gridY, Direction.LEFT)) {
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
				if (hasConnection(gridX, gridY, Direction.RIGHT)) {
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
				if (hasConnection(gridX, gridY, nextDir)) {
					currentDir = nextDir;
					nextDir = Direction.NONE;
				}
				else if (hasConnection(gridX, gridY, Direction.RIGHT)) {
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

export const isValidDirection = (data: any): data is Direction => {
	return Object.values(Direction).includes(data);
}

export const isValidControllerType = (data: any): data is ControllerType => {
	return Object.values(ControllerType).includes(data);
}
export const isValidActorRole = (data: any): data is ActorRole => {
	return Object.values(ActorRole).includes(data);
}

export const isValidActorStatus = (data: any): data is ActorStatus => {
	return Object.values(ActorStatus).includes(data);
}

export const isValidRoomPhase = (data: any): data is RoomPhase => {
	return Object.values(RoomPhase).includes(data);
}

export const isValidMovementState = (data: any): data is MovementState => {
	return typeof data === 'object' &&
		typeof data.gridX === 'number' &&
		0 <= data.gridX && data.gridX < MAP_WIDTH &&
		typeof data.gridY === 'number' &&
		0 <= data.gridY && data.gridY < MAP_HEIGHT &&
		typeof data.offsetX === 'number' &&
		data.offsetX >= -0.5 && data.offsetX <= 0.5 &&
		typeof data.offsetY === 'number' &&
		data.offsetY >= -0.5 && data.offsetY <= 0.5 &&
		isValidDirection(data.currentDir) &&
		isValidDirection(data.nextDir);
}

export const randomMapPosition = (): { gridX: number, gridY: number } => {
	while (true) {
		const gridX = Math.floor(Math.random() * MAP_WIDTH);
		const gridY = Math.floor(Math.random() * MAP_HEIGHT);
		console.log(`Trying position (${gridX}, ${gridY})`);
		if (MAP[gridY][gridX] === 0) {
			return { gridX, gridY };
		}
	}
}

interface ItemSpawnRate {
	category: ItemCategory;
	count: number;
}

export class ItemDeck {
	private items: ItemCategory[];

	private readonly CONFIG: ItemSpawnRate[] = [
		{ category: ItemCategory.SCORE, count: 17 },
		{ category: ItemCategory.SCORE_SPECIAL, count: 1 },
		{ category: ItemCategory.SPEED_UP, count: 1 },
		{ category: ItemCategory.STUN, count: 1 }
	]

	constructor() {
		this.items = [];
		this.refill();
	}

	private refill() {
		this.items = [];
		for (const { category, count } of this.CONFIG) {
			for (let i = 0; i < count; i++) {
				this.items.push(category);
			}
		}
		this.shuffle();
	}

	private shuffle() {
		for (let i = this.items.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.items[i], this.items[j]] = [this.items[j], this.items[i]];
		}
	}

	public pick(): ItemCategory {
		if (this.items.length === 0) {
			this.refill();
		}
		console.log(`Picking item category ${this.items[this.items.length - 1]}, ${this.items.length - 1} items left in deck`);
		return this.items.pop()!;
	}

	public reset() {
		this.items = [];
		this.refill();
	}
}

const ITEM_TYPES_BY_CATEGORY: Record<ItemCategory, ItemType[]> = ITEM_CONFIG.reduce((acc, item) => {
	if (!acc[item.category]) {
		acc[item.category] = [];
	}
	acc[item.category].push(item.type);
	return acc;
}, {} as Record<ItemCategory, ItemType[]>);

export const sampleItemTypeByCategory = (category: ItemCategory): ItemType => {
	const types = ITEM_TYPES_BY_CATEGORY[category];
	if (!types || types.length === 0) {
		throw new Error(`No item types found for category ${category}`);
	}
	return types[Math.floor(Math.random() * types.length)];
}

export const keyFromItemState = (itemState: ItemState): string => {
	return `${itemState.type}_${itemState.gridX}_${itemState.gridY}`;
}


export const gridToPixel = (gridX: number, gridY: number): { x: number, y: number } => {
	const x = MAP_ORIGIN_X + gridX * TILE_SIZE;
	const y = MAP_ORIGIN_Y + gridY * TILE_SIZE;
	return { x, y };
}

export const gridToCenterPixel = (gridX: number, gridY: number): { x: number, y: number } => {
	const x = MAP_ORIGIN_X + gridX * TILE_SIZE + TILE_SIZE / 2;
	const y = MAP_ORIGIN_Y + gridY * TILE_SIZE + TILE_SIZE / 2;
	return { x, y };
}

export const movementToPixel = (movement: MovementState): { x: number, y: number } => {
	return gridToPixel(movement.gridX + movement.offsetX, movement.gridY + movement.offsetY);
}