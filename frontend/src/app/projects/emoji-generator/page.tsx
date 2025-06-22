"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import "@styles/emoji-generator.css";

const CANVAS_SIZE = 128;
const MAX_TEXT_LENGTH = 16;

type CharRenderConfig = {
	char: string;
	x: number;
	y: number;
	fontSize: number;
	fontFamily: string;
	fillColor: string;
};

type Square = {
	x: number;
	y: number;
	halfSize: number;
};

function randInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
	return arr[randInt(0, arr.length - 1)];
}

function RgbToHex(r: number, g: number, b: number): string {
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
	h = h % 360;
	s = Math.max(0, Math.min(1, s));
	v = Math.max(0, Math.min(1, v));
	const c = v * s;
	const x = c * (1 - Math.abs((h / 60) % 2 - 1));
	const m = v - c;
	let r = 0, g = 0, b = 0;
	if (h < 60) {
		r = c; g = x; b = 0;
	} else if (h < 120) {
		r = x; g = c; b = 0;
	} else if (h < 180) {
		r = 0; g = c; b = x;
	} else if (h < 240) {
		r = 0; g = x; b = c;
	} else if (h < 300) {
		r = x; g = 0; b = c;
	} else {
		r = c; g = 0; b = x;
	}
	r = Math.round((r + m) * 255);
	g = Math.round((g + m) * 255);
	b = Math.round((b + m) * 255);
	return [r, g, b];
}

function hsvToHex(h: number, s: number, v: number): string {
	const [r, g, b] = hsvToRgb(h, s, v);
	return RgbToHex(r, g, b);
}

function pickReadableColorHex(): string {
	const h = Math.random() * 360;
	const s = 1.0;
	const v = 0.7 + Math.random() * 0.2;
	return hsvToHex(h, s, v);
}

function isOverlapping(a: Square, b: Square): boolean {
	return !(a.x + a.halfSize <= b.x - b.halfSize || a.x - a.halfSize >= b.x + b.halfSize ||
		a.y + a.halfSize <= b.y - b.halfSize || a.y - a.halfSize >= b.y + b.halfSize);
}

function isOutOfBounds(square: Square): boolean {
	return square.x - square.halfSize < 0 ||
		square.x + square.halfSize > CANVAS_SIZE ||
		square.y - square.halfSize < 0 ||
		square.y + square.halfSize > CANVAS_SIZE;
}

