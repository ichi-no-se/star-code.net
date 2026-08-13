"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import "@styles/japan-split-population.css";

export default function JapanSplitPopulationPage() {
	const [populationData, setPopulationData] = useState<{ x: number, y: number, population: number }[] | null>(null);
	const [landPolygons, setLandPolygons] = useState<{ x: number, y: number }[][] | null>(null);
	const [firstPoint, setFirstPoint] = useState<{ x: number, y: number } | null>(null);
	const [secondPoint, setSecondPoint] = useState<{ x: number, y: number } | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [populationA, setPopulationA] = useState<number | null>(null);
	const [populationB, setPopulationB] = useState<number | null>(null);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		fetch("/japan-split-population/polygons.json")
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to fetch polygons.json: ${response.status} ${response.statusText}`);
				}
				return response.json();
			})
			.then((data: [number, number][][]) => {
				const formattedLand = data.map(polygon => polygon.map(([x, y]) => ({ x, y })));
				setLandPolygons(formattedLand);
			});

		fetch("/japan-split-population/population.csv")
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Failed to fetch population.csv: ${response.status} ${response.statusText}`);
				}
				return response.text();
			})
			.then((text) => {
				const lines = text.split("\n");
				const headers = lines[0].split(",");
				const xIndex = headers.indexOf("x");
				const yIndex = headers.indexOf("y");
				const populationIndex = headers.indexOf("population");

				const data = lines.slice(1).map(line => {
					const values = line.split(",");
					return {
						x: parseFloat(values[xIndex]),
						y: parseFloat(values[yIndex]),
						population: parseInt(values[populationIndex], 10)
					};
				}).filter(item => !isNaN(item.x) && !isNaN(item.y) && !isNaN(item.population));
				setPopulationData(data);
			});
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !landPolygons || landPolygons.length === 0 || !populationData || populationData.length === 0) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const width = canvas.parentElement?.clientWidth || 800;
		const height = canvas.parentElement?.clientHeight || 600;
		canvas.width = width;
		canvas.height = height;
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		for (const polygon of landPolygons) {
			for (const point of polygon) {
				if (point.x < minX) minX = point.x;
				if (point.x > maxX) maxX = point.x;
				if (point.y < minY) minY = point.y;
				if (point.y > maxY) maxY = point.y;
			}
		}

		const padding = 20;

		const scaleX = (width - padding * 2) / (maxX - minX);
		const scaleY = (height - padding * 2) / (maxY - minY);
		const scale = Math.min(scaleX, scaleY);
		const offsetX = padding + (width - padding * 2 - (maxX - minX) * scale) / 2;
		const offsetY = padding + (height - padding * 2 - (maxY - minY) * scale) / 2;

		const toScreenX = (x: number) => (x - minX) * scale + offsetX;
		const toScreenY = (y: number) => height - (y - minY) * scale - offsetY;
		ctx.clearRect(0, 0, width, height);
		const existLine = firstPoint && secondPoint && (firstPoint.x !== secondPoint.x || firstPoint.y !== secondPoint.y);

		landPolygons.forEach((polygon) => {
			if (polygon.length === 0) return;
			const buildPath = () => {
				ctx.beginPath();
				polygon.forEach((point, index) => {
					const screenX = toScreenX(point.x);
					const screenY = toScreenY(point.y);
					if (index === 0) {
						ctx.moveTo(screenX, screenY);
					} else {
						ctx.lineTo(screenX, screenY);
					}
				});
				ctx.closePath();
			}
			if (existLine) {
				const dx = secondPoint.x - firstPoint.x;
				const dy = secondPoint.y - firstPoint.y;
				const length = Math.sqrt(dx * dx + dy * dy);
				const unitDx = dx / length;
				const unitDy = dy / length;
				const r = width + height;

				const extendedFirstPoint = { x: firstPoint.x - unitDx * r, y: firstPoint.y - unitDy * r };
				const extendedSecondPoint = { x: secondPoint.x + unitDx * r, y: secondPoint.y + unitDy * r };

				const nx = -unitDy;
				const ny = unitDx;

				const polygonA: { x: number, y: number }[] = [extendedFirstPoint, extendedSecondPoint, { x: extendedSecondPoint.x + nx * r, y: extendedSecondPoint.y + ny * r }, { x: extendedFirstPoint.x + nx * r, y: extendedFirstPoint.y + ny * r }];
				const polygonB: { x: number, y: number }[] = [extendedFirstPoint, extendedSecondPoint, { x: extendedSecondPoint.x - nx * r, y: extendedSecondPoint.y - ny * r }, { x: extendedFirstPoint.x - nx * r, y: extendedFirstPoint.y - ny * r }];

				ctx.save();
				buildPath();
				ctx.clip();
				ctx.beginPath();
				polygonA.forEach((point, index) => {
					if (index === 0) {
						ctx.moveTo(point.x, point.y);
					} else {
						ctx.lineTo(point.x, point.y);
					}
				});
				ctx.closePath();
				ctx.fillStyle = "#fcc";
				ctx.fill();
				ctx.restore();

				ctx.save();
				buildPath();
				ctx.clip();
				ctx.beginPath();
				polygonB.forEach((point, index) => {
					if (index === 0) {
						ctx.moveTo(point.x, point.y);
					} else {
						ctx.lineTo(point.x, point.y);
					}
				});
				ctx.closePath();
				ctx.fillStyle = "#ccf";
				ctx.fill();
				ctx.restore();

				ctx.strokeStyle = "#020";
				ctx.lineWidth = 1;
				buildPath();
				ctx.stroke();
			}
			else {
				buildPath();
				ctx.fillStyle = "#eee";
				ctx.fill();
				ctx.strokeStyle = "#020";
				ctx.lineWidth = 1;
				ctx.stroke();
			}
		});

		if (existLine) {
			const dx = secondPoint.x - firstPoint.x;
			const dy = secondPoint.y - firstPoint.y;
			const length = Math.sqrt(dx * dx + dy * dy);
			const unitDx = dx / length;
			const unitDy = dy / length;
			const r = width + height;

			const extendedFirstPoint = { x: firstPoint.x - unitDx * r, y: firstPoint.y - unitDy * r };
			const extendedSecondPoint = { x: secondPoint.x + unitDx * r, y: secondPoint.y + unitDy * r };

			ctx.strokeStyle = "#505";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(extendedFirstPoint.x, extendedFirstPoint.y);
			ctx.lineTo(extendedSecondPoint.x, extendedSecondPoint.y);
			ctx.stroke();

			const a = extendedSecondPoint.y - extendedFirstPoint.y;
			const b = extendedFirstPoint.x - extendedSecondPoint.x;
			const c = extendedSecondPoint.x * extendedFirstPoint.y - extendedFirstPoint.x * extendedSecondPoint.y;

			let sumA = 0;
			let sumB = 0;
			for (const data of populationData) {
				const x = toScreenX(data.x);
				const y = toScreenY(data.y);
				const side = a * x + b * y + c;
				if (side > 0) {
					sumB += data.population;
				} else {
					sumA += data.population;
				}
			}
			setPopulationA(sumA);
			setPopulationB(sumB);
		}
		else {
			setPopulationA(null);
			setPopulationB(null);
		}

	}, [landPolygons, populationData, firstPoint, secondPoint]);

	const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		setFirstPoint({ x, y });
		setSecondPoint({ x, y });
		setIsDragging(true);
	};

	const handlePointerUp = () => {
		setIsDragging(false);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current;
		if (!canvas || !isDragging) return;
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		setSecondPoint({ x, y });
	};

	const totalPop = (populationA ?? 0) + (populationB ?? 0);
	const percentA = totalPop > 0 && populationA !== null ? ((populationA / totalPop) * 100).toFixed(1) : "0.0";
	const percentB = totalPop > 0 && populationB !== null ? ((populationB / totalPop) * 100).toFixed(1) : "0.0";

	return (
		<>
			<h1 className="title">日本分割（人口）</h1>
			<div className="introduction">
				日本を線で分割した時のそれぞれの人口を計算．<br />
				操作方法：ドラッグで線を引く
			</div>
			<div className="result-container">
				<div className="result-item">
					<span className="red-box"></span>
					<span className="red-result-text">
						{populationA !== null ? populationA.toLocaleString() : "---"} 人
					</span>
					<span className="percent-text">
						({percentA}%)
					</span>
				</div>

				<div className="result-item">
					<span className="blue-box"></span>
					<span className="blue-result-text">
						{populationB !== null ? populationB.toLocaleString() : "---"} 人
					</span>
					<span className="percent-text">
						({percentB}%)
					</span>
				</div>
			</div>

			<div className="main-layout">
				<canvas
					ref={canvasRef}
					className="main-canvas"
					onPointerDown={handlePointerDown}
					onPointerUp={handlePointerUp}
					onPointerMove={handlePointerMove}
				/>
			</div>

			<div className="license">
				本 Web アプリでは，国土交通省国土数値情報ダウンロードサイトの<Link href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html">行政区域データ</Link>（令和 8 年）および，<Link href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-mesh1000r6.html">1kmメッシュ別将来推計人口データ（R6国政局推計）</Link>を加工して使用しています．<br />
			</div>
		</>
	)
}