import { Sprite, Graphics, Container, Text, Rectangle } from 'pixi.js';
import { gsap } from 'gsap';
import { Char } from '../char';
import { GameLogicService } from '../../../services/game-logic.service';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { createGradientTextStyle } from '../../pixi-helpers';

const COLOR_PANEL_BG = 0x150806;
const COLOR_PANEL_BORDER = 0x94632f;
const COLOR_PANEL_INNER_BG = 0x090302;
const COLOR_PANEL_INNER_BORDER = 0xe3bb73;
const COLOR_PANEL_TRIM = 0xf7d7a5;
const COLOR_POTION_AURA = 0x8b3d08;

const POTION_ICON_X = 76;
const POTION_ICON_Y = 86;
const POTION_ICON_MAX_SIZE = 84;
const POTION_AURA_RADIUS = 48;
const PRICE_COIN_X = 190;
const PRICE_COIN_Y = 80;
const PRICE_COIN_MAX_SIZE = 24;
const PRICE_TEXT_X = 208;
const HEAL_TEXT_X = 138;
const HEAL_TEXT_Y = 98;

const DURATION_POTION_PRICE_ANIM = 0.6;

const ALPHA_POTION_HOVER = 0.2;
const ALPHA_POTION_DEFAULT = 0.12;
const ALPHA_POTION_DISABLED = 0.78;

const POTION_PRICE_MULTIPLIER = 2;
const POTION_PRICE_TEXT_MAX_WIDTH = 82;
const POTION_PRICE_TEXT_MIN_SCALE = 0.82;

export class PotionPanel {
	private potionContainer!: Container;
	public potionPriceText: Text = new Text({ text: '' });
	private readonly potionPriceDisplayState = { value: 0 };
	private previousPotionPrice = 0;
	private lastRenderedCanAfford: boolean | null = null;

	private readonly panelTitleStyle = createGradientTextStyle({
		fillStops: ['#fff5cf', '#c18f40'],
		fontSize: 20,
		strokeWidth: 3,
		letterSpacing: 1
	});

	private readonly hudPriceStyle = createGradientTextStyle({
		fillStops: ['#fff8dd', '#d1ab59'],
		fontSize: 24,
		strokeWidth: 4
	});

	private readonly panelNoteStyle = createGradientTextStyle({
		fillStops: ['#fef4dc', '#be9860'],
		fontSize: 18,
		strokeWidth: 3,
		wordWrap: true,
		wordWrapWidth: SCENE_LAYOUT.game.potionWell.width - 130
	});

