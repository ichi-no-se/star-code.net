'use client';

import { useEffect, useRef } from "react";;
import * as Phaser from "phaser"
import { WIDTH, HEIGHT } from "@shared/GhostTag/core";
import BootScene from "./BootScene";
import LobbyScene from "./LobbyScene";
import MainScene from "./MainScene";
import ResultScene from "./ResultScene";

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
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: WIDTH,
                height: HEIGHT,
            },
            parent: containerRef.current,
            scene: [BootScene, LobbyScene, MainScene, ResultScene],
            pixelArt: true,
            antialias: false,
            roundPixels: true
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
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#000',
        position: 'absolute',
        top: 0,
        left: 0,
    };

    return <div ref={containerRef} style={containerStyle} />;
}
