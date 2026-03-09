import { Socket } from "socket.io";

enum Direction {
	NONE = 0,
	UP = 1,
	DOWN = 2,
	LEFT = 3,
	RIGHT = 4
}

enum ControllerType {
	NONE = 0,
	PLAYER = 1,
	CPU = 2
}

enum ActorRole {
	HUMAN_1 = 0,
	HUMAN_2 = 1,
	GHOST_1 = 2,
	GHOST_2 = 3
}

interface Actor {
	slotId: number; // 0 - 3
	sessionId: string | null;
	role: ActorRole;
	controller: ControllerType;
	direction: Direction;
	x: number;
	y: number;
	dir: Direction;
	nextDir: Direction;
	visible: boolean;
}

interface Session {
	id: string;
	joinedSlotId: number | null;
}


export class GameRoom {
	private sessions: Map<string, Session>;
	private actors: Actor[];
	private intervalId: NodeJS.Timeout | null = null;

	constructor() {
		this.sessions = new Map();
		this.actors = [];
		for (let i = 0; i < 4; i++) {
			this.actors.push({
				slotId: i,
				sessionId: null,
				role: i,
				controller: ControllerType.NONE,
				direction: Direction.NONE,
				x: 0,
				y: 0,
				dir: Direction.NONE,
				nextDir: Direction.NONE,
				visible: false
			});
		}
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

		this.broadcastGameState();
	}

	private broadcastGameState() {
	}

	public joinGamePlayer(socket: Socket, role: ActorRole) {
		const session = this.sessions.get(socket.id);
		if (!session) {
			console.log(`[GhostTag] joinGamePlayer: Session not found for socket ${socket.id}`);
			return;
		}
		const slotId = session.joinedSlotId;
		if (slotId !== null) {
			this.leaveGamePlayer(socket.id);
		}
		const actor = this.actors.find(a => a.role === role);
		if (!actor) {
			console.log(`[GhostTag] joinGamePlayer: Actor not found for role ${role}`);
			return;
		}
		if (actor.sessionId) {
			console.log(`[GhostTag] joinGamePlayer: Actor for role ${role} is already occupied by session ${actor.sessionId}`);
			return;
		}
		actor.controller = ControllerType.PLAYER;
		actor.visible = true;
		session.joinedSlotId = actor.slotId;
	}

	private leaveGamePlayer(sessionId: string) {
		const session = this.sessions.get(sessionId);
		if (!session) {
			console.log(`[GhostTag] leaveGamePlayer: Session not found for socket ${sessionId}`);
			return;
		}
		const slotId = session.joinedSlotId;
		if (slotId === null) {
			return;
		}
		const actor = this.actors[slotId];
		actor.sessionId = null;
		actor.controller = ControllerType.NONE;
		actor.visible = false;
		session.joinedSlotId = null;
	}

	public addPlayer(socket: Socket) {
		const newSession: Session = {
			id: socket.id,
			joinedSlotId: null
		};
		this.sessions.set(socket.id, newSession);
	}

	public removePlayer(socket: Socket) {
		this.leaveGamePlayer(socket.id);
		this.sessions.delete(socket.id);
	}

	public getPlayerCount(): number {
		return this.sessions.size;
	}
}