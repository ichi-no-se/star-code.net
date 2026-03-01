"use client"
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import "@styles/shiny-pokemon.css";

type Generation = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type ConditionState = {
	generation: Generation;
	shinyCharm: boolean;
	international: boolean;
};

type ResultRecord = {
	trialCount: number;
	shinyCount: number;
	lastResult: "shiny" | "normal" | null;
};

type StoredData = {
	[genKey: string]: {
		[charmKey: string]: {
			[intlKey: string]: ResultRecord;
		}
	}
};

const STORAGE_KEY = "shiny-pokemon";

function getAvailableOptions(gen: Generation) {
	return {
		shinyCharmEnabled: gen >= 5,
		internationalEnabled: gen >= 4,
	};
}

function calculateShinyChance(condition: ConditionState): number {
	switch (condition.generation) {
		case 2:
			return 1 / 8192;
		case 3:
			return 1 / 8192;
		case 4:
			return condition.international ? 5 / 8192 : 1 / 8192;
		case 5:
			{
				const baseNumerator = condition.international ? 6 : 1;
				return (baseNumerator + (condition.shinyCharm ? 2 : 0)) / 8192;
			}
		case 6:
			{
				const baseNumerator = condition.international ? 6 : 1;
				return (baseNumerator + (condition.shinyCharm ? 2 : 0)) / 4096;
			}
		case 7:
			{
				const baseNumerator = condition.international ? 6 : 1;
				return (baseNumerator + (condition.shinyCharm ? 2 : 0)) / 4096;
			}
		case 8:
			{
				let numerator = 1;
				if (condition.international) numerator += 6;
				if (condition.shinyCharm) numerator += 2;
				return numerator / 4096;
			}
		case 9:
			{
				let numerator = 1;
				if (condition.international) numerator += 6;
				if (condition.shinyCharm) numerator += 2;
				return numerator / 4096;
			}
		default:
			throw new Error("Unsupported generation");
	}
}

function loadData(): StoredData {
	const raw = localStorage.getItem(STORAGE_KEY);
	return raw ? JSON.parse(raw) as StoredData : {};
}

function saveData(data: StoredData) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function genKey(g: Generation): string {
	return `gen${g}`;
}

function charmKey(b: boolean): "withCharm" | "noCharm" {
	return b ? "withCharm" : "noCharm";
}

function intlKey(b: boolean): "intlHatch" | "regularHatch" {
	return b ? "intlHatch" : "regularHatch";
}

function updateResult(condition: ConditionState, record: ResultRecord) {
	const gen = genKey(condition.generation);
	const charm = charmKey(condition.shinyCharm);
	const intl = intlKey(condition.international);
	const data = loadData();
	if (!data[gen]) {
		data[gen] = {};
	}
	if (!data[gen][charm]) {
		data[gen][charm] = {};
	}
	data[gen][charm][intl] = record;
	saveData(data);
}

function getResult(condition: ConditionState): ResultRecord {
	const gen = genKey(condition.generation);
	const charm = charmKey(condition.shinyCharm);
	const intl = intlKey(condition.international);
	const data = loadData();
	if (data[gen]?.[charm]?.[intl]) {
		return data[gen][charm][intl];
	}
	return {
		trialCount: 0,
		shinyCount: 0,
		lastResult: null,
	};
}

function resetResult(condition: ConditionState) {
	const gen = genKey(condition.generation);
	const charm = charmKey(condition.shinyCharm);
	const intl = intlKey(condition.international);

	const data = loadData();
	if (data[gen]?.[charm]?.[intl]) {
		delete data[gen][charm][intl];
		if (Object.keys(data[gen][charm]).length === 0) {
			delete data[gen][charm];
		}
		if (Object.keys(data[gen]).length === 0) {
			delete data[gen];
		}
	}
	saveData(data);
}

function resetAllResults() {
	localStorage.removeItem(STORAGE_KEY);
}

