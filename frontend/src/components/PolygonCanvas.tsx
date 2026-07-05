"use client";

import React, { useRef, useEffect } from "react";
import "@styles/polygon-canvas.css";

export interface Point {
	x: number;
	y: number;
}

interface PolygonCanvasProps {
	width: number;
	height: number;
	onStrokeEnd: (points: Point[]) => void;
	onStrokeStart?: () => void;
}


export default function PolygonCanvas({ width, height, onStrokeEnd, onStrokeStart }: PolygonCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isDrawing = useRef<boolean>(false);
	const currentStroke = useRef<Point[]>([]);
	const onStrokeEndRef = useRef(onStrokeEnd);
	const onStrokeStartRef = useRef(onStrokeStart);

	useEffect(() => {
		onStrokeEndRef.current = onStrokeEnd;
		onStrokeStartRef.current = onStrokeStart;
	}, [onStrokeEnd, onStrokeStart]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const clearCanvas = () => {
			ctx.fillStyle = "white";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		};

		clearCanvas();

		ctx.lineCap = "round";
		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;

		const getPos = (e: MouseEvent | TouchEvent) => {
			const rect = canvas.getBoundingClientRect();
			const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
			const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
			return {
				x: (clientX - rect.left) / rect.width * canvas.width,
				y: (clientY - rect.top) / rect.height * canvas.height
			};
		};
		const startDrawing = (e: MouseEvent | TouchEvent) => {
			e.preventDefault();
			isDrawing.current = true;
			const pos = getPos(e);
			currentStroke.current = [pos];
			clearCanvas();
			onStrokeStartRef.current?.();
			ctx.beginPath();
			ctx.moveTo(pos.x, pos.y);
		};
		const draw = (e: MouseEvent | TouchEvent) => {
			if (!isDrawing.current) return;
			e.preventDefault();
			const pos = getPos(e);
			currentStroke.current.push(pos);
			ctx.lineTo(pos.x, pos.y);
			ctx.stroke();
		};
		const endDrawing = () => {
			if (!isDrawing.current) return;
			isDrawing.current = false;
			if (currentStroke.current.length < 5) {
				clearCanvas();
				return;
			}
			isDrawing.current = false;
			ctx.closePath();
			ctx.stroke();
			onStrokeEndRef.current([...currentStroke.current]);
		};
		const touchOptions: AddEventListenerOptions = { passive: false };

		canvas.addEventListener("mousedown", startDrawing);
		canvas.addEventListener("mousemove", draw);
		canvas.addEventListener("mouseup", endDrawing);
		canvas.addEventListener("mouseleave", endDrawing);

		canvas.addEventListener("touchstart", startDrawing, touchOptions);
		canvas.addEventListener("touchmove", draw, touchOptions);
		canvas.addEventListener("touchend", endDrawing);
		canvas.addEventListener("touchcancel", endDrawing);

		return () => {
			canvas.removeEventListener("mousedown", startDrawing);
			canvas.removeEventListener("mousemove", draw);
			canvas.removeEventListener("mouseup", endDrawing);
			canvas.removeEventListener("mouseleave", endDrawing);

			canvas.removeEventListener("touchstart", startDrawing, touchOptions);
			canvas.removeEventListener("touchmove", draw, touchOptions);
			canvas.removeEventListener("touchend", endDrawing);
			canvas.removeEventListener("touchcancel", endDrawing);
		};
	}, [width, height]);


	return (
		<div className="polygon-canvas-container">
			<canvas ref={canvasRef} width={width} height={height} className="polygon-canvas" />
		</div>
	)
}

interface PolygonViewerProps {
	width: number;
	height: number;
	points: Point[];
}

export function PolygonViewer({ width, height, points }: PolygonViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		if (points.length > 0) {
			ctx.beginPath();
			ctx.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i].x, points[i].y);
			}
			ctx.closePath();
			ctx.stroke();
		}
	}, [width, height, points]);

	return (
		<div className="polygon-viewer-container">
			<canvas ref={canvasRef} width={width} height={height} className="polygon-viewer" />
		</div>
	)
}

interface PolygonsViewerProps {
	width: number;
	height: number;
	polygons: Point[][];
	colors?: string[];
}

export function PolygonsViewer({ width, height, polygons, colors }: PolygonsViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		polygons.forEach((points, index) => {
			ctx.strokeStyle = colors && colors[index] ? colors[index] : "black";
			ctx.lineWidth = 2;
			if (points.length > 0) {
				ctx.beginPath();
				ctx.moveTo(points[0].x, points[0].y);
				for (let i = 1; i < points.length; i++) {
					ctx.lineTo(points[i].x, points[i].y);
				}
				ctx.closePath();
				ctx.stroke();
			}
		});
	},[width, height, polygons, colors]);
	return (
		<div className="polygons-viewer-container">
			<canvas ref={canvasRef} width={width} height={height} className="polygons-viewer" />
		</div>
	);
}