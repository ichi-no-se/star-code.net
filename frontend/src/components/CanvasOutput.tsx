"use client";

import { useEffect, useRef } from "react";
import "@styles/image-processor.css";

type Props = {
    image: HTMLImageElement | ImageData | null;
};

export default function CanvasOutput({ image }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (!image) {
            canvas.width = 100;
            canvas.height = 100;
            return;
        }
        if (image instanceof HTMLImageElement) {
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            ctx.drawImage(image, 0, 0);
            return;
        }
        if (image instanceof ImageData) {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.putImageData(image, 0, 0);
            return;
        }
    }, [image]);

    return <canvas ref={canvasRef} className="image-canvas" />;
}
