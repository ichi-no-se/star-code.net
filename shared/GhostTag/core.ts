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
	SPEEDUP = 3,
	RESPAWN = 4,
}

export enum ActorType{
	HUMAN = 0,
	GHOST = 1
}

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
}

export type ItemType = 'SPEED_UP' | 'STUN' | 'POINT';

export type GameEventType = 'ITEM_PICKUP' | 'PLAYER_TAGGED' | 'GAME_OVER';

export interface BaseGameEvent {
	type: GameEventType;
}

export interface ItemPickupEvent extends BaseGameEvent {
	type: 'ITEM_PICKUP';
	role: ActorRole;
	// 将来的にアイテムの種類や位置なども追加
	// itemState: ItemState;
}

export interface PlayerTaggedEvent extends BaseGameEvent {
	type: 'PLAYER_TAGGED';
	taggerRole: ActorRole; // 捕まえた人
	taggedRole: ActorRole; // 捕まったお化け
	x: number;
	y: number;
}

export interface GameOverEvent extends BaseGameEvent {
	type: 'GAME_OVER';
	scores: { role: ActorRole, score: number }[];
}

export type GameEvent = ItemPickupEvent | PlayerTaggedEvent | GameOverEvent;

export interface GameSnapshot {
	roomPhase: RoomPhase;
	roomTimer: number;
	actors: ActorSnapshot[];
	// items: ItemState[]; 将来的に追加
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

	score: number;
	lastUpdateTime: number;
}

export interface GameState {
	roomPhase: RoomPhase;
	roomTimer: number;
	actors: ActorState[];
	// items: ItemState[]; 将来的に追加
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
	[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
];

export const MAP_WIDTH = 42;
export const MAP_HEIGHT = 18;

export const HUMAN_SPEED = 4 * 60 / 40;
export const GHOST_SPEED = 3 * 60 / 40;

export const COUNTDOWN_TIME = 5000; // ms
// export const GAME_DURATION = 120000; // ms
export const GAME_DURATION = 10000; // テスト用

export const ACTOR_CONFIG = [
	{ role: ActorRole.HUMAN_1, name: "Human 1", speed: HUMAN_SPEED, type: ActorType.HUMAN, spritePrefix: 'human_1', initialPos: { gridX: 1, gridY: 1 }, buttonInitialPos: { x: 20, y: 20 } },
	{ role: ActorRole.HUMAN_2, name: "Human 2", speed: HUMAN_SPEED, type: ActorType.HUMAN, spritePrefix: 'human_2', initialPos: { gridX: 1, gridY: 16 }, buttonInitialPos: { x: 20, y: 60 } },
	{ role: ActorRole.GHOST_1, name: "Ghost 1", speed: GHOST_SPEED, type: ActorType.GHOST, spritePrefix: 'ghost_1', initialPos: { gridX: 40, gridY: 1 }, buttonInitialPos: { x: 20, y: 100 } },
	{ role: ActorRole.GHOST_2, name: "Ghost 2", speed: GHOST_SPEED, type: ActorType.GHOST, spritePrefix: 'ghost_2', initialPos: { gridX: 40, gridY: 16 }, buttonInitialPos: { x: 20, y: 140 } }
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