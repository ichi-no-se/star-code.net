"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function KanjiPuzzle2Page() {
    
    return (
        <>
            <h1>スーパー和同開珎ソルバー</h1>
            <div className="description">
                和同開珎を繋げてみたくなった．<br />
                関連記事は <Link href="/blog/kanji-puzzle">こちら</Link>から．
            </div>
            <div className="license">
                本 Web アプリでは，<Link href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project">EDICT</Link> の <Link href="https://www.edrdg.org/edrdg/licence.html">ライセンス</Link> に基づき，<Link href="https://github.com/scriptin/jmdict-simplified">jmdict-simplified</Link> の JMdict データを加工して使用しています．
            </div>
        </>
    )
}
