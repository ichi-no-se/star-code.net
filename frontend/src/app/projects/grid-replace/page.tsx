"use client";
import Link from "next/link";
import { useEffect, useState, useRef, Fragment } from "react";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import "@styles/grid-replace.css";

type Grid = string[][];

type Mode = "edit" | "view";

interface ReplaceRule {
	id: string;
	find: Grid;
	replace: Grid;
}

interface ReplaceResult {
	newGrid: Grid;
	isMatched: boolean;
	appliedRuleIndex: number | null;
	matchedPosition: { row: number; col: number } | null;
}

interface RuleGridEditorProps {
	grid: Grid;
	onCellChange: (row: number, col: number, value: string) => void;
	readOnly: boolean;
	colorRules: ColorRule[];
}

interface RuleCardProps {
	index: number;
	rule: ReplaceRule;
	isFirst: boolean;
	isLast: boolean;
	readOnly: boolean;
	highlightType: null | "current" | "next" | "both";
	colorRules: ColorRule[];
	maxRows: number;
	maxCols: number;
	onChange: (newRule: ReplaceRule) => void;
	onDelete: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
}

interface StepLog {
	grid: Grid;
	appliedRuleIndex: number | null;
	matchedPosition: { row: number; col: number } | null;
}

interface ColorRule {
	char: string;
	backgroundColor: string;
	textColor: string;
}

interface GridReplaceExportData {
	version: 1;
	mainGrid: Grid;
	rules: ReplaceRule[];
	maxSteps: number;
	playInterval: number;
	colorRules: ColorRule[];
	currentHighlightColor: string;
	nextHighlightColor: string;
}

interface DualInputProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	min: number;
	sliderMax: number;
	limitMax: number;
	step: number;
}

const DualInput = ({ label, value, onChange, min, sliderMax, limitMax, step }: DualInputProps) => {
	const [textValue, setTextValue] = useState(value.toString());

	useEffect(() => {
		setTextValue(value.toString());
	}, [value]);

	const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const str = e.target.value;
		setTextValue(str);
		const num = parseInt(str, 10);
		if (!isNaN(num) && num >= min && num <= limitMax) {
			onChange(num);
		}
	};

	const handleBlur = () => {
		let num = parseInt(textValue, 10);
		if (isNaN(num) || num < min) {
			num = min;
		} else if (num > limitMax) {
			num = limitMax;
		}
		setTextValue(num.toString());
		onChange(num);
	};

	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const num = parseInt(e.target.value, 10);
		onChange(num);
	};

	return (
		<fieldset className="dual-input-fieldset">
			<legend>{label}</legend>
			<div className="dual-inputs">
				<input type="range" min={min} max={sliderMax} step={step} value={Math.min(value, sliderMax)} onChange={handleSliderChange} className="dual-input-range" />
				<input type="number" min={min} max={limitMax} value={textValue} onChange={handleTextChange} onBlur={handleBlur} className="dual-input-number" />
			</div>
		</fieldset>
	)
};

function resizeGrid(grid: Grid, newRows: number, newCols: number, padding: string): Grid {
	const resizedGrid: Grid = [];
	for (let r = 0; r < newRows; r++) {
		const newRow: string[] = [];
		for (let c = 0; c < newCols; c++) {
			if (r < grid.length && c < grid[0].length) {
				newRow.push(grid[r][c]);
			} else {
				newRow.push(padding);
			}
		}
		resizedGrid.push(newRow);
	}
	return resizedGrid;
}

function stepReplace(grid: Grid, rules: ReplaceRule[]): ReplaceResult {
	const newGrid: string[][] = grid.map(row => [...row]);
	for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
		const rule = rules[ruleIndex];
		for (let row = 0; row <= grid.length - rule.find.length; row++) {
			for (let col = 0; col <= grid[0].length - rule.find[0].length; col++) {
				let match = true;
				for (let r = 0; r < rule.find.length; r++) {
					for (let c = 0; c < rule.find[0].length; c++) {
						if (rule.find[r][c] === "") continue;
						if (newGrid[row + r][col + c] !== rule.find[r][c]) {
							match = false;
							break;
						}
					}
					if (!match) break;
				}
				if (match) {
					for (let r = 0; r < rule.replace.length; r++) {
						for (let c = 0; c < rule.replace[0].length; c++) {
							if (rule.replace[r][c] !== "") {
								newGrid[row + r][col + c] = rule.replace[r][c];
							}
						}
					}
					return { newGrid: newGrid, isMatched: true, appliedRuleIndex: ruleIndex, matchedPosition: { row, col } };
				}
			}
		}
	}
	return { newGrid: newGrid, isMatched: false, appliedRuleIndex: null, matchedPosition: null };
}

