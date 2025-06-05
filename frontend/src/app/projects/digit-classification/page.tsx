"use client";

import { useRef, useEffect, useState } from "react";
import "@/components/ProbabilityChart";
import "@styles/digit-classification.css";
import ProbabilityChart from "@/components/ProbabilityChart";
import predictDigit from "@/lib/DigitClassification";

export default function DigitClassification() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const [lineWidth, setLineWidth] = useState(2.0);
    const [probabilities, setProbabilities] = useState<number[]>(Array(10).fill(0));

    const getInputFromCanvas = (): number[][] => {
        const canvas = canvasRef.current;
        if (!canvas) return Array.from({ length: 28 }, () => Array(28).fill(0));
        const ctx = canvas.getContext("2d");
        if (!ctx) return Array.from({ length: 28 }, () => Array(28).fill(0));

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const input: number[][] = Array.from({ length: 28 }, () => Array(28).fill(0));
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                const index = (y * 28 + x) * 4; // RGBA
                const r = imageData[index];
                const g = imageData[index + 1];
                const b = imageData[index + 2];
                const a = imageData[index + 3];
                // Convert to grayscale and normalize
                input[y][x] = (r + g + b) / (3 * 255) * (a / 255);
            }
        }
        return input;
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const clearCanvas = () => {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        clearCanvas();

        ctx.lineCap = "round";
        ctx.strokeStyle = "white";
        ctx.lineWidth = lineWidth;

        const getPos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
            const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
            return {
                x: (clientX - rect.left) / rect.width * canvas.width,
                y: (clientY - rect.top) / rect.height * canvas.height
            };
        };
        const startDrawing = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            isDrawing.current = true;
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
        const draw = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            if (!isDrawing.current) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
        const endDrawing = () => {
            isDrawing.current = false;
            ctx.closePath();
            const input = getInputFromCanvas();
            predictDigit(input).then(setProbabilities).catch(console.error);
        }

        canvas.addEventListener("mousedown", startDrawing);
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", endDrawing);
        canvas.addEventListener("mouseleave", endDrawing);

        canvas.addEventListener("touchstart", startDrawing, { passive: false });
        canvas.addEventListener("touchmove", draw, { passive: false });
        canvas.addEventListener("touchend", endDrawing);
        canvas.addEventListener("touchcancel", endDrawing);
        return () => {
            canvas.removeEventListener("mousedown", startDrawing);
            canvas.removeEventListener("mousemove", draw);
            canvas.removeEventListener("mouseup", endDrawing);
            canvas.removeEventListener("mouseleave", endDrawing);

            canvas.removeEventListener("touchstart", startDrawing);
            canvas.removeEventListener("touchmove", draw);
            canvas.removeEventListener("touchend", endDrawing);
            canvas.removeEventListener("touchcancel", endDrawing);
        }
    }, []
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.lineWidth = lineWidth;
    }, [lineWidth]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setProbabilities(Array(10).fill(0));
    };

    return (
        <main>
            <div className="title">手書き数字分類</div>
            <div className="introduction">学習には MNIST データセットを用いています</div>
            <div className="layout-container">
                <div className="canvas-wrapper">
                    <canvas ref={canvasRef} width={28} height={28} className="digit-canvas" />
                    <div className="slider-container">
                        <label htmlFor="lineWidth">線の太さ: {lineWidth}</label>
                        <input
                            type="range"
                            id="lineWidth"
                            min="0.5"
                            max="5"
                            step="0.5"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="slider"
                        />
                    </div>
                    <button onClick={clearCanvas} className="clear-button">クリア</button>
                </div>
                <div className="chart-wrapper">
                    <ProbabilityChart probabilities={probabilities} />
                </div>
            </div>
        </main>
    )
}
