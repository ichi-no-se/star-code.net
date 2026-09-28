"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { DepthEstimator, rawImageToImageData } from "@/lib/DepthEstimation";
import ImageUploader from "@/components/ImageUploader";
import CanvasOutput from "@/components/CanvasOutput";
import "@styles/image-processor.css";

export default function AutostereogramGeneratorPage() {
    const [inputImage, setInputImage] = useState<HTMLImageElement | null>(null);
    const [outputImage, setOutputImage] = useState<ImageData | null>(null);
    useEffect(() => {
        DepthEstimator.loadModel();
    }, []);
    const handleGenerate = async () => {
        if (!inputImage) return;
        if(!DepthEstimator.isLoaded()) {
            alert("Depth estimation model is not loaded yet. Please wait.");
            return;
        }
        setOutputImage(null);
        const depthMap = await DepthEstimator.estimate(inputImage);
        const outputImageData = rawImageToImageData(depthMap);
        setOutputImage(outputImageData);
    };
    return (
        <>
            <h1 className="title">画像から裸眼立体視生成</h1>
            <h2 className="introduction">
                画像から深度を自動判別して裸眼立体視（オートステレオグラム）画像を自動生成．<br />
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
                    <CanvasOutput image={outputImage} />
                </div>
                <p>出力画像</p>
            </div>
        </>
    )
}
