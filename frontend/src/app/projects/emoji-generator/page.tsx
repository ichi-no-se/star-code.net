"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import "@styles/emoji-generator.css";

export default function EmojiGenerator() {
	const darkCanvasRef = useRef<HTMLCanvasElement>(null);
	const lightCanvasRef = useRef<HTMLCanvasElement>(null);
	const [text, setText] = useState<string>("");

	const drawCharacter = (canvas:HTMLCanvasElement,char:string) => {
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		const fontSize = 100;
		ctx.font = `${fontSize}px sans-serif`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = "blue";
		ctx.lineWidth = 8;
		ctx.strokeStyle = "yellow";
		ctx.strokeText(char, canvas.width / 2, canvas.height / 2);
		ctx.fillText(char, canvas.width / 2, canvas.height / 2);
	};

	const handleGenerate = () => {
		const char = text[0] || "?";
		[lightCanvasRef, darkCanvasRef].forEach((canvasRef) => {
			if (!canvasRef.current) return;
			drawCharacter(canvasRef.current, char);
		}
		);
	};
	const handleDownload = () => {

	};
	return (
		<main>
			<div className="title">絵文字ジェネレーター</div>
			<div className="introduction">
				Slack や Discord で使える絵文字を生成するツール<br />
				技術情報は<Link href="/blog/emoji-generator">こちら</Link>から
			</div>
			<div className="emoji-generator-panel">
				<input
					type="text"
					placeholder="ここに入力"
					value={text}
					onChange={(e) => setText(e.target.value)}
					className="emoji-input"
				/>
				<button
					onClick={handleGenerate}
					className="emoji-generate-button"
				>
					ランダム生成
				</button>

			</div>
			<div className="emoji-preview-panel">
				<div style={{ backgroundColor: "black", padding: 10 }}>
					<canvas ref={darkCanvasRef} width={128} height={128} className="emoji-canvas" />
				</div>				<div style={{ backgroundColor: "white", padding: 10 }}>
					<canvas ref={lightCanvasRef} width={128} height={128} className="emoji-canvas" />
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