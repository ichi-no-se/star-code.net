import { Namespace } from "socket.io";
import { RoomManager } from "../lib/GhostTag/RoomManager";
import { ActorRole } from "@shared/GhostTag/core";

export const ghostTagHandler = (ns: Namespace) => {
	const manager = new RoomManager(ns);

	ns.on("connection", (socket) => {
		console.log(`[GhostTag] Client connected: ${socket.id}`);
		socket.on("connectLobby", () => { manager.handleConnectLobby(socket) });
		socket.on("joinRoom", (roomId: string) => manager.handleJoinRoom(socket, roomId));
		socket.on("leaveRoom", () => manager.handleLeaveRoom(socket));
		socket.on("requestRoomStats", () => manager.handleRequestRoomStats(socket));
		socket.on("disconnect", () => manager.handleDisconnect(socket));
		socket.on("joinGamePlayer", (data: { roleId: ActorRole }) => manager.handleJoinGamePlayer(socket, data.roleId));
		socket.on("leaveGamePlayer", () => manager.handleLeaveGamePlayer(socket));
	});
}