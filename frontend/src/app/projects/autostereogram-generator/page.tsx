"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import DepthEstimator from "@/lib/DepthEstimation";
import { downloadImageData } from "@/lib/ImageUtils";
import generateAutostereogram, { ViewMode } from "@/lib/Autostereogram";
import ImageUploader from "@/components/ImageUploader";
import CanvasOutput from "@/components/CanvasOutput";
import "@styles/image-processor.css";
import "@styles/image-tools.css";

const DualInput = ({ label, value, onChange, min, sliderMax, limitMax, step, disabled }: {
    label: string, value: number, onChange: (value: number) => void, min: number, sliderMax: number, limitMax: number, step: number, disabled: boolean
}) => (
    <fieldset className="dual-input-fieldset">
        <legend>{label}</legend>
        <div className="dual-inputs">
            <input type="range" min={min} max={sliderMax} value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} className="dual-input-range" disabled={disabled} />
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
                step={step} disabled={disabled} />
        </div>
    </fieldset>
);

export default function AutostereogramGeneratorPage() {
    const [inputImage, setInputImage] = useState<HTMLImageElement | null>(null);
    const [outputImage, setOutputImage] = useState<ImageData | null>(null);
    const [patternWidth, setPatternWidth] = useState<number>(10);
    const [maxShiftRatio, setMaxShiftRatio] = useState<number>(0.4);
    const [paddingWidth, setPaddingWidth] = useState<number>(0);
    const [viewMode, setViewMode] = useState<ViewMode>("parallel");
    const [addGuideDots, setAddGuideDots] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    useEffect(() => {
        if (!inputImage) return;
        const imgWidth = inputImage.naturalWidth || inputImage.width;
        setPatternWidth(Math.max(1, Math.floor(imgWidth / 8)));
    }, [inputImage]);


    const handleLoadModel = async () => {
        if (DepthEstimator.isLoaded()) {
            return;
        }
        const isConfirmed = confirm("深度推定モデル（約 40MB）を読み込みますか？");
        if (!isConfirmed) {
            return;
        }
        try {
            await DepthEstimator.loadModel();
        }
        catch (error) {
            console.error("Failed to load depth estimation model:", error);
            alert("深度推定モデルの読み込みに失敗．");
        }
    };

    const handleGenerate = async () => {
        if (!inputImage || isProcessing) return;
        setIsProcessing(true);
        try {
            await handleLoadModel();
            if (!DepthEstimator.isLoaded()) {
                return;
            }
            const depthMap = await DepthEstimator.estimate(inputImage);
            const outputAutostereogramImageData = generateAutostereogram(depthMap, patternWidth, maxShiftRatio, paddingWidth, viewMode, addGuideDots);
            setOutputImage(outputAutostereogramImageData);
        }
        catch (error) {
            console.error("Failed to generate autostereogram:", error);
        }
        finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <h1 className="title">画像からオートステレオグラム（裸眼立体視）生成</h1>
            <h2 className="introduction">
                画像から深度を自動判別してオートステレオグラムを自動生成．<br />
                技術情報は<Link href="/blog/autostereogram-generator">こちら</Link>から．<br />
                画像はブラウザ上で処理されます．サーバーに送信されることはありません．
            </h2>

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
            <div className="settings-form">
                <DualInput label="繰り返し幅（px）" value={patternWidth} onChange={setPatternWidth} min={1} sliderMax={inputImage ? Math.floor(inputImage.naturalWidth / 5) : 100} limitMax={inputImage ? Math.floor(inputImage.naturalWidth / 2) : 100} step={1} disabled={!inputImage || isProcessing} />
                <DualInput label="深度の強さ" value={maxShiftRatio} onChange={setMaxShiftRatio} min={0.1} sliderMax={1.0} limitMax={1.0} step={0.05} disabled={!inputImage || isProcessing} />
                <DualInput label="余白幅（px）" value={paddingWidth} onChange={setPaddingWidth} min={0} sliderMax={patternWidth} limitMax={patternWidth} step={1} disabled={!inputImage || isProcessing} />
                <fieldset >
                    <legend>描画モード</legend>
                    <label className="option-label">
                        <input
                            type="radio"
                            name="viewMode"
                            value="parallel"
                            checked={viewMode === "parallel"}
                            onChange={() => setViewMode("parallel")}
                            disabled={!inputImage || isProcessing}
                        />
                        <span>平行法</span>
                    </label>
                    <label className="option-label">
                        <input
                            type="radio"
                            name="viewMode"
                            value="cross"
                            checked={viewMode === "cross"}
                            onChange={() => setViewMode("cross")}
                            disabled={!inputImage || isProcessing}
                        />
                        <span>交差法</span>
                    </label>
                </fieldset>
                <label className="option-label">
                    <input
                        type="checkbox"
                        className="option-checkbox"
                        checked={addGuideDots}
                        onChange={(e) => setAddGuideDots(e.target.checked)}
                        disabled={!inputImage || isProcessing}
                    />
                    <span>ガイドドットを追加</span>
                </label>
                <div className="button-container">
                    <button
                        className="generate-button"
                        onClick={handleGenerate}
                        disabled={!inputImage || isProcessing}
                    >
                        生成
                    </button>
                </div>
            </div>
            <div className="canvas-container">
                <div className="canvas-button-wrapper">
                    <button className="download-button" disabled={!outputImage} onClick={() => outputImage && downloadImageData(outputImage, "output.png")}>ダウンロード</button>
                    <div className="canvas-wrapper">
                        <CanvasOutput image={outputImage} />
                    </div>
                    <p>出力画像</p>
                </div>
            </div>
            <div className="license">
                本 Web アプリでは，深度推定モデルとして<Link href="https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX">depth-anything-v2-small-ONNX</Link>（ライセンス：<Link href="https://choosealicense.com/licenses/apache-2.0/">Apache 2.0</Link>）を使用しています．
            </div>
        </>
    )
}
