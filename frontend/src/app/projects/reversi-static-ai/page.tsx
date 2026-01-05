"use client"
import Link from "next/link"
import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { createInitialBoard, getValidMoves, applyMove, canMove, countPieces, Board, Player, GameStatus, ReversiHistoryRecord } from "@/lib/ReversiLogic"
import { ReversiBoard } from "@/components/Reversi/ReversiBoard";
import { ReversiScoreBoard } from "@/components/Reversi/ReversiScoreBoard";
import { ReversiControlls } from "@/components/Reversi/ReversiControlls";
import { PriorityMap, parsePriorityCSV, getBestMoveByPriority, PRESETS } from "@/lib/ReversiStaticAI";
import "@styles/reversi.css";

type StrategyConfig = {
	mode: "Human" | "AI";
	aiSource: "Preset" | "File" | "Manual";
	presetIndex: number;
	priorityMap: PriorityMap;
	customMap: PriorityMap | null;
	customFileName: string | null;
};

const GridCell = ({ value, onCommit }: { value: number, onCommit: (newValue: string) => void }) => {
	const [localValue, setLocalValue] = useState<string>(value.toString());
	useEffect(() => {
		setLocalValue(value.toString());
	}, [value]);
	const handleBlur = () => {
		const num = parseInt(localValue);
		const safeNum = isNaN(num) ? 0 : num;
		onCommit(safeNum.toString());
		setLocalValue(safeNum.toString());
	}
	return (<input
		type="text"
		inputMode="numeric"
		value={localValue}
		onChange={(e) => setLocalValue(e.target.value)}
		onBlur={handleBlur}
		onKeyDown={(e) => {
			if (e.key === "Enter") {
				e.currentTarget.blur();
			}
		}}
		className="priority-grid-cell"
	/>);
};

const SettingsPanel = ({ config, setConfig, color }: { config: StrategyConfig, setConfig: React.Dispatch<React.SetStateAction<StrategyConfig>>, color: Player }) => {
	const handleTypeChange = (newType: "Human" | "AI") => {
		setConfig({
			...config,
			mode: newType,
		})
	}
	const handleSourceChange = (newSource: "Preset" | "File" | "Manual") => {
		let newPriorityMap = config.priorityMap;
		if (newSource === "Preset") {
			newPriorityMap = PRESETS[config.presetIndex].map;
		}
		else if (newSource === "File" && config.customMap) {
			newPriorityMap = config.customMap;
		}
		setConfig({
			...config,
			aiSource: newSource,
			priorityMap: newPriorityMap,
		})
	}
	const handlePresetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		const newIndex = parseInt(event.target.value);
		setConfig({
			...config,
			aiSource: "Preset",
			presetIndex: newIndex,
			priorityMap: PRESETS[newIndex].map,
		});
	}
	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) {
			return;
		}
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result;
			if (typeof text === "string") {
				const parsedMap = parsePriorityCSV(text);
				if (parsedMap) {
					setConfig({
						...config,
						aiSource: "File",
						priorityMap: parsedMap,
						customMap: parsedMap,
						customFileName: file.name,
					});
				} else {
					setConfig({
						...config,
						customFileName: "Invalid File",
					})
				}
			}
		};
		reader.readAsText(file);
	};
	const handleGridChange = (index: number, val: number) => {
		const newPriorityMap = [...config.priorityMap];
		newPriorityMap[index] = val;
		setConfig({
			...config,
			aiSource: "Manual",
			priorityMap: newPriorityMap,
		});
	}

	const headerClass = color === "Black" ? "header-black" : "header-white";
	const title = color as string + " Settings";

	return (
		<div className="settings-panel">
			<h3 className={`settings-header ${headerClass}`}>{title}</h3>
			<div className="settings-body">
				<div className="mode-tabs">
					<button
						className={`mode-tab ${config.mode === "Human" ? "mode-tab-active" : ""}`}
						onClick={() => handleTypeChange("Human")}
					>
						Human
					</button>
					<button
						className={`mode-tab ${config.mode === "AI" ? "mode-tab-active" : ""}`}
						onClick={() => handleTypeChange("AI")}
					>
						AI
					</button>
				</div>
			</div>
			{
				config.mode === "AI" && (
					<div className="ai-settings-container">
						<div className="source-selection">
							<div className="source-row">
								<label className="source-radio-label">
									<input type="radio"
										name={`source-${color}`}
										checked={config.aiSource === "Preset"}
										onChange={() => handleSourceChange("Preset")}
									/>
									<span className="source-name">Preset</span>
								</label>
								<select
									value={config.presetIndex}
									onChange={handlePresetChange}
									disabled={config.aiSource !== "Preset"}
									className="preset-select"
								>
									{PRESETS.map((preset, index) => (
										<option key={index} value={index}>{preset.name}</option>
									))}
								</select>
							</div>
							<div className="source-row">
								<label className="source-radio-label">
									<input type="radio"
										name={`source-${color}`}
										checked={config.aiSource === "File"}
										onChange={() => handleSourceChange("File")}
									/>
									<span className="source-name">Upload CSV</span>
								</label>
								<div className="file-input-wrapper">
									<input id={`file-upload-${color}`} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden-file-input" />
									<label htmlFor={`file-upload-${color}`} className="custom-file-button">Choose File</label>
									<span className="file-status-text">
										{config.customFileName ? config.customFileName : "No file chosen"}
									</span>
								</div>
							</div>
							<div className="source-row">
								<label className="source-radio-label">
									<input
										type="radio"
										name={`source-${color}`}
										checked={config.aiSource === "Manual"}
										onChange={() => handleSourceChange("Manual")}
									/>
									<span className="source-name">Custom</span>
								</label>
								<span className="manual-input-note"> (Edit the grid below) </span>
							</div>
						</div>
						<div className="grid-editor">
							{config.priorityMap.map((val, i) => (
								<GridCell
									key={i}
									value={val}
									onCommit={(strVal) => handleGridChange(i, parseInt(strVal) || 0)}
								/>
							))}
						</div>
					</div>
				)
			}
		</div>

	)
};

