"use client"
import { useState, useRef, useEffect } from "react";
import { Noto_Sans_JP, Noto_Serif_JP, DotGothic16, Dela_Gothic_One } from "next/font/google";
import "@styles/image-tools.css";
import "@styles/character-xor.css";

const notoSansJP = Noto_Sans_JP({ weight: "400", subsets: ["latin"] });
const notoSerifJP = Noto_Serif_JP({ weight: "400", subsets: ["latin"] });
const dotGothic16 = DotGothic16({ weight: "400", subsets: ["latin"] });
const delaGothicOne = Dela_Gothic_One({ weight: "400", subsets: ["latin"] });

const FONTS = {
    "noto-sans": { "name": "Noto Sans JP", "font": notoSansJP },
    "noto-serif": { "name": "Noto Serif JP", "font": notoSerifJP },
    "dot": { "name": "DotGothic16", "font": dotGothic16 },
    "dela": { "name": "Dela Gothic One", "font": delaGothicOne },
} as const;

type FontKey = keyof typeof FONTS;

export default function CharacterXorPage() {
    const BASE_CANVAS_SIZE = 512;
    const [inputText, setInputText] = useState<string>("");
    const [backgroundColor, setBackgroundColor] = useState<"black" | "white">("black");
    const [fontType, setFontType] = useState<FontKey>("noto-sans");
    const [fontScale, setFontScale] = useState<number>(100);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const handleDraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = BASE_CANVAS_SIZE;
        const height = BASE_CANVAS_SIZE;

        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement("canvas");
            offscreenCanvasRef.current.width = width;
            offscreenCanvasRef.current.height = height;
        }
        const offCanvas = offscreenCanvasRef.current;
        const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
        if (!offCtx) return;

        const mask = new Uint8Array(width * height);
        const fontSize = BASE_CANVAS_SIZE * (fontScale / 100);
        offCtx.font = `${fontSize}px ${FONTS[fontType].font.style.fontFamily}`;
        offCtx.textAlign = "center";
        offCtx.textBaseline = "middle";
        offCtx.fillStyle = "#ffffff";

        for (const char of inputText) {
            offCtx.clearRect(0, 0, width, height);
            offCtx.fillText(char, width / 2, height / 2);
            const charData = offCtx.getImageData(0, 0, width, height).data;
            for (let i = 0; i < mask.length; i++) {
                if (charData[i * 4 + 3] >= 128) {
                    mask[i] ^= 1;
                }
            }
        }

        const finalImage = ctx.createImageData(width, height);
        const pixelBuffer = new Uint32Array(finalImage.data.buffer);
        const isDark = backgroundColor === "black";
        const bgPixel = isDark ? 0xFF000000 : 0xFFFFFFFF;
        const fgPixel = isDark ? 0xFFFFFFFF : 0xFF000000;

        for (let i = 0; i < mask.length; i++) {
            pixelBuffer[i] = mask[i] ? fgPixel : bgPixel;
        }

        ctx.putImageData(finalImage, 0, 0);
    };

    useEffect(() => {
        handleDraw();
    }, [inputText, backgroundColor, fontType, fontScale]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = inputText + "_" + fontType + "_xor.png";
                a.click();
                URL.revokeObjectURL(url);
            }
        }, "image/png");
    };

    return (
        <>
            <h1 className="title">文字 XOR</h1>
            <h2 className="introduction">文字を XOR して画像生成．<br />フォントの読み込みが間に合わず，デフォルトのフォントで表示される場合は「描画を更新」をクリックしてください．</h2>
            <div className="settings-form">
                <fieldset>
                    <legend>背景色</legend>
                    <label>
                        <input type="radio" name="backgroundColor" value="black" checked={backgroundColor === "black"} onChange={() => setBackgroundColor("black")} />
                        黒
                    </label>
                    <label>
                        <input type="radio" name="backgroundColor" value="white" checked={backgroundColor === "white"} onChange={() => setBackgroundColor("white")} />
                        白
                    </label>
                </fieldset>
                <fieldset>
                    <legend>フォント</legend>
                    {Object.entries(FONTS).map(([key, { name }]) => (
                        <label key={key}>
                            <input type="radio" name="fontType" value={key} checked={fontType === key} onChange={() => setFontType(key as FontKey)} />
                            {name}
                        </label>
                    ))}
                </fieldset>
                <fieldset className="font-scale-fieldset">
                    <legend>文字倍率</legend>
                    <span className="font-scale-value">{fontScale}%</span>
                    <input type="range" min="50" max="200" step="1" list="scale-list" value={fontScale} onChange={(e) => setFontScale(Number(e.target.value))} />
                    <datalist id="scale-list">
                        <option value="100"/>
                    </datalist>
                </fieldset>
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="ここに入力" />
                <div className="update-button-wrapper">
                    <button onClick={handleDraw} className="update-button">描画を更新</button>
                </div>
            </div>
            <div className="xor-canvas-container">
                <canvas className="xor-canvas" ref={canvasRef} width={BASE_CANVAS_SIZE} height={BASE_CANVAS_SIZE} />
            </div>
            <div className="button-wrapper">
                <button
                    onClick={handleDownload}
                    className="download-button"
                    disabled={inputText.length === 0}
                >
                    画像を保存
                </button>
            </div>
        </>
    );
}
