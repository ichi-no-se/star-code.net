"use client";
import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
import { SquareConfig, calcPoints } from "./SquareSelector";
import "@styles/kaleidoscope.css";

interface Props {
    image: HTMLImageElement;
    config: SquareConfig;
    width: number;
    height: number;
    zoom: number;
    isInteracting: boolean;
}

export interface SquareRenderRef {
    download: () => void;
}


const SquareRender = forwardRef<SquareRenderRef, Props>(
    function SquareRender(props, ref) {
        const { image, config, width, height, zoom, isInteracting } = props;
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [imageUrl, setImageUrl] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            download: () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const link = document.createElement("a");
                link.download = "kaleidoscope.png";
                link.href = canvas.toDataURL("image/png");
                link.click();
            }
        }
        ))

        const srcPixelData = useMemo(() => {
            if (!image) return null;
            const offscreenCanvas = document.createElement("canvas");
            offscreenCanvas.width = image.naturalWidth;
            offscreenCanvas.height = image.naturalHeight;
            const offscreenCtx = offscreenCanvas.getContext("2d");
            if (!offscreenCtx) return null;
            offscreenCtx.drawImage(image, 0, 0);
            return offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height).data;
        }, [image]);

        const render = useCallback((ctx: CanvasRenderingContext2D) => {
            if (!srcPixelData) return;

            const imageData = ctx.createImageData(width, height);

            const points = calcPoints(config);
            const [p0, p1, , p3] = points;
            const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
            const v3 = { x: p3.x - p0.x, y: p3.y - p0.y };
            const det = v1.x * v3.y - v1.y * v3.x;
            const inv00 = v3.y / det;
            const inv01 = -v3.x / det;
            const inv10 = -v1.y / det;
            const inv11 = v1.x / det;
            const mod = (a: number, b: number) => ((a % b) + b) % b;

            const calcSrcPos = (x: number, y: number) => {
                const dx = (x - width / 2) / zoom;
                const dy = (y - height / 2) / zoom;

                const u = inv00 * dx + inv01 * dy;
                const v = inv10 * dx + inv11 * dy;

                const u2 = mod(u, 2);
                const v2 = mod(v, 2);

                const finalU = u2 <= 1 ? u2 : 2 - u2;
                const finalV = v2 <= 1 ? v2 : 2 - v2;

                const srcX = p0.x + finalU * v1.x + finalV * v3.x;
                const srcY = p0.y + finalU * v1.y + finalV * v3.y;

                return { x: srcX, y: srcY };
            }

            const getPixelColor = (x: number, y: number) => {
                x = Math.max(0, Math.min(image.naturalWidth - 1, x));
                y = Math.max(0, Math.min(image.naturalHeight - 1, y));
                const index = (y * image.naturalWidth + x) * 4;
                return {
                    r: srcPixelData[index],
                    g: srcPixelData[index + 1],
                    b: srcPixelData[index + 2],
                    a: srcPixelData[index + 3],
                }
            }

            const calcColorBilinear = (x: number, y: number) => {
                const x0 = Math.floor(x);
                const x1 = x0 + 1;
                const y0 = Math.floor(y);
                const y1 = y0 + 1;
                const wx = x - x0;
                const wy = y - y0;

                const p00 = getPixelColor(x0, y0);
                const p10 = getPixelColor(x1, y0);
                const p01 = getPixelColor(x0, y1);
                const p11 = getPixelColor(x1, y1);

                return {
                    r: p00.r * (1 - wx) * (1 - wy) + p10.r * wx * (1 - wy) + p01.r * (1 - wx) * wy + p11.r * wx * wy,
                    g: p00.g * (1 - wx) * (1 - wy) + p10.g * wx * (1 - wy) + p01.g * (1 - wx) * wy + p11.g * wx * wy,
                    b: p00.b * (1 - wx) * (1 - wy) + p10.b * wx * (1 - wy) + p01.b * (1 - wx) * wy + p11.b * wx * wy,
                    a: p00.a * (1 - wx) * (1 - wy) + p10.a * wx * (1 - wy) + p01.a * (1 - wx) * wy + p11.a * wx * wy,
                }
            }

            if (isInteracting) {
                for (let y = 0; y < height; y += 8) {
                    for (let x = 0; x < width; x += 8) {
                        let { x: srcX, y: srcY } = calcSrcPos(x, y);
                        srcX = Math.round(srcX);
                        srcY = Math.round(srcY);
                        const color = getPixelColor(srcX, srcY);
                        for (let j = y; j < y + 8 && j < height; j++) {
                            for (let i = x; i < x + 8 && i < width; i++) {
                                const index = (j * width + i) * 4;
                                imageData.data[index] = color.r;
                                imageData.data[index + 1] = color.g;
                                imageData.data[index + 2] = color.b;
                                imageData.data[index + 3] = color.a;
                            }
                        }
                    }
                }
            }
            else {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const { x: srcX, y: srcY } = calcSrcPos(x, y);
                        const color = calcColorBilinear(srcX, srcY);

                        const index = (y * width + x) * 4;
                        imageData.data[index] = color.r;
                        imageData.data[index + 1] = color.g;
                        imageData.data[index + 2] = color.b;
                        imageData.data[index + 3] = color.a;
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }, [image, config, width, height, zoom, isInteracting, srcPixelData]);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;
            render(ctx);
            if (isInteracting) {
                setImageUrl(null);
            }
            else {
                const url = canvas.toDataURL("image/png");
                setImageUrl(url);
            }
        }, [render, isInteracting]);

        return (
            <div className="render-container">
                <canvas ref={canvasRef} width={width} height={height} className="render-canvas" />
                {imageUrl && (
                    /* eslint-disable @next/next/no-img-element */
                    <img src={imageUrl} className="save-layer" alt="Rendered Image" />
                )}
            </div>
        )
    }
);

export default SquareRender;
