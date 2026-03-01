'use client';

import { useEffect, useRef } from "react";;
import * as Phaser from "phaser"
import LobbyScene from "./LobbyScene";
import MainScene from "./MainScene";

export default function GameContainer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
        }

        if (gameRef.current) {
            gameRef.current.destroy(true);
            gameRef.current = null;
        }

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: containerRef.current,
            scene: [LobbyScene, MainScene],
        };
        gameRef.current = new Phaser.Game(config);

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    const containerStyle: React.CSSProperties = {
        width: '800px',
        height: '600px',
        margin: '20px auto 20px auto',
        // border: '4px solid #333',
        // borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#000',
    };

    return <div ref={containerRef} style={containerStyle} />;
}
