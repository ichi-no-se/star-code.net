import { Namespace } from "socket.io";
import { RoomManager } from "../lib/GhostTag/RoomManager";
import { ActorRole, MovementState } from "@shared/GhostTag/core";

export const ghostTagHandler = (ns: Namespace) => {
	const manager = new RoomManager(ns);

	ns.on("connection", (socket) => {
		console.log(`[GhostTag] Client connected: ${socket.id}`);
		socket.on("connectLobby", () => { manager.handleConnectLobby(socket) });
		socket.on("joinRoom", (data: { roomId: string }) => manager.handleJoinRoom(socket, data.roomId));
		socket.on("leaveRoom", () => manager.handleLeaveRoom(socket));
		socket.on("requestRoomStats", () => manager.handleRequestRoomStats(socket));
		socket.on("disconnect", () => manager.handleDisconnect(socket));
		socket.on("joinGamePlayer", (data: { role: ActorRole }) => manager.handleJoinGamePlayer(socket, data.role));
		socket.on("leaveGamePlayer", () => manager.handleLeaveGamePlayer(socket));
		socket.on("reportMovement", (data: { role: ActorRole, movement: MovementState }) => manager.handleReportMovement(socket, data.role, data.movement));
	});
}