function RuleGridEditor({ grid, onCellChange, readOnly, colorRules }: RuleGridEditorProps) {
	return (
		<div className="rule-grid-editor">
			{grid.map((row, rowIndex) => (
				<div className="rule-grid-row" key={rowIndex}>
					{row.map((cell, colIndex) => (
						<input
							className="rule-grid-cell"
							key={`${rowIndex}-${colIndex}`}
							type="text"
							value={cell}
							onChange={(e) => onCellChange(rowIndex, colIndex, e.target.value)}
							disabled={readOnly}
							style={getCellStyle(cell, colorRules)}
						/>))}
				</div>
			))}
		</div>
	);
}

function RuleCard({ rule, isFirst, isLast, readOnly, highlightType, colorRules, maxRows, maxCols, onChange, onDelete, onMoveUp, onMoveDown }: RuleCardProps) {
	const [rowsInput, setRowsInput] = useState<string>(rule.find.length.toString());
	const [colsInput, setColsInput] = useState<string>(rule.find[0].length.toString());

	const handleResize = (newRowsStr: string, newColsStr: string) => {
		setRowsInput(newRowsStr);
		setColsInput(newColsStr);
		const newRows = parseInt(newRowsStr, 10);
		const newCols = parseInt(newColsStr, 10);
		if (!isNaN(newRows) && newRows > 0 && !isNaN(newCols) && newCols > 0) {
			const clampedRows = Math.min(newRows, maxRows);
			const clampedCols = Math.min(newCols, maxCols);
			onChange({
				id: rule.id,
				find: resizeGrid(rule.find, clampedRows, clampedCols, ""),
				replace: resizeGrid(rule.replace, clampedRows, clampedCols, "")
			});
		}
	};
	const handleBlur = () => {
		const r = parseInt(rowsInput, 10);
		const c = parseInt(colsInput, 10);
		if (isNaN(r) || r <= 0) {
			setRowsInput(rule.find.length.toString());
		}
		else {
			const clampedRows = Math.min(r, maxRows);
			setRowsInput(clampedRows.toString());
		}
		if (isNaN(c) || c <= 0) {
			setColsInput(rule.find[0].length.toString());
		}
		else {
			const clampedCols = Math.min(c, maxCols);
			setColsInput(clampedCols.toString());
		}
	};
	const handleCellChange = (target: "find" | "replace", row: number, col: number, value: string) => {
		const targetGrid = target === "find" ? rule.find : rule.replace;
		const newGrid = targetGrid.map((r, rIndex) => r.map((c, cIndex) => (rIndex === row && cIndex === col ? value : c)));
		onChange({
			...rule,
			[target]: newGrid
		});
	};

	return (
		<div className={`rule-card ${highlightType ? `highlight-${highlightType}` : ""}`}>
			<div className="rule-card-body">
				<details open>
					<summary className="rule-card-summary">ルールの編集</summary>
					<div className="rule-card-left-container">
						<div className="rule-card-size-inputs">
							<label>
								行：
								<input
									type="number"
									className="rule-card-size-input"
									min="1"
									max={maxRows}
									value={rowsInput}
									onChange={(e) => handleResize(e.target.value, colsInput)}
									onBlur={handleBlur}
									disabled={readOnly}
								/>
							</label>
							<label>
								列：
								<input
									type="number"
									className="rule-card-size-input"
									min="1"
									max={maxCols}
									value={colsInput}
									onChange={(e) => handleResize(rowsInput, e.target.value)}
									onBlur={handleBlur}
									disabled={readOnly}
								/>
							</label>
						</div>
						<div className="rule-card-grids">
							<RuleGridEditor grid={rule.find} onCellChange={(row, col, value) => handleCellChange("find", row, col, value)} readOnly={readOnly} colorRules={colorRules} />
							<div className="rule-card-arrow" />
							<RuleGridEditor grid={rule.replace} onCellChange={(row, col, value) => handleCellChange("replace", row, col, value)} readOnly={readOnly} colorRules={colorRules} />
						</div>
					</div>
				</details>
				<div className="rule-card-buttons">
					<button className="rule-card-button" onClick={onMoveUp} disabled={readOnly || isFirst}>上へ</button>
					<button className="rule-card-button delete-button" onClick={onDelete} disabled={readOnly}>削除</button>
					<button className="rule-card-button" onClick={onMoveDown} disabled={readOnly || isLast}>下へ</button>
				</div>
			</div>
		</div>
	)
}

function AddRuleButton({ onAdd, index, disabled }: { onAdd: (index: number) => void, index: number, disabled: boolean }) {
	return (
		<button onClick={() => onAdd(index)} className="add-rule-button" disabled={disabled}>
			ルールを追加
		</button>
	)
}

