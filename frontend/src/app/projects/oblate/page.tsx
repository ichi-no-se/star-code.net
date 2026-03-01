"use client";
import { useState } from "react";
import "@styles/oblate.css";

export default function Oblate() {
	const [input, setInput] = useState("");
	const [output, setOutput] = useState("");
	const [copied, setCopied] = useState(false);

	const oblateWord = () => {
		if (input.length === 0) {
			setOutput("");
			setCopied(false);
			return;
		}
		const oblate = "オブラート";
		const index = Math.floor(Math.random() * (oblate.length - 1));
		let result = "";
		for (let i = 0; i <= index; i++) {
			result += oblate[i];
		}
		result += input;
		for (let i = index + 1; i < oblate.length; i++) {
			result += oblate[i];
		}
		setOutput(result);
		setCopied(false);
	}

	const handleCopy = () => {
		if (!output) return;
		navigator.clipboard.writeText(output);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<>
			<h1 className="title">言葉をオブラートに包む</h1>
			<div className="container">
				<div className="input-container">
					<input type="text" placeholder="ここに言葉を入力" value={input} onChange={(e) => setInput(e.target.value)} className="input-area" />
					<button onClick={oblateWord} className="input-button">オブラートに包む</button>
				</div>
				<div className="output-container">
					{output && (<>
						<div className="output-text">
							{output}
						</div>
						<button onClick={handleCopy} className="output-button">{copied ? "コピーしました" : "コピーする"}</button>
					</>
					)}
				</div>
			</div>
		</>
	)
}
