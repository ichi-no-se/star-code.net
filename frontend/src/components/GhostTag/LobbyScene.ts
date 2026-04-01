import * as Phaser from "phaser"
import { Socket, io } from "socket.io-client";
import { ROOM_CONFIG, FONT_FAMILY_EN, FONT_FAMILY_JA, WIDTH, HEIGHT } from "@shared/GhostTag/core";

export default class LobbyScene extends Phaser.Scene {
    private socket: Socket | null = null;
    private roomButtons: Map<string, Phaser.GameObjects.Text> = new Map();
    private keyEsc?: Phaser.Input.Keyboard.Key;

    constructor() {
        super({ key: 'LobbyScene' });
    }

    create() {
        this.keyEsc = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.keyEsc?.on('down', () => {
            this.cameras.main.fadeOut(100, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('TitleScene');
            });
        });
        this.cameras.main.fadeIn(100, 0, 0, 0);
        this.socket = this.registry.get('socket') as Socket;
        if (!this.socket) {
            const url = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001') + '/ghost-tag';
            const socket = io(url, { transports: ['websocket'] });
            this.registry.set('socket', socket);
            this.socket = socket;
        }
        this.add.text(WIDTH / 2, 80, 'Lobby', { fontFamily: FONT_FAMILY_EN, fontSize: '96px', color: '#eee' }).setOrigin(0.5, 0.5);

        ROOM_CONFIG.forEach(({ id, name }, index) => {
            const y = 220 + index * 120;

            const textObject = this.add.text(WIDTH / 2, y, `${name} (00 Players)`, { fontFamily: FONT_FAMILY_EN, fontSize: '36px', color: '#eee' }).setOrigin(0.5, 0.5).setDepth(1);

            const graphics = this.add.graphics();

            const buttonWidth = 800;
            const buttonHeight = 80;
            const drawButton = (color: number, alpha: number, lineWeight: number) => {
                graphics.clear();
                graphics.lineStyle(lineWeight, color, alpha);
                graphics.fillStyle(0x000000, alpha);
                graphics.strokeRect(WIDTH / 2 - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
                graphics.fillRect(WIDTH / 2 - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
            };
            drawButton(0xeeeeee, 0.5, 4);

            const hitArea = new Phaser.Geom.Rectangle(
                (textObject.width / 2) - (buttonWidth / 2),
                (textObject.height / 2) - (buttonHeight / 2),
                buttonWidth,
                buttonHeight
            );
            textObject.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
            if (textObject.input) {
                textObject.input.cursor = 'pointer';
            }
            textObject.on('pointerover', () => {
                drawButton(0x00eeef, 0.7, 6);
                textObject.setColor('#0ff');
            });
            textObject.on('pointerout', () => {
                drawButton(0xeeeeee, 0.5, 4);
                textObject.setColor('#eee');
            });
            textObject.on('pointerdown', () => {
                this.sound.play('select');
                this.cameras.main.fadeOut(100, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.start('MainScene', { roomId: id });
                });
            });
            this.roomButtons.set(id, textObject);
        });

        const buttonWidth = 400;
        const buttonHeight = 60;
        const buttonY = HEIGHT - 200;

        const backText = this.add.text(WIDTH / 2, buttonY, 'タイトルに戻る', {
            fontFamily: FONT_FAMILY_JA,
            fontSize: '24px',
            color: '#eee'
        }).setOrigin(0.5, 0.5).setDepth(1);

        const buttonBackground = this.add.graphics();
        const drawButton = (color: number, alpha: number, lineWeight: number) => {
            buttonBackground.clear();
            buttonBackground.lineStyle(lineWeight, color, alpha);
            buttonBackground.fillStyle(0x000000, alpha);
            buttonBackground.strokeRect(WIDTH / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
            buttonBackground.fillRect(WIDTH / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
        };
        drawButton(0xeeeeee, 0.5, 4);

        const hitArea = new Phaser.Geom.Rectangle(
            (backText.width / 2) - (buttonWidth / 2),
            (backText.height / 2) - (buttonHeight / 2),
            buttonWidth,
            buttonHeight
        );

        backText.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        if (backText.input) {
            backText.input.cursor = 'pointer';
        }

        backText.on('pointerover', () => {
            drawButton(0x00eeef, 0.7, 6);
            backText.setColor('#0ee');
        });

        backText.on('pointerout', () => {
            drawButton(0xeeeeee, 0.5, 4);
            backText.setColor('#eee');
        });

        backText.on('pointerdown', () => {
            this.sound.play('select');
            this.cameras.main.fadeOut(100, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('TitleScene');
            });
        });

        this.events.once('update', () => this.postCreate());
    }

    postCreate() {
        if (!this.socket) return;
        this.socket.on('roomStatsUpdate', (stats: { id: string; playerCount: number }[]) => {
            stats.forEach(room => {
                const button = this.roomButtons.get(room.id);
                if (button) {
                    const { name } = ROOM_CONFIG.find(config => config.id === room.id) || { name: "Unknown" };
                    button.setText(`${name} (${room.playerCount.toString().padStart(2, '0')} Players)`);
                }
            });
        });
        this.events.once('shutdown', () => {
            this.socket?.off('roomStatsUpdate');
        });
        this.socket.emit('connectLobby');
        this.socket.emit('requestRoomStats');
    }
}
