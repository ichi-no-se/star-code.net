import { Socket, Namespace } from "socket.io";
import { GameRoom } from "./GameRoom";
import { ActorRole, MovementState, ROOM_CONFIG } from "@shared/GhostTag/core";

export class RoomManager {
	private rooms: Record<string, GameRoom>;

	constructor(private ns: Namespace) {
		this.rooms = {};
		ROOM_CONFIG.forEach(({ id }) => {
			this.rooms[id] = new GameRoom(ns, id);
		});
	}

	public handleConnectLobby(socket: Socket) {
		this.leaveCurrentRoom(socket, true);
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
		room.addPlayer(socket.id);
		console.log(`[GhostTag] handleJoinRoom: Socket ${socket.id} joined room ${roomId}.`);
		this.ns.to("lobby").emit("roomStatsUpdate", this.getRoomStats());
	}

	private leaveCurrentRoom(socket: Socket, joinLobby: boolean = true) {
		const rooms = this.getGameRoomsForSocketId(socket.id);
		for (const room of rooms) {
			const roomId = room.getRoomId();
			socket.leave(roomId);
			room.removePlayer(socket.id);
			console.log(`[GhostTag] leaveCurrentRoom: Socket ${socket.id} left room ${roomId}.`);
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

	private getGameRoomsForSocketId(socketId: string): GameRoom[] {
		const gameRooms: GameRoom[] = [];
		for (const room of Object.values(this.rooms)) {
			if (room.findSession(socketId)) {
				gameRooms.push(room);
			}
		}
		return gameRooms;
	}

	public handleJoinGamePlayer(socket: Socket, role: ActorRole) {
		const rooms = this.getGameRoomsForSocketId(socket.id);
		if (rooms.length === 0) {
			console.log(`[GhostTag] handleJoinGamePlayer: Socket ${socket.id} is not in any game room.`);
			return;
		}
		else if (rooms.length >= 2) {
			console.log(`[GhostTag] handleJoinGamePlayer: Socket ${socket.id} is in multiple game rooms, which should not happen.`);
			this.leaveCurrentRoom(socket);
			return;
		}
		const room = rooms[0];
		room.joinGamePlayer(socket.id, role);
	}

	public handleLeaveGamePlayer(socket: Socket) {
		const rooms = this.getGameRoomsForSocketId(socket.id);
		if (rooms.length === 0) {
			console.log(`[GhostTag] handleLeaveGamePlayer: Socket ${socket.id} is not in any game room.`);
			return;
		}
		else if (rooms.length >= 2) {
			console.log(`[GhostTag] handleLeaveGamePlayer: Socket ${socket.id} is in multiple game rooms, which should not happen.`);
			this.leaveCurrentRoom(socket);
			return;
		}
		const room = rooms[0];
		room.leaveGamePlayer(socket.id);
	}

	public handleReportMovement(socket: Socket, role: ActorRole, movement: MovementState) {
		const rooms = this.getGameRoomsForSocketId(socket.id);
		if (rooms.length === 0) {
			console.log(`[GhostTag] handleReportMovement: Socket ${socket.id} is not in any game room.`);
			return;
		}
		else if (rooms.length >= 2) {
			console.log(`[GhostTag] handleReportMovement: Socket ${socket.id} is in multiple game rooms, which should not happen.`);
			this.leaveCurrentRoom(socket);
			return;
		}
		const room = rooms[0];
		room.receivePlayerMovement(socket.id, role, movement);
	}
}