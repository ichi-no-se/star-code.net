import { Namespace } from "socket.io";
import {
	ActorRole, ActorStatus, ControllerType, GameState, RoomPhase, Direction, Session, MovementState,
	GameSnapshot, calcNextMovement,
	ACTOR_CONFIG,
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

	constructor(private ns: Namespace, private roomId: string) {
		this.sessions = new Map();
		this.gameState = {
			roomPhase: RoomPhase.WAITING,
			roomTimer: 0,
			actors: []
			// items: [] 将来的に追加
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
				lastUpdateTime: performance.now()
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
		this.gameState.roomTimer += deltaTime;
		for (const { socketId, role, movement, time } of this.receivedMovements) {
			const actor = this.gameState.actors.find(a => a.sessionId === socketId && a.role === role);
			if (actor) {
				actor.movement = movement;
				actor.lastUpdateTime = time;
			}
			// console.log(`[GhostTag] Received movement from ${socketId} at ${time}: ${JSON.stringify(movement)}`);
		}
		this.receivedMovements = [];
		const gameSnapshot: GameSnapshot = {
			roomPhase: this.gameState.roomPhase,
			roomTimer: this.gameState.roomTimer,
			actors: this.gameState.actors.map(a => {
				// TODO: アイテム処理は将来的に追加
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
					score: a.score
				};
			})
			// items: this.master.items.map(i => ({ ... })) 将来的に追加
		};

		this.broadcastGameSnapshot(gameSnapshot);
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
		this.leaveGamePlayer(socketId);
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