function getCellStyle(str: string, colorRules: ColorRule[]): React.CSSProperties {
	if (!str || !colorRules) return {
		backgroundColor: "white",
		color: "black"
	};
	const colorRule = colorRules.find(rule => rule.char === str);
	if (colorRule) {
		return {
			backgroundColor: colorRule.backgroundColor,
			color: colorRule.textColor
		};
	}
	return {
		backgroundColor: "white",
		color: "black"
	};
}

function isValidHex6(color: unknown): color is string {
	if (typeof color !== "string") return false;
	return /^#[0-9a-fA-F]{6}$/.test(color.trim());
}

function isValidGrid(grid: unknown, maxRows: number, maxCols: number): grid is Grid {
	if (!Array.isArray(grid) || grid.length === 0 || grid.length > maxRows) return false;
	const cols = grid[0]?.length;
	if (typeof cols !== "number" || cols === 0 || cols > maxCols) return false;
	for (const row of grid) {
		if (!Array.isArray(row) || row.length !== cols) return false;
		for (const cell of row) {
			if (typeof cell !== "string") return false;
		}
	}
	return true;
}

function isValidReplaceRule(rule: unknown, maxRows: number, maxCols: number): rule is ReplaceRule {
	if (typeof rule !== "object" || rule === null) return false;
	const r = rule as Partial<ReplaceRule>;
	if (typeof r.id !== "string" || !r.id) return false;
	if (!isValidGrid(r.find, maxRows, maxCols) || !isValidGrid(r.replace, maxRows, maxCols)) return false;
	return r.find.length === r.replace.length && r.find[0].length === r.replace[0].length;
}

function isValidColorRule(rule: unknown): rule is ColorRule {
	if (typeof rule !== "object" || rule === null) return false;
	const r = rule as Partial<ColorRule>;
	return typeof r.char === "string" && isValidHex6(r.backgroundColor) && isValidHex6(r.textColor);
}


function validateExportData(data: unknown, maxRows: number, maxCols: number): data is GridReplaceExportData {
	if (typeof data !== "object" || data === null) return false;
	const d = data as Partial<GridReplaceExportData>;
	if (d.version !== 1) return false;
	if (!isValidGrid(d.mainGrid, maxRows, maxCols)) return false;
	if (!Array.isArray(d.rules) || !d.rules.every(rule => isValidReplaceRule(rule, maxRows, maxCols))) return false;
	if (typeof d.maxSteps !== "number" || !Number.isInteger(d.maxSteps) || d.maxSteps <= 0) return false;
	if (typeof d.playInterval !== "number" || !Number.isInteger(d.playInterval) || d.playInterval <= 0) return false;
	if (!Array.isArray(d.colorRules) || !d.colorRules.every(isValidColorRule)) return false;
	if (!isValidHex6(d.currentHighlightColor)) return false;
	if (!isValidHex6(d.nextHighlightColor)) return false;
	return true;
}

