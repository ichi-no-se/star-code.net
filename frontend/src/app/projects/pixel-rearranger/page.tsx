"use client";
import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import CanvasOutput from "@/components/CanvasOutput";
import "@styles/image-processor.css";
import "@styles/pixel-rearranger.css";

export default function PixelRearranger() {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    return (
        <main>
            <h1 className="title">Pixel Rearranger</h1>
            <ImageUploader onLoad={setImage} />
            <CanvasOutput image={image} />
        </main>
    )
}
