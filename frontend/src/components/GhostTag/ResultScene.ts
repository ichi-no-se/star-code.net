import * as Phaser from "phaser"
import { ActorType, WIDTH, GameOverEvent, ACTOR_CONFIG } from "@shared/GhostTag/core";

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
		this.cameras.main.fadeIn(200, 0, 0, 0);

		const humanScore = this.scores.filter(score => ACTOR_CONFIG[score.role].type === ActorType.HUMAN).reduce((sum, score) => sum + score.score, 0);
		const ghostScore = this.scores.filter(score => ACTOR_CONFIG[score.role].type === ActorType.GHOST).reduce((sum, score) => sum + score.score, 0);
		let resultText = '';
		if (humanScore > ghostScore) {
			resultText = 'Humans Win!';
		} else if (ghostScore > humanScore) {
			resultText = 'Ghosts Win!';
		} else {
			resultText = "It's a Tie!";
		}
		let color = '#fff';
		if (resultText === 'Humans Win!') color = '#8f8';
		else if (resultText === 'Ghosts Win!') color = '#f88';

		this.add.text(WIDTH / 2, 100, 'Game Over', { fontSize: '48px', color: '#fff' }).setOrigin(0.5);
		this.add.text(WIDTH / 2, 150, resultText, { fontSize: '40px', color: color }).setOrigin(0.5);

		this.add.text(WIDTH / 2 - 300, 200, `Human Score: ${humanScore}`, { fontSize: '32px', color: '#8f8' }).setOrigin(0.5);
		this.add.text(WIDTH / 2 + 300, 200, `Ghost Score: ${ghostScore}`, { fontSize: '32px', color: '#f88' }).setOrigin(0.5);

		this.add.text(WIDTH / 2 - 300, 300, `HUMAN_1: ${this.scores.find(score => score.role === 0)?.score || 0}`, { fontSize: '24px', color: '#8f8' }).setOrigin(0.5);
		this.add.text(WIDTH / 2 - 100, 300, `HUMAN_2: ${this.scores.find(score => score.role === 1)?.score || 0}`, { fontSize: '24px', color: '#8f8' }).setOrigin(0.5);
		this.add.text(WIDTH / 2 + 100, 300, `GHOST_1: ${this.scores.find(score => score.role === 2)?.score || 0}`, { fontSize: '24px', color: '#f88' }).setOrigin(0.5);
		this.add.text(WIDTH / 2 + 300, 300, `GHOST_2: ${this.scores.find(score => score.role === 3)?.score || 0}`, { fontSize: '24px', color: '#f88' }).setOrigin(0.5);

		this.add.text(WIDTH / 2, 400, 'Back to Room', { fontSize: '24px', color: '#0ff' })
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => {
				this.input.enabled = false;
				this.cameras.main.fadeOut(100, 0, 0, 0);
				this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
					this.scene.start('MainScene', { roomId: this.roomId });
				});
			});

		this.add.text(WIDTH / 2, 450, 'Back to Lobby', { fontSize: '24px', color: '#0ff' })
			.setOrigin(0.5)
			.setInteractive()
			.on('pointerdown', () => {
				this.input.enabled = false;
				this.cameras.main.fadeOut(100, 0, 0, 0);
				this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
					this.scene.start('LobbyScene');
				});
			});
	}

}