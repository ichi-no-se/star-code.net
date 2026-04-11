"use client";
import Link from 'next/link';
import { useRef, useEffect, useState, useCallback } from "react";
import '@styles/qr-canvas.css';
import { encodeToBooleanMatrix } from '@/lib/QRUtils';
import Decoder from '@zxing/library/esm/core/qrcode/decoder/Decoder';

const QRView = ({ matrix, onCellClick }: { matrix: boolean[][]; onCellClick: (x: number, y: number) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const size = matrix.length;
    const isValidMatrix = matrix.every(row => row.length === size) && size > 0;

    useEffect(() => {
        if (!canvasRef.current || !isValidMatrix) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, size, size);
        matrix.forEach((row, y) => {
            row.forEach((cell, x) => {
                ctx.fillStyle = cell ? 'black' : 'white';
                ctx.fillRect(x, y, 1, 1);
            });
        });
    }, [matrix, size, isValidMatrix]);
    if (!isValidMatrix) {
        return <div className="qr-container">Generating...</div>;
    }

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (size / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (size / rect.height));
        onCellClick(x, y);
    };

    return (
        <div className="qr-container">
            <canvas ref={canvasRef} className="qr-canvas" width={size} height={size} onClick={handleClick} />
        </div>
    )

}

export default function QRCanvas() {
    const [matrix, setMatrix] = useState<boolean[][]>([[]]);
    const [decodedText, setDecodedText] = useState<string>("");
    const [decodedHex, setDecodedHex] = useState<string>("");
    const [inputText, setInputText] = useState<string>("https://star-code.net");
    const [qrLevel, setQrLevel] = useState<'L' | 'M' | 'Q' | 'H'>('L');
    const [isError, setIsError] = useState<boolean>(false);

    const handleEncode = useCallback(() => {
        if (!inputText) return;
        const m = encodeToBooleanMatrix(inputText, qrLevel);
        setMatrix(m);
    }, [inputText, qrLevel]);

    useEffect(() => {
        handleEncode();
    }, [handleEncode]);

    const toggleCell = (x: number, y: number) => {
        setMatrix(prev => {
            if (y < 0 || y >= prev.length || x < 0 || x >= prev[y].length) return prev;
            const copy = structuredClone(prev);
            copy[y][x] = !copy[y][x];
            return copy;
        });
    };

    useEffect(() => {
        const decoder = new Decoder();
        try {
            const decoded = decoder.decodeBooleanArray(matrix);
            const bytes = decoded.getRawBytes();
            const hexString = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
            const text = decoded.getText();
            setDecodedHex(hexString);
            setDecodedText(text);
            setIsError(false);
        } catch (error) {
            setDecodedText(String(error));
            setDecodedHex("");
            setIsError(true);
        }
    }, [matrix]);

    const saveImage = (scale: number) => {
        const size = matrix.length;
        if (!size) return;

        const padding = 4;
        const totalSize = size + padding * 2;
        const canvas = document.createElement('canvas');
        canvas.width = totalSize * scale;
        canvas.height = totalSize * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        matrix.forEach((row, y) => {
            row.forEach((cell, x) => {
                ctx.fillStyle = cell ? 'black' : 'white';
                ctx.fillRect((x + padding) * scale, (y + padding) * scale, scale, scale);
            });
        });

        const link = document.createElement('a');
        link.download = 'qr-code.png';
        link.href = canvas.toDataURL();
        link.click();
    }

    return (
        <>
            <h1 className="title">QR Canvas</h1>
            <h2 className="introduction">
                QRコードのロバスト性の実験．<br />
                クリックして黒白を反転させることができます．<br />
                画像保存機能もあります．<br />
                関連記事は <Link href="/blog/qr-canvas">こちら</Link> から．<br />
                <div style={{ fontSize: '0.6em', color: 'gray' }}>
                    QRコードは株式会社デンソーウェーブの登録商標です
                </div>
            </h2>
            <div className="control-panel">
                <span>Text to Encode</span>
                <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Enter text to encode" className="input-field" />
                <span>エラー訂正レベル</span>
                <div className="qr-level-selector">
                    {(['L', 'M', 'Q', 'H'] as const).map(level => (
                        <label key={level} className="qr-level-option">
                            <input
                                type="radio"
                                name="qrLevel"
                                value={level}
                                checked={qrLevel === level}
                                onChange={() => setQrLevel(level)}
                            />
                            {level}
                        </label>
                    ))}
                </div>
                <button onClick={handleEncode} className="encode-button">Encode</button>
            </div>
            <div className="save-button-container">
                <div className="save-button" onClick={() => saveImage(1)}>
                    画像として保存 (1x)
                </div>
                <div className="save-button" onClick={() => saveImage(10)}>
                    画像として保存 (10x)
                </div>
            </div>
            <QRView matrix={matrix} onCellClick={toggleCell} />
            <div className="decoded-result-container">
                {isError ? (
                    <>
                        <span className="result-error-label">Error</span>
                        <p className="error-text">{decodedText}</p>
                    </>
                ) : (
                    <>
                        <span className="result-success-label">Success</span>
                        <span className="decoded-text-label">Decoded Text</span>
                        <p className="decoded-text">{decodedText}</p>
                        <span className="decoded-hex-label">Decoded Raw Data (Hex)</span>
                        <p className="decoded-hex">{decodedHex}</p>
                    </>
                )}
            </div>
        </>
    )
}