	public setup(parent: Container, char: Char, gameLogicService: GameLogicService): void {
		const potionWell = SCENE_LAYOUT.game.potionWell;
		this.potionContainer = new Container();
		const panel = new Graphics();
		const trim = new Graphics();
		const potionAura = new Graphics();
		const title = new Text({ text: 'POTION', style: this.panelTitleStyle });
		const priceCoin = new Sprite(getTexture('assets/coin.png'));
		const potion = new Sprite(getTexture('assets/potion_icon.png'));
		const healText = new Text({ text: `Heals ${gameLogicService.POTION_HEALTH} life`, style: this.panelNoteStyle });

		panel
			.roundRect(potionWell.x, potionWell.y, potionWell.width, potionWell.height, 24)
			.fill({ color: COLOR_PANEL_BG, alpha: 0.88 })
			.stroke({ color: COLOR_PANEL_BORDER, alpha: 0.24, width: 3 });
		panel
			.roundRect(potionWell.x + 10, potionWell.y + 10, potionWell.width - 20, potionWell.height - 20, 20)
			.fill({ color: COLOR_PANEL_INNER_BG, alpha: 0.72 })
			.stroke({ color: COLOR_PANEL_INNER_BORDER, alpha: 0.1, width: 2 });
		trim.roundRect(potionWell.x + 16, potionWell.y + 14, potionWell.width - 32, 16, 8).fill({ color: COLOR_PANEL_TRIM, alpha: 0.06 });

		title.anchor.set(0.5, 0);
		title.x = potionWell.centerX;
		title.y = potionWell.y + 6;

		this.potionContainer.x = potionWell.x;
		this.potionContainer.y = potionWell.y;
		this.potionContainer.cursor = 'pointer';
		this.potionContainer.eventMode = 'static';
		this.potionContainer.hitArea = new Rectangle(0, 0, potionWell.width, potionWell.height);

		potionAura.circle(POTION_ICON_X, POTION_ICON_Y, POTION_AURA_RADIUS).fill({ color: COLOR_POTION_AURA, alpha: 0.12 });

		potion.anchor.set(0.5);
		potion.x = POTION_ICON_X;
		potion.y = POTION_ICON_Y;
		potion.scale.x = potion.scale.y = Math.min(POTION_ICON_MAX_SIZE / potion.width, POTION_ICON_MAX_SIZE / potion.height);

		priceCoin.anchor.set(0.5);
		priceCoin.x = PRICE_COIN_X;
		priceCoin.y = PRICE_COIN_Y;
		priceCoin.scale.x = priceCoin.scale.y = Math.min(PRICE_COIN_MAX_SIZE / priceCoin.width, PRICE_COIN_MAX_SIZE / priceCoin.height);

		this.potionPriceText = new Text({ text: gameLogicService.POTION_PRICE.toString(), style: this.hudPriceStyle });
		this.potionPriceText.anchor.set(0, 0.5);
		this.potionPriceText.x = PRICE_TEXT_X;
		this.potionPriceText.y = PRICE_COIN_Y;

		healText.x = HEAL_TEXT_X;
		healText.y = HEAL_TEXT_Y;
		this.fitTextToWidth(healText, potionWell.width - 152, 0.8);

		this.potionContainer
			.on('pointerdown', () => {
				if (char.credits >= gameLogicService.POTION_PRICE) {
					char.heal(gameLogicService.POTION_HEALTH);
					char.removeCredits(gameLogicService.POTION_PRICE);
					gameLogicService.POTION_PRICE *= POTION_PRICE_MULTIPLIER;
				}
			})
			.on('pointerover', () => {
				potionAura.alpha = ALPHA_POTION_HOVER;
			})
			.on('pointerout', () => {
				potionAura.alpha = ALPHA_POTION_DEFAULT;
			});

		this.potionContainer.addChild(potionAura);
		this.potionContainer.addChild(potion);
		this.potionContainer.addChild(priceCoin);
		this.potionContainer.addChild(this.potionPriceText);
		this.potionContainer.addChild(healText);

		parent.addChild(panel);
		parent.addChild(trim);
		parent.addChild(title);
		parent.addChild(this.potionContainer);
	}

	public updatePrice(currentPrice: number): void {
		if (currentPrice !== this.previousPotionPrice) {
			gsap.to(this.potionPriceDisplayState, {
				value: currentPrice,
				duration: DURATION_POTION_PRICE_ANIM,
				ease: 'power2.out',
				overwrite: true,
				onUpdate: () => {
					this.potionPriceText.text = Math.round(this.potionPriceDisplayState.value).toString();
					this.fitTextToWidth(this.potionPriceText, POTION_PRICE_TEXT_MAX_WIDTH, POTION_PRICE_TEXT_MIN_SCALE);
				}
			});
			this.previousPotionPrice = currentPrice;
		}
	}

	public render(credits: number, price: number): void {
		const canAfford = credits >= price;
		if (canAfford === this.lastRenderedCanAfford) return;
		this.lastRenderedCanAfford = canAfford;
		this.potionContainer.alpha = canAfford ? 1 : ALPHA_POTION_DISABLED;
	}

	public initPrice(value: number): void {
		this.potionPriceDisplayState.value = value;
		this.previousPotionPrice = value;
	}

	public destroy(): void {
		gsap.killTweensOf(this.potionPriceDisplayState);
	}

	private fitTextToWidth(text: Text, maxWidth: number, minScale: number): void {
		text.scale.set(1);
		if (text.width > maxWidth) {
			const nextScale = Math.max(minScale, maxWidth / text.width);
			text.scale.set(nextScale);
		}
	}
}