function generateConfigs(text: string): CharRenderConfig[] {
	if (text.length === 0) {
		return [];
	}
	const squares: Square[] = [];
	const initGridCount = 5;
	const initGridSize = Math.floor(CANVAS_SIZE / initGridCount);
	const initGridOffset = Math.floor(initGridSize / 2);
	const initSquareHalfSize = 5;
	for (let i = 0; i < text.length; i++) {
		while (true) {
			const gridX = randInt(0, initGridCount - 1);
			const gridY = randInt(0, initGridCount - 1);
			const x = gridX * initGridSize + initGridOffset;
			const y = gridY * initGridSize + initGridOffset;
			let flag = true;
			for (let j = 0; j < i; j++) {
				if (squares[j].x === x && squares[j].y === y) {
					flag = false;
					break;
				}
			}
			if (flag) {
				squares.push({ x, y, halfSize: initSquareHalfSize });
				break;
			}
		}
	}

	let consecutiveFailCount = 0;
	const maxConsecutiveFails = 100;
	while (consecutiveFailCount < maxConsecutiveFails) {
		const id = randInt(0, squares.length - 1);
		const dx = randInt(0, 1) * 2 - 1; // -1 or 1
		const dy = randInt(0, 1) * 2 - 1; // -1 or 1

		let flag = true;
		squares[id].x += dx;
		squares[id].y += dy;
		squares[id].halfSize += 1;
		if (isOutOfBounds(squares[id])) {
			flag = false;
		}
		else {
			for (let i = 0; i < squares.length; i++) {
				if (i === id) continue;
				if (isOverlapping(squares[id], squares[i])) {
					flag = false;
					break;
				}
			}
		}
		if (flag) {
			consecutiveFailCount = 0;
		}
		else {
			squares[id].x -= dx;
			squares[id].y -= dy;
			squares[id].halfSize -= 1;
			consecutiveFailCount++;
			// スライドさせてみる
			let dx2 = 0;
			let dy2 = 0;
			if (Math.random() < 0.5) {
				// 水平方向にスライド
				// ただし，自分が辺に接しているかつ，自分以外の正方形がその辺に接していない場合，スライドしない
				if (squares[id].x - squares[id].halfSize === 0) {
					let flag2 = true;
					for (let i = 0; i < squares.length; i++) {
						if (i === id) continue;
						if (squares[i].x - squares[i].halfSize === 0) {
							flag2 = false;
							break;
						}
					}
					if (flag2) {
						continue;
					}
				}
				if(squares[id].x + squares[id].halfSize === CANVAS_SIZE) {
					let flag2 = true;
					for (let i = 0; i < squares.length; i++) {
						if (i === id) continue;
						if (squares[i].x + squares[i].halfSize === CANVAS_SIZE) {
							flag2 = false;
							break;
						}
					}
					if (flag2) {
						continue;
					}
				}
				dx2 = randInt(0, 1) * 2 - 1; // -1 or 1
			}
			else {
				// 垂直方向にスライド
				// ただし，自分が辺に接しているかつ，自分以外の正方形がその辺に接していない場合，スライドしない
				if (squares[id].y - squares[id].halfSize === 0) {
					let flag2 = true;
					for (let i = 0; i < squares.length; i++) {
						if (i === id) continue;
						if (squares[i].y - squares[i].halfSize === 0) {
							flag2 = false;
							break;
						}
					}
					if (flag2) {
						continue;
					}
				}
				if (squares[id].y + squares[id].halfSize === CANVAS_SIZE) {
					let flag2 = true;
					for (let i = 0; i < squares.length; i++) {
						if (i === id) continue;
						if (squares[i].y + squares[i].halfSize === CANVAS_SIZE) {
							flag2 = false;
							break;
						}
					}
					if (flag2) {
						continue;
					}
				}
				dy2 = randInt(0, 1) * 2 - 1; // -1 or 1
			}
			while (true) {
				squares[id].x += dx2;
				squares[id].y += dy2;
				let flag2 = true;
				if (isOutOfBounds(squares[id])) {
					flag2 = false;
				}
				else {
					for (let i = 0; i < squares.length; i++) {
						if (i === id) continue;
						if (isOverlapping(squares[id], squares[i])) {
							flag2 = false;
							break;
						}
					}
				}
				if (!flag2) {
					squares[id].x -= dx2;
					squares[id].y -= dy2;
					break;
				}
			}
		}
	}

	// バブルソートもどき
	// 文字の並びがそれっぽくなるようにしたいだけなので，順序律を満たさない
	for (let i = 0; i < squares.length; i++) {
		for (let j = 0; j < squares.length-1; j++) {
			if (squares[j].y - squares[j].halfSize * 0.5 >= squares[j + 1].y + squares[j + 1].halfSize * 0.5 || squares[j].y + squares[j].halfSize * 0.5 >= squares[j + 1].y - squares[j + 1].halfSize * 0.5 && squares[j].x >= squares[j + 1].x) {
				// j の方が下にあるかつ，x 座標が大きい場合は入れ替え
				const temp = squares[j];
				squares[j] = squares[j + 1];
				squares[j + 1] = temp;
			}
		}
	}

	const fontFamilies: string[] = [
		"serif",
		"cursive",
	];
	const fontFamily = randChoice(fontFamilies);
	const fillColor = pickReadableColorHex();
	const randomColor = Math.random() < 0.7;

	const configs: CharRenderConfig[] = [];
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const square = squares[i];
		const color = randomColor ? pickReadableColorHex() : fillColor;
		const config: CharRenderConfig = {
			char,
			x: square.x,
			y: square.y,
			fontSize: square.halfSize * 2,
			fontFamily: fontFamily,
			fillColor: color,
		};
		configs.push(config);
	}
	return configs;
}

export default function EmojiGenerator() {
	const darkCanvasRef = useRef<HTMLCanvasElement>(null);
	const lightCanvasRef = useRef<HTMLCanvasElement>(null);
	const [text, setText] = useState<string>("");

	const drawCharacter = (ctx: CanvasRenderingContext2D, config: CharRenderConfig) => {
		const { char, x, y, fontSize, fontFamily, fillColor } = config;
		ctx.font = `bold ${fontSize}px ${fontFamily}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = fillColor;
		ctx.fillText(char, x, y);
	};

	const handleGenerate = () => {
		const configs = generateConfigs(text);
		[lightCanvasRef, darkCanvasRef].forEach((canvasRef) => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			for (const config of configs) {
				drawCharacter(ctx, config);
			}
		}
		);
	};
	const handleDownload = () => {
		const canvas = lightCanvasRef.current;
		if (!canvas) return;
		canvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = text + ".png";
			a.click();
			URL.revokeObjectURL(url);
		}, "image/png");
	};
	return (
		<main>
			<h1 className="title">絵文字ジェネレーター</h1>
			<h2 className="introduction">
				Slack や Discord で使える絵文字を生成するツール．<br />
				技術情報は<Link href="/blog/emoji-generator">こちら</Link>から．
			</h2>
			<div className="emoji-generator-panel">
				<input
					type="text"
					placeholder="ここに入力"
					value={text}
					onChange={(e) => setText(e.target.value)}
					className="emoji-input"
					maxLength={MAX_TEXT_LENGTH}
				/>
				<button
					onClick={handleGenerate}
					className="emoji-generate-button"
				>
					ランダム生成
				</button>

			</div>
			<div className="emoji-preview-panel">
				<div style={{ backgroundColor: "black" }}>
					<canvas ref={darkCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="emoji-canvas" />
				</div>				<div style={{ backgroundColor: "white" }}>
					<canvas ref={lightCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="emoji-canvas" />
				</div>
			</div>
			<div className="emoji-download-panel">				<button
				onClick={handleDownload}
				className="emoji-download-button"
			>
				ダウンロード
			</button>
			</div>

		</main>
	);
}
