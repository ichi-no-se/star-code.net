import * as Phaser from 'phaser';
import { WIDTH, ACTOR_CONFIG, ActorRole, DIRECTION_CONFIG, Direction, FONT_FAMILY_JA } from "@shared/GhostTag/core";

export default class TitleScene extends Phaser.Scene {
	constructor() {
		super({ key: 'TitleScene' });
	}
	create() {
		this.cameras.main.fadeIn(100, 0, 0, 0);
		const logo = this.add.sprite(WIDTH / 2, 330, 'logo').setOrigin(0.5, 0.5);
		logo.setScale(16);

		this.tweens.add({
			targets: logo,
			y: 360,
			duration: 2000,
			ease: 'Sine.easeInOut',
			yoyo: true,
			loop: -1
		})

		const charHuman1 = this.add.sprite(WIDTH / 6, 250, ACTOR_CONFIG[ActorRole.HUMAN_1].spriteName).setOrigin(0.5, 0.5);
		const frameRight = DIRECTION_CONFIG[Direction.RIGHT].frameOffset
		charHuman1.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(ACTOR_CONFIG[ActorRole.HUMAN_1].spriteName, { start: frameRight, end: frameRight + 1 }),
			frameRate: 1,
			repeat: -1
		});
		charHuman1.play('walk');
		charHuman1.setScale(8);

		const charHuman2 = this.add.sprite(WIDTH / 6 + 150, 550, ACTOR_CONFIG[ActorRole.HUMAN_2].spriteName).setOrigin(0.5, 0.5);
		charHuman2.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(ACTOR_CONFIG[ActorRole.HUMAN_2].spriteName, { start: frameRight, end: frameRight + 1 }),
			frameRate: 1,
			repeat: -1
		});
		charHuman2.play('walk');
		charHuman2.setScale(8);


		const charGhost1 = this.add.sprite(WIDTH / 6 * 5, 250, ACTOR_CONFIG[ActorRole.GHOST_1].spriteName).setOrigin(0.5, 0.5);
		const frameLeft = DIRECTION_CONFIG[Direction.LEFT].frameOffset
		charGhost1.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(ACTOR_CONFIG[ActorRole.GHOST_1].spriteName, { start: frameLeft, end: frameLeft + 1 }),
			frameRate: 1,
			repeat: -1
		});
		charGhost1.play('walk');
		charGhost1.setScale(8);

		const charGhost2 = this.add.sprite(WIDTH / 6 * 5 - 150, 550, ACTOR_CONFIG[ActorRole.GHOST_2].spriteName).setOrigin(0.5, 0.5);
		charGhost2.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(ACTOR_CONFIG[ActorRole.GHOST_2].spriteName, { start: frameLeft, end: frameLeft + 1 }),
			frameRate: 1,
			repeat: -1
		});
		charGhost2.play('walk');
		charGhost2.setScale(8);

		const menuItems = [
			{ text: 'あそぶ', scene: 'LobbyScene', y: 750 , buttonWidth: 600, buttonHeight: 120,fontSize: '64px' },
			{ text: 'あそびかた', scene: 'HowToPlayScene', y: 900, buttonWidth: 600, buttonHeight: 120, fontSize: '64px' },
			{text: 'クレジット', scene: 'CreditScene', y: 1010, buttonWidth: 200, buttonHeight: 50, fontSize: '32px' }
		];

		menuItems.forEach(({ text, scene, y, buttonWidth, buttonHeight, fontSize }) => {
			const textObject = this.add.text(WIDTH / 2, y, text, { fontFamily: FONT_FAMILY_JA, fontSize: fontSize, color: '#fff' }).setOrigin(0.5, 0.5).setDepth(1); // 手前に置く
			const buttonBackground = this.add.graphics();
			const drawButton = (color: number, alpha: number, lineWeight: number) => {
				buttonBackground.clear();
				buttonBackground.lineStyle(lineWeight, color, alpha);
				buttonBackground.fillStyle(0x000000, alpha);
				buttonBackground.strokeRect(WIDTH / 2 - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
				buttonBackground.fillRect(WIDTH / 2 - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
			};
			drawButton(0xffffff, 0.5, 4);

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
				this.sound.play('select');
				drawButton(0x00ffff, 0.7, 6);
				textObject.setColor('#0ff');
			});
			textObject.on('pointerout', () => {
				drawButton(0xffffff, 0.5, 4);
				textObject.setColor('#fff');
			});
			textObject.on('pointerdown', () => {
				this.sound.play('select');
				this.cameras.main.fadeOut(100, 0, 0, 0);
				this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
					this.scene.start(scene);
				});
			});
		});
	}
}