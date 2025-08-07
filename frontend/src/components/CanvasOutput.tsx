"use client";

import { useEffect, useState } from "react";
import "@styles/image-processor.css";

type Props = {
    image: HTMLImageElement | ImageData | null;
};

export default function CanvasOutput({ image }: Props) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!image) {
            setImageUrl(null);
            return;
        }

        if (image instanceof HTMLImageElement) {
            setImageUrl(image.src);
            return;
        }

        const canvas = document.createElement("canvas");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.putImageData(image, 0, 0);
        const url = canvas.toDataURL("image/png");
        setImageUrl(url);
    }, [image]);

    return (
        <>
            {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    className="image-canvas"
                    style={{ maxWidth: "100%", height: "auto" }} alt={""} />
            )}
        </>
    )
}
