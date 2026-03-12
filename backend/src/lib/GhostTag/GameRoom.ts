import { Namespace } from "socket.io";
import {
	ActorRole, ActorStatus, ControllerType, GameState, RoomPhase, Direction, Session, MovementState,
	GameSnapshot,
	HUMAN_1_INITIAL_POS, HUMAN_2_INITIAL_POS, GHOST_1_INITIAL_POS, GHOST_2_INITIAL_POS
} from "@shared/GhostTag/core";


export class GameRoom {
	private sessions: Map<string, Session>;
	private intervalId: NodeJS.Timeout | null = null;
	private gameState: GameState;

	constructor(private ns: Namespace, private roomId: string) {
		this.sessions = new Map();
		this.gameState = {
			roomPhase: RoomPhase.WAITING,
			roomTimer: 0,
			actors: []
			// items: [] 将来的に追加
		}
		for (let i = 0; i < 4; i++) {
			this.gameState.actors.push({
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
				lastUpdateTime: Date.now()
			});
		}
		this.startGameLoop();
	}

	public findSession(socketId: string): Session | undefined {
		return this.sessions.get(socketId);
	}

	private startGameLoop() {
		let lastTime = Date.now();
		this.intervalId = setInterval(() => {
			const now = Date.now();
			const deltaTime = now - lastTime;
			lastTime = now;
			this.updateGame(deltaTime);
		}, 1000 / 60);
	}

	private updateGame(deltaTime: number) {
		this.gameState.roomTimer += deltaTime;

		const gameSnapshot: GameSnapshot = {
			roomPhase: this.gameState.roomPhase,
			roomTimer: this.gameState.roomTimer,
			actors: this.gameState.actors.map(a => ({
				movement: a.movement,
				status: a.status,
				statusTimer: a.statusTimer,
				sessionId: a.sessionId,
				role: a.role,
				controller: a.controller,
				score: a.score
			}))
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
		actor.sessionId = socketId;
		actor.controller = ControllerType.PLAYER;
		actor.status = ActorStatus.ACTIVE;
		session.joinedSlotId = actor.slotId;
		switch (role) {
			case ActorRole.HUMAN_1:
				actor.movement.gridX = HUMAN_1_INITIAL_POS.gridX;
				actor.movement.gridY = HUMAN_1_INITIAL_POS.gridY;
				break;
			case ActorRole.HUMAN_2:
				actor.movement.gridX = HUMAN_2_INITIAL_POS.gridX;
				actor.movement.gridY = HUMAN_2_INITIAL_POS.gridY;
				break;
			case ActorRole.GHOST_1:
				actor.movement.gridX = GHOST_1_INITIAL_POS.gridX;
				actor.movement.gridY = GHOST_1_INITIAL_POS.gridY;
				break;
			case ActorRole.GHOST_2:
				actor.movement.gridX = GHOST_2_INITIAL_POS.gridX;
				actor.movement.gridY = GHOST_2_INITIAL_POS.gridY;
				break;
		}
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
		const actor = this.gameState.actors[slotId];
		actor.sessionId = null;
		actor.controller = ControllerType.NONE;
		actor.status = ActorStatus.INACTIVE;
		session.joinedSlotId = null;
	}

	public addPlayer(socketId: string) {
		const newSession: Session = {
			id: socketId,
			joinedSlotId: null
		};
		this.sessions.set(socketId, newSession);
	}

	public removePlayer(socketId: string) {
		this.leaveGamePlayer(socketId);
		this.sessions.delete(socketId);
	}

	public getPlayerCount(): number {
		return this.sessions.size;
	}

	public getRoomId(): string {
		return this.roomId;
	}
}