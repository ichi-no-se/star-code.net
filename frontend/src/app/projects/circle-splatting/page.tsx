"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import CanvasOutput from "@/components/CanvasOutput";
import { getImageDataFromImage, downloadImageData } from "@/lib/ImageUtils";
import { useCircleSplatting } from "@/hooks/useCircleSplatting";
import "@styles/image-processor.css";
import "@styles/image-tools.css";

const DualInput = ({ label, value, onChange, min, sliderMax, limitMax }: {
    label: string, value: number, onChange: (value: number) => void, min: number, sliderMax: number, limitMax: number
}) => (
    <fieldset className="dual-input-fieldset">
        <legend>{label}</legend>
        <div className="dual-inputs">
            <input type="range" min={min} max={sliderMax} value={value} onChange={(e) => onChange(Number(e.target.value))} className="dual-input-range" />
            <input type="number" min={min} max={limitMax} value={value} onChange={(e) => {
                let val = Number(e.target.value)
                if (val > limitMax) {
                    val = limitMax
                }
                if (val < min) {
                    val = min
                }
                onChange(val)
            }} className="dual-input-number" />
        </div>
    </fieldset>
);

type Shape = "circle" | "square" | "diamond" | "triangle-up" | "triangle-down" | "hexagon";

export default function CircleSplatting() {
    const wasmModule = useCircleSplatting();

    const [numberOfShapes, setNumberOfShapes] = useState(400);
    const [epochs, setEpochs] = useState(1000);
    const [initialRadiusMax, setInitialRadiusMax] = useState(20);
    const [shape, setShape] = useState<Shape>("circle");

    const [inputImage, setInputImage] = useState<HTMLImageElement | null>(null);
    const [outputImage, setOutputImage] = useState<ImageData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleReset = () => {
        setOutputImage(null);
    }
    const handleImageLoad = (img: HTMLImageElement) => {
        handleReset();
        setInputImage(img);
    };

    const handleGenerate = async () => {
        if (!wasmModule || !inputImage) return;
        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 10)); // allow UI update
        try {
            const w = inputImage.naturalWidth;
            const h = inputImage.naturalHeight;
            const imageData = getImageDataFromImage(inputImage);
            const instance = new wasmModule.CircleSplatting(w, h);
            instance.getInputBuffer().set(imageData.data);
            instance.run(numberOfShapes, epochs, initialRadiusMax, shape);
            const resultView = instance.getDrawImageData();
            const resultData = new Uint8ClampedArray(resultView);
            const outputImageData = new ImageData(resultData, w, h);
            setOutputImage(outputImageData);
            instance.delete();
        }
        catch (e) {
            console.error("Error during circle splatting:", e);
        }
        finally {
            setIsProcessing(false);
        }
    };

    return (
        <main>
            <h1 className="title">図形による画像近似</h1>
            <h2 className="introduction">
                たくさんの色付き図形を配置して，元の画像を再構築します．<br />
                ブラウザ上で計算を行います．サーバーに画像が送信されることはありません．<br />
                作成した画像は自由にお使いください．クレジット表記等は不要です．
            </h2>
            <div className="settings-form">
                <fieldset style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <legend>図形の種類</legend>
                    <label><input type="radio" value="circle" checked={shape === "circle"} onChange={() => setShape("circle")} /> 円</label>
                    <label><input type="radio" value="square" checked={shape === "square"} onChange={() => setShape("square")} /> 正方形</label>
                    <label><input type="radio" value="diamond" checked={shape === "diamond"} onChange={() => setShape("diamond")} /> 正方形（45 度回転）</label>
                    <label><input type="radio" value="triangle-up" checked={shape === "triangle-up"} onChange={() => setShape("triangle-up")} /> 正三角形（上向き）</label>
                    <label><input type="radio" value="triangle-down" checked={shape === "triangle-down"} onChange={() => setShape("triangle-down")} /> 正三角形（下向き）</label>
                    <label><input type="radio" value="hexagon" checked={shape === "hexagon"} onChange={() => setShape("hexagon")} /> 正六角形</label>
                </fieldset>
                <DualInput
                    label="図形の数"
                    value={numberOfShapes}
                    onChange={setNumberOfShapes}
                    min={10}
                    sliderMax={1000}
                    limitMax={10000}
                />
                <DualInput
                    label="エポック数"
                    value={epochs}
                    onChange={setEpochs}
                    min={100}
                    sliderMax={2000}
                    limitMax={10000}
                />
                <DualInput
                    label="初期半径の最大値"
                    value={initialRadiusMax}
                    onChange={setInitialRadiusMax}
                    min={1}
                    sliderMax={50}
                    limitMax={100}
                />
                <button className="generate-button" onClick={handleGenerate} disabled={!inputImage || isProcessing}>{isProcessing ? "生成中..." : "生成"}</button>
            </div>
            <div className="canvas-container">
                <div className="canvas-button-wrapper">
                    <div className="image-uploader">
                        <label className="upload-label">
                            ファイルを選択
                            <ImageUploader onLoad={handleImageLoad} resizeDivisor={1} />
                        </label>
                    </div>
                    <div className="canvas-wrapper">
                        <CanvasOutput image={inputImage} />
                    </div>
                    <p>入力画像</p>
                </div>
                <div className="canvas-button-wrapper">
                    <button className="download-button" disabled={!outputImage} onClick={() => outputImage && downloadImageData(outputImage, "output.png")}>ダウンロード</button>
                    <div className="canvas-wrapper">
                        <CanvasOutput image={outputImage} />
                    </div>
                    <p>出力画像</p>
                </div>
            </div>
        </main>
    )
}
