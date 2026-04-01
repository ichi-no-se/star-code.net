import * as Phaser from "phaser"
import { FONT_FAMILY_EN, ActorType, WIDTH, GameOverEvent, ACTOR_CONFIG, DIRECTION_CONFIG } from "@shared/GhostTag/core";

export default class ResultScene extends Phaser.Scene {
	private roomId!: string;
	private scores!: GameOverEvent['scores'];

	constructor() {
		super({ key: 'ResultScene' });
	}
	init(data: { roomId: string, scores: GameOverEvent['scores'] }) {
		this.roomId = data.roomId;
		this.scores = data.scores;
	}
	create() {
		this.cameras.main.fadeIn(100, 0, 0, 0);

		const humanScore = this.scores.filter(score => ACTOR_CONFIG[score.role].type === ActorType.HUMAN).reduce((sum, score) => sum + score.score, 0);
		const ghostScore = this.scores.filter(score => ACTOR_CONFIG[score.role].type === ActorType.GHOST).reduce((sum, score) => sum + score.score, 0);
		const humanScoreText = humanScore.toString().padStart(5, '0');
		const ghostScoreText = ghostScore.toString().padStart(5, '0');
		let resultText = '';
		const humanColor = '#faa';
		const ghostColor = '#aaf';
		let color = '#ddd';

		if (humanScore > ghostScore) {
			resultText = 'Humans Win!';
			color = humanColor;
		} else if (ghostScore > humanScore) {
			resultText = 'Ghosts Win!';
			color = ghostColor;
		} else {
			resultText = "It's a Tie!";
			color = '#ddd';
		}
		
		this.add.text(WIDTH / 2, 100, 'Game Over', { fontSize: '96px', color: '#eee', fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);
		this.add.text(WIDTH / 2, 250, resultText, { fontSize: '80px', color: color, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);

		this.add.text(WIDTH / 4, 360, `Human Score`, { fontSize: '32px', color: humanColor, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);
		this.add.text(WIDTH / 4, 440, humanScoreText, { fontSize: '64px', color: humanColor, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);
		this.add.text(WIDTH / 4 * 3, 360, `Ghost Score`, { fontSize: '32px', color: ghostColor, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);
		this.add.text(WIDTH / 4 * 3, 440, ghostScoreText, { fontSize: '64px', color: ghostColor, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);

		const human1Score = this.scores.find(score => score.role === 0)?.score || 0;
		const human2Score = this.scores.find(score => score.role === 1)?.score || 0;
		const ghost1Score = this.scores.find(score => score.role === 2)?.score || 0;
		const ghost2Score = this.scores.find(score => score.role === 3)?.score || 0;

		const human1ScoreText = human1Score.toString().padStart(5, '0');
		const human2ScoreText = human2Score.toString().padStart(5, '0');
		const ghost1ScoreText = ghost1Score.toString().padStart(5, '0');
		const ghost2ScoreText = ghost2Score.toString().padStart(5, '0');

		this.add.text(WIDTH / 4, 600, human1ScoreText, { fontSize: '48px', color: humanColor, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);
		this.add.text(WIDTH / 4, 800, human2ScoreText, { fontSize: '48px', color: humanColor, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);
		this.add.text(WIDTH / 4 * 3, 600, ghost1ScoreText, { fontSize: '48px', color: ghostColor, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);
		this.add.text(WIDTH / 4 * 3, 800, ghost2ScoreText, { fontSize: '48px', color: ghostColor, fontFamily: FONT_FAMILY_EN }).setOrigin(0.5);

		const positions = [
			{ x: WIDTH / 2 - 700, y: 600 },
			{ x: WIDTH / 2 - 700, y: 800 },
			{ x: WIDTH / 2 + 700, y: 600 },
			{ x: WIDTH / 2 + 700, y: 800 },
		];

		ACTOR_CONFIG.forEach(({ spriteName, iconDirection }, index) => {
			const sprite = this.add.sprite(positions[index].x, positions[index].y, spriteName)
				.setOrigin(0.5)
				.setScale(4);
			sprite.anims.create({
				key: 'walk',
				frames: this.anims.generateFrameNumbers(spriteName, { start: DIRECTION_CONFIG[iconDirection].frameOffset, end: DIRECTION_CONFIG[iconDirection].frameOffset + 1 }),
				frameRate: 1,
				repeat: -1
			});
			sprite.play('walk');
		});

		const menuItems = [
			{ text: 'Back to Room', scene: 'MainScene', y: 670 },
			{ text: 'Back to Lobby', scene: 'LobbyScene', y: 810 },
			{ text: 'Back to Title', scene: 'TitleScene', y: 950 }
		]

		const buttonWidth = 500;
		const buttonHeight = 100;

		menuItems.forEach(({ text, scene, y }) => {
			const textObject = this.add.text(WIDTH / 2, y, text, { fontSize: '32px', color: '#eee', fontFamily: FONT_FAMILY_EN }).setOrigin(0.5, 0.5).setDepth(1);
			const buttonBackground = this.add.graphics();
			const drawButton = (color: number, alpha: number, lineWeight: number) => {
				buttonBackground.clear();
				buttonBackground.lineStyle(lineWeight, color, alpha);
				buttonBackground.fillStyle(0x000000, alpha);
				buttonBackground.strokeRect(WIDTH / 2 - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
				buttonBackground.fillRect(WIDTH / 2 - buttonWidth / 2, y - buttonHeight / 2, buttonWidth, buttonHeight);
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
				drawButton(0x00ffff, 0.7, 6);
				textObject.setColor('#0ee');
			});
			textObject.on('pointerout', () => {
				drawButton(0xeeeeee, 0.5, 4);
				textObject.setColor('#eee');
			});
			textObject.on('pointerdown', () => {
				this.sound.play('select');
				this.cameras.main.fadeOut(100, 0, 0, 0);
				this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
					if (scene === 'MainScene') {
						this.scene.start(scene, { roomId: this.roomId });
					} else {
						this.scene.start(scene);
					}
				});
			});
		});
	}
}