import * as Phaser from "phaser"
import * as WebFont from "webfontloader";
import { ITEM_CONFIG, ACTOR_CONFIG } from "@shared/GhostTag/core";

export default class BootScene extends Phaser.Scene {
	constructor() {
		super({ key: 'BootScene' });
	}

	preload() {
		this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');
		for (let i = 1; i <= 14; i++) {
			this.load.image(`wall${i}`, `/ghost-tag/tiles/wall_${i}.png`);
		}
		const roadTypes = ['ud', 'udl', 'udlr', 'udr', 'ul', 'ulr', 'ur', 'dl', 'dlr', 'dr', 'lr', 'default'];
		for (const roadType of roadTypes) {
			this.load.image(`road_${roadType}`, `/ghost-tag/tiles/road_${roadType}.png`);
		}
		ITEM_CONFIG.forEach(({ spriteName }) => {
			this.load.image(spriteName, `/ghost-tag/items/${spriteName}.png`);
		});
		ACTOR_CONFIG.forEach(({ spriteName }) => {
			this.load.spritesheet(spriteName, `/ghost-tag/characters/${spriteName}.png`, { frameWidth: 40, frameHeight: 40 });
		});
		this.load.image('marker_you', '/ghost-tag/ui/marker_you.png');

		this.load.spritesheet('ghost_item_pick_up_effect', '/ghost-tag/effects/ghost_item_pick_up_effect.png', { frameWidth: 160, frameHeight: 160 });
		this.load.spritesheet('human_item_pick_up_effect', '/ghost-tag/effects/human_item_pick_up_effect.png', { frameWidth: 80, frameHeight: 80 });

		this.load.spritesheet('inventory', '/ghost-tag/ui/inventory.png', { frameWidth: 40, frameHeight: 40 });

		this.load.image('score_100', '/ghost-tag/effects/score_100.png');
		this.load.image('score_150', '/ghost-tag/effects/score_150.png');
		this.load.image('score_200', '/ghost-tag/effects/score_200.png');
		this.load.image('score_300', '/ghost-tag/effects/score_300.png');
		this.load.image('score_500', '/ghost-tag/effects/score_500.png');

		this.load.audio('boost', '/ghost-tag/sounds/boost.wav');
		this.load.audio('item_get', '/ghost-tag/sounds/item_get.wav');
		this.load.audio('select', '/ghost-tag/sounds/select.wav');
		this.load.audio('stun', '/ghost-tag/sounds/stun.wav');
		this.load.audio('tag', '/ghost-tag/sounds/tag.wav');

		this.load.image('logo', '/ghost-tag/logo.png');
	}

	create() {
		WebFont.load({
			google: {
				families: ['Press Start 2P', 'DotGothic16']
			},
			active: () => {
				this.scene.start('TitleScene');
			},
			inactive: () => {
				console.warn('Font load failed.')
				this.scene.start('TitleScene');
			},
			timeout: 3000
		});
	}
}