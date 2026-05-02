import { Sprite, Graphics, Container, Text, Rectangle } from 'pixi.js';
import { gsap } from 'gsap';
import { Char } from '../char';
import { GameLogicService } from '../../../services/game-logic.service';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { createGradientTextStyle, fitTextToWidth, buildPanelGraphics } from '../../pixi-helpers';
import { POTION_PANEL as LAYOUT } from '../../constants/layout';
import { POTION_PANEL as ANIM } from '../../constants/animation';

const COLOR_POTION_AURA = 0x8b3d08;

const ALPHA_POTION_HOVER = 0.2;
const ALPHA_POTION_DEFAULT = 0.12;
const ALPHA_POTION_DISABLED = 0.78;

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

		buildPanelGraphics(panel, trim, potionWell);

		title.anchor.set(0.5, 0);
		title.x = potionWell.centerX;
		title.y = potionWell.y + 6;

		this.potionContainer.x = potionWell.x;
		this.potionContainer.y = potionWell.y;
		this.potionContainer.cursor = 'pointer';
		this.potionContainer.eventMode = 'static';
		this.potionContainer.hitArea = new Rectangle(0, 0, potionWell.width, potionWell.height);

		potionAura.circle(LAYOUT.ICON_X, LAYOUT.ICON_Y, LAYOUT.AURA_RADIUS).fill({ color: COLOR_POTION_AURA, alpha: 0.12 });

		potion.anchor.set(0.5);
		potion.x = LAYOUT.ICON_X;
		potion.y = LAYOUT.ICON_Y;
		potion.scale.x = potion.scale.y = Math.min(LAYOUT.ICON_MAX_SIZE / potion.width, LAYOUT.ICON_MAX_SIZE / potion.height);

		priceCoin.anchor.set(0.5);
		priceCoin.x = LAYOUT.PRICE_COIN_X;
		priceCoin.y = LAYOUT.PRICE_COIN_Y;
		priceCoin.scale.x = priceCoin.scale.y = Math.min(LAYOUT.PRICE_COIN_MAX_SIZE / priceCoin.width, LAYOUT.PRICE_COIN_MAX_SIZE / priceCoin.height);

		this.potionPriceText = new Text({ text: gameLogicService.potionPrice.toString(), style: this.hudPriceStyle });
		this.potionPriceText.anchor.set(0, 0.5);
		this.potionPriceText.x = LAYOUT.PRICE_TEXT_X;
		this.potionPriceText.y = LAYOUT.PRICE_COIN_Y;

		healText.x = LAYOUT.HEAL_TEXT_X;
		healText.y = LAYOUT.HEAL_TEXT_Y;
		fitTextToWidth(healText, potionWell.width - LAYOUT.HEAL_TEXT_WIDTH_PADDING, LAYOUT.HEAL_TEXT_MIN_SCALE);

		this.potionContainer
			.on('pointerdown', () => {
				if (char.credits >= gameLogicService.potionPrice) {
					char.heal(gameLogicService.POTION_HEALTH);
					char.removeCredits(gameLogicService.potionPrice);
					gameLogicService.increasePotionPrice();
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
				duration: ANIM.DURATION.PRICE_ANIM,
				ease: 'power2.out',
				overwrite: true,
			onUpdate: () => {
					const rounded = Math.round(this.potionPriceDisplayState.value);
					const text = rounded.toString();
					
					if (this.potionPriceText.text !== text) {
						this.potionPriceText.text = text;
						fitTextToWidth(this.potionPriceText, POTION_PRICE_TEXT_MAX_WIDTH, POTION_PRICE_TEXT_MIN_SCALE);
					}
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

}
