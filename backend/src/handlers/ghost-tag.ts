import { Namespace } from "socket.io";
import { RoomManager } from "../lib/GhostTag/RoomManager";

export const ghostTagHandler = (ns: Namespace) => {
	const manager = new RoomManager(ns);

	ns.on("connection", (socket) => {
		console.log(`[GhostTag] Client connected: ${socket.id}`);
		socket.on("connectLobby", () => { manager.handleConnectLobby(socket) });
		socket.on("joinRoom", (roomId: string) => manager.handleJoinRoom(socket, roomId));
		socket.on("leaveRoom", () => manager.handleLeaveRoom(socket));
		socket.on("requestRoomStats", () => manager.handleRequestRoomStats(socket));
		socket.on("disconnect", () => manager.handleDisconnect(socket));
	});

}