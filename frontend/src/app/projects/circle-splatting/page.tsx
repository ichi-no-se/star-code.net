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

export default function CircleSplatting() {
    const module = useCircleSplatting();

    const [numberOfCircles, setNumberOfCircles] = useState(400);
    const [epochs, setEpochs] = useState(1000);
    const [initialRadiusMax, setInitialRadiusMax] = useState(20);

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
        if (!module || !inputImage) return;
        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 50)); // allow UI update
        try {
            const w = inputImage.naturalWidth;
            const h = inputImage.naturalHeight;
            const imageData = getImageDataFromImage(inputImage);
            const instance = new module.CircleSplatting(w, h);
            instance.getInputBuffer().set(imageData.data);
            instance.run(numberOfCircles, epochs, initialRadiusMax);
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
            <h1 className="title">円による画像近似</h1>
            <h2 className="introduction">
                たくさんの色付き円を配置して，元の画像を再構築します．<br />
                ブラウザ上で計算を行います．サーバーに画像が送信されることはありません．<br />
                作成した画像は自由にお使いください．クレジット表記等は不要です．
            </h2>
            <div className="settings-form">
                <DualInput
                    label="円の数"
                    value={numberOfCircles}
                    onChange={setNumberOfCircles}
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
                <button className="generate-button" onClick={handleGenerate} disabled={!inputImage}>生成</button>
            </div>
            <div className="canvas-container">
                <div className="canvas-button-wrapper">
                    <div className="image-uploader">
                        <label className="upload-label">
                            ファイルを選択
                            <ImageUploader onLoad={setInputImage} resizeDivisor={1} />
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
