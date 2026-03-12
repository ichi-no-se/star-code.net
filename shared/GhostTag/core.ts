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
	COUNTDOWN = 1,
	PLAYING = 2,
	RESULT = 3,
}

export enum ActorStatus {
	ACTIVE = 0,
	INACTIVE = 1,
	STUNNED = 2,
	SPEEDUP = 3,
	RESPAWN = 4,
}

export interface Session {
	id: string;
	joinedSlotId: number | null;
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

export interface GameSnapshot {
	roomPhase: RoomPhase;
	roomTimer: number;
	actors: ActorSnapshot[];
	// items: ItemState[]; 将来的に追加
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

export const HUMAN_SPEED = 4 * 60 / 40;
export const GHOST_SPEED = 3 * 60 / 40;

export const HUMAN_1_INITIAL_POS = { gridX: 1, gridY: 1 };
export const HUMAN_2_INITIAL_POS = { gridX: 1, gridY: 16 };
export const GHOST_1_INITIAL_POS = { gridX: 40, gridY: 1 };
export const GHOST_2_INITIAL_POS = { gridX: 40, gridY: 16 };

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