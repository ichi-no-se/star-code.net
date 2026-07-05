"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import "@styles/prefecture-outline.css";
import PolygonCanvas, { Point, PolygonsViewer } from "@/components/PolygonCanvas";

interface PrefData {
	name: string;
	points: Point[];
}

interface RawPrefData {
	[key: string]: [number, number][];
}

interface RankingItem {
	name: string;
	score: number;
}

function normalizePolygon(points: Point[]): Point[] {
	if (points.length < 3) return points;
	let area = 0;
	const weightedCenter: Point = { x: 0, y: 0 };
	for (let i = 0; i < points.length; i++) {
		const p1 = points[i];
		const p2 = points[(i + 1) % points.length];
		const cross = p1.x * p2.y - p2.x * p1.y;
		area += cross;
		weightedCenter.x += (p1.x + p2.x) * cross;
		weightedCenter.y += (p1.y + p2.y) * cross;
	}
	if (Math.abs(area) < 1e-6) return points; // Avoid division by zero for degenerate polygons
	const center: Point = { x: weightedCenter.x / (3 * area), y: weightedCenter.y / (3 * area) };
	area = Math.abs(area) / 2;
	const scale = 1.0 / Math.sqrt(area);
	const normalizedPoints = points.map(p => {
		const dx = p.x - center.x;
		const dy = p.y - center.y;
		return { x: dx * scale, y: dy * scale };
	});
	return normalizedPoints;
}

function resamplePolygon(points: Point[], targetLength: number): Point[] {
	if (points.length < 2) {
		return points;
	}
	const segmentLengths: number[] = [];
	let totalLength = 0;
	for (let i = 0; i < points.length; i++) {
		const p1 = points[i];
		const p2 = points[(i + 1) % points.length];
		const length = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
		segmentLengths.push(length);
		totalLength += length;
	}
	const interval = totalLength / targetLength;
	const resampledPoints: Point[] = [];
	let accumulatedDistance = 0;
	let currentIndex = 0;
	resampledPoints.push(points[0]);
	for (let i = 1; i < targetLength; i++) {
		const targetDistance = i * interval;
		while (currentIndex < segmentLengths.length && accumulatedDistance + segmentLengths[currentIndex] < targetDistance) {
			accumulatedDistance += segmentLengths[currentIndex];
			currentIndex++;
		}
		if (currentIndex >= segmentLengths.length) {
			resampledPoints.push(points[points.length - 1]);
			continue;
		}
		const p1 = points[currentIndex];
		const p2 = points[(currentIndex + 1) % points.length];
		const segmentLength = segmentLengths[currentIndex];
		const remainingDistance = targetDistance - accumulatedDistance;
		const t = remainingDistance / segmentLength;
		const newX = p1.x + t * (p2.x - p1.x);
		const newY = p1.y + t * (p2.y - p1.y);
		resampledPoints.push({ x: newX, y: newY });
	}
	return resampledPoints;
}

function calculateSimilarityScore(normalizedAndResampledUserPolygon: Point[], referencePolygon: Point[]): number {
	const coefficient = 3.0; // Coefficient to adjust the score scale
	if (normalizedAndResampledUserPolygon.length === 0 || referencePolygon.length === 0) return 0;
	let sumMinDistUser = 0;
	for (const u of normalizedAndResampledUserPolygon) {
		let minDist = Infinity;
		for (const r of referencePolygon) {
			const dist = Math.sqrt((u.x - r.x) ** 2 + (u.y - r.y) ** 2);
			if (dist < minDist) minDist = dist;
		}
		sumMinDistUser += minDist;
	}
	const avgMinDistUser = sumMinDistUser / normalizedAndResampledUserPolygon.length;
	const scoreUser = Math.exp(-coefficient * avgMinDistUser);

	let sumMinDistReference = 0;
	for (const r of referencePolygon) {
		let minDist = Infinity;
		for (const u of normalizedAndResampledUserPolygon) {
			const dist = Math.sqrt((r.x - u.x) ** 2 + (r.y - u.y) ** 2);
			if (dist < minDist) minDist = dist;
		}
		sumMinDistReference += minDist;
	}
	const avgMinDistReference = sumMinDistReference / referencePolygon.length;
	const scoreReference = Math.exp(-coefficient * avgMinDistReference);
	if (scoreUser === 0 || scoreReference === 0) return 0;
	const finalScore = (2 * scoreUser * scoreReference) / (scoreUser + scoreReference);
	return finalScore;
}


