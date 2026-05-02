import { Container, Sprite, Text } from 'pixi.js';
import { Button } from '../model/gui-module/button';
import { createGradientTextStyle } from '../model/pixi-helpers';
import { getTexture } from '../rendering/assets';
import { DESIGN_HEIGHT, DESIGN_WIDTH, SCENE_LAYOUT } from '../rendering/viewport';

const LOSE_TITLE_FONT_SIZE = 36;
const LOSE_SUBTITLE_FONT_SIZE = 22;
const TEXT_STROKE_WIDTH = 5;
const DROP_SHADOW_COLOR = '#B2240C';
const DROP_SHADOW_BLUR = 2;
const DROP_SHADOW_DISTANCE = 3;
const WORD_WRAP_WIDTH = 400;
const LOSE_TEXT_Y = 128;
const SURVIVAL_TEXT_Y = 238;
const RESTART_BTN_X_OFFSET = 124;
const RESTART_BTN_Y = 352;

export class GameOverOverlay {
	public readonly container = new Container();
	private initialized = false;
	private loseText!: Text;
	private survivalText!: Text;
	private restartCallback: (() => void) | null = null;

	constructor() {
		this.container.visible = false;
		this.container.x = DESIGN_WIDTH / 2 - SCENE_LAYOUT.overlay.width / 2;
		this.container.y = DESIGN_HEIGHT / 2 - SCENE_LAYOUT.overlay.height / 2;
	}

	setup(parent: Container): void {
		if (this.initialized) return;
		this.initialized = true;

		const titleStyle = createGradientTextStyle({
			fillStops: ['#ffffff', '#ff0000'],
			fontSize: LOSE_TITLE_FONT_SIZE,
			strokeWidth: TEXT_STROKE_WIDTH,
			dropShadowColor: DROP_SHADOW_COLOR,
			dropShadowBlur: DROP_SHADOW_BLUR,
			dropShadowDistance: DROP_SHADOW_DISTANCE,
			wordWrap: true,
			wordWrapWidth: WORD_WRAP_WIDTH,
		});

		const subtitleStyle = createGradientTextStyle({
			fillStops: ['#ffffff', '#ff0000'],
			fontSize: LOSE_SUBTITLE_FONT_SIZE,
			strokeWidth: TEXT_STROKE_WIDTH,
			dropShadowColor: DROP_SHADOW_COLOR,
			dropShadowBlur: DROP_SHADOW_BLUR,
			dropShadowDistance: DROP_SHADOW_DISTANCE,
			wordWrap: true,
			wordWrapWidth: WORD_WRAP_WIDTH,
		});

		const background = new Sprite(getTexture('assets/lose_msg.png'));
		background.width = SCENE_LAYOUT.overlay.width;
		background.height = SCENE_LAYOUT.overlay.height;

		this.loseText = new Text({ text: '', style: titleStyle });
		this.loseText.anchor.set(0.5, 0);
		this.loseText.x = SCENE_LAYOUT.overlay.width / 2;
		this.loseText.y = LOSE_TEXT_Y;

		this.survivalText = new Text({ text: '', style: subtitleStyle });
		this.survivalText.anchor.set(0.5, 0);
		this.survivalText.x = SCENE_LAYOUT.overlay.width / 2;
		this.survivalText.y = SURVIVAL_TEXT_Y;

		const endBtn = new Button(
			96,
			248,
			getTexture('assets/button.png'),
			getTexture('assets/button-HOVER.png'),
			getTexture('assets/button-PUSH.png'),
			'Restart',
			subtitleStyle
		);
		endBtn.btnContainer.x = SCENE_LAYOUT.overlay.width / 2 - RESTART_BTN_X_OFFSET;
		endBtn.btnContainer.y = RESTART_BTN_Y;
		endBtn.btnContainer.on('pointerdown', () => {
			this.restartCallback?.();
		});

		this.container.addChild(background);
		this.container.addChild(this.loseText);
		this.container.addChild(this.survivalText);
		this.container.addChild(endBtn.btnContainer);
		parent.addChild(this.container);
	}

	showDeath(message: string): void {
		if (this.container.visible) return;
		this.loseText.text = 'You Lose!';
		this.survivalText.text = message;
		this.container.visible = true;
	}

	hide(): void {
		this.container.visible = false;
	}

	onRestart(callback: () => void): void {
		this.restartCallback = callback;
	}

	destroy(): void {
		this.container.destroy({ children: true });
		this.restartCallback = null;
	}
}
