import * as Phaser from 'phaser';
import { WIDTH, HEIGHT, FONT_FAMILY_JA,FONT_FAMILY_EN } from "@shared/GhostTag/core";

export default class CreditScene extends Phaser.Scene {
	constructor() {
		super({ key: 'CreditScene' });
	}

	create() {
		this.cameras.main.fadeIn(100, 0, 0, 0);
		this.add.text(WIDTH / 2, 80, 'クレジット', { fontFamily: FONT_FAMILY_JA, fontSize: '96px', color: '#fff' }).setOrigin(0.5, 0.5);

		const credits = [
			"【制作】",
			"プログラム：一之瀬このみ",
			"デザイン：一之瀬このみ",
			"サウンド：一之瀬このみ（jsfxr を使用）",
			"",
			"【使用技術】",
			"Phaser 3",
			"Socket.io",
			"",
			"【フォント】",
			"DotGothic16",
			"Press Start 2P",
			"",
			"【スペシャル・サンクス】",
			"リメイク元を共に作った仲間たち",
		];

		credits.forEach((line, index) => {
			const y = 180 + index * 50;
			let fontSize = '32px';
			let fontFamily = FONT_FAMILY_JA;
			if (line.includes('【')) {
				fontSize = '36px';
			}
			if(line === "Press Start 2P") {
				fontFamily = FONT_FAMILY_EN;
			}
			this.add.text(WIDTH / 2, y, line, { fontFamily: fontFamily, fontSize: fontSize, color: '#fff' }).setOrigin(0.5, 0.5);
		});

		const buttonWidth = 600;
		const buttonHeight = 100;
		const buttonY = HEIGHT - 100;

		const backText = this.add.text(WIDTH / 2, buttonY, 'タイトルに戻る', {
			fontFamily: FONT_FAMILY_JA,
			fontSize: '64px',
			color: '#fff'
		}).setOrigin(0.5, 0.5).setDepth(1);

		const buttonBackground = this.add.graphics();
		const drawButton = (color: number, alpha: number, lineWeight: number) => {
			buttonBackground.clear();
			buttonBackground.lineStyle(lineWeight, color, alpha);
			buttonBackground.fillStyle(0x000000, alpha);
			buttonBackground.strokeRect(WIDTH / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
			buttonBackground.fillRect(WIDTH / 2 - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight);
		};
		drawButton(0xffffff, 0.5, 4);

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
			this.sound.play('select');
			drawButton(0x00ffff, 0.7, 6);
			backText.setColor('#0ff');
		});

		backText.on('pointerout', () => {
			drawButton(0xffffff, 0.5, 4);
			backText.setColor('#fff');
		});

		backText.on('pointerdown', () => {
			this.sound.play('select');
			this.cameras.main.fadeOut(100, 0, 0, 0);
			this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
				this.scene.start('TitleScene');
			});
		});
	}
}