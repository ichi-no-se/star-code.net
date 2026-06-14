"use client"

import Link from "next/link";
import { useState, useEffect } from "react";
import GeoCanvas, { GeoData } from "@/components/GeoCanvas";
import "@styles/rail-silhouette.css";

interface GeoFeature {
	type: "Feature",
	properties: {
		class_cd: number,
		type_cd: number,
		company: string,
		line: string,
	},
	geometry: GeoData,
}

const TYPE_LABELS: Record<number, string> = {
	1: "新幹線",
	2: "JR在来線",
	3: "公営鉄道",
	4: "民営鉄道",
	5: "第三セクター"
}

interface LineNode {
	globalIndex: number;
	lineName: string;
	geometry: GeoData;
}

export default function RailSilhouettePage() {
	const [geoJsonData, setGeoJsonData] = useState<{ features: GeoFeature[] } | null>(null);
	const [currentGeoFeature, setCurrentGeoFeature] = useState<GeoFeature | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetch("/rail-silhouette/rail_lines.geojson")
			.then(response => {
				if (!response.ok) {
					throw new Error(`Failed to fetch GeoJSON data: ${response.status} ${response.statusText}`);
				}
				return response.json();
			})
			.then(data => {
				setGeoJsonData(data);
			})
			.catch(error => {
				console.error("Error fetching GeoJSON data:", error);
				setError(error.message);
			});
	}, []);

	const handleChoice = () => {
		if (!geoJsonData || geoJsonData.features.length === 0) return;
		const randomIndex = Math.floor(Math.random() * geoJsonData.features.length);
		setCurrentGeoFeature(geoJsonData.features[randomIndex]);
	}

	return (
		<>
			<h1 className="title">鉄道路線クイズ</h1>
			<h2 className="introduction">
				鉄道路線の形から，どこの路線か当てるクイズ
			</h2>
			{!geoJsonData && !error && <p>データを読み込み中...</p>}
			{error && <p className="error">エラー: {error}</p>}
			{geoJsonData && (
				<div className="content">
					<button className="choice-button" onClick={handleChoice}>路線を選ぶ</button>
					{currentGeoFeature && (
						<div className="canvas-container">
							<GeoCanvas canvasWidth={400} canvasHeight={400} geoData={currentGeoFeature.geometry} />
							<p className="line-info">{currentGeoFeature.properties.company} {currentGeoFeature.properties.line}</p>
						</div>
					)}
				</div>
			)}
			<p>本 Web アプリでは，<Link href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v2_3.html">国土交通省国土数値情報ダウンロードサイト</Link>（令和 2 年）のデータを加工して使用しています．</p>
		</>
	)
}