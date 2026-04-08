"use client";
import Link from 'next/link';

export default function QRCanvas() {
    return(
        <>
            <h1 className="title">QR Canvas</h1>
            <h2 className="introduction">
                QRコード®のロバスト性の実験．<br />
                （QRコード®は<Link href="https://www.denso-wave.com">株式会社デンソーウェーブ</Link>の登録商標です）
            </h2>
        </>
    )
}
