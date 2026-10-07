"use client"
import { useState, useRef } from "react";

export default function CharacterXorPage() {
    const [inputText, setInputText] = useState<string>("");
    const [backgroundColor, setBackgroundColor] = useState<"black" | "white">("black");
    const [fontType, setFontType] = useState<"serif" | "sans-serif">("sans-serif");
    const [isFontBold, setIsFontBold] = useState<boolean>(false);
    const [fontScale, setFontScale] = useState<number>(100);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const drawCharacterXor = (ctx: CanvasRenderingContext2D, text: string, isFontBold: boolean, fontType: "serif" | "sans-serif", fontScale: number) => {
        ctx.font = `${isFontBold ? "bold" : ""} ${fontScale}% ${fontType}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalCompositeOperation = "difference";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
    };

    const handleDraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const char of inputText) {
            drawCharacterXor(ctx, char, isFontBold, fontType, fontScale);
        }
    };

    const handleDownload = (text: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = text + "_xor.png";
                a.click();
                URL.revokeObjectURL(url);
            }
        }, "image/png");
    };

    return (
        <>
            <h1 className="title">文字 XOR</h1>
            <h2 className="introduction">文字の XOR をとってみる．</h2>
            <div className="setting-panel">
                <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="ここに入力" />
                <fieldset>
                    <legend>背景色</legend>
                    <label className="option-label">
                        <input type="radio" name="backgroundColor" value="black" checked={backgroundColor === "black"} onChange={() => setBackgroundColor("black")} />
                        黒
                    </label>
                    <label className="option-label">
                        <input type="radio" name="backgroundColor" value="white" checked={backgroundColor === "white"} onChange={() => setBackgroundColor("white")} />
                        白
                    </label>
                </fieldset>
                <fieldset>
                    <legend>フォント</legend>
                    <label className="option-label">
                        <input type="radio" name="fontType" value="serif" checked={fontType === "serif"} onChange={() => setFontType("serif")} />
                        Serif
                    </label>
                    <label className="option-label">
                        <input type="radio" name="fontType" value="sans-serif" checked={fontType === "sans-serif"} onChange={() => setFontType("sans-serif")} />
                        Sans-serif
                    </label>
                </fieldset>
            </div>
        </>
    );
}