export default function ShinyPokemon() {
	const [generation, setGeneration] = useState<Generation>(9);
	const [shinyCharm, setShinyCharm] = useState<boolean>(false);
	const [international, setInternational] = useState<boolean>(false);

	const options = useMemo(() => getAvailableOptions(generation), [generation]);
	const condition = useMemo((): ConditionState => ({
		generation: generation,
		shinyCharm: options.shinyCharmEnabled ? shinyCharm : false,
		international: options.internationalEnabled ? international : false,
	}), [generation, shinyCharm, international, options]);

	const [result, setResult] = useState<ResultRecord>({
		trialCount: 0,
		shinyCount: 0,
		lastResult: null,
	});

	useEffect(() => {
		if (typeof window === "undefined") {
			setResult({
				trialCount: 0,
				shinyCount: 0,
				lastResult: null,
			});
		}
		else {
			setResult(getResult(condition));
		}
	}, [condition]);

	const handleTrial = () => {
		const chance = calculateShinyChance(condition);
		const isShiny = Math.random() < chance;
		const newRecord: ResultRecord = {
			trialCount: result.trialCount + 1,
			shinyCount: isShiny ? result.shinyCount + 1 : result.shinyCount,
			lastResult: isShiny ? "shiny" : "normal",
		};
		setResult(newRecord);
		updateResult(condition, newRecord);
	};
	const handleResetCurrent = () => {
		resetResult(condition);
		setResult({
			trialCount: 0,
			shinyCount: 0,
			lastResult: null,
		});
	}
	const handleResetAll = () => {
		resetAllResults();
		setResult({
			trialCount: 0,
			shinyCount: 0,
			lastResult: null,
		});
	}
	return (
		<>
			<h1 className="title">ポケモン色違い抽選シミュレーター</h1>
			<h2 className="introduction">
				4096 分の 1 の奇跡．<br />
				関連記事は<Link href="/blog/shiny-pokemon">こちら</Link>から．
			</h2>
			<div className="layout-container">
				<div className="side-panel">
					<label className="title-label">
						条件
					</label>
					<div className="generation-panel">
						{([2, 3, 4, 5, 6, 7, 8, 9] as Generation[]).map((gen) => (
							<button key={gen}
								className={`generation-button ${gen === generation ? "active" : ""}`}
								onClick={() => setGeneration(gen)}
							>
								第 {gen} 世代
							</button>
						))}
					</div>
					<div className="options-panel">
						<label className="option-label">
							<input
								type="checkbox"
								className="option-checkbox"
								checked={shinyCharm}
								onChange={(e) => setShinyCharm(e.target.checked)}
								disabled={!options.shinyCharmEnabled}
							/>
							<span>ひかるおまもり</span>
						</label>
						<label className="option-label">
							<input
								type="checkbox"
								className="option-checkbox"
								checked={international}
								onChange={(e) => setInternational(e.target.checked)}
								disabled={!options.internationalEnabled}
							/>
							<span>国際孵化</span>
						</label>
					</div>
					<div className="shiny-chance-panel">
						<p className="shiny-chance-label">色違い出現確率</p>
						<p className="shiny-chance-value">
							{(calculateShinyChance(condition) * 100).toFixed(11)} %
						</p>
					</div>
				</div>
				<div className="-panel">
					<label className="title-label">
						結果
					</label>
					<div className="statistic-panel">
						<p className="statistic-label">試行回数</p>
						<p className="statistic-value">{result.trialCount} 回</p>
						<p className="statistic-label">色違い出現回数</p>
						<p className="statistic-value">{result.shinyCount} 回</p>
					</div><div className="result-panel">
						{
							result.lastResult === "shiny" && (
								<p className="result-text shiny">色違い</p>
							)
						}
						{
							result.lastResult === "normal" && (
								<p className="result-text normal">通常色</p>
							)
						}
						{
							result.lastResult === null && (
								<p className="result-text initial">-</p>
							)
						}
					</div>
					<div className="trial-button-panel">
						<button className="trial-button" onClick={handleTrial}>
							抽選
						</button>
					</div>
				</div>
			</div>

			<div className="reset-button-panel">
				<button className="reset-button" onClick={handleResetCurrent}>
					現在の結果をリセット
				</button>
				<button className="reset-button" onClick={handleResetAll}>
					全ての結果をリセット
				</button>
			</div>
		</>
	);
}
