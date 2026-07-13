"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import "@styles/kanji-puzzle.css";

type ArrowDirection = "in" | "out";

type SlotState = {
	kanji: string;
	arrowDirection: ArrowDirection;
}

export default function KanjiPuzzlePage() {
	const [topSlot, setTopSlot] = useState<SlotState>({ kanji: "", arrowDirection: "in" });
	const [bottomSlot, setBottomSlot] = useState<SlotState>({ kanji: "", arrowDirection: "out" });
	const [leftSlot, setLeftSlot] = useState<SlotState>({ kanji: "", arrowDirection: "in" });
	const [rightSlot, setRightSlot] = useState<SlotState>({ kanji: "", arrowDirection: "out" });
	const [centerKanjiCandidates, setCenterKanjiCandidates] = useState<string[]>([]);
	const [kanjiPairs, setKanjiPairs] = useState<[string, string][]>([]);

	useEffect(() => {
		fetch("/kanji-puzzle/kanji_pairs_all.json")
			.then(response => {
				if (!response.ok) {
					throw new Error(`Failed to fetch JSON data: ${response.status} ${response.statusText}`);
				}
				return response.json();
			})
			.then(data => {
				setKanjiPairs(data);
			})
			.catch(error => {
				console.error("Error fetching JSON data:", error);
			})
	}, []);

	const searchCenterKanjiCandidates = () => {
		if (topSlot.kanji.length !== 1 || bottomSlot.kanji.length !== 1 || leftSlot.kanji.length !== 1 || rightSlot.kanji.length !== 1) {
			setCenterKanjiCandidates([]);
			return;
		}

		const candidates: string[] = [];
		let isFirstSlot = true;
		for (const slot of [topSlot, bottomSlot, leftSlot, rightSlot]) {
			const localCandidates = [];
			if (slot.arrowDirection === "in") {
				for (const [kanji1, kanji2] of kanjiPairs) {
					if (kanji1 === slot.kanji) {
						localCandidates.push(kanji2);
					}
				}
			}
			else {
				for (const [kanji1, kanji2] of kanjiPairs) {
					if (kanji2 === slot.kanji) {
						localCandidates.push(kanji1);
					}
				}
			}
			if (isFirstSlot) {
				candidates.push(...localCandidates);
				isFirstSlot = false;
			}
			else {
				const newCandidates: string[] = [];
				for (const candidate of localCandidates) {
					if (candidates.includes(candidate)) {
						newCandidates.push(candidate);
					}
				}
				candidates.length = 0;
				candidates.push(...newCandidates);
			}
		}
		setCenterKanjiCandidates(candidates);
	}

	return (
		<>
			<h1 className="title">和同開珎ソルバー</h1>
			<div className="introduction">
				漢字熟語パズル．<br />
			</div>
			<div className="cross-grid">
				<div />
				<div className="slot-wrapper vertical">
					<input type="text" className="slot" value={topSlot.kanji} onChange={(e) => setTopSlot({ ...topSlot, kanji: e.target.value })} />
					<button className="arrow-button" onClick={() => setTopSlot({ ...topSlot, arrowDirection: topSlot.arrowDirection === "in" ? "out" : "in" })}>
						{topSlot.arrowDirection === "in" ? "↓" : "↑"}
					</button>
				</div>
				<div />
				<div className="slot-wrapper horizontal">
					<input type="text" className="slot" value={leftSlot.kanji} onChange={(e) => setLeftSlot({ ...leftSlot, kanji: e.target.value })} />
					<button className="arrow-button" onClick={() => setLeftSlot({ ...leftSlot, arrowDirection: leftSlot.arrowDirection === "in" ? "out" : "in" })}>
						{leftSlot.arrowDirection === "in" ? "→" : "←"}
					</button>
				</div>
				<div className="center-slot">
					？
				</div>
				<div className="slot-wrapper horizontal">
					<button className="arrow-button" onClick={() => setRightSlot({ ...rightSlot, arrowDirection: rightSlot.arrowDirection === "in" ? "out" : "in" })}>
						{rightSlot.arrowDirection === "in" ? "←" : "→"}
					</button>
					<input type="text" className="slot" value={rightSlot.kanji} onChange={(e) => setRightSlot({ ...rightSlot, kanji: e.target.value })} />
				</div>
				<div />
				<div className="slot-wrapper vertical">
					<button className="arrow-button" onClick={() => setBottomSlot({ ...bottomSlot, arrowDirection: bottomSlot.arrowDirection === "in" ? "out" : "in" })}>
						{bottomSlot.arrowDirection === "in" ? "↑" : "↓"}
					</button>
					<input type="text" className="slot" value={bottomSlot.kanji} onChange={(e) => setBottomSlot({ ...bottomSlot, kanji: e.target.value })} />
				</div>
				<div />
			</div >
			<div className="button-wrapper">
				<button className="search-button" onClick={searchCenterKanjiCandidates}>検索</button>
			</div>
			<div className="result-wrapper">
				<div className="result">
					{centerKanjiCandidates.length > 0 ? (
						<>
							<p className="result-label">候補</p>
							<ul className="result-list">
								{centerKanjiCandidates.map((kanji, index) => (
									<li key={index}>{kanji}</li>
								))}
							</ul>
						</>
					) : (
						<p className="no-result">候補なし</p>
					)}
				</div>
			</div>
			<div className="license">
				本 Web アプリでは，<Link href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project">EDICT</Link> の <Link href="https://www.edrdg.org/edrdg/licence.html">ライセンス</Link> に基づき，<Link href="https://github.com/scriptin/jmdict-simplified">jmdict-simplified</Link> の JMdict データを加工して使用しています．
			</div>
		</>
	)
}