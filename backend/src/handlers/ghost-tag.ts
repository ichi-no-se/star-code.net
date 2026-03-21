import { Namespace } from "socket.io";
import { RoomManager } from "../lib/GhostTag/RoomManager";
import { ActorRole, MovementState, isValidActorRole, isValidMovementState } from "@shared/GhostTag/core";

export const ghostTagHandler = (ns: Namespace) => {
	const manager = new RoomManager(ns);

	ns.on("connection", (socket) => {
		console.log(`[GhostTag] Client connected: ${socket.id}`);
		socket.on("connectLobby", () => { manager.handleConnectLobby(socket) });
		socket.on("joinRoom", (data: any) => {
			if(typeof data?.roomId !== 'string') {
				console.log(`[GhostTag] Invalid joinRoom data from socket ${socket.id}:`, data);
				return;
			}
			manager.handleJoinRoom(socket, data.roomId);
		});
		socket.on("leaveRoom", () => manager.handleLeaveRoom(socket));
		socket.on("requestRoomStats", () => manager.handleRequestRoomStats(socket));
		socket.on("disconnect", () => manager.handleDisconnect(socket));
		socket.on("joinGamePlayer", (data: any) => {
			if(!isValidActorRole(data?.role)) {
				console.log(`[GhostTag] Invalid joinGamePlayer data from socket ${socket.id}:`, data);
				return;
			}
			manager.handleJoinGamePlayer(socket, data.role);
		});
		socket.on("changeToCPU", (data: any) => {
			if(!isValidActorRole(data?.role)) {
				console.log(`[GhostTag] Invalid changeToCPU data from socket ${socket.id}:`, data);
				return;
			}
			manager.handleChangeToCPU(socket, data.role);
		});
		socket.on("useItemRequest"	, (data: any) => {
			if(!isValidActorRole(data?.role)) {
				console.log(`[GhostTag] Invalid useItemRequest data from socket ${socket.id}:`, data);
				return;
			}
			manager.handleUseItemRequest(socket, data.role);
		});
		socket.on("leaveGamePlayer", () => manager.handleLeaveGamePlayer(socket));
		socket.on("reportMovement", (data: any) => {
			if(!isValidActorRole(data?.role) || !isValidMovementState(data?.movement)) {
				console.log(`[GhostTag] Invalid reportMovement data from socket ${socket.id}:`, data);
				return;
			}
			manager.handleReportMovement(socket, data.role, data.movement);
		});
	});
}