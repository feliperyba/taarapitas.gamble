import { Sprite, Graphics, Container, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import { Char } from '../char';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { createGradientTextStyle } from '../../pixi-helpers';

const COLOR_CREDITS_PANEL_BG = 0x140806;
const COLOR_CREDITS_PANEL_BORDER = 0xa37139;
const COLOR_CREDITS_PANEL_TRIM = 0xf3d3a0;

const COIN_MAX_SIZE = 52;
const COIN_CREDITS_GAP = 14;
const CREDITS_TEXT_PADDING = 100;
const CREDITS_TEXT_MIN_SCALE = 0.76;

const DURATION_CREDITS_ANIM = 0.5;

export class CreditsDisplay {
	public creditsText: Text = new Text({ text: '' });
	private readonly creditsDisplayState = { value: 0 };
	private centerFn: () => void = () => {};
	private previousCredits = 0;
	private coin!: Sprite;

	private readonly panelTitleStyle = createGradientTextStyle({
		fillStops: ['#fff5cf', '#c18f40'],
		fontSize: 20,
		strokeWidth: 3,
		letterSpacing: 1
	});

	public setup(parent: Container, char: Char, style: TextStyle): void {
		const creditsCluster = SCENE_LAYOUT.game.creditsCluster;
		const panel = new Graphics();
		const trim = new Graphics();
		const label = new Text({ text: 'CREDITS', style: this.panelTitleStyle });
		this.coin = new Sprite(getTexture('assets/coin.png'));

		panel
			.roundRect(creditsCluster.x, creditsCluster.y, creditsCluster.width, creditsCluster.height, 22)
			.fill({ color: COLOR_CREDITS_PANEL_BG, alpha: 0.82 })
			.stroke({ color: COLOR_CREDITS_PANEL_BORDER, alpha: 0.22, width: 3 });
		trim.roundRect(creditsCluster.x + 12, creditsCluster.y + 10, creditsCluster.width - 24, 16, 8).fill({ color: COLOR_CREDITS_PANEL_TRIM, alpha: 0.07 });

		label.anchor.set(0.5, 0);
		label.x = creditsCluster.centerX;
		label.y = creditsCluster.y + 4;

		this.coin.anchor.set(0.5);
		this.coin.y = creditsCluster.centerY + 12;
		this.coin.scale.x = this.coin.scale.y = Math.min(COIN_MAX_SIZE / this.coin.width, COIN_MAX_SIZE / this.coin.height);

		this.creditsText = new Text({ text: char.credits.toString(), style: style });
		this.creditsText.anchor.set(0, 0.5);
		this.creditsText.y = creditsCluster.centerY + 10;

		this.centerFn = () => {
			this.fitTextToWidth(this.creditsText, creditsCluster.width - CREDITS_TEXT_PADDING, CREDITS_TEXT_MIN_SCALE);
			const gap = COIN_CREDITS_GAP;
			const coinWidth = this.coin.width;
			const totalWidth = coinWidth + gap + this.creditsText.width;
			this.coin.x = creditsCluster.centerX - totalWidth / 2 + coinWidth / 2;
			this.creditsText.x = this.coin.x + coinWidth / 2 + gap;
		};
		this.centerFn();

		parent.addChild(panel);
		parent.addChild(trim);
		parent.addChild(label);
		parent.addChild(this.coin);
		parent.addChild(this.creditsText);
	}

	public updateCredits(currentCredits: number): void {
		if (currentCredits !== this.previousCredits) {
			gsap.to(this.creditsDisplayState, {
				value: currentCredits,
				duration: DURATION_CREDITS_ANIM,
				ease: 'power2.out',
				overwrite: true,
				onUpdate: () => {
					this.creditsText.text = Math.round(this.creditsDisplayState.value).toString();
					this.centerFn();
				}
			});
			this.previousCredits = currentCredits;
		}
	}

	public initCredits(value: number): void {
		this.creditsDisplayState.value = value;
		this.previousCredits = value;
	}

	public destroy(): void {
		gsap.killTweensOf(this.creditsDisplayState);
	}

	private fitTextToWidth(text: Text, maxWidth: number, minScale: number): void {
		text.scale.set(1);
		if (text.width > maxWidth) {
			const nextScale = Math.max(minScale, maxWidth / text.width);
			text.scale.set(nextScale);
		}
	}
}