export default function PrefectureOutlinePage() {
	const [masterData, setMasterData] = useState<PrefData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [ranking, setRanking] = useState<RankingItem[]>([]);
	const [openedPrefNames, setOpenedPrefNames] = useState<Set<string>>(new Set());
	const [userResampledPolygon, setUserResampledPolygon] = useState<Point[]>([]);

	useEffect(() => {
		fetch("/prefecture-outline/prefecture_outline.json")
			.then((response) => {
				if (!response.ok) {
					throw new Error("Network response was not ok");
				}
				return response.json();
			})
			.then((data: RawPrefData) => {
				const formattedData: PrefData[] = Object.entries(data).map(([name, points]) => ({
					name,
					points: points.map(([x, y]) => ({ x, y }))
				}));
				setMasterData(formattedData);
				setIsLoading(false);
			})
			.catch((error) => {
				console.error("Error fetching GeoJSON data:", error);
				setIsLoading(false);
			}
			);
	}, []);

	const handleStrokeEnd = (userPolygon: Point[]) => {
		if (isLoading || userPolygon.length < 3 || masterData.length === 0) {
			setRanking([]);
			return;
		}
		const normalizedUserPolygon = normalizePolygon(userPolygon);
		const resampledUserPolygon = resamplePolygon(normalizedUserPolygon, 500);
		const result = masterData.map(pref => {
			const score = calculateSimilarityScore(resampledUserPolygon, pref.points) * 100;
			return { name: pref.name, score };
		}).sort((a, b) => b.score - a.score);
		setRanking(result);
		setOpenedPrefNames(new Set());
		setUserResampledPolygon(resampledUserPolygon);
	}

	const toggleCanvas = (prefName: string) => {
		setOpenedPrefNames(prev => {
			const newSet = new Set(prev);
			if (newSet.has(prefName)) {
				newSet.delete(prefName);
			} else {
				newSet.add(prefName);
			}
			return newSet;
		});
	}

	return (
		<>
			<h1 className="title">手書き都道府県</h1>
			<div className="introduction">
				どれだけ都道府県に似た形を書けるか．<br />
				離島，飛び地は計算の対象外です．<br />
				開発記事は<Link href="/blog/prefecture-outline/">こちら</Link>から．
			</div>
			<div className="canvas-wrapper">
				<PolygonCanvas width={400} height={400} onStrokeEnd={handleStrokeEnd} />
			</div>
			{ranking.length > 0 && (
				<div className="result-container">
					<div className="result-title">判定結果</div>
					<div className="top-result">
						<strong className="top-pref-name">{ranking[0].name}</strong> <span className="top-pref-score">{ranking[0].score.toFixed(2)}</span>
						<span className="top-pref-unit">点</span>
					</div>
					<details className="ranking-details">
						<summary className="ranking-summary">すべての都道府県のスコアを見る</summary>
						<ul className="ranking-list">
							{ranking.map((res, index) => {
								const isOpened = openedPrefNames.has(res.name);
								if (!isOpened) {
									return (
										<li key={res.name} className="ranking-item">
											<div className="ranking-info-cluster">
												<span className="rank-number">{String(index + 1)}</span>
												<span className="rank-unit">位</span>
												<span className="rank-divider" />
												<strong className="rank-pref-name">{res.name}</strong>
												<span className="rank-score">{res.score.toFixed(2)}</span>
												<span className="rank-unit">点</span>
												<button onClick={() => toggleCanvas(res.name)} className="view-shape-button">
													形を見る
												</button>
											</div>
										</li>
									)
								}
								const prefMasterData = masterData.find(pref => pref.name === res.name);
								if (!prefMasterData) return null;
								let maxVal = 0.01;
								for (const p of userResampledPolygon) {
									if (Math.abs(p.x) > maxVal) maxVal = Math.abs(p.x);
									if (Math.abs(p.y) > maxVal) maxVal = Math.abs(p.y);
								}
								for (const p of prefMasterData.points) {
									if (Math.abs(p.x) > maxVal) maxVal = Math.abs(p.x);
									if (Math.abs(p.y) > maxVal) maxVal = Math.abs(p.y);
								}
								const size = 300;
								const scale = size * 0.9 / 2 / maxVal;

								const scaledUserPolygon = userResampledPolygon.map(p => ({ x: size / 2 + p.x * scale, y: size / 2 + p.y * scale }));
								const scaledPrefPolygon = prefMasterData.points.map(p => ({ x: size / 2 + p.x * scale, y: size / 2 + p.y * scale }));
								return (
									<li key={res.name} className="ranking-item">
										<div className="ranking-info-cluster">
											<span className="rank-number">{String(index + 1)}</span>
											<span className="rank-unit">位</span>
											<span className="rank-divider" />
											<strong className="rank-pref-name">{res.name}</strong>
											<span className="rank-score">{res.score.toFixed(2)}</span>
											<span className="rank-unit">点</span>
											<button onClick={() => toggleCanvas(res.name)} className="view-shape-button">
												形を閉じる
											</button>
										</div>
										<div className="viewer-wrapper">
											<PolygonsViewer width={size} height={size} polygons={[scaledPrefPolygon, scaledUserPolygon]} colors={["#1e90ff", "#ff4757"]} />
										</div>
									</li>
								)
							})}
						</ul>
					</details>
				</div >
			)
			}
			<div className="license">
				本 Web アプリでは，<Link href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html">国土交通省国土数値情報ダウンロードサイト</Link>（令和 8 年）のデータを加工して使用しています．<br />
			</div>
		</>
	)
}