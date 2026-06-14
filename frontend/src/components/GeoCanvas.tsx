"use client";
import { useRef, useEffect } from "react";

import "@styles/geo-canvas.css";


type Position = [number, number]; // [longitude, latitude]

type GeoMultiLineString = {
	type: "MultiLineString";
	coordinates: Position[][];
}

export type GeoData = GeoMultiLineString; // 他のタイプは追々追加するかも

export interface GeoCanvasProps {
	canvasWidth: number;
	canvasHeight: number;
	geoData: GeoData | null;
}

export default function GeoCanvas({ canvasWidth, canvasHeight, geoData }: GeoCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		if (!geoData) return;
		const lines = geoData.coordinates;
		const allPoints = lines.flat(1);
		const latitudes = allPoints.map(p => p[1]);
		const minLatitude = Math.min(...latitudes);
		const maxLatitude = Math.max(...latitudes);

		const centerLatitude = (minLatitude + maxLatitude) / 2;
		const latitudeAspect = Math.cos(centerLatitude * Math.PI / 180);

		const xList = allPoints.map(p => p[0] * latitudeAspect);
		const yList = latitudes;

		const minX = Math.min(...xList);
		const maxX = Math.max(...xList);
		const centerX = (minX + maxX) / 2;
		const minY = Math.min(...yList);
		const maxY = Math.max(...yList);
		const centerY = (minY + maxY) / 2;

		const xScale = canvasWidth / (maxX - minX + 1e-9);
		const yScale = canvasHeight / (maxY - minY + 1e-9);
		const scale = Math.min(xScale, yScale) * 0.9; // 10 % のマージンを取る

		const canvasCenterWidth = canvasWidth / 2;
		const canvasCenterHeight = canvasHeight / 2;

		const toCanvasXY = (p: Position) => [
			(p[0] * latitudeAspect - centerX) * scale + canvasCenterWidth,
			canvasCenterHeight - (p[1] - centerY) * scale
		];

		ctx.strokeStyle = "black";
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		lines.forEach(line => {
			if (line.length === 0) return;
			ctx.beginPath();
			line.forEach((pt, idx) => {
				const [cx, cy] = toCanvasXY(pt);
				if (idx === 0) {
					ctx.moveTo(cx, cy);
				} else {
					ctx.lineTo(cx, cy);
				}
			});
			ctx.stroke(); // 1本引き終わったら即座に描画
		});
	}, [canvasWidth, canvasHeight, geoData]);
	return <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} className="geo-canvas" />;
}