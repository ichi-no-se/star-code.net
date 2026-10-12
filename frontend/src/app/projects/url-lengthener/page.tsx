"use client";
import { useState } from "react";
import { encode } from "@/lib/URLLengthener";
import "@styles/oblate.css";

export default function UrlLengthenerPage() {
    const [inputUrl, setInputUrl] = useState("");
    const [shortenedUrl, setShortenedUrl] = useState("");
    const [copied, setCopied] = useState(false);

    const generateShortenedUrl = () => {
        const payload = encode(inputUrl);
        setShortenedUrl(`${process.env.NEXT_PUBLIC_SITE_URL}/r/${payload}`);
        setCopied(false);
    };

    const handleCopy = () => {
        if (!shortenedUrl) return;
        navigator.clipboard.writeText(shortenedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <>
            <h1 className="title">逆短縮 URL</h1>
            <div className="container">
                <div className="input-container">
                    <input type="text"
                        placeholder="https://example.com"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="input-area"
                    />
                    <button onClick={generateShortenedUrl} className="input-button">逆短縮 URL を生成</button>
                </div>
                <div className="output-container">
                    {shortenedUrl && (
                        <>
                            <div className="output-text">
                                <a href={shortenedUrl} target="_blank" rel="noopener noreferrer">{shortenedUrl}</a>
                            </div>
                            <button onClick={handleCopy} className="output-button">{copied ? "コピーしました" : "コピーする"}</button>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}