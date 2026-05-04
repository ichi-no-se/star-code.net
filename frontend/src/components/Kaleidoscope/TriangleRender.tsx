"use client";
import { useRef, useEffect, useState, useImperativeHandle, forwardRef, useMemo } from "react";
import { TriangleConfig, calcPoints } from "./TriangleSelector";
import "@styles/kaleidoscope.css";

interface Props {
    image: HTMLImageElement;
    config: TriangleConfig;
    width: number;
    height: number;
    zoom: number;
    isInteracting: boolean;
}

export interface TriangleRenderRef {
    download: () => void;
}


const TriangleRender = forwardRef<TriangleRenderRef, Props>((props, ref) => {
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
    }, [image, config, width, height, zoom, isInteracting]);

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

    const render = (ctx: CanvasRenderingContext2D) => {
        if (!srcPixelData) return;

        const imageData = ctx.createImageData(width, height);

        const points = calcPoints(config);
        const [p0, p1, p2] = points;
        const v1 = { x: p1.x - p0.x, y: p1.y - p0.y };
        const v2 = { x: p2.x - p0.x, y: p2.y - p0.y };
        const det = v1.x * v2.y - v1.y * v2.x;
        const inv00 = v2.y / det;
        const inv01 = -v2.x / det;
        const inv10 = -v1.y / det;
        const inv11 = v1.x / det;
        const L = config.r * Math.sqrt(3);
        const e01 = { x: (p1.x - p0.x) / L, y: (p1.y - p0.y) / L };
        const e01_perp = { x: -e01.y, y: e01.x };

        const mod = (a: number, b: number) => ((a % b) + b) % b;

        const calsSrcPos = (x: number, y: number) => {
            const dx = (x - width / 2) / zoom;
            const dy = (y - height / 2) / zoom;

            const u = inv00 * dx + inv01 * dy;
            const v = inv10 * dx + inv11 * dy;

            const iu = Math.floor(u);
            const iv = Math.floor(v);
            const fu = u - iu;
            const fv = v - iv;

            const isUpperRight = fu + fv >= 1;

            const aroundPoints = isUpperRight ? [
                { u: iu + 1, v: iv },
                { u: iu, v: iv + 1 },
                { u: iu + 1, v: iv + 1 },
            ] : [
                { u: iu, v: iv },
                { u: iu + 1, v: iv },
                { u: iu, v: iv + 1 },
            ]
            const aroundPointsIds = aroundPoints.map(p => mod(p.u - p.v, 3));

            const distFromPoint = [];

            for (let i = 0; i < 3; i++) {
                if (aroundPointsIds[i] === 2) {
                    continue;
                }
                const px = aroundPoints[i].u * v1.x + aroundPoints[i].v * v2.x;
                const py = aroundPoints[i].u * v1.y + aroundPoints[i].v * v2.y;
                const dPx = dx - px;
                const dPy = dy - py;
                const dist = Math.sqrt(dPx * dPx + dPy * dPy);
                distFromPoint[aroundPointsIds[i]] = dist;
            }

            let cosTheta = (L * L + distFromPoint[0] * distFromPoint[0] - distFromPoint[1] * distFromPoint[1]) / (2 * L * distFromPoint[0]);
            if (Number.isNaN(cosTheta)) {
                cosTheta = 0;
            }
            cosTheta = Math.max(-1, Math.min(1, cosTheta));
            const sinTheta = Math.sqrt(1 - cosTheta * cosTheta); // 0 <= theta <= pi / 3

            let srcX = p0.x + distFromPoint[0] * (cosTheta * e01.x + sinTheta * e01_perp.x)
            let srcY = p0.y + distFromPoint[0] * (cosTheta * e01.y + sinTheta * e01_perp.y);
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
                    let { x: srcX, y: srcY } = calsSrcPos(x, y);
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
                    let { x: srcX, y: srcY } = calsSrcPos(x, y);
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
    };

    return (
        <div className="render-container">
            <canvas ref={canvasRef} width={width} height={height} className="render-canvas" />
            {imageUrl && (
                <img src={imageUrl} className="save-layer" />
            )}
        </div>
    )
}
);

export default TriangleRender;
