"use client";
import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import CanvasOutput from "@/components/CanvasOutput";
import { getImageDataFromImage, rgbToHsv, downloadImageData } from "@/lib/ImageUtils";
import "@styles/image-processor.css";
import "@styles/pixel-rearranger.css";

type ColorSpace = "HSV" | "RGB";
type HSVKey = "Hue" | "Saturation" | "Value";
type RGBKey = "Red" | "Green" | "Blue";

function shuffle<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export default function PixelRearrange() {
    const [isRandom, setIsRandom] = useState(false);
    const [colorSpace, setColorSpace] = useState<ColorSpace>("HSV");
    const [primaryHSVKey, setPrimaryHSVKey] = useState<HSVKey>("Value");
    const [secondaryHSVKey, setSecondaryHSVKey] = useState<HSVKey>("Saturation");
    const [primaryRGBKey, setPrimaryRGBKey] = useState<RGBKey>("Red");
    const [secondaryRGBKey, setSecondaryRGBKey] = useState<RGBKey>("Green");
    const [axis, setAxis] = useState<"Row" | "Column">("Row");
    const [flipHorizontal, setFlipHorizontal] = useState(false);
    const [flipVertical, setFlipVertical] = useState(false);
    const [inputImage, setInputImage] = useState<HTMLImageElement | null>(null);
    const [outputImage, setOutputImage] = useState<ImageData | null>(null);

    const handleGenerate = () => {
        if (!inputImage) return;
        const imageData = getImageDataFromImage(inputImage);
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;

        const newImageData = new ImageData(width, height);
        if (isRandom) {
            const pixels = [];
            for (let i = 0; i < data.length; i += 4) {
                pixels.push({
                    r: data[i],
                    g: data[i + 1],
                    b: data[i + 2],
                    a: data[i + 3],
                });
            }
            shuffle(pixels);
            for (let i = 0; i < pixels.length; i++) {
                newImageData.data[i * 4] = pixels[i].r;
                newImageData.data[i * 4 + 1] = pixels[i].g;
                newImageData.data[i * 4 + 2] = pixels[i].b;
                newImageData.data[i * 4 + 3] = pixels[i].a;
            }
        }
        if (colorSpace === "HSV") {
            type Pixel = {
                r: number;
                g: number;
                b: number;
                a: number;
                h: number;
                s: number;
                v: number;
            };
            const pixels: Pixel[] = [];
            for (let i = 0; i < data.length; i += 4) {
                const [h, s, v] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
                pixels.push({
                    r: data[i],
                    g: data[i + 1],
                    b: data[i + 2],
                    a: data[i + 3],
                    h: h,
                    s: s,
                    v: v,
                })
            }
            pixels.sort((a, b) => {
                if (primaryHSVKey === "Hue") {
                    return a.h - b.h;
                }
                if (primaryHSVKey === "Saturation") {
                    return a.s - b.s;
                }
                if (primaryHSVKey === "Value") {
                    return a.v - b.v;
                }
                return 0;
            });
            if (axis === "Row") {
                for (let x = 0; x < width; x++) {
                    const start = x * height;
                    const end = start + height;
                    const column = pixels.slice(start, end);
                    column.sort((a, b) => {
                        if (secondaryHSVKey === "Hue") {
                            return a.h - b.h;
                        }
                        if (secondaryHSVKey === "Saturation") {
                            return a.s - b.s;
                        }
                        if (secondaryHSVKey === "Value") {
                            return a.v - b.v;
                        }
                        return 0;
                    });
                    for (let y = 0; y < height; y++) {
                        const index = (y * width + x) * 4;
                        newImageData.data[index] = column[y].r;
                        newImageData.data[index + 1] = column[y].g;
                        newImageData.data[index + 2] = column[y].b;
                        newImageData.data[index + 3] = column[y].a;
                    }
                }
            }
            else {
                for (let y = 0; y < height; y++) {
                    const start = y * width;
                    const end = start + width;
                    const row = pixels.slice(start, end);
                    row.sort((a, b) => {
                        if (secondaryHSVKey === "Hue") {
                            return a.h - b.h;
                        }
                        if (secondaryHSVKey === "Saturation") {
                            return a.s - b.s;
                        }
                        if (secondaryHSVKey === "Value") {
                            return a.v - b.v;
                        }
                        return 0;
                    });
                    for (let x = 0; x < width; x++) {
                        const index = (y * width + x) * 4;
                        newImageData.data[index] = row[x].r;
                        newImageData.data[index + 1] = row[x].g;
                        newImageData.data[index + 2] = row[x].b;
                        newImageData.data[index + 3] = row[x].a;
                    }
                }
            }
        }
        if (colorSpace === "RGB") {
            type Pixel = {
                r: number;
                g: number;
                b: number;
                a: number;
            };
            const pixels: Pixel[] = [];
            for (let i = 0; i < data.length; i += 4) {
                pixels.push({
                    r: data[i],
                    g: data[i + 1],
                    b: data[i + 2],
                    a: data[i + 3],
                });
            }
            pixels.sort((a, b) => {
                if (primaryRGBKey === "Red") {
                    return a.r - b.r;
                }
                if (primaryRGBKey === "Green") {
                    return a.g - b.g;
                }
                if (primaryRGBKey === "Blue") {
                    return a.b - b.b;
                }
                return 0;
            });
            if (axis === "Row") {
                for (let x = 0; x < width; x++) {
                    const start = x * height;
                    const end = start + height;
                    const column = pixels.slice(start, end);
                    column.sort((a, b) => {
                        if (secondaryRGBKey === "Red") {
                            return a.r - b.r;
                        }
                        if (secondaryRGBKey === "Green") {
                            return a.g - b.g;
                        }
                        if (secondaryRGBKey === "Blue") {
                            return a.b - b.b;
                        }
                        return 0;
                    });
                    for (let y = 0; y < height; y++) {
                        const index = (y * width + x) * 4;
                        newImageData.data[index] = column[y].r;
                        newImageData.data[index + 1] = column[y].g;
                        newImageData.data[index + 2] = column[y].b;
                        newImageData.data[index + 3] = column[y].a;
                    }
                }
            }
            else {
                for (let y = 0; y < height; y++) {
                    const start = y * width;
                    const end = start + width;
                    const row = pixels.slice(start, end);
                    row.sort((a, b) => {
                        if (secondaryRGBKey === "Red") {
                            return a.r - b.r;
                        }
                        if (secondaryRGBKey === "Green") {
                            return a.g - b.g;
                        }
                        if (secondaryRGBKey === "Blue") {
                            return a.b - b.b;
                        }
                        return 0;
                    });
                    for (let x = 0; x < width; x++) {
                        const index = (y * width + x) * 4;
                        newImageData.data[index] = row[x].r;
                        newImageData.data[index + 1] = row[x].g;
                        newImageData.data[index + 2] = row[x].b;
                        newImageData.data[index + 3] = row[x].a;
                    }
                }
            }
        }
        if (flipVertical) {
            const flippedImageData = new ImageData(newImageData.width, newImageData.height);
            for (let y = 0; y < newImageData.height; y++) {
                for (let x = 0; x < newImageData.width; x++) {
                    const srcIndex = (y * newImageData.width + x) * 4;
                    const destIndex = ((newImageData.height - 1 - y) * newImageData.width + x) * 4;
                    flippedImageData.data[destIndex] = newImageData.data[srcIndex];
                    flippedImageData.data[destIndex + 1] = newImageData.data[srcIndex + 1];
                    flippedImageData.data[destIndex + 2] = newImageData.data[srcIndex + 2];
                    flippedImageData.data[destIndex + 3] = newImageData.data[srcIndex + 3];
                }
            }
            newImageData.data.set(flippedImageData.data);
        }
        if (flipHorizontal) {
            const flippedImageData = new ImageData(newImageData.width, newImageData.height);
            for (let y = 0; y < newImageData.height; y++) {
                for (let x = 0; x < newImageData.width; x++) {
                    const srcIndex = (y * newImageData.width + x) * 4;
                    const destIndex = (y * newImageData.width + (newImageData.width - 1 - x)) * 4;
                    flippedImageData.data[destIndex] = newImageData.data[srcIndex];
                    flippedImageData.data[destIndex + 1] = newImageData.data[srcIndex + 1];
                    flippedImageData.data[destIndex + 2] = newImageData.data[srcIndex + 2];
                    flippedImageData.data[destIndex + 3] = newImageData.data[srcIndex + 3];
                }
            }
            newImageData.data.set(flippedImageData.data);
        }
        setOutputImage(newImageData);
    };

    return (
        <main>
            <h1 className="title">画像ピクセル並び替え</h1>
            <h2 className="introduction">
                画像をピクセルレベルでバラバラにした後，特定の優先順位に基づいて並び替えます．<br />
                画像サイズが大きい場合，変換に時間がかかることがあります．
            </h2>
            <div className="settings-form">
                <fieldset>
                    <label className="random-label"><input type="checkbox" checked={isRandom} onChange={e => setIsRandom(e.target.checked)} /> ランダムに並び替える</label>
                </fieldset>
                <fieldset disabled={isRandom}>
                    <legend>ソートに用いる色空間</legend>
                    <label><input type="radio" value="HSV" checked={colorSpace === "HSV"} onChange={() => setColorSpace("HSV")} /> HSV</label>
                    <label><input type="radio" value="RGB" checked={colorSpace === "RGB"} onChange={() => setColorSpace("RGB")} /> RGB</label>
                </fieldset>
                <fieldset disabled={isRandom}>
                    <legend>並び替えのキー</legend>
                    {colorSpace === "HSV" ? (
                        <>
                            <label>
                                メイン
                                <select value={primaryHSVKey} onChange={e => setPrimaryHSVKey(e.target.value as HSVKey)}>
                                    <option value="Hue">色相 (Hue)</option>
                                    <option value="Saturation">彩度 (Saturation)</option>
                                    <option value="Value">明度 (Value)</option>
                                </select>
                            </label>
                            <label>
                                サブ
                                <select value={secondaryHSVKey} onChange={e => setSecondaryHSVKey(e.target.value as HSVKey)}>
                                    <option value="Hue">色相 (Hue)</option>
                                    <option value="Saturation">彩度 (Saturation)</option>
                                    <option value="Value">明度 (Value)</option>
                                </select>
                            </label>
                        </>
                    ) : (
                        <>
                            <label>
                                メイン
                                <select value={primaryRGBKey} onChange={e => setPrimaryRGBKey(e.target.value as RGBKey)}>
                                    <option value="Red">赤 (Red)</option>
                                    <option value="Green">緑 (Green)</option>
                                    <option value="Blue">青 (Blue)</option>
                                </select>
                            </label>
                            <label>
                                サブ
                                <select value={secondaryRGBKey} onChange={e => setSecondaryRGBKey(e.target.value as RGBKey)}>
                                    <option value="Red">赤 (Red)</option>
                                    <option value="Green">緑 (Green)</option>
                                    <option value="Blue">青 (Blue)</option>
                                </select>
                            </label>
                        </>
                    )}
                </fieldset>
                <fieldset disabled={isRandom}>
                    <legend>メインの並び替え方向</legend>
                    <label><input type="radio" value="Row" checked={axis === "Row"} onChange={() => setAxis("Row")} /> 行</label>
                    <label><input type="radio" value="Column" checked={axis === "Column"} onChange={() => setAxis("Column")} /> 列</label>
                </fieldset>
                <fieldset disabled={isRandom}>
                    <legend>反転</legend>
                    <label><input type="checkbox" checked={flipHorizontal} onChange={e => setFlipHorizontal(e.target.checked)} /> 水平反転</label>
                    <label><input type="checkbox" checked={flipVertical} onChange={e => setFlipVertical(e.target.checked)} /> 垂直反転</label>
                </fieldset>
                <button className="generate-button" onClick={handleGenerate} disabled={!inputImage}>生成</button>
            </div>
            <div className="canvas-container">
                <div className="canvas-button-wrapper">
                    <ImageUploader onLoad={setInputImage} />
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
