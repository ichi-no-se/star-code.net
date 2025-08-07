"use client";

import "@styles/image-processor.css"
import { ChangeEvent } from "react";

type Props = {
    onLoad: (image: HTMLImageElement) => void;
    resizeDivisor: 1 | 2 | 4 | 8;
};

export default function ImageUploader({ onLoad, resizeDivisor = 1 }: Props) {
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const width = Math.max(1, Math.floor(img.width / resizeDivisor));
            const height = Math.max(1, Math.floor(img.height / resizeDivisor));
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                alert("画像の処理中にエラーが発生しました．");
                URL.revokeObjectURL(objectUrl);
                return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const resizedImg = new Image();
            resizedImg.onload = () => {
                onLoad(resizedImg);
                URL.revokeObjectURL(objectUrl);
            };
            resizedImg.src = canvas.toDataURL();
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
