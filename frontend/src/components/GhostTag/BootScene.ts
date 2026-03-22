import * as Phaser from "phaser"
import * as WebFont from "webfontloader";

export default class BootScene extends Phaser.Scene {
	constructor() {
		super({ key: 'BootScene' });
	}

	preload() {
		this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
	}

	create() {
		WebFont.load({
			google: {
				families: ['Press Start 2P', 'DotGothic16']
			},
			active: () => {
				this.scene.start('LobbyScene');
			},
			inactive: () => {
				console.warn('Font load failed.')
				this.scene.start('LobbyScene');
			},
			timeout: 3000
		});
	}
}