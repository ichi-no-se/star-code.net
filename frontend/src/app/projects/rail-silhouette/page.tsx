"use client"

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
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

interface LineInfo {
	globalIndex: number;
	typeCd: number;
	companyName: string;
	lineName: string;
	geometry: GeoData;
}

export default function RailSilhouettePage() {
	const [currentLineInfo, setCurrentLineInfo] = useState<LineInfo | null>(null);
	const [lineInfoList, setLineInfoList] = useState<LineInfo[]>([]);
	const [flags, setFlags] = useState<boolean[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [expandedTypes, setExpandedType] = useState<boolean[]>([]);
	const [expandedCompanies, setExpandedCompanies] = useState<boolean[][]>([]);
	const [showAnswer, setShowAnswer] = useState<boolean>(false);
	const [copied, setCopied] = useState<boolean>(false);

	useEffect(() => {
		fetch("/rail-silhouette/rail_lines.geojson")
			.then(response => {
				if (!response.ok) {
					throw new Error(`Failed to fetch GeoJSON data: ${response.status} ${response.statusText}`);
				}
				return response.json();
			})
			.then(data => {
				const infoList: LineInfo[] = data.features.map((feature: GeoFeature, index: number) => ({
					globalIndex: index,
					typeCd: feature.properties.type_cd,
					companyName: feature.properties.company,
					lineName: feature.properties.line,
					geometry: feature.geometry,
				}));
				const companyMap = new Map<number, Set<string>>();
				infoList.forEach(line => {
					if (!companyMap.has(line.typeCd)) {
						companyMap.set(line.typeCd, new Set<string>());
					}
					companyMap.get(line.typeCd)!.add(line.companyName);
				});
				const sortedCompanyCounts = Array.from(companyMap.entries()).sort((a, b) => a[0] - b[0]).map(([_, companies]) => companies.size);
				const initialTypes = new Array(sortedCompanyCounts.length).fill(false);
				const initialCompanies = sortedCompanyCounts.map(count => new Array(count).fill(false));

				setExpandedType(initialTypes);
				setExpandedCompanies(initialCompanies);
				setLineInfoList(infoList);
				setFlags(new Array(infoList.length).fill(true));

			})
			.catch(error => {
				console.error("Error fetching GeoJSON data:", error);
				setError(error.message);
			});
	}, []);

	const handleChoice = () => {
		if (!lineInfoList || lineInfoList.length === 0) return;
		const activeLines = lineInfoList.filter(line => flags[line.globalIndex]);
		if (activeLines.length === 0) {
			return;
		}
		const randomLine = activeLines[Math.floor(Math.random() * activeLines.length)];
		setCurrentLineInfo(randomLine);
		setShowAnswer(false);
	}

	const toggleType = (typeIndex: number) => {
		const newExpandedTypes = [...expandedTypes];
		newExpandedTypes[typeIndex] = !newExpandedTypes[typeIndex];
		setExpandedType(newExpandedTypes);
	}

	const toggleCompany = (typeIndex: number, companyIndex: number) => {
		const newExpandedCompanies = [...expandedCompanies];
		newExpandedCompanies[typeIndex][companyIndex] = !newExpandedCompanies[typeIndex][companyIndex];
		setExpandedCompanies(newExpandedCompanies);
	}

	const toggleFlag = (globalIndex: number) => {
		const newFlags = [...flags];
		newFlags[globalIndex] = !newFlags[globalIndex];
		setFlags(newFlags);
	}

	const exportCode = useMemo(() => {
		if (flags.length === 0) return "";
		let result = "";
		for (let i = 0; i < flags.length; i += 5) {
			let binStr = "";
			for (let j = 0; j < 5; j++) {
				if (i + j < flags.length) {
					binStr += flags[i + j] ? "1" : "0";
				} else {
					binStr += "0";
				}
			}
			const num = parseInt(binStr, 2);
			result += num.toString(32).toUpperCase();
		}
		return result;
	}, [flags]);

	const copyToClipboard = () => {
		if (!exportCode) return;
		navigator.clipboard.writeText(exportCode).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}).catch(err => {
			console.error("Failed to copy to clipboard: ", err);
		});
	}

	const handleImport = (inputStr: string) => {
		const cleanStr = inputStr.trim().toUpperCase();
		const newFlags = new Array(flags.length).fill(false);
		let flagIndex = 0;
		for (let i = 0; i < cleanStr.length; i++) {
			const num = parseInt(cleanStr[i], 32);
			if (isNaN(num)) continue
			const binStr = num.toString(2).padStart(5, '0');
			for (let j = 0; j < 5; j++) {
				if (flagIndex < newFlags.length) {
					newFlags[flagIndex] = binStr[j] === '1';
					flagIndex++;
				}
			}
		}
		setFlags(newFlags);
	}

	const groupedTree = useMemo(() => {
		const treeMap = new Map<number, Map<string, LineInfo[]>>();
		lineInfoList.forEach(line => {
			if (!treeMap.has(line.typeCd)) {
				treeMap.set(line.typeCd, new Map<string, LineInfo[]>());
			}
			const typeMap = treeMap.get(line.typeCd)!;
			if (!typeMap.has(line.companyName)) {
				typeMap.set(line.companyName, []);
			}
			typeMap.get(line.companyName)!.push(line);
		});
		return Array.from(treeMap.entries()).map(([typeCd, typeMap]) => {
			const sortedCompanies = Array.from(typeMap.entries()).map(([companyName, lines]) => {
				const sortedLines = [...lines].sort((a, b) => a.lineName.localeCompare(b.lineName, "ja"));
				return {
					companyName,
					lines: sortedLines,
				};
			}).sort((a, b) => a.companyName.localeCompare(b.companyName, "ja"));
			return {
				typeCd,
				typeLabel: TYPE_LABELS[typeCd] || `不明な種別 (${typeCd})`,
				companies: sortedCompanies,
			}
		}).sort((a, b) => a.typeCd - b.typeCd);
	}, [lineInfoList]);
	console.log(groupedTree);
	return (
		<>
			<h1 className="title">鉄道路線クイズ</h1>
			<h2 className="introduction">
				鉄道路線の形から，どこの路線か当てるクイズです．
				<br />
				開発記事・プリセットは<Link href="/blog/rail-silhouette/">こちら</Link>から．
			</h2>
			{!lineInfoList && !error && <p>データを読み込み中...</p>}
			{error && <p className="error">エラー: {error}</p>}
			{lineInfoList && (
				<div className="game-container">
					<div className="tree-container">
						<div className="export-import-container">
							<div className="export-container">
								<span className="export-label">現在の設定コード：</span>
								<input type="text" value={exportCode} readOnly className="export-input" />
								<button onClick={copyToClipboard} className="copy-button">{copied ? "コピーしました" : "コピー"}</button>
							</div>
							<div className="import-container">
								<span className="import-label">設定コードを入力して復元：</span>
								<input type="text" className="import-input" onChange={(e) => handleImport(e.target.value)} placeholder="設定コードを入力" />
							</div>
						</div>
						{groupedTree.map((typeGroup, typeIndex) => {
							const allTypeIndices = typeGroup.companies.flatMap(company => company.lines.map(line => line.globalIndex));
							const checkedCount = allTypeIndices.filter(index => flags[index]).length;
							const isAllChecked = checkedCount === allTypeIndices.length;
							const isIndeterminate = checkedCount > 0 && checkedCount < allTypeIndices.length;
							return (
								<div key={typeIndex} className="type-container">
									<div className="type-label">
										<span className="arrow" onClick={() => toggleType(typeIndex)}>{expandedTypes[typeIndex] ? '▼' : '▶︎'}</span>
										<input type="checkbox"
											checked={isAllChecked}
											ref={e => {
												if (e) {
													e.indeterminate = isIndeterminate;
												}
											}}
											onChange={(e) => {
												const isChecked = e.target.checked;
												const newFlags = [...flags];
												allTypeIndices.forEach(index => {
													newFlags[index] = isChecked;
												});
												setFlags(newFlags);
											}}
										/>
										<span onClick={() => toggleType(typeIndex)}>{typeGroup.typeLabel}</span>
									</div>
									{expandedTypes[typeIndex] && (
										<div className="company-list-container">
											{typeGroup.companies.map((companyGroup, companyIndex) => {
												const checkedCount = companyGroup.lines.filter(line => flags[line.globalIndex]).length;
												const isAllChecked = checkedCount === companyGroup.lines.length;
												const isIndeterminate = checkedCount > 0 && checkedCount < companyGroup.lines.length;
												return (
													<div key={`${typeIndex}-${companyIndex}`} className="company-container">
														<div className="company-label">
															<span className="arrow" onClick={() => toggleCompany(typeIndex, companyIndex)}>{expandedCompanies[typeIndex][companyIndex] ? '▼' : '▶︎'}</span>
															<input type="checkbox"
																checked={isAllChecked}
																ref={input => {
																	if (input) {
																		input.indeterminate = isIndeterminate;
																	}
																}}
																onChange={(e) => {
																	const newFlags = [...flags];
																	const isChecked = e.target.checked;
																	companyGroup.lines.forEach(line => {
																		newFlags[line.globalIndex] = isChecked;
																	});
																	setFlags(newFlags);
																}}
															/>
															<span onClick={() => toggleCompany(typeIndex, companyIndex)}>{companyGroup.companyName}</span>
														</div>
														{expandedCompanies[typeIndex][companyIndex] && (
															<div className="line-list-container">
																{companyGroup.lines.map(line => (
																	<label key={line.globalIndex} className="line-item">
																		<input
																			type="checkbox"
																			checked={flags[line.globalIndex]}
																			onChange={() => toggleFlag(line.globalIndex)}
																		/>
																		<span>{line.lineName}</span>
																	</label>
																))}
															</div>
														)}
													</div>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
					</div>
					<div className="map-container">
						<button className="choice-button" onClick={handleChoice} disabled={!flags.some(f => f)}>出題</button>
						{currentLineInfo && (
							<div className="canvas-container">
								{showAnswer ? <p className="line-info">{currentLineInfo.companyName} {currentLineInfo.lineName}</p> : <button className="show-answer-button" onClick={() => setShowAnswer(true)}>答えを見る</button>}
								<GeoCanvas canvasWidth={600} canvasHeight={600} geoData={currentLineInfo.geometry} />
							</div>
						)}
					</div>
				</div>
			)}
			<div className="license">
				本 Web アプリでは，<Link href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v2_3.html">国土交通省国土数値情報ダウンロードサイト</Link>（令和 2 年）のデータを加工して使用しています．
			</div>
		</>
	)
}
