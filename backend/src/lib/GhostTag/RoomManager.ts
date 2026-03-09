import { Socket, Namespace } from "socket.io";
import { GameRoom } from "./GameRoom";

export class RoomManager {
	private rooms: Record<string, GameRoom>;

	constructor(private ns: Namespace) {
		this.rooms = {
			"room1": new GameRoom(),
			"room2": new GameRoom(),
			"room3": new GameRoom()
		};
	}

	public handleConnectLobby(socket: Socket) {
		socket.join("lobby");
		console.log(`[GhostTag] handleConnectLobby: Socket ${socket.id} connected and joined lobby.`);
	}

	public handleJoinRoom(socket: Socket, roomId: string) {
		let room = this.rooms[roomId];
		if (!room) {
			console.log(`[GhostTag] handleJoinRoom: Room ${roomId} does not exist.`);
			return;
		}
		socket.leave("lobby");
		socket.join(roomId);
		room.addPlayer(socket);
		console.log(`[GhostTag] handleJoinRoom: Socket ${socket.id} joined room ${roomId}.`);
		this.ns.to("lobby").emit("roomStatsUpdate", this.getRoomStats());
	}

	private leaveCurrentRoom(socket: Socket, joinLobby: boolean = true) {
		for (const [roomId, room] of Object.entries(this.rooms)) {
			if (socket.rooms.has(roomId)) {
				socket.leave(roomId);
				room.removePlayer(socket);
				console.log(`[GhostTag] leaveCurrentRoom: Socket ${socket.id} left room ${roomId}.`);
			}
		}
		this.ns.to("lobby").emit("roomStatsUpdate", this.getRoomStats());
		if (joinLobby) {
			socket.join("lobby");
		}
	}

	public handleLeaveRoom(socket: Socket) {
		this.leaveCurrentRoom(socket);
	}

	public handleDisconnect(socket: Socket) {
		this.leaveCurrentRoom(socket, false);
		console.log(`[GhostTag] handleDisconnect: Socket ${socket.id} disconnected.`);
	}

	public handleRequestRoomStats(socket: Socket) {
		socket.emit("roomStatsUpdate", this.getRoomStats());
	}

	private getRoomStats() {
		return Object.entries(this.rooms).map(([roomId, room]) => ({
			id: roomId,
			playerCount: room.getPlayerCount()
		}));
	}
}