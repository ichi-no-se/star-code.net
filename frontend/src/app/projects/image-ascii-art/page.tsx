"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import CanvasOutput from "@/components/CanvasOutput";
import { getImageDataFromImage } from "@/lib/ImageUtils";
import "@styles/image-processor.css";
import "@styles/image-ascii-art.css";


export default function ImageAsciiArt() {
	const [cols, setCols] = useState(100);
	const [rows, setRows] = useState(50);
	const [processType, setProcessType] = useState<"edge" | "brightness" | "brightness-reverse">("edge");
	const [letterRatio, setLetterRatio] = useState<number>(30);
	const [letters, setLetters] = useState<string>("ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789 !\"#$%&'()-=^~\\|<>/?_");
	const [inputImage, setInputImage] = useState<HTMLImageElement | null>(null);
	const [outputText, setOutputText] = useState<string>("");
	const [outputCols, setOutputCols] = useState<number>(100);
	const outputWrapRef = useRef<HTMLDivElement>(null);
	const [fontPx, setFontPx] = useState<number>(12);

	useEffect(() => {
		if (!inputImage) return;
		const W = inputImage.naturalWidth;
		const H = inputImage.naturalHeight;
		const cols = Math.min(Math.floor(W / 8), 200);
		const rows = Math.floor(cols * (H / W) / 2);
		setCols(cols);
		setRows(rows);
	}, [inputImage]);

	useEffect(() => {
		if (!outputWrapRef.current || !outputText) return;
		const compute = () => {
			const containerWidth = outputWrapRef.current!.clientWidth;
			if (containerWidth === 0) return;
			// 基準 12px で 1文字の幅を測る
			const probe = document.createElement("span");
			probe.textContent = "0";
			probe.style.position = "absolute";
			probe.style.visibility = "hidden";
			probe.style.fontFamily = "monospace";
			probe.style.fontSize = `12px`;
			document.body.appendChild(probe);
			const chWidth = probe.getBoundingClientRect().width || 8;
			document.body.removeChild(probe);

			// 横方向にフィットするフォントサイズ（px）
			const fontByWidth = Math.floor((containerWidth - 4) / (outputCols * (chWidth / 12)));
			setFontPx(fontByWidth);
		}

		compute();
		const ro = new ResizeObserver(compute);
		ro.observe(outputWrapRef.current);
		window.addEventListener("resize", compute);

		return () => {
			ro.disconnect();
			window.removeEventListener("resize", compute);
		};
	}, [outputText, outputCols]);

	const handleLettersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const input = e.target.value;
		const validLetters = input.split('').filter(char => (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) || char === '\n').join('');
		setLetters(validLetters);
	}

	const handleGenerate = () => {
		if (!inputImage) return;
		const charArray = Array.from(new Set(letters.split('').filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126)));
		if (charArray.length === 0) {
			alert("使用する文字を入力してください．");
			return;
		}

		const imageData = getImageDataFromImage(inputImage);
		const width = imageData.width;
		const height = imageData.height;
		if (width < cols || height < rows) {
			alert("アスキーアートのサイズに対して画像が小さすぎます．");
			return;
		}

		const grayScaleData = new Array<number>(width * height);
		for (let i = 0; i < width * height; i++) {
			const r = imageData.data[i * 4];
			const g = imageData.data[i * 4 + 1];
			const b = imageData.data[i * 4 + 2];
			grayScaleData[i] = Math.floor(0.299 * r + 0.587 * g + 0.114 * b);
		}
		const x0 = (c: number) => Math.floor((c * width) / cols);
		const x1 = (c: number) => Math.floor(((c + 1) * width) / cols);
		const y0 = (r: number) => Math.floor((r * height) / rows);
		const y1 = (r: number) => Math.floor(((r + 1) * height) / rows);
		if (processType === "edge") {
			const dx = [3, 3, 2, 1, 0, -1, -2, -3];
			const dy = [0, 1, 2, 3, 3, 3, 2, 1];
			const numEdgeDirections = 8;
			const computeLetterEdgeProfile = (letter: string, size = 50) => {
				const canvas = document.createElement("canvas");
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("Canvas context is not available");
				ctx.fillStyle = "black";
				ctx.fillRect(0, 0, size, size);
				ctx.fillStyle = "white";
				ctx.font = `${size * 0.8}px monospace`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(letter, size / 2, size / 2);
				const imageData = ctx.getImageData(0, 0, size, size);
				const data = imageData.data;
				const edgeProfile: number[] = Array(numEdgeDirections).fill(0);
				for (let i = 0; i < size; i++) {
					for (let j = 0; j < size; j++) {
						const val = data[(i * size + j) * 4];
						for (let k = 0; k < numEdgeDirections; k++) {
							const ni = i + dy[k];
							const nj = j + dx[k];
							if (ni < 0 || ni >= size || nj < 0 || nj >= size) continue;
							const neighborVal = data[(ni * size + nj) * 4];
							edgeProfile[k] += Math.abs(val - neighborVal);
						}
					}
				}
				let norm = 0.0;
				for (let i = 0; i < edgeProfile.length; i++) {
					norm += edgeProfile[i] * edgeProfile[i];
				}
				norm = Math.sqrt(norm);
				norm += 1e-9;
				for (let i = 0; i < edgeProfile.length; i++) {
					edgeProfile[i] /= norm;
				}
				return edgeProfile;
			}
			const edgeProfiles: number[][] = new Array(charArray.length);
			for (let i = 0; i < charArray.length; i++) {
				edgeProfiles[i] = computeLetterEdgeProfile(charArray[i], 50);
			}

			type ScoredTile = {
				score: number;
				char: string;
				c: number;
				r: number;
			};
			const scoredTiles: ScoredTile[] = [];
			for (let r = 0; r < rows; r++) {
				const yStart = y0(r);
				const yEnd = y1(r);
				for (let c = 0; c < cols; c++) {
					const xStart = x0(c);
					const xEnd = x1(c);
					const edgeValues = new Array(numEdgeDirections).fill(0);
					for (let y = yStart; y < yEnd; y++) {
						for (let x = xStart; x < xEnd; x++) {
							const val = grayScaleData[y * width + x];
							for (let k = 0; k < numEdgeDirections; k++) {
								const nx = x + dx[k];
								const ny = y + dy[k];
								if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
								const neighborVal = grayScaleData[ny * width + nx];
								edgeValues[k] += Math.abs(val - neighborVal);
							}
						}
					}
					let bestChar = " ";
					let bestScore = 0;
					for (let i = 0; i < charArray.length; i++) {
						let score = 0.0;
						for (let k = 0; k < numEdgeDirections; k++) {
							score += edgeValues[k] * edgeProfiles[i][k];
						}
						if (score > bestScore) {
							bestScore = score;
							bestChar = charArray[i];
						}
					}
					const area = (xEnd - xStart) * (yEnd - yStart);
					scoredTiles.push({
						score: bestScore / (area + 1e-9),
						char: bestChar,
						c: c,
						r: r
					});
				}
			}
			scoredTiles.sort((a, b) => b.score - a.score);
			const outputArray = Array.from({ length: rows }, () => Array(cols).fill(" "));
			for (let i = 0; i < scoredTiles.length * letterRatio / 100; i++) {
				const tile = scoredTiles[i];
				outputArray[tile.r][tile.c] = tile.char;
			}
			const outputText = outputArray.map(row => row.join("")).join("\n");
			setOutputText(outputText);
		}
		else {
			const computeEdgeBrightness = (letter: string, size = 50) => {
				const canvas = document.createElement("canvas");
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("Canvas context is not available");
				ctx.fillStyle = "black";
				ctx.fillRect(0, 0, size, size);
				ctx.fillStyle = "white";
				ctx.font = `${size * 0.8}px monospace`;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(letter, size / 2, size / 2);
				const imageData = ctx.getImageData(0, 0, size, size);
				const data = imageData.data;
				let brightnessSum = 0;
				for (let i = 0; i < size; i++) {
					for (let j = 0; j < size; j++) {
						const val = data[(i * size + j) * 4];
						brightnessSum += val;
					}
				}
				return brightnessSum / (size * size);
			}
			const brightnessArray = charArray.map(letter => computeEdgeBrightness(letter, 50));
			const maxBrightness = Math.max(...brightnessArray) + 1e-9;
			for (let i = 0; i < brightnessArray.length; i++) {
				brightnessArray[i] = brightnessArray[i] / maxBrightness * 255;
				if (processType === "brightness") {
					brightnessArray[i] = 255 - brightnessArray[i];
				}
			}
			const outputArray = Array.from({ length: rows }, () => Array(cols).fill(" "));
			for (let r = 0; r < rows; r++) {
				const yStart = y0(r);
				const yEnd = y1(r);
				for (let c = 0; c < cols; c++) {
					const xStart = x0(c);
					const xEnd = x1(c);
					let brightnessSum = 0;
					for (let y = yStart; y < yEnd; y++) {
						for (let x = xStart; x < xEnd; x++) {
							brightnessSum += grayScaleData[y * width + x];
						}
					}
					const averageBrightness = brightnessSum / ((xEnd - xStart) * (yEnd - yStart));
					let bestChar = " ";
					let bestDiff = Infinity;
					for (let i = 0; i < charArray.length; i++) {
						const charBrightness = brightnessArray[i];
						const diff = Math.abs(averageBrightness - charBrightness);
						if (diff < bestDiff) {
							bestDiff = diff;
							bestChar = charArray[i];
						}
					}
					outputArray[r][c] = bestChar;
				}
			}
			const outputText = outputArray.map(row => row.join("")).join("\n");
			setOutputText(outputText);
		}
		setOutputCols(cols);
	};

	const handleCopy = () => {
		try {
			navigator.clipboard.writeText(outputText);
		}
		catch (err) {
			console.error("コピーに失敗しました:", err);
		}
	}

	return (
		<main>
			<h1 className="title">画像アスキーアート化</h1>
			<h2 className="introduction">
				画像をアスキーアートに変換します．<br />
				関連記事は <Link href="/blog/image-ascii-art">こちら</Link> から．
			</h2>
			<div className="settings-form">
				<fieldset>
					<legend>アスキーアートのサイズ</legend>
					<label>
						<span>横幅（文字数）</span>
						<input type="number" min={1} max={200} value={cols} onChange={(e) => setCols(Number(e.target.value))} />
					</label>
					<label>
						<span>縦幅（文字数）</span>
						<input type="number" min={1} max={200} value={rows} onChange={(e) => setRows(Number(e.target.value))} />
					</label>
				</fieldset>
				<fieldset>
					<legend>使用する文字（ASCII 文字のみ）</legend>
					<textarea className="letters-input" value={letters} onChange={handleLettersChange} />
				</fieldset>
				<fieldset className="ratio-field" disabled={processType !== "edge"}>
					<legend>文字の割合</legend>
					<input type="range" min={1} max={100} value={letterRatio} onChange={(e) => setLetterRatio(Number(e.target.value))} />
					<span className="ratio-num">{letterRatio}%</span>
				</fieldset>
				<fieldset>
					<legend>処理タイプ</legend>
					<label>
						<input type="radio" value="edge" checked={processType === "edge"} onChange={() => setProcessType("edge")} />
						エッジベース
					</label>
					<label>
						<input type="radio" value="brightness" checked={processType === "brightness"} onChange={() => setProcessType("brightness")} />
						明るさベース
					</label>
					<label>
						<input type="radio" value="brightness-reverse" checked={processType === "brightness-reverse"} onChange={() => setProcessType("brightness-reverse")} />
						明るさベース（反転）
					</label>
				</fieldset>
				<div className="button-container">
					<div className="image-uploader">
						<label className="upload-label">
							ファイルを選択
							<ImageUploader onLoad={setInputImage} resizeDivisor={2} />
						</label>
					</div>
					<button className="generate-button" onClick={handleGenerate} disabled={!inputImage}>生成</button>
				</div>
				{inputImage && (
					<div className="canvas-wrapper">
						<CanvasOutput image={inputImage} />
					</div>
				)}
			</div>
			{outputText !== "" && (
				<div className="output-container" ref={outputWrapRef}>
					<div className="ascii-output">
						<pre className="ascii-text" style={{ fontSize: `${fontPx}px` }}>{outputText}</pre>
					</div>
					<button className="copy-button" onClick={handleCopy} disabled={!outputText}>コピー</button>
				</div>
			)}
		</main >
	);
}