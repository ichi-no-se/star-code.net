"use client";
import Link from 'next/link';
import { useRef, useEffect, useState } from "react";
import '@styles/qr-canvas.css';
import { encodeToBooleanMatrix } from '@/lib/QRUtils';
import Decoder from '@zxing/library/esm/core/qrcode/decoder/Decoder';

const QRView = ({ matrix,onCellClick }: { matrix: boolean[][]; onCellClick: (x: number, y: number) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const size = matrix.length;
    const isValidMatrix = matrix.every(row => row.length === size) && size > 0;

    useEffect(() => {
        if (!canvasRef.current || !isValidMatrix) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, size, size);
        matrix.forEach((row, y)=>{
            row.forEach((cell, x) => {
                ctx.fillStyle = cell ? 'black' : 'white';
                ctx.fillRect(x, y, 1, 1);
            });
        });
    }, [matrix]);
    if (!isValidMatrix) {
        return <div className="qr-container">Generating...</div>;
    }

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (size / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (size / rect.height));
        onCellClick(x, y);
    };

    return(
        <div className="qr-container">
            <canvas ref={canvasRef} className="qr-canvas" width={size} height={size} onClick={handleClick} />
        </div>
    )

}

export default function QRCanvas() {
    const [matrix, setMatrix] = useState<boolean[][]>([[]]);
    const [decodedText, setDecodedText] = useState<string>("");

    useEffect(() => {
        const text = "https://star-code.net/";
        const m = encodeToBooleanMatrix(text, 'L');
        setMatrix(m);
    }, []);

    const toggleCell = (x: number, y: number) => {
        setMatrix(prev => {
            if (y < 0 || y >= prev.length || x < 0 || x >= prev[y].length) return prev;
            const copy = structuredClone(prev);
            copy[y][x] = !copy[y][x];
            return copy;
        });
    };

    const decoder = new Decoder();
    const decodeMatrix = () => {
        try {
            const decoded = decoder.decodeBooleanArray(matrix);
            setDecodedText(`Decoded Text: ${decoded.getText()}`);
        } catch (error) {
            setDecodedText(`Error decoding QR code: ${error}`);
        }
    };

    useEffect(() => {
        decodeMatrix();
    }, [matrix]);

    return (
        <>
            <h1 className="title">QR Canvas</h1>
            <h2 className="introduction">
                QRコード®のロバスト性の実験．<br />
                <div style={{ fontSize: '0.6em', color: 'gray' }}>
                    QRコード®は<Link href="https://www.denso-wave.com">株式会社デンソーウェーブ</Link>の登録商標です
                </div>
            </h2>
            <QRView matrix={matrix} onCellClick={toggleCell} />
            <p>{decodedText}</p>
        </>
    )
}
