"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { DepthEstimator, rawImageToImageData } from "@/lib/DepthEstimation";
import generateAutostereogram, { ViewMode } from "@/lib/Autostereogram";
import ImageUploader from "@/components/ImageUploader";
import CanvasOutput from "@/components/CanvasOutput";
import "@styles/image-processor.css";

const DualInput = ({ label, value, onChange, min, sliderMax, limitMax, disabled }: {
    label: string, value: number, onChange: (value: number) => void, min: number, sliderMax: number, limitMax: number, disabled: boolean
}) => (
    <fieldset className="dual-input-fieldset">
        <legend>{label}</legend>
        <div className="dual-inputs">
            <input type="range" min={min} max={sliderMax} value={value} onChange={(e) => onChange(Number(e.target.value))} className="dual-input-range" disabled={disabled} />
            <input type="number" min={min} max={limitMax} value={value} onChange={(e) => {
                let val = Number(e.target.value)
                if (val > limitMax) {
                    val = limitMax
                }
                if (val < min) {
                    val = min
                }
                onChange(val)
            }} className="dual-input-number"
                disabled={disabled} />
        </div>
    </fieldset>
);

export default function AutostereogramGeneratorPage() {
    const [inputImage, setInputImage] = useState<HTMLImageElement | null>(null);
    const [outputAutostereogramImage, setOutputAutostereogramImage] = useState<ImageData | null>(null);
    const [patternWidth, setPatternWidth] = useState<number>(10);
    const [maxShiftRatio, setMaxShiftRatio] = useState<number>(0.3);
    const [paddingWidth, setPaddingWidth] = useState<number>(0);
    const [viewMode, setViewMode] = useState<ViewMode>("parallel");
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);

    useEffect(() => {
        DepthEstimator.loadModel();
    }, []);
    const handleGenerate = async () => {
        if (!inputImage) return;
        if (!DepthEstimator.isLoaded()) {
            alert("Depth estimation model is not loaded yet. Please wait.");
            return;
        }
        const depthMap = await DepthEstimator.estimate(inputImage);
        // const outputAutostereogramImageData = generateAutostereogram(depthMap, patternWidth, maxShiftRatio, paddingWidth, viewMode);
        const outputAutostereogramImageData = generateAutostereogram(depthMap);
        setOutputAutostereogramImage(outputAutostereogramImageData);
    };
    return (
        <>
            <h1 className="title">画像から裸眼立体視生成</h1>
            <h2 className="introduction">
                画像から深度を自動判別して裸眼立体視（オートステレオグラム）画像を自動生成．<br />
                技術情報は<Link href="/blog/autostereogram-generator">こちら</Link>から．<br />
                画像はブラウザ上で処理されます．サーバーに送信されることはありません．
            </h2>
            <div className="settings-form">
                <DualInput label="繰り返し幅（px）" value={patternWidth} onChange={setPatternWidth} min={1} sliderMax={inputImage ? Math.floor(inputImage.naturalWidth / 5) : 100} limitMax={inputImage ? Math.floor(inputImage.naturalWidth / 2) : 100} disabled={!inputImage} />
                <DualInput label="深度の強さ" value={maxShiftRatio} onChange={setMaxShiftRatio} min={0.1} sliderMax={1.0} limitMax={1.0} disabled={!inputImage} />
                <DualInput label="余白幅（px）" value={paddingWidth} onChange={setPaddingWidth} min={0} sliderMax={patternWidth} limitMax={patternWidth} disabled={!inputImage} />
                <fieldset >
                    <legend>表示モード</legend>

                </fieldset>
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
            </div>
            <div className="button-container">
                <button
                    className="generate-button"
                    onClick={handleGenerate}
                    disabled={!inputImage}
                >
                    生成
                </button>
            </div>
            <div className="canvas-container">
                <div className="canvas-wrapper">
                    <CanvasOutput image={outputAutostereogramImage} />
                </div>
                <p>出力</p>
            </div>
        </>
    )
}
