"use client";
import { useEffect, useState } from "react";
import CanvasOutput from "@/components/CanvasOutput";
import ImageUploader from "@/components/ImageUploader";
import { getImageDataFromImage, rgbToHsv, hsvToRgb, downloadImageData } from "@/lib/ImageUtils";
import "@styles/image-processor.css";
import "@styles/image-tools.css";
import "@styles/image-blend.css";

const blendHue = (h1: number, h2: number, s1: number, s2: number, ratio: number): number => {
    if (s1 === 0) return h2;
    if (s2 === 0) return h1;
    let diff = h2 - h1;
    if (diff > 180) {
        diff -= 360;
    } else if (diff < -180) {
        diff += 360;
    }
    return ((h1 + diff * ratio) % 360 + 360) % 360;
};

export default function ImageBlendPage() {
    const [inputImageA, setInputImageA] = useState<HTMLImageElement | null>(null);
    const [inputImageB, setInputImageB] = useState<HTMLImageElement | null>(null);
    const [outputImage, setOutputImage] = useState<ImageData | null>(null);
    const [height, setHeight] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);
    const [heightText, setHeightText] = useState<string>("");
    const [widthText, setWidthText] = useState<string>("");
    const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(false);
    const [blendMode, setBlendMode] = useState<"rgb" | "hsv">("rgb");
    const [blendRatios, setBlendRatios] = useState<[number, number, number]>([0.5, 0.5, 0.5]);

    useEffect(() => {
        if (inputImageA && inputImageB) {
            const width = Math.min(inputImageA.naturalWidth, inputImageB.naturalWidth);
            const height = Math.min(inputImageA.naturalHeight, inputImageB.naturalHeight);
            setWidth(width);
            setHeight(height);
            setWidthText(width.toString());
            setHeightText(height.toString());
            if (inputImageA.naturalWidth * inputImageB.naturalHeight === inputImageB.naturalWidth * inputImageA.naturalHeight) {
                setKeepAspectRatio(true);
            } else {
                setKeepAspectRatio(false);
            }
        }
    }, [inputImageA, inputImageB]);

    const isAspectSame = Boolean(
        inputImageA && inputImageB && (inputImageA.naturalWidth * inputImageB.naturalHeight === inputImageB.naturalWidth * inputImageA.naturalHeight)
    );

    const handleHeightChange = (newHeight: number) => {
        if (newHeight <= 0) {
            newHeight = inputImageA && inputImageB ? Math.min(inputImageA.naturalHeight, inputImageB.naturalHeight) : 0;
        }
        if (keepAspectRatio && inputImageA && inputImageB) {
            const newWidth = Math.round((newHeight * inputImageA.naturalWidth) / inputImageA.naturalHeight);
            setWidth(newWidth);
            setWidthText(newWidth.toString());
        }
        setHeight(newHeight);
        setHeightText(newHeight.toString());
    };

    const handleWidthChange = (newWidth: number) => {
        if (newWidth <= 0) {
            newWidth = inputImageA && inputImageB ? Math.min(inputImageA.naturalWidth, inputImageB.naturalWidth) : 0;
        }
        if (keepAspectRatio && inputImageA && inputImageB) {
            const newHeight = Math.round((newWidth * inputImageA.naturalHeight) / inputImageA.naturalWidth);
            setHeight(newHeight);
            setHeightText(newHeight.toString());
        }
        setWidth(newWidth);
        setWidthText(newWidth.toString());
    };

    const handleReset = () => {
        setOutputImage(null);
    };

    const handleImageLoadA = (img: HTMLImageElement) => {
        handleReset();
        setInputImageA(img);
    };

    const handleImageLoadB = (img: HTMLImageElement) => {
        handleReset();
        setInputImageB(img);
    };

    const handleGenerate = () => {
        if (!inputImageA || !inputImageB) return;
        const imageDataA = getImageDataFromImage(inputImageA, width, height, false);
        const imageDataB = getImageDataFromImage(inputImageB, width, height, false);
        const outputData = new ImageData(width, height);

        if (blendMode === "rgb") {
            for (let i = 0; i < outputData.data.length; i += 4) {
                outputData.data[i] = imageDataA.data[i] * (1 - blendRatios[0]) + imageDataB.data[i] * blendRatios[0];
                outputData.data[i + 1] = imageDataA.data[i + 1] * (1 - blendRatios[1]) + imageDataB.data[i + 1] * blendRatios[1];
                outputData.data[i + 2] = imageDataA.data[i + 2] * (1 - blendRatios[2]) + imageDataB.data[i + 2] * blendRatios[2];
                outputData.data[i + 3] = 255;
            }
        } else {
            for (let i = 0; i < outputData.data.length; i += 4) {
                const [h1, s1, v1] = rgbToHsv(imageDataA.data[i], imageDataA.data[i + 1], imageDataA.data[i + 2]);
                const [h2, s2, v2] = rgbToHsv(imageDataB.data[i], imageDataB.data[i + 1], imageDataB.data[i + 2]);

                const h = blendHue(h1, h2, s1, s2, blendRatios[0]);
                const s = s1 * (1 - blendRatios[1]) + s2 * blendRatios[1];
                const v = v1 * (1 - blendRatios[2]) + v2 * blendRatios[2];

                const [r, g, b] = hsvToRgb(h, s, v);
                outputData.data[i] = Math.round(r);
                outputData.data[i + 1] = Math.round(g);
                outputData.data[i + 2] = Math.round(b);
                outputData.data[i + 3] = 255;
            }
        }
        setOutputImage(outputData);
    };

    return (
        <>
            <h1 className="title">画像ブレンド</h1>
            <h2 className="introduction">
                2 枚の画像を RGB か HSV の比率を指定してまぜまぜ．<br />
                画像はブラウザ上で処理されます．サーバーに送信されることはありません．
            </h2>

            <div className="settings-form">
                <fieldset>
                    <legend>画像サイズ</legend>
                    <label>
                        幅（px）
                        <input
                            type="number"
                            onChange={(e) => setWidthText(e.target.value)}
                            onBlur={() => handleWidthChange(Number(widthText))}
                            value={widthText}
                            disabled={!(inputImageA && inputImageB)}
                        />
                    </label>
                    <label>
                        高さ（px）
                        <input
                            type="number"
                            onChange={(e) => setHeightText(e.target.value)}
                            onBlur={() => handleHeightChange(Number(heightText))}
                            value={heightText}
                            disabled={!(inputImageA && inputImageB)}
                        />
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={keepAspectRatio}
                            onChange={(e) => setKeepAspectRatio(e.target.checked)}
                            disabled={!isAspectSame}
                        />
                        アスペクト比を維持
                    </label>
                </fieldset>

                <fieldset>
                    <legend>ブレンドモード</legend>
                    <label>
                        <input
                            type="radio"
                            name="blendMode"
                            value="rgb"
                            checked={blendMode === "rgb"}
                            onChange={() => {
                                setBlendMode("rgb");
                                setBlendRatios([0.5, 0.5, 0.5]);
                            }}
                        />
                        RGB
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="blendMode"
                            value="hsv"
                            checked={blendMode === "hsv"}
                            onChange={() => {
                                setBlendMode("hsv");
                                setBlendRatios([0.5, 0.5, 0.5]);
                            }}
                        />
                        HSV
                    </label>
                </fieldset>

                <fieldset className="blend-ratio-fieldset">
                    <legend>ブレンド比率</legend>
                    <label className="blend-ratio-label">
                        <span className="blend-ratio-label-text">
                            {blendMode === "rgb" ? "R" : "H"}
                        </span>
                        <input
                            className="blend-ratio-slider"
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={blendRatios[0]}
                            onChange={(e) => setBlendRatios([Number(e.target.value), blendRatios[1], blendRatios[2]])}
                        />
                    </label>
                    <label className="blend-ratio-label">
                        <span className="blend-ratio-label-text">
                            {blendMode === "rgb" ? "G" : "S"}
                        </span>
                        <input
                            className="blend-ratio-slider"
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={blendRatios[1]}
                            onChange={(e) => setBlendRatios([blendRatios[0], Number(e.target.value), blendRatios[2]])}
                        />
                    </label>
                    <label className="blend-ratio-label">
                        <span className="blend-ratio-label-text">
                            {blendMode === "rgb" ? "B" : "V"}
                        </span>
                        <input
                            className="blend-ratio-slider"
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={blendRatios[2]}
                            onChange={(e) => setBlendRatios([blendRatios[0], blendRatios[1], Number(e.target.value)])}
                        />
                    </label>
                </fieldset>

                <button
                    className="generate-button"
                    onClick={handleGenerate}
                    disabled={!(inputImageA && inputImageB)}
                >
                    生成
                </button>
            </div>

            <div className="canvas-container-image-blend">
                <div className="canvas-button-wrapper">
                    <div className="image-uploader">
                        <label className="upload-label">
                            ファイルを選択
                            <ImageUploader onLoad={handleImageLoadA} resizeDivisor={1} />
                        </label>
                    </div>
                    <div className="canvas-wrapper">
                        <CanvasOutput image={inputImageA} />
                    </div>
                    <p>入力画像 A</p>
                </div>

                <div className="canvas-button-wrapper">
                    <button
                        className="download-button"
                        disabled={!outputImage}
                        onClick={() => outputImage && downloadImageData(outputImage, "output.png")}
                    >
                        ダウンロード
                    </button>
                    <div className="canvas-wrapper">
                        <CanvasOutput image={outputImage} />
                    </div>
                    <p>出力画像</p>
                </div>

                <div className="canvas-button-wrapper">
                    <div className="image-uploader">
                        <label className="upload-label">
                            ファイルを選択
                            <ImageUploader onLoad={handleImageLoadB} resizeDivisor={1} />
                        </label>
                    </div>
                    <div className="canvas-wrapper">
                        <CanvasOutput image={inputImageB} />
                    </div>
                    <p>入力画像 B</p>
                </div>

            </div>
        </>
    );
}