export default function GridReplacePage() {
	const LOCAL_STORAGE_KEY = "grid-replace-app-state-v1";
	const DEFAULT_MAIN_CELL = "0";
	const DEFAULT_STATE = {
		mainGrid: Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => DEFAULT_MAIN_CELL)),
		rules: [
			{
				id: crypto.randomUUID(),
				find: Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => DEFAULT_MAIN_CELL)),
				replace: Array.from({ length: 2 }, () => Array.from({ length: 2 }, () => "A")),
			},
			{
				id: crypto.randomUUID(),
				find: [["A", "", ""], ["", "A", ""]],
				replace: [["B", "B", ""], ["", "", "B"]],
			}
		],
		colorRules: [
			{ char: "A", backgroundColor: "#ffa0a0", textColor: "#550000" },
			{ char: "B", backgroundColor: "#a0a0ff", textColor: "#000055" },
		],
		maxSteps: 200,
		playInterval: 500,
		currentHighlightColor: "#eebb00",
		nextHighlightColor: "#00aaff",
	};
	const [mode, setMode] = useState<Mode>("edit");
	const [mainGrid, setMainGrid] = useState<Grid>(DEFAULT_STATE.mainGrid);
	const [rules, setRules] = useState<ReplaceRule[]>(DEFAULT_STATE.rules);

	const [colorRules, setColorRules] = useState<ColorRule[]>(DEFAULT_STATE.colorRules);

	const [maxSteps, setMaxSteps] = useState<number>(DEFAULT_STATE.maxSteps);

	const [mainRowsInput, setMainRowsInput] = useState<string>(mainGrid.length.toString());
	const [mainColsInput, setMainColsInput] = useState<string>(mainGrid[0].length.toString());

	const [stepLogs, setStepLogs] = useState<StepLog[]>([]);
	const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

	const [currentHighlightColor, setCurrentHighlightColor] = useState<string>(DEFAULT_STATE.currentHighlightColor);
	const [nextHighlightColor, setNextHighlightColor] = useState<string>(DEFAULT_STATE.nextHighlightColor);
	const [isHighlightVisible, setIsHighlightVisible] = useState<boolean>(true);

	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [playInterval, setPlayInterval] = useState<number>(DEFAULT_STATE.playInterval);// milliseconds

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const [isExportingGif, setIsExportingGif] = useState<boolean>(false);
	const [gifCellSizeInput, setGifCellSizeInput] = useState<string>("20");
	const [gifIntervalInput, setGifIntervalInput] = useState<string>("100");

	const maxRows = 100;
	const maxCols = 100;

	const maxGifCellSize = 100;
	const maxGifInterval = 10000;

	const handleMainGridResize = (newRowsStr: string, newColsStr: string) => {
		setMainRowsInput(newRowsStr);
		setMainColsInput(newColsStr);
		const newRows = parseInt(newRowsStr, 10);
		const newCols = parseInt(newColsStr, 10);
		if (!isNaN(newRows) && newRows > 0 && !isNaN(newCols) && newCols > 0) {
			const clampedRows = Math.min(newRows, maxRows);
			const clampedCols = Math.min(newCols, maxCols);
			setMainGrid(resizeGrid(mainGrid, clampedRows, clampedCols, DEFAULT_MAIN_CELL));
		}
	};

	const handleMainGridBlur = () => {
		const r = parseInt(mainRowsInput, 10);
		const c = parseInt(mainColsInput, 10);
		if (isNaN(r) || r <= 0) {
			setMainRowsInput(mainGrid.length.toString());
		}
		else {
			const clampedRows = Math.min(r, maxRows);
			setMainRowsInput(clampedRows.toString());
		}
		if (isNaN(c) || c <= 0) {
			setMainColsInput(mainGrid[0].length.toString());
		}
		else {
			const clampedCols = Math.min(c, maxCols);
			setMainColsInput(clampedCols.toString());
		}
	};

	const handleMainGridCellChange = (row: number, col: number, value: string) => {
		const newGrid = mainGrid.map((r, rIndex) => r.map((c, cIndex) => (rIndex === row && cIndex === col ? value : c)));
		setMainGrid(newGrid);
	};

	const handleMainGridCellBlur = (row: number, col: number) => {
		const value = mainGrid[row][col];
		if (value === "") {
			const newGrid = mainGrid.map((r, rIndex) => r.map((c, cIndex) => (rIndex === row && cIndex === col ? DEFAULT_MAIN_CELL : c)));
			setMainGrid(newGrid);
		}
	}

	const handleAddRule = (index: number) => {
		const newRule: ReplaceRule = {
			id: crypto.randomUUID(),
			find: [[""]],
			replace: [[""]]
		};
		const newRules = [...rules];
		newRules.splice(index, 0, newRule);
		setRules(newRules);
	};

	const handleChangeRule = (index: number, newRule: ReplaceRule) => {
		const newRules = [...rules];
		newRules[index] = newRule;
		setRules(newRules);
	};

	const handleDeleteRule = (index: number) => {
		const newRules = [...rules];
		newRules.splice(index, 1);
		setRules(newRules);
	};

	const handleMoveRuleUp = (index: number) => {
		if (index === 0) return;
		const newRules = [...rules];
		const temp = newRules[index - 1];
		newRules[index - 1] = newRules[index];
		newRules[index] = temp;
		setRules(newRules);
	};

	const handleMoveRuleDown = (index: number) => {
		if (index === rules.length - 1) return;
		const newRules = [...rules];
		const temp = newRules[index + 1];
		newRules[index + 1] = newRules[index];
		newRules[index] = temp;
		setRules(newRules);
	};


	const handleStartSimulation = () => {
		const initialLog: StepLog = {
			grid: mainGrid.map(row => [...row]),
			appliedRuleIndex: null,
			matchedPosition: null
		};
		const newStepLogs: StepLog[] = [initialLog];
		for (let step = 0; step < maxSteps; step++) {
			const currentGrid = newStepLogs[newStepLogs.length - 1].grid;
			const result = stepReplace(currentGrid, rules);
			if (!result.isMatched) {
				break;
			}
			newStepLogs.push({
				grid: result.newGrid,
				appliedRuleIndex: result.appliedRuleIndex,
				matchedPosition: result.matchedPosition
			});
		}
		setStepLogs(newStepLogs);
		setCurrentStepIndex(0);
		setIsPlaying(false);
		setMode("view");
	};

	const handleGoFirst = () => {
		setIsPlaying(false);
		setCurrentStepIndex(0);
	};

	const handleStepPrev = () => {
		setIsPlaying(false);
		setCurrentStepIndex(prev => Math.max(prev - 1, 0));
	};

	const handleStepNext = () => {
		setIsPlaying(false);
		setCurrentStepIndex(prev => Math.min(prev + 1, stepLogs.length - 1));
	};

	const handleGoLast = () => {
		setIsPlaying(false);
		setCurrentStepIndex(stepLogs.length - 1);
	};

	const handleTogglePlay = () => {
		if (!isPlaying && currentStepIndex === stepLogs.length - 1) {
			setCurrentStepIndex(0);
		}
		setIsPlaying(prev => !prev);
	};

	const handleEditInitial = () => {
		setIsPlaying(false);
		setMode("edit");
		setMainGrid(stepLogs[0].grid.map(row => [...row]));
		setMainRowsInput(stepLogs[0].grid.length.toString());
		setMainColsInput(stepLogs[0].grid[0].length.toString());
	};

	const handleGifCellSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setGifCellSizeInput(e.target.value);
	};

	const handleGifCellSizeBlur = () => {
		const num = parseInt(gifCellSizeInput, 10);
		if (isNaN(num) || num <= 0) {
			setGifCellSizeInput("20");
		}
		else if (num > maxGifCellSize) {
			setGifCellSizeInput(maxGifCellSize.toString());
		} else {
			setGifCellSizeInput(num.toString());
		}
	};

	const handleGifIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setGifIntervalInput(e.target.value);
	};

	const handleGifIntervalBlur = () => {
		const num = parseInt(gifIntervalInput, 10);
		if (isNaN(num) || num <= 0) {
			setGifIntervalInput("100");
		} else if (num > maxGifInterval) {
			setGifIntervalInput(maxGifInterval.toString());
		} else {
			setGifIntervalInput(num.toString());
		}
	}

	const handleExportJson = () => {
		const targetMainGrid = mode === "edit" ? mainGrid : stepLogs[0].grid;
		const data: GridReplaceExportData = {
			version: 1,
			mainGrid: targetMainGrid,
			rules,
			maxSteps,
			playInterval,
			colorRules,
			currentHighlightColor,
			nextHighlightColor
		};
		const jsonString = JSON.stringify(data, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url
		a.download = `grid-replace-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const text = event.target?.result;
				if (typeof text !== "string") throw new Error("Invalid file content");
				const data = JSON.parse(text);
				if (!validateExportData(data, maxRows, maxCols)) throw new Error("Invalid data structure");
				setIsPlaying(false);
				setMode("edit");
				setMainGrid(data.mainGrid);
				setMainRowsInput(data.mainGrid.length.toString());
				setMainColsInput(data.mainGrid[0].length.toString());
				setRules(data.rules);
				setMaxSteps(data.maxSteps);
				setPlayInterval(data.playInterval);
				setColorRules(data.colorRules);
				setCurrentHighlightColor(data.currentHighlightColor);
				setNextHighlightColor(data.nextHighlightColor);
			} catch (error) {
				console.error("Error importing JSON file:", error);
			} finally {
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			}
		};
		reader.readAsText(file);
	};

	const handleExportGif = async () => {
		if (stepLogs.length === 0 || mode !== "view" || isExportingGif) return;
		setIsExportingGif(true);
		try {
			const cellSize = parseInt(gifCellSizeInput, 10);
			if (isNaN(cellSize) || cellSize <= 0) {
				throw new Error("Invalid cell size for GIF export.");
			}

			const rows = displayGrid.length;
			const cols = displayGrid[0]?.length || 1;
			const width = cols * cellSize;
			const height = rows * cellSize;

			const gifInterval = parseInt(gifIntervalInput, 10);
			if (isNaN(gifInterval) || gifInterval <= 0) {
				throw new Error("Invalid play interval for GIF export.");
			}

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Failed to get canvas context.");

			const encoder = GIFEncoder();
			for (let i = 0; i < stepLogs.length; i++) {
				const log = stepLogs[i];
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, width, height);
				for (let r = 0; r < log.grid.length; r++) {
					for (let c = 0; c < log.grid[r].length; c++) {
						const char = log.grid[r][c];
						const style = getCellStyle(char, colorRules);
						const x = c * cellSize;
						const y = r * cellSize;
						ctx.fillStyle = style.backgroundColor as string || "white";
						ctx.fillRect(x, y, cellSize, cellSize);
						ctx.fillStyle = style.color as string || "black";
						ctx.font = `${cellSize * 0.6}px sans-serif`;
						ctx.textAlign = "center";
						ctx.textBaseline = "middle";
						ctx.fillText(char, x + cellSize / 2, y + cellSize / 2);
					}
				}
				const imageData = ctx.getImageData(0, 0, width, height);
				const palette = quantize(imageData.data, 256);
				const index = applyPalette(imageData.data, palette);
				encoder.writeFrame(index, width, height, { palette, delay: gifInterval });
			}
			encoder.finish();
			const blob = new Blob([encoder.bytes() as BlobPart], { type: "image/gif" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `grid-replace-${new Date().toISOString().slice(0, 10)}.gif`;
			a.click();
			URL.revokeObjectURL(url);
		}
		catch (error) {
			console.error("Error exporting GIF:", error);
		} finally {
			setIsExportingGif(false);
		}
	}

	const handleResetToDefault = () => {
		const isConfirmed = window.confirm("初期状態にリセットしますか？\n（現在のグリッドやルールはすべて消去されます）");
		if (!isConfirmed) return;
		setIsPlaying(false);
		setMode("edit");
		setMainGrid(DEFAULT_STATE.mainGrid);
		setMainRowsInput(DEFAULT_STATE.mainGrid.length.toString());
		setMainColsInput(DEFAULT_STATE.mainGrid[0].length.toString());
		setRules(DEFAULT_STATE.rules);
		setMaxSteps(DEFAULT_STATE.maxSteps);
		setPlayInterval(DEFAULT_STATE.playInterval);
		setColorRules(DEFAULT_STATE.colorRules);
		setCurrentHighlightColor(DEFAULT_STATE.currentHighlightColor);
		setNextHighlightColor(DEFAULT_STATE.nextHighlightColor);
		setStepLogs([]);
		setCurrentStepIndex(0);
	};

	const handleClear = () => {
		const isConfirmed = window.confirm("グリッドとルールをすべて消去しますか？\n（現在のグリッドやルールはすべて消去されます）");
		if (!isConfirmed) return;
		setIsPlaying(false);
		setMode("edit");
		setMainGrid([[DEFAULT_MAIN_CELL]]);
		setMainRowsInput("1");
		setMainColsInput("1");
		setRules([]);
		setMaxSteps(DEFAULT_STATE.maxSteps);
		setPlayInterval(DEFAULT_STATE.playInterval);
		setColorRules([]);
		setCurrentHighlightColor(DEFAULT_STATE.currentHighlightColor);
		setNextHighlightColor(DEFAULT_STATE.nextHighlightColor);
		setStepLogs([]);
		setCurrentStepIndex(0);
	};

	useEffect(() => {
		try {
			const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (!saved) return;
			const data = JSON.parse(saved);
			if (!validateExportData(data, maxRows, maxCols)) return;

			setMainGrid(data.mainGrid);
			setMainRowsInput(data.mainGrid.length.toString());
			setMainColsInput(data.mainGrid[0].length.toString());
			setRules(data.rules);
			setMaxSteps(data.maxSteps);
			setPlayInterval(data.playInterval);
			setColorRules(data.colorRules);
			setCurrentHighlightColor(data.currentHighlightColor);
			setNextHighlightColor(data.nextHighlightColor);
		} catch (error) {
			console.error("Error loading saved state:", error);
		}
		finally {
			setIsLoaded(true);
		}
	}, []);

	useEffect(() => {
		if (!isPlaying || mode !== "view") return;
		if (currentStepIndex >= stepLogs.length - 1) {
			setIsPlaying(false);
			return;
		}

		const timer = setTimeout(() => {
			setCurrentStepIndex((prev) => prev + 1);
		}, playInterval);

		return () => clearTimeout(timer);
	}, [isPlaying, currentStepIndex, stepLogs.length, playInterval, mode]);

	useEffect(() => {
		const targetMainGrid = mode === "edit" ? mainGrid : (stepLogs[0]?.grid ?? mainGrid);
		if (!isLoaded) return;
		const data: GridReplaceExportData = {
			version: 1,
			mainGrid: targetMainGrid,
			rules,
			maxSteps,
			playInterval,
			colorRules,
			currentHighlightColor,
			nextHighlightColor,
		};

		try {
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
		} catch (e) {
			console.error("Failed to save to localStorage:", e);
		}
	}, [
		mainGrid,
		rules,
		maxSteps,
		playInterval,
		colorRules,
		currentHighlightColor,
		nextHighlightColor,
		mode,
		stepLogs,
		isLoaded
	]);

	const displayGrid = mode === "edit" ? mainGrid : stepLogs[currentStepIndex].grid;

	const rowsCount = displayGrid.length || 1;
	const colsCount = displayGrid[0]?.length || 1;

	const currentLog = mode === "view" ? stepLogs[currentStepIndex] : null;
	const nextLog = mode === "view" && stepLogs[currentStepIndex + 1] ? stepLogs[currentStepIndex + 1] : null;

	return (
		<>
			<h1 className="title">グリッド置換器</h1>
			<div className="introduction">
				グリッド上で文字を置換．<br />
				説明は<Link href="/blog/grid-replace">こちら</Link>から．開発記事は<Link href="/blog/grid-replace-2">こちら</Link>から．
			</div>
			<div className="grid-replace-container" style={{ "--current-highlight-color": currentHighlightColor, "--next-highlight-color": nextHighlightColor } as React.CSSProperties}>
				<div className="main-grid-container">
					<div className="main-grid-size-inputs">
						<label>行：
							<input
								type="number"
								min="1"
								max={maxRows}
								value={mainRowsInput}
								readOnly={mode === "view"}
								onChange={(e) => handleMainGridResize(e.target.value, mainColsInput)}
								onBlur={handleMainGridBlur}
							/>
						</label>
						<label>列：
							<input
								type="number"
								min="1"
								max={maxCols}
								value={mainColsInput}
								readOnly={mode === "view"}
								onChange={(e) => handleMainGridResize(mainRowsInput, e.target.value)}
								onBlur={handleMainGridBlur}
							/>
						</label>
					</div>
					<div className="main-grid-wrapper" style={{ "--rows": rowsCount, "--cols": colsCount } as React.CSSProperties}>
						<div className="main-grid-editor">
							{displayGrid.map((row, rowIndex) => (
								<div className="main-grid-row" key={rowIndex}>
									{row.map((cell, colIndex) => (
										<input
											className="main-grid-cell"
											key={`${rowIndex}-${colIndex}`}
											type="text"
											value={cell}
											readOnly={mode === "view"}
											style={getCellStyle(cell, colorRules)}
											onChange={(e) => handleMainGridCellChange(rowIndex, colIndex, e.target.value)}
											onBlur={() => handleMainGridCellBlur(rowIndex, colIndex)}
										/>
									))}
								</div>
							))}
						</div>
						{mode === "view" && isHighlightVisible && (
							<>
								{currentLog?.matchedPosition && (
									<div className="highlight-area highlight-current" style={{
										"--match-row": currentLog.matchedPosition.row,
										"--match-col": currentLog.matchedPosition.col,
										"--rule-rows": rules[currentLog.appliedRuleIndex!].find.length,
										"--rule-cols": rules[currentLog.appliedRuleIndex!].find[0].length
									} as React.CSSProperties}
									/>
								)}
								{nextLog?.matchedPosition && (
									<div className="highlight-area highlight-next" style={{
										"--match-row": nextLog.matchedPosition.row,
										"--match-col": nextLog.matchedPosition.col,
										"--rule-rows": rules[nextLog.appliedRuleIndex!].find.length,
										"--rule-cols": rules[nextLog.appliedRuleIndex!].find[0].length
									} as React.CSSProperties}
									/>
								)}
							</>
						)}
					</div>

				</div>
				<div className="rules-container">
					<AddRuleButton onAdd={handleAddRule} index={0} disabled={mode === "view"} />
					{rules.map((rule, index) => (
						<Fragment key={rule.id}>
							<RuleCard
								index={index}
								rule={rule}
								isFirst={index === 0}
								isLast={index === rules.length - 1}
								readOnly={mode === "view"}
								highlightType={(() => {
									if (mode === "view" && isHighlightVisible) {
										if (currentLog?.appliedRuleIndex === index && nextLog?.appliedRuleIndex === index) return "both";
										if (currentLog?.appliedRuleIndex === index) return "current";
										if (nextLog?.appliedRuleIndex === index) return "next";
									}
									return null;
								})()}
								maxRows={maxRows}
								maxCols={maxCols}
								colorRules={colorRules}
								onChange={(newRule) => handleChangeRule(index, newRule)}
								onDelete={() => handleDeleteRule(index)}
								onMoveUp={() => handleMoveRuleUp(index)}
								onMoveDown={() => handleMoveRuleDown(index)}
							/>
							<AddRuleButton onAdd={handleAddRule} index={index + 1} disabled={mode === "view"} />
						</Fragment>
					))}
				</div>
			</div>
			<div className="control-panel">
				{mode === "edit" ? (
					<div className="edit-controls">
						<DualInput
							label="最大ステップ数"
							min={1}
							limitMax={10000}
							sliderMax={10000}
							step={1}
							value={maxSteps}
							onChange={setMaxSteps}
						/>
						<button onClick={handleStartSimulation} className="start-simulation-button">実行モードへ<br />（シミュレーション開始）</button>
					</div>
				) : (
					<div className="view-controls">
						<DualInput
							label="ステップ"
							min={0}
							limitMax={stepLogs.length - 1}
							sliderMax={stepLogs.length - 1}
							step={1}
							value={currentStepIndex}
							onChange={(val) => {
								setIsPlaying(false);
								setCurrentStepIndex(val);
							}}
						/>
						<div className="playback-buttons">
							<button onClick={handleGoFirst} disabled={currentStepIndex === 0}>|&lt;</button>
							<button onClick={handleStepPrev} disabled={currentStepIndex === 0}>&lt;</button>
							<button onClick={handleTogglePlay}>{isPlaying ? "停止" : "再生"}</button>
							<button onClick={handleStepNext} disabled={currentStepIndex === stepLogs.length - 1}>&gt;</button>
							<button onClick={handleGoLast} disabled={currentStepIndex === stepLogs.length - 1}>&gt;|</button>
						</div>
						<DualInput
							label="再生間隔（ms）"
							min={10}
							limitMax={10000}
							sliderMax={2000}
							step={10}
							value={playInterval}
							onChange={setPlayInterval}
						/>
						<details className="highlight-controls">
							<summary>ハイライト表示設定</summary>
							<div className="highlight-controls-container">
								<div className="toggle-highlight">
									<label>
										<input
											type="checkbox"
											checked={isHighlightVisible}
											onChange={(e) => setIsHighlightVisible(e.target.checked)}
										/>
										ハイライト枠線表示
									</label>
								</div>
								<div className="highlight-color-controls">
									<label>
										今回ハイライト枠:
										<input
											type="color"
											value={currentHighlightColor}
											onChange={(e) => setCurrentHighlightColor(e.target.value)}
										/>
									</label>
									<label>
										次回ハイライト枠:
										<input
											type="color"
											value={nextHighlightColor}
											onChange={(e) => setNextHighlightColor(e.target.value)}
										/>
									</label>
								</div>
							</div>
						</details>
						<button onClick={handleEditInitial} className="edit-initial-button">編集モードへ</button>
						<details className="output-gif-controls">
							<summary>GIF 出力</summary>
							<div className="output-gif-controls-container">
								<div className="gif-cell-size-input">
									<label>
										セルのサイズ（px）：
										<input
											type="number"
											min="1"
											max={maxGifCellSize}
											value={gifCellSizeInput}
											onChange={handleGifCellSizeChange}
											onBlur={handleGifCellSizeBlur}
										/>
									</label>
									<label>
										フレーム間隔（ms）：
										<input
											type="number"
											min="1"
											max={maxGifInterval}
											value={gifIntervalInput}
											onChange={handleGifIntervalChange}
											onBlur={handleGifIntervalBlur}
										/>
									</label>
								</div>
								<div className="export-gif-button">
									<button onClick={handleExportGif} disabled={isExportingGif}>
										{isExportingGif ? "GIF 出力中..." : "GIF を出力（保存）"}
									</button>
								</div>
							</div>
						</details>
					</div>
				)}
				<details className="color-controls">
					<summary>色の設定</summary>
					<div className="color-rules-container">
						{colorRules.map((colorRule, index) => (
							<div key={index} className="color-rule">
								<label>
									文字：
									<input
										type="text"
										value={colorRule.char}
										onChange={(e) => {
											const newColorRules = [...colorRules];
											newColorRules[index].char = e.target.value;
											setColorRules(newColorRules);
										}}
									/>
								</label>
								<label>
									背景色：
									<input
										type="color"
										value={colorRule.backgroundColor}
										onChange={(e) => {
											const newColorRules = [...colorRules];
											newColorRules[index].backgroundColor = e.target.value;
											setColorRules(newColorRules);
										}}
									/>
								</label>
								<label>
									文字色：
									<input
										type="color"
										value={colorRule.textColor}
										onChange={(e) => {
											const newColorRules = [...colorRules];
											newColorRules[index].textColor = e.target.value;
											setColorRules(newColorRules);
										}}
									/>
								</label>
							</div>
						))}
						<div className="color-rule-buttons">
							<div className="color-rule-add">
								<button onClick={() => setColorRules([...colorRules, { char: "", backgroundColor: "#ffffff", textColor: "#000000" }])}>追加</button>
							</div>
							<div className="color-rule-remove">
								<button onClick={() => setColorRules(colorRules.slice(0, -1))} disabled={colorRules.length === 0}>削除</button>
							</div>
						</div>
					</div>
				</details>
				<div className="io-controls">
					<button type="button" onClick={handleExportJson}>JSON を書き出し（保存）</button>
					<input type="file" accept=".json" ref={fileInputRef} onChange={handleImportJson} style={{ display: "none" }} />
					<button type="button" onClick={() => fileInputRef.current?.click()}>JSON を読み込み（復元）</button>
				</div>
				<div className="danger-buttons">
					<div className="reset-button">
						<button type="button" onClick={handleResetToDefault}>初期状態にリセット</button>
					</div>
					<div className="clear-button">
						<button type="button" onClick={handleClear}>全てをクリア</button>
					</div>
				</div>
			</div>
		</>
	)
}
