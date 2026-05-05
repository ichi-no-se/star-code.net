"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import ImageUploader from "@/components/ImageUploader";
import TriangleSelector, { TriangleSelectorRef, TriangleConfig } from "@/components/Kaleidoscope/TriangleSelector";
import TriangleRender, { TriangleRenderRef } from "@/components/Kaleidoscope/TriangleRender";
import "@styles/image-processor.css";
import "@styles/image-tools.css";

export default function KaleidoscopePage() {
    const [inputImage, setInputImage] = useState<HTMLImageElement | null>(null);
    const [triangleConfig, setTriangleConfig] = useState<TriangleConfig>({ cx: 0, cy: 0, r: 0, angle: 0 });
    const [outputWidth, setOutputWidth] = useState(400);
    const [outputWidthText, setOutputWidthText] = useState("400");
    const [outputHeight, setOutputHeight] = useState(400);
    const [outputHeightText, setOutputHeightText] = useState("400");
    const [zoom, setZoom] = useState(1);
    const [zoomText, setZoomText] = useState("1");
    const [angleText, setAngleText] = useState("0");
    const [isInteracting, setIsInteracting] = useState(false);
    const selectorRef = useRef<TriangleSelectorRef>(null);
    const renderRef = useRef<TriangleRenderRef>(null);
    const ZOOM_MIN = 1e-4;
    const handleDownload = () => {
        if (renderRef.current) {
            renderRef.current.download();
        }
    };
    const handleSelectorChange = useCallback(
        (config: TriangleConfig, isDragging: boolean) => {
            setTriangleConfig(config);
            setIsInteracting(isDragging);
        }, []);
    const degToRad = (deg: number) => {
        deg %= 360;
        if (deg < 0) {
            deg += 360;
        }
        return (deg * Math.PI) / 180;
    }
    const radToDeg = (rad: number) => {
        rad %= 2 * Math.PI;
        if (rad < 0) {
            rad += 2 * Math.PI;
        }
        return (rad * 180) / Math.PI;
    };
    useEffect(() => {
        if (selectorRef.current) {
            const angle = triangleConfig.angle;
            const deg = radToDeg(angle);
            setAngleText(deg.toFixed(0));
        }
    }, [triangleConfig])
    return (
        <>
            <h1 className="title">万華鏡風画像作成（正三角形）</h1>
            <h2 className="introduction">
                画像から万華鏡風の画像を作成します．<br />
                <small>
                    端末のブラウザ上で計算を行います．サーバーに画像が送信されることはありません．<br />
                    作成した画像はご自由にお使いください．クレジット表記等は不要です．
                </small>

            </h2>
            <div className="settings-form kaleidoscope-settings">
                <legend>出力サイズ</legend>
                <div className="setting-group">
                    <label>幅（px）</label><input
                        type="number"
                        value={outputWidthText}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setOutputWidthText(val);
                            let valInt = parseInt(e.target.value);
                            if (!isNaN(valInt) && valInt > 0) {
                                if (valInt > 4000) {
                                    valInt = 4000;
                                }
                                setOutputWidth(valInt);
                            }
                        }}
                        onBlur={(e) => {
                            let valInt = parseInt(e.target.value);
                            if (isNaN(valInt) || valInt <= 0) {
                                valInt = 400;
                            }
                            if (valInt > 4000) {
                                valInt = 4000;
                            }
                            setOutputWidth(valInt);
                            setOutputWidthText(valInt.toString());
                        }}
                        min="1"
                        max="4000"
                    />
                </div>
                <div className="setting-group">
                    <label>高さ（px）</label>
                    <input
                        type="number"
                        value={outputHeightText}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            setOutputHeightText(val);
                            let valInt = parseInt(e.target.value);
                            if (!isNaN(valInt) && valInt > 0) {
                                if (valInt > 4000) {
                                    valInt = 4000;
                                } setOutputHeight(valInt);
                            }
                        }}
                        onBlur={(e) => {
                            let valInt = parseInt(e.target.value);
                            if (isNaN(valInt) || valInt <= 0) {
                                valInt = 400;
                            }
                            if (valInt > 4000) {
                                valInt = 4000;
                            }
                            setOutputHeight(valInt);
                            setOutputHeightText(valInt.toString());
                        }}
                        min="1"
                        max="4000"
                    />
                </div>
                <div className="setting-group">
                    <label>ズーム</label><input
                        type="number"
                        value={zoomText}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            setZoomText(val);
                            let valFloat = parseFloat(e.target.value);
                            if (!isNaN(valFloat) && valFloat > 0) {
                                if (valFloat < ZOOM_MIN) {
                                    valFloat = ZOOM_MIN;
                                }
                                setZoom(valFloat);
                            }
                        }}
                        onBlur={(e) => {
                            let valFloat = parseFloat(e.target.value);
                            if (isNaN(valFloat) || valFloat <= 0) {
                                valFloat = 1;
                            } if (valFloat < ZOOM_MIN) {
                                valFloat = ZOOM_MIN;
                            }
                            setZoom(valFloat);
                            setZoomText(valFloat.toString());
                        }}
                        min="0.1"
                        step="0.1"
                    />
                </div>
                <div className="setting-group">
                    <label>回転（度）</label><input
                        type="number"
                        value={angleText}
                        onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.-]/g, "");
                            setAngleText(val);
                            const valFloat = parseFloat(e.target.value);
                            if (!isNaN(valFloat)) {
                                const rad = degToRad(valFloat);
                                if (selectorRef.current) {
                                    const newConfig = { ...triangleConfig, angle: rad };
                                    if (selectorRef.current.validateConfig(newConfig)) {
                                        setTriangleConfig(newConfig);
                                    }
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const valFloat = parseFloat(e.target.value);
                            if (isNaN(valFloat)) {
                                const deg = radToDeg(triangleConfig.angle);
                                setAngleText(deg.toFixed(0));
                                return;
                            }
                            else {
                                const rad = degToRad(valFloat);
                                if (selectorRef.current) {
                                    const newConfig = { ...triangleConfig, angle: rad };
                                    if (selectorRef.current.validateConfig(newConfig)) {
                                        setTriangleConfig(newConfig);
                                        setAngleText(valFloat.toFixed(0));
                                    }
                                    else {
                                        const deg = radToDeg(triangleConfig.angle);
                                        setAngleText(deg.toFixed(0));
                                    }
                                }
                            }
                        }}
                        min="-360"
                        max="360"
                        step="1"
                    />
                </div>
            </div>
            <div className="canvas-container">
                <div className="canvas-button-wrapper">
                    <div className="image-uploader">
                        <label className="upload-label">
                            ファイルを選択
                            <ImageUploader onLoad={(img) => setInputImage(img)} resizeDivisor={1} />
                        </label>
                    </div>
                    <div className="canvas-wrapper">
                        {inputImage && (
                            <TriangleSelector image={inputImage} config={triangleConfig} onChange={handleSelectorChange} ref={selectorRef} />
                        )}
                    </div>
                    <p>入力画像</p>
                </div>
                <div className="canvas-button-wrapper">
                    <button className="download-button" onClick={handleDownload} disabled={!inputImage}>
                        ダウンロード
                    </button>
                    <div className="canvas-wrapper">
                        {inputImage && (
                            <TriangleRender image={inputImage} config={triangleConfig} width={outputWidth} height={outputHeight} zoom={zoom} isInteracting={isInteracting} ref={renderRef} />
                        )}
                    </div>
                    <p>出力画像</p>
                </div>
            </div>
        </>
    )
}