const executeMove = (index: number, currentBoard: Board, currentPlayer: Player) => {
	const newBoard = applyMove(currentBoard, { index, player: currentPlayer });
	const nextPlayerOpponent = currentPlayer === "Black" ? "White" : "Black";
	let nextPassPlayer: Player | null = null;
	let nextGameStatus: GameStatus = nextPlayerOpponent;
	if (canMove(newBoard, nextPlayerOpponent)) {
		nextGameStatus = nextPlayerOpponent;
	} else if (canMove(newBoard, currentPlayer)) {
		nextPassPlayer = nextPlayerOpponent;
		nextGameStatus = currentPlayer;
	} else {
		nextGameStatus = "GameOver";
	}
	return { newBoard, nextGameStatus, nextPassPlayer };
}


export default function ReversiStaticAIPage() {
	const [board, setBoard] = useState<Board>(createInitialBoard());
	const [gameStatus, setGameStatus] = useState<GameStatus>("Black");
	const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);
	const [passPlayer, setPassPlayer] = useState<Player | null>(null);
	const [isGameOver, setIsGameOver] = useState<boolean>(false);
	const [step, setStep] = useState<number>(0);
	const [blackStrategy, setBlackStrategy] = useState<StrategyConfig>({
		mode: "Human",
		aiSource: "Preset",
		presetIndex: 0,
		priorityMap: PRESETS[0].map,
		customMap: null,
		customFileName: null,
	});
	const [whiteStrategy, setWhiteStrategy] = useState<StrategyConfig>({
		mode: "Human",
		aiSource: "Preset",
		presetIndex: 0,
		priorityMap: PRESETS[0].map,
		customMap: null,
		customFileName: null,
	});
	const validMoves = useMemo(() => {
		if (isGameOver || gameStatus === "GameOver") {
			return [];
		}
		return getValidMoves(board, gameStatus);
	}, [board, gameStatus, isGameOver]);

	const scores = useMemo(() => countPieces(board), [board]);
	const historyRecordRef = useRef<ReversiHistoryRecord[]>([{ board, previousMove: null, passPlayer: null, gameStatus: "Black" }]);


	const handleChangeStep = useCallback((nextStep: number) => {
		setBoard(historyRecordRef.current[nextStep].board);
		setGameStatus(historyRecordRef.current[nextStep].gameStatus);
		const previousMove = historyRecordRef.current[nextStep].previousMove;
		setLastMoveIndex(previousMove ? previousMove.index : null);
		setPassPlayer(historyRecordRef.current[nextStep].passPlayer);
	}, []);

	const handleGoToStart = useCallback(() => {
		setStep(0);
		handleChangeStep(0);
	}, [handleChangeStep]);
	const handleGoBack = () => {
		if (step > 0) {
			setStep(step - 1);
			handleChangeStep(step - 1);
		}
	}
	const handleGoForward = () => {
		if (step < historyRecordRef.current.length - 1) {
			setStep(step + 1);
			handleChangeStep(step + 1);
		}
	}
	const handleGoToEnd = () => {
		setStep(historyRecordRef.current.length - 1);
		handleChangeStep(historyRecordRef.current.length - 1);
	}

	const runAutoGame = useCallback(() => {
		let currentBoard = createInitialBoard();
		let currentGameStatus: GameStatus = "Black";
		const tempHistory: ReversiHistoryRecord[] = [{ board: [...currentBoard], previousMove: null, passPlayer: null, gameStatus: "Black" }];
		do {
			const currentStrategy = currentGameStatus === "Black" ? blackStrategy : whiteStrategy;
			const currentValidMoves = getValidMoves(currentBoard, currentGameStatus);
			const moveIndex = getBestMoveByPriority(currentValidMoves, currentStrategy.priorityMap);
			if (moveIndex === null) {
				console.error("AI could not find a valid move despite validMoves being non-empty.");
				break;
			}
			const result = executeMove(moveIndex, currentBoard, currentGameStatus);
			tempHistory.push({ board: [...result.newBoard], previousMove: { index: moveIndex, player: currentGameStatus }, passPlayer: result.nextPassPlayer, gameStatus: result.nextGameStatus });
			currentBoard = result.newBoard;
			currentGameStatus = result.nextGameStatus;

		} while (currentGameStatus !== "GameOver");
		historyRecordRef.current = tempHistory;
		setIsGameOver(true);
		handleGoToStart();
	}, [blackStrategy, whiteStrategy, handleGoToStart]);

	const handleCellClick = (index: number) => {
		const currentStrategy = gameStatus === "Black" ? blackStrategy : whiteStrategy;
		if (currentStrategy.mode === "AI") {
			return;
		}
		if (!validMoves.includes(index) || isGameOver || gameStatus === "GameOver") {
			return;
		}
		const result = executeMove(index, board, gameStatus);
		setBoard(result.newBoard);
		setLastMoveIndex(index);
		setPassPlayer(result.nextPassPlayer);
		setGameStatus(result.nextGameStatus);
		if (result.nextGameStatus === "GameOver") {
			setStep(historyRecordRef.current.length);
			setIsGameOver(true);
		}
		historyRecordRef.current.push({ board: result.newBoard, previousMove: { index, player: gameStatus }, passPlayer: result.nextPassPlayer, gameStatus: result.nextGameStatus });
	}

	const handleReset = useCallback(() => {
		setBoard(createInitialBoard());
		setGameStatus("Black");
		setLastMoveIndex(null);
		setPassPlayer(null);
		historyRecordRef.current = [{ board: createInitialBoard(), previousMove: null, passPlayer: null, gameStatus: "Black" }];
		setStep(0);
		setIsGameOver(false);

		if (blackStrategy.mode === "AI" && whiteStrategy.mode === "AI") {
			runAutoGame();
		}
	}, [blackStrategy, whiteStrategy, runAutoGame]);

	const canGoForward = isGameOver && (step < historyRecordRef.current.length - 1);
	const canGoBack = isGameOver && (step > 0);

	useEffect(() => {
		handleReset();
	}, [handleReset]);

	useEffect(() => {
		if (isGameOver || gameStatus === "GameOver") {
			return;
		}
		if (blackStrategy.mode === "AI" && whiteStrategy.mode === "AI") {
			return;
		}
		const currentStrategy = gameStatus === "Black" ? blackStrategy : whiteStrategy;
		if (currentStrategy.mode === "Human") {
			return;
		}

		const timerId = setTimeout(() => {
			const currentValidMoves = getValidMoves(board, gameStatus);
			const moveIndex = getBestMoveByPriority(currentValidMoves, currentStrategy.priorityMap);
			if (moveIndex !== null) {
				const result = executeMove(moveIndex, board, gameStatus);
				setBoard(result.newBoard);
				setLastMoveIndex(moveIndex);
				setPassPlayer(result.nextPassPlayer);
				setGameStatus(result.nextGameStatus);
				if (result.nextGameStatus === "GameOver") {
					setStep(historyRecordRef.current.length);
					setIsGameOver(true);
				}
				historyRecordRef.current.push({ board: result.newBoard, previousMove: { index: moveIndex, player: gameStatus }, passPlayer: result.nextPassPlayer, gameStatus: result.nextGameStatus });
			}
		}, 300);
		return () => clearTimeout(timerId);
	}, [gameStatus, board, isGameOver, blackStrategy, whiteStrategy]);

	return (
		<main>
			<h1 className="title">リバーシ（vs 静的 AI）</h1>
			<h2 className="introduction">
				ブラウザ上で動作するリバーシ盤面．<br />
				静的な優先度マップに基づいて動作する AI と対戦できます．<br />
				関連記事は<Link href="/blog/reversi-static-ai">こ</Link><Link href="/blog/reversi-static-ai-2">ち</Link><Link href="/blog/reversi-static-ai-3">ら</Link>から．<br />
				静的 AI のプリセットは<Link href="/blog/reversi-static-ai-3">こちら</Link>の記事で行った対戦で使用したものです．
			</h2>
			<div className="game-container">
				<div className="board-container">
					<ReversiBoard board={board} validMoves={validMoves} nextTurn={gameStatus} lastMoveIndex={lastMoveIndex} onCellClick={handleCellClick} />
				</div>
				<div className="info-panel">
					<ReversiScoreBoard blackScore={scores.Black} whiteScore={scores.White} gameStatus={gameStatus} passPlayer={passPlayer} />
					<ReversiControlls
						canGoBack={canGoBack}
						onGoBack={handleGoBack}
						onGoToStart={handleGoToStart}
						canGoForward={canGoForward}
						onGoForward={handleGoForward}
						onGoToEnd={handleGoToEnd}
					/>

					<button onClick={handleReset} className="reversi-controlls-button">
						Reset
					</button>
				</div>
			</div>
			<div className="settings-container">
				<SettingsPanel config={blackStrategy} setConfig={setBlackStrategy} color="Black" />
				<SettingsPanel config={whiteStrategy} setConfig={setWhiteStrategy} color="White" />
			</div>
		</main>
	)
}