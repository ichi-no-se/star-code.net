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
	role: ActorRole;
	controller: ControllerType;
	direction: Direction;
	x: number;
	y: number;
	dir: Direction;
	nextDir: Direction;
}

interface Session {
	id: string;
	joinedSlotId: number | null;
}


export class GameRoom{
	private sessions: Map<string, Session>;
	private actors: Actor[];

	constructor() {
		this.sessions = new Map();
		this.actors = [];
		for (let i = 0; i < 4; i++) {
			this.actors.push({
				slotId: i,
				role: i,
				controller: ControllerType.NONE,
				direction: Direction.NONE,
				x: 0,
				y: 0,
				dir: Direction.NONE,
				nextDir: Direction.NONE
			});
		}
	}

	public addPlayer(socket: Socket) {
		const newSession: Session = {
			id: socket.id,
			joinedSlotId: null
		};
		this.sessions.set(socket.id, newSession);
	}

	public removePlayer(socket: Socket) {
		this.sessions.delete(socket.id);
	}

	public getPlayerCount(): number {
		return this.sessions.size;
	}
}