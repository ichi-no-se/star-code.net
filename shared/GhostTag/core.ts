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
	STUN_ATTACKING = 2,
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
	ITEM_USE = 3,
}

export interface BaseGameEvent {
	type: GameEventType;
}

export interface ItemPickUpEvent extends BaseGameEvent {
	type: GameEventType.ITEM_PICK_UP;
	role: ActorRole;
	itemState: ItemState;
	earnedScore?: ItemScore; // アイテム取得で得たスコア（アイテムが得点アイテムの場合）
}

export interface PlayerTaggedEvent extends BaseGameEvent {
	type: GameEventType.PLAYER_TAGGED;
	taggerRole: ActorRole; // 捕まえた人
	taggedRole: ActorRole; // 捕まったゴースト
	taggedPosition: { gridX: number, offsetX: number, gridY: number, offsetY: number }; // 捕まった位置
	respawnPosition: { gridX: number, gridY: number }; // ゴーストのリスポーン位置
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
	justJoined: boolean;

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

export const FONT_FAMILY_EN = '"Press Start 2P", monospace';
export const FONT_FAMILY_JA = '"DotGothic16", monospace';

// 0: 通行可能 その他: 通行不可
export const MAP = [
	[1, 11, 13, 2, 11, 2, 2, 11, 2, 2, 11, 2, 13, 11, 2, 2, 11, 2, 2, 11, 2, 2, 11, 2, 2, 11, 2, 2, 11, 2, 2, 11, 2, 2, 11, 2, 2, 11, 2, 13, 11, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 0, 13, 14, 14, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 2, 6, 2, 0, 2, 5, 2, 2, 12, 14, 14, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 13, 2, 2, 4, 3, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 14, 14, 14, 0, 2, 8, 2, 2, 12, 13, 2, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 2, 4, 8, 2, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 10, 6, 2, 2, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 13, 4, 2, 7, 2, 2, 12, 0, 2, 10, 2, 0, 1],
	[1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 3, 2, 12, 13, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 0, 13, 7, 2, 0, 2, 10, 2, 2, 9, 12, 4, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 6, 14, 14, 14, 0, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1],
	[1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
	[1, 0, 13, 2, 10, 2, 12, 2, 8, 0, 2, 7, 2, 0, 2, 2, 6, 5, 0, 2, 2, 2, 8, 2, 2, 10, 2, 12, 0, 10, 2, 2, 0, 10, 2, 8, 0, 6, 2, 5, 0, 1],
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
	[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const MAP_WIDTH = 42;
export const MAP_HEIGHT = 18;

export const TILE_SIZE = 40;
export const MAP_ORIGIN_X = (WIDTH - MAP_WIDTH * TILE_SIZE) / 2;
export const MAP_ORIGIN_Y = 30;


export const HUMAN_SPEED = 6
export const GHOST_SPEED = 4.5
export const HUMAN_BOOST_SPEED = 9
export const GHOST_BOOST_SPEED = 7.5

export const COUNTDOWN_TIME = 5000; // ms
export const GAME_DURATION = 120000; // ms

export const RESPAWN_DURATION = 2500; // ms

export const MAX_ITEMS_ON_FIELD = 15;

// 得点
export const SCORE_ITEM_NORMAL = 100;
export const SCORE_ITEM_SPECIAL = 200;
// スピードアップ中の得点アイテム取得
export const SCORE_SPEED_UP_NORMAL = 150;
export const SCORE_SPEED_UP_SPECIAL = 300;

// 捕まえた時の得点
export const SCORE_TAG = 500;

export type ItemScore = typeof SCORE_ITEM_NORMAL | typeof SCORE_ITEM_SPECIAL | typeof SCORE_SPEED_UP_NORMAL | typeof SCORE_SPEED_UP_SPECIAL;

export const ITEM_GET_DISTANCE = 0.9; // アイテム取得の距離
export const TAG_DISTANCE = 0.9; // 捕まえた判定の距離

export const HUMAN_BOOST_DURATION = 2800; // スピードアップの継続時間
export const GHOST_BOOST_DURATION = 4500;
export const HUMAN_STUN_ATTACKING_DURATION = 1000; // スタン攻撃の継続時間
export const GHOST_STUN_ATTACKING_DURATION = 2000;


interface ActorConfig {
	role: ActorRole;
	name: string;
	speed: number;
	boostSpeed: number; // スピードアップ状態の速度
	boostDuration: number;
	stunAttackingDuration: number;
	type: ActorType;
	spriteName: string;
	initialPos: { gridX: number, gridY: number };
	iconOriginPos: { x: number, y: number };
	iconDirection: ActiveDirection;
	inventoryIconOriginPos: { x: number, y: number };
	buttonOriginPos: { x: number, y: number };
}

export const ACTOR_CONFIG: ActorConfig[] = [
	{ role: ActorRole.HUMAN_1, name: "Human 1", speed: HUMAN_SPEED, boostSpeed: HUMAN_BOOST_SPEED, boostDuration: HUMAN_BOOST_DURATION, stunAttackingDuration: HUMAN_STUN_ATTACKING_DURATION, type: ActorType.HUMAN, spriteName: 'human_1', initialPos: { gridX: 1, gridY: 1 }, iconOriginPos: { x: 30, y: 780 }, iconDirection: Direction.RIGHT, inventoryIconOriginPos: { x: 160, y: 780 }, buttonOriginPos: { x: 310, y: 780 } },
	{ role: ActorRole.HUMAN_2, name: "Human 2", speed: HUMAN_SPEED, boostSpeed: HUMAN_BOOST_SPEED, boostDuration: HUMAN_BOOST_DURATION, stunAttackingDuration: HUMAN_STUN_ATTACKING_DURATION, type: ActorType.HUMAN, spriteName: 'human_2', initialPos: { gridX: 40, gridY: 16 }, iconOriginPos: {x: 30,y: 930},iconDirection: Direction.RIGHT, inventoryIconOriginPos: { x: 160, y: 930 }, buttonOriginPos: { x: 310, y: 930 } },
	{ role: ActorRole.GHOST_1, name: "Ghost 1", speed: GHOST_SPEED, boostSpeed: GHOST_BOOST_SPEED, boostDuration: GHOST_BOOST_DURATION, stunAttackingDuration: GHOST_STUN_ATTACKING_DURATION, type: ActorType.GHOST, spriteName: 'ghost_1', initialPos: { gridX: 40, gridY: 1 }, iconOriginPos: { x: 1770, y: 780 }, iconDirection: Direction.LEFT, inventoryIconOriginPos: { x: 1640, y: 780 }, buttonOriginPos: { x: 1350, y: 780 } },
	{ role: ActorRole.GHOST_2, name: "Ghost 2", speed: GHOST_SPEED, boostSpeed: GHOST_BOOST_SPEED, boostDuration: GHOST_BOOST_DURATION, stunAttackingDuration: GHOST_STUN_ATTACKING_DURATION, type: ActorType.GHOST, spriteName: 'ghost_2', initialPos: { gridX: 1, gridY: 16 }, iconOriginPos: { x: 1770, y: 930 }, iconDirection: Direction.LEFT, inventoryIconOriginPos: { x: 1640, y: 930 }, buttonOriginPos: { x: 1350, y: 930 } }
];

export const HUMAN_ROLES = ACTOR_CONFIG.filter(c => c.type === ActorType.HUMAN).map(c => c.role);
export const GHOST_ROLES = ACTOR_CONFIG.filter(c => c.type === ActorType.GHOST).map(c => c.role);

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

const ITEM_SCORE_ALPHA_CONFIG = { ghost: 1, human: 0.5, spectator: 1 };
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

export type ActiveDirection = Exclude<Direction, Direction.NONE>;

export interface DirectionConfig {
	axis: 'x' | 'y';
	sign: 1 | -1;
	dx: -1 | 0 | 1;
	dy: -1 | 0 | 1;
	suffix: 'u' | 'd' | 'l' | 'r';
	opposite: ActiveDirection;
	frameOffset: number;
	lightPixelOffsetX: number;
	lightPixelOffsetY: number;
}

export const DIRECTION_CONFIG: Record<ActiveDirection, DirectionConfig> = {
	[Direction.UP]: { axis: 'y', sign: -1, dx: 0, dy: -1, suffix: 'u', opposite: Direction.DOWN, frameOffset: 0, lightPixelOffsetX: 13, lightPixelOffsetY: 18 },
	[Direction.DOWN]: { axis: 'y', sign: 1, dx: 0, dy: 1, suffix: 'd', opposite: Direction.UP, frameOffset: 2, lightPixelOffsetX: 24, lightPixelOffsetY: 30 },
	[Direction.LEFT]: { axis: 'x', sign: -1, dx: -1, dy: 0, suffix: 'l', opposite: Direction.RIGHT, frameOffset: 4, lightPixelOffsetX: 11, lightPixelOffsetY: 21 },
	[Direction.RIGHT]: { axis: 'x', sign: 1, dx: 1, dy: 0, suffix: 'r', opposite: Direction.LEFT, frameOffset: 6, lightPixelOffsetX: 31, lightPixelOffsetY: 21 },
};


export const hasConnection = (gridX: number, gridY: number, dir: Direction): boolean => {
	if (dir === Direction.NONE) return false;
	const { dx, dy } = DIRECTION_CONFIG[dir];
	return MAP[gridY + dy]?.[gridX + dx] === 0;
}

export const calcNextMovement = (currentMovement: MovementState, distance: number): MovementState => {
	let state = structuredClone(currentMovement);
	while (distance > 0) {
		if (state.currentDir === Direction.NONE) {
			if (state.nextDir !== Direction.NONE) {
				state.currentDir = state.nextDir;
				state.nextDir = Direction.NONE;
			}
			else {
				break;
			}
		}
		const { axis, sign, opposite } = DIRECTION_CONFIG[state.currentDir as ActiveDirection];
		const offsetAxis = axis === 'x' ? 'offsetX' : 'offsetY';
		const otherOffsetAxis = axis === 'x' ? 'offsetY' : 'offsetX';
		const offsetGridAxis = axis === 'x' ? 'gridX' : 'gridY';

		state[otherOffsetAxis] = 0; // 移動方向と垂直なオフセットは常に 0

		if (state.nextDir === opposite) {
			state.currentDir = state.nextDir;
			state.nextDir = Direction.NONE;
			continue;
		}

		const relativeOffset = state[offsetAxis] * sign; // 移動方向に対する相対的なオフセット
		if (relativeOffset < 0) {
			// タイル中心に向かって移動
			const distanceToCenter = -relativeOffset; // タイル中心までの距離
			const moveDist = Math.min(distance, distanceToCenter);
			state[offsetAxis] += sign * moveDist;
			distance -= moveDist;
		}
		else if (relativeOffset === 0) {
			// タイル中心にいる場合
			if (hasConnection(state.gridX, state.gridY, state.nextDir)) {
				state.currentDir = state.nextDir;
				state.nextDir = Direction.NONE;
			}
			else if (hasConnection(state.gridX, state.gridY, state.currentDir)) {
				const moveDist = Math.min(distance, 0.5);
				state[offsetAxis] += sign * moveDist;
				distance -= moveDist;
			}
			else {
				distance = 0;
			}
		}
		else {
			// タイル中心から離れている場合
			const distanceToEdge = 0.5 - relativeOffset; // タイル端までの距離
			if (distance < distanceToEdge) {
				state[offsetAxis] += sign * distance;
				distance = 0;
			}
			else {
				distance -= distanceToEdge;
				state[offsetAxis] = -0.5 * sign;
				state[offsetGridAxis] += sign;
			}
		}
	}
	return state;
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

export const calcSpeed = (role: ActorRole, status: ActorStatus, isStunned: boolean): number => {
	if (isStunned || status === ActorStatus.RESPAWN) {
		return 0;
	}
	const config = ACTOR_CONFIG[role];
	if (status === ActorStatus.SPEED_UP) {
		return config.boostSpeed;
	}
	return config.speed;
}