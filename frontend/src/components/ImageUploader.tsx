"use client";

import "@styles/image-processor.css"
import { ChangeEvent, useState } from "react";

type Props = {
    onLoad: (image: HTMLImageElement) => void;
};

export default function ImageUploader({ onLoad }: Props) {
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            onLoad(img);
            URL.revokeObjectURL(objectUrl);
        };
        img.onerror = () => {
            console.error("画像の読み込みに失敗しました：", file.name);
            URL.revokeObjectURL(objectUrl);
            alert("画像の読み込みに失敗しました．有効な画像ファイルを選択してください．");
        };
        img.src = objectUrl;
    };
    return (
        <div className="image-uploader">
            <label className="upload-label">
                ファイルを選択
                <input type="file" accept="image/*" onChange={handleFileChange}
                    className="file-input" />
            </label>
        </div>
    )
}
