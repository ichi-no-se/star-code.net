import * as Phaser from 'phaser';
import { HEIGHT, WIDTH, FONT_FAMILY_JA, ACTOR_CONFIG, ActorRole, DIRECTION_CONFIG, Direction } from "@shared/GhostTag/core";

export default class HowToPlayScene extends Phaser.Scene {
	constructor() {
		super({ key: 'HowToPlayScene' });
	}

	create() {
		this.cameras.main.fadeIn(100, 0, 0, 0);
		this.add.text(WIDTH / 2, 80, 'あそびかた', { fontFamily: FONT_FAMILY_JA, fontSize: '96px', color: '#eee' }).setOrigin(0.5, 0.5);
		this.add.text(50, 150, '操作方法', { fontFamily: FONT_FAMILY_JA, fontSize: '48px', color: '#eee' });
		this.add.text(100, 220, '移動：ＷＡＳＤ / 方向キー', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' });
		this.add.text(100, 270, 'アイテム使用：スペースキー / エンターキー', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' });

		this.add.text(50, 330, 'ルール', { fontFamily: FONT_FAMILY_JA, fontSize: '48px', color: '#eee' });
		this.add.text(100, 400, '人間：ゴーストを捕まえる（＋５００点）', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' });

		const charHuman1 = this.add.sprite(300, 520, ACTOR_CONFIG[ActorRole.HUMAN_1].spriteName).setOrigin(0.5, 0.5);
		const frameRight = DIRECTION_CONFIG[Direction.RIGHT].frameOffset
		charHuman1.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(ACTOR_CONFIG[ActorRole.HUMAN_1].spriteName, { start: frameRight, end: frameRight + 1 }),
			frameRate: 1,
			repeat: -1
		});
		charHuman1.play('walk');
		charHuman1.setScale(4);

		const charHuman2 = this.add.sprite(450, 520, ACTOR_CONFIG[ActorRole.HUMAN_2].spriteName).setOrigin(0.5, 0.5);
		charHuman2.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(ACTOR_CONFIG[ActorRole.HUMAN_2].spriteName, { start: frameRight, end: frameRight + 1 }),
			frameRate: 1,
			repeat: -1
		});
		charHuman2.play('walk');
		charHuman2.setScale(4);

		this.add.text(1100, 400, 'ゴースト：人間から逃げる', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' });

		const charGhost1 = this.add.sprite(1300, 520, ACTOR_CONFIG[ActorRole.GHOST_1].spriteName).setOrigin(0.5, 0.5);
		charGhost1.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(ACTOR_CONFIG[ActorRole.GHOST_1].spriteName, { start: frameRight, end: frameRight + 1 }),
			frameRate: 1,
			repeat: -1
		});
		charGhost1.play('walk');
		charGhost1.setScale(4);

		const charGhost2 = this.add.sprite(1450, 520, ACTOR_CONFIG[ActorRole.GHOST_2].spriteName).setOrigin(0.5, 0.5);
		charGhost2.anims.create({
			key: 'walk',
			frames: this.anims.generateFrameNumbers(ACTOR_CONFIG[ActorRole.GHOST_2].spriteName, { start: frameRight, end: frameRight + 1 }),
			frameRate: 1,
			repeat: -1
		});
		charGhost2.play('walk');
		charGhost2.setScale(4);

		this.add.text(50, 620, 'アイテム', { fontFamily: FONT_FAMILY_JA, fontSize: '48px', color: '#eee' });
		this.add.sprite(250, 750, 'item_speed_up').setScale(4).setOrigin(0.5, 0.5);
		this.add.text(250, 850, 'スピードアップ', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' }).setOrigin(0.5, 0.5);
		this.add.sprite(650, 750, 'item_stun').setScale(4).setOrigin(0.5, 0.5);
		this.add.text(650, 850, 'スタン', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' }).setOrigin(0.5, 0.5);
		this.add.text(450, 890, '（人間・ゴースト共通）', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' }).setOrigin(0.5, 0.5);
		this.add.sprite(1100, 750, 'item_score_candy').setScale(4).setOrigin(0.5, 0.5);
		this.add.sprite(1200, 750, 'item_score_chocolate').setScale(4).setOrigin(0.5, 0.5);
		this.add.sprite(1300, 750, 'item_score_donut').setScale(4).setOrigin(0.5, 0.5);
		this.add.sprite(1400, 750, 'item_score_special_candy').setScale(4).setOrigin(0.5, 0.5);
		this.add.sprite(1500, 750, 'item_score_special_chocolate').setScale(4).setOrigin(0.5, 0.5);
		this.add.sprite(1600, 750, 'item_score_special_donut').setScale(4).setOrigin(0.5, 0.5);
		this.add.text(1350, 850, 'スコアアイテム（＋１００・２００点）', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' }).setOrigin(0.5, 0.5);
		this.add.text(1350, 890, '（ゴースト専用）', { fontFamily: FONT_FAMILY_JA, fontSize: '32px', color: '#eee' }).setOrigin(0.5, 0.5);

		const buttonWidth = 600;
		const buttonHeight = 100;
		const buttonY = HEIGHT - 100;

		const backText = this.add.text(WIDTH / 2, buttonY, 'タイトルに戻る', {
			fontFamily: FONT_FAMILY_JA,
			fontSize: '64px',
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
	}
}