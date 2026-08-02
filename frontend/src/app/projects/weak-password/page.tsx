"use client"
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import WeakPasswordGenerator from "@/lib/WeakPasswordGenerator";
import "@styles/weak-password.css";

export default function WeakPasswordPage() {
	const [inputText, setInputText] = useState<string>("");
	const [outputLength, setOutputLength] = useState<number>(8);
	const [outputLengthText, setOutputLengthText] = useState<string>("8");
	const [outputCount, setOutputCount] = useState<number>(20);
	const [outputCountText, setOutputCountText] = useState<string>("20");
	const [outputTemperature, setOutputTemperature] = useState<number>(0.7);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [outputs, setOutputs] = useState<string[]>([]);
	const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
	const generatorRef = useRef<WeakPasswordGenerator | null>(null);

	useEffect(() => {
		const generator = new WeakPasswordGenerator();
		generatorRef.current = generator;
		generator.load("/weak-password/rnn_model_meta.json", "/weak-password/rnn_model_weights.bin").then(() => {
			setIsModelLoaded(true);
			const vocab = generator.getVocab();
			setInputText((prevInputText) => prevInputText.split('').filter(char => vocab.includes(char)).join(''));
		}).catch((error) => {
			console.error("Failed to load model:", error);
		});
	}, []);

	const handleGenerate = async () => {
		if (!isModelLoaded || !generatorRef.current) {
			return;
		}
		if (inputText && !generatorRef.current.isValidPrefix(inputText)) {
			return;
		}
		setIsGenerating(true);
		setTimeout(() => {
			try {
				const generated: string[] = [];
				for (let i = 0; i < outputCount; i++) {
					const generatedPassword = generatorRef.current!.generate(outputLength, outputTemperature, inputText);
					generated.push(generatedPassword);
				}
				setOutputs(generated);
				setIsGenerating(false);
			}
			catch (error) {
				console.error("Failed to generate password:", error);
				setIsGenerating(false);
			}
		}, 20);
	};

	const setInputTextWithFilter = (text: string) => {
		if (generatorRef.current) {
			const vocab = generatorRef.current.getVocab();
			const filteredText = text.split('').filter(char => vocab.includes(char)).join('');
			setInputText(filteredText);
		}
		else {
			setInputText(text);
		}
	};

	return (
		<>
			<h1 className="title">ありそうなパスワード生成器</h1>
			<p className="introduction">
				ありそうなパスワードを生成します．<br />
				詳しくは<Link href="/blog/weak-password">関連記事</Link>をご覧ください．<br />
				このツールで生成されるようなパスワードの使用は推奨しません．
			</p>
			<div className="layout-container">
				<div className="control-panel">
					<legend>設定</legend>
					<div className="control-panel-content">
						<div className="setting-group">
							<label>出力文字数</label>
							<input
								type="number"
								value={outputLengthText}
								onChange={(e) => {
									const val = e.target.value.replace(/[^0-9]/g, "");
									setOutputLengthText(val);
									let valInt = parseInt(e.target.value);
									if (!isNaN(valInt) && valInt > 0) {
										if (valInt > 15) valInt = 15;
										setOutputLength(valInt);
									}
								}}
								onBlur={(e) => {
									let valInt = parseInt(e.target.value);
									if (isNaN(valInt) || valInt < 3) {
										valInt = 8;
									}
									if (valInt > 15) valInt = 15;
									setOutputLength(valInt);
									setOutputLengthText(valInt.toString());
									if (inputText.length >= valInt) {
										setInputText(inputText.substring(0, valInt - 1));
									}
								}}
								min="3"
								max="15"
							/>
						</div>
						<div className="setting-group">
							<label>出力数</label>
							<input
								type="number"
								value={outputCountText}
								onChange={(e) => {
									const val = e.target.value.replace(/[^0-9]/g, "");
									setOutputCountText(val);
									let valInt = parseInt(e.target.value);
									if (!isNaN(valInt) && valInt > 0) {
										if (valInt > 1000) valInt = 1000;
										setOutputCount(valInt);
									}
								}}
								onBlur={(e) => {
									let valInt = parseInt(e.target.value);
									if (isNaN(valInt) || valInt <= 0) {
										valInt = 10;
									}
									if (valInt > 1000) valInt = 1000;
									setOutputCount(valInt);
									setOutputCountText(valInt.toString());
								}}
								min="1"
								max="1000"
							/>
						</div>
						<div className="setting-group">
							<label>自由度（Temperature）</label>
							<div className="temperature-slider">
								<input type="range" min={0.1} max={2} step={0.1} value={outputTemperature} onChange={(e) => setOutputTemperature(parseFloat(e.target.value))} />
								<span className="temperature-value">{outputTemperature.toFixed(1)}</span>
							</div>
						</div>
						<div className="setting-group">
							<label>先頭文字列（任意）</label>
							<input type="text"
								value={inputText}
								onChange={(e) => setInputTextWithFilter(e.target.value)}
								maxLength={outputLength - 1}
							/>
						</div>
					</div>
				</div>
				<button className="generate-button" onClick={handleGenerate} disabled={isGenerating || !isModelLoaded || !generatorRef.current}>
					生成
				</button>
				<div className="output-container">
					<legend>出力</legend>
					<div className="output-list">
						{outputs.map((output, index) => (
							<div key={index} className="output-item">
								{output}
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	)
}