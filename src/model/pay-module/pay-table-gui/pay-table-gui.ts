import { Sprite, Application, Texture, Graphics, Container, Text } from 'pixi.js';
import { gsap } from 'gsap';
import { Subscription } from 'rxjs';
import { GameLogicService } from '../../../services/game-logic.service';
import { GameStates } from '../../game-states';
import { COMBINATIONS } from '../../pay-module/combinations';
import { PayTable } from '../../pay-module/pay-table';
import type { PayCheckStrategy } from '../../pay-module/pay-table-strategy/pay-table-strategy';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { createGradientTextStyle, fitTextToWidth } from '../../pixi-helpers';
import { MASK_ALPHA_INVISIBLE } from '../../constants/colors';
import { PAY_TABLE } from '../../constants/layout';
import { PAY_HIGHLIGHT } from '../../constants/animation';

export class PayTableGUI {
	private readonly descStyle = createGradientTextStyle({
		fillStops: ['#fff6d7', '#d9b674'],
		fontSize: SCENE_LAYOUT.game.paytable.labelFontSize,
		strokeWidth: 3,
		dropShadowColor: '#C86913',
		wordWrap: true,
		wordWrapWidth: SCENE_LAYOUT.game.paytable.width - PAY_TABLE.FRAME_PADDING,
		align: 'center'
	});

	private readonly badgeStyle = createGradientTextStyle({
		fillStops: ['#fffdf4', '#d7ba82'],
		fontSize: 14,
		strokeWidth: 2,
		dropShadowColor: '#C86913',
		letterSpacing: 0
	});

	private readonly valueStyle = createGradientTextStyle({
		fillStops: ['#fff8dd', '#c8973b'],
		fontSize: SCENE_LAYOUT.game.paytable.valueFontSize,
		strokeWidth: 3,
		dropShadowColor: '#f2ebb5'
	});

	private readonly FRAME: Texture = getTexture('assets/paytable_frame.png');
	private readonly HIGHLIGHT_FRAME: Texture = getTexture('assets/paytable_frame_highlight.png');
	private FRAME_HIGHLIGHT!: Sprite;
	private readonly payTableLayout = SCENE_LAYOUT.game.paytable;
	private readonly rowFrameScale = Math.min(
		(this.payTableLayout.width - PAY_TABLE.FRAME_PADDING) / this.FRAME.width,
		(this.payTableLayout.height - PAY_TABLE.HEADER_HEIGHT - PAY_TABLE.LIST_GAP - PAY_TABLE.ROW_STEP * 8) / this.FRAME.height,
		(PAY_TABLE.ROW_STEP - PAY_TABLE.ROW_FRAME_PADDING) / PAY_TABLE.FRAME_CIRCLE_DIAMETER
	);
	private readonly rowFrameWidth = this.FRAME.width * this.rowFrameScale;
	private readonly rowFrameHeight = this.FRAME.height * this.rowFrameScale;
	private readonly rowFrameX = Math.round((this.payTableLayout.width - this.rowFrameWidth) / 2);
	private readonly highlightOffsetX = ((this.HIGHLIGHT_FRAME.width - this.FRAME.width) * this.rowFrameScale) / 2;
	private readonly highlightOffsetY = ((this.HIGHLIGHT_FRAME.height - this.FRAME.height) * this.rowFrameScale) / 2;

	public readonly payTableContainer = new Container();
	public readonly payTableRowData: Partial<Record<COMBINATIONS, { pos: number; rowY: number }>> = {};
	public result: COMBINATIONS | null = null;
	private _resultSub!: Subscription;
	private _stateSub!: Subscription;
	private winHighlightTween: gsap.core.Tween | null = null;

	constructor(
		public readonly app: Application,
		public readonly sceneRoot: Container,
		public readonly payTable: PayTable,
		public readonly gameLogicService: GameLogicService
	) {
		this.payTableContainer.x = this.payTableLayout.x;
		this.payTableContainer.y = this.payTableLayout.y;

		this.initHighlight();
		this.initRows();

		this.sceneRoot.addChild(this.payTableContainer);
		this.payTableContainer.addChild(this.FRAME_HIGHLIGHT);

		this._resultSub = this.payTable.result$.subscribe((result) => {
			this.result = result;
		});

		this.addPayWinAnimations();
	}

	private initHighlight(): void {
		this.FRAME_HIGHLIGHT = this.createHighlightSprite();
		this.FRAME_HIGHLIGHT.visible = false;
		this.FRAME_HIGHLIGHT.alpha = PAY_HIGHLIGHT.INITIAL_ALPHA;
	}

	private initRows(): void {
		let positionY = PAY_TABLE.HEADER_HEIGHT + PAY_TABLE.LIST_GAP;
		let i = 0;
		for (const payStrategy of this.payTable.strategies) {
			const row = this.createRow(payStrategy, positionY);
			this.payTableRowData[payStrategy.enumIndex] = { pos: i, rowY: positionY };
			this.payTableContainer.addChild(row);
			positionY += PAY_TABLE.ROW_STEP + this.payTableLayout.rowGap;
			i++;
		}
	}

	private createRow(payStrategy: PayCheckStrategy, positionY: number): Container {
		const payOptionRegion = new Container();
		payOptionRegion.x = this.rowFrameX;
		payOptionRegion.y = positionY;

		const payFrame = this.createRowFrame();
		const { iconMask, iconRim, payIcon } = this.createRowIcon(payStrategy);
		const rowText = { label: payStrategy.displayLabel, detail: payStrategy.displayDetail };
		const { payDesc, badgeText } = this.createRowTexts(rowText);
		const { payValue, coin } = this.createRowValue(payStrategy);

		payOptionRegion.addChild(payIcon);
		payOptionRegion.addChild(iconMask);
		payOptionRegion.addChild(payFrame);
		payOptionRegion.addChild(iconRim);
		payOptionRegion.addChild(payDesc);
		payOptionRegion.addChild(badgeText);
		payOptionRegion.addChild(payValue);
		payOptionRegion.addChild(coin);

		return payOptionRegion;
	}

	private createRowFrame(): Sprite {
		const payFrame = new Sprite(this.FRAME);
		payFrame.scale.set(this.rowFrameScale);
		payFrame.x = 0;
		payFrame.y = 0;
		return payFrame;
	}

	private createRowIcon(payStrategy: PayCheckStrategy): { iconMask: Graphics; iconRim: Graphics; payIcon: Sprite } {
		const circleX = PAY_TABLE.FRAME_CIRCLE_CENTER_X * this.rowFrameScale;
		const circleY = PAY_TABLE.FRAME_CIRCLE_CENTER_Y * this.rowFrameScale;
		const circleRadius = PAY_TABLE.FRAME_CIRCLE_RADIUS * this.rowFrameScale;

		const iconRim = new Graphics();
		iconRim.circle(circleX, circleY, circleRadius - 2).stroke({ color: 0xf7d7a5, alpha: 0.2, width: 2 });

		const iconMask = new Graphics();
		iconMask.circle(circleX, circleY, circleRadius - 3).fill({ color: 0xffffff, alpha: 1 });
		iconMask.alpha = MASK_ALPHA_INVISIBLE;

		const payIcon = new Sprite(payStrategy.payIcon);
		payIcon.anchor.set(0.5);
		payIcon.x = circleX;
		payIcon.y = circleY;
		payIcon.scale.x = payIcon.scale.y = Math.max(
			(circleRadius * PAY_TABLE.ICON_SCALE_FACTOR) / payIcon.texture.width,
			(circleRadius * PAY_TABLE.ICON_SCALE_FACTOR) / payIcon.texture.height
		);
		payIcon.mask = iconMask;

		return { iconMask, iconRim, payIcon };
	}

	private createRowTexts(rowText: { label: string; detail: string }): { payDesc: Text; badgeText: Text } {
		const rowCenterY = this.rowFrameHeight / 2;

		const payDesc = new Text({ text: rowText.label, style: this.descStyle });
		payDesc.anchor.set(0, 0.5);
		payDesc.x = Math.round(PAY_TABLE.DESC_X_FACTOR * this.rowFrameScale);
		payDesc.y = rowCenterY + PAY_TABLE.DESC_Y_OFFSET_UP;
		fitTextToWidth(payDesc, PAY_TABLE.DESC_MAX_WIDTH, PAY_TABLE.DESC_MIN_SCALE);

		const badgeText = new Text({ text: rowText.detail, style: this.badgeStyle });
		badgeText.anchor.set(0, 0.5);
		badgeText.x = payDesc.x;
		badgeText.y = rowCenterY + PAY_TABLE.BADGE_Y_OFFSET_DOWN;
		fitTextToWidth(badgeText, PAY_TABLE.DESC_MAX_WIDTH, PAY_TABLE.BADGE_MIN_SCALE);

		return { payDesc, badgeText };
	}

	private createRowValue(payStrategy: PayCheckStrategy): { payValue: Text; coin: Sprite } {
		const rowCenterY = this.rowFrameHeight / 2;

		const payValue = new Text({ text: payStrategy.enumIndex.toString(), style: this.valueStyle });
		payValue.anchor.set(1, 0.5);
		payValue.x = this.rowFrameWidth - PAY_TABLE.VALUE_X_PADDING;
		payValue.y = rowCenterY + PAY_TABLE.VALUE_Y_OFFSET;
		fitTextToWidth(payValue, PAY_TABLE.VALUE_MAX_WIDTH, PAY_TABLE.VALUE_MIN_SCALE);

		const coin = new Sprite(getTexture('assets/coin_reward.png'));
		coin.anchor.set(0.5);
		coin.x = this.rowFrameWidth - PAY_TABLE.COIN_X_PADDING;
		coin.y = rowCenterY + PAY_TABLE.VALUE_Y_OFFSET;
		coin.scale.x = coin.scale.y = Math.min(this.payTableLayout.coinSize / coin.width, this.payTableLayout.coinSize / coin.height);

		return { payValue, coin };
	}

	public addPayWinAnimations(): void {
		this._stateSub = this.gameLogicService.stateMachine.state$.subscribe((state) => {
			if (state === GameStates.WIN && this.result !== null) {
				this.startWinPulse();
			} else {
				this.stopWinPulse();
			}
		});
	}

	private startWinPulse(): void {
		const currPayObj = this.payTableRowData[this.result!];
		if (!currPayObj) return;

		this.FRAME_HIGHLIGHT.x = this.rowFrameX - this.highlightOffsetX;
		this.FRAME_HIGHLIGHT.y = currPayObj.rowY - this.highlightOffsetY;
		this.FRAME_HIGHLIGHT.visible = true;
		this.FRAME_HIGHLIGHT.alpha = PAY_HIGHLIGHT.ALPHA_MAX;

		if (this.winHighlightTween) return;
		this.winHighlightTween = gsap.to(this.FRAME_HIGHLIGHT, {
			alpha: PAY_HIGHLIGHT.ALPHA_MIN,
			duration: 0.5,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
		});
	}

	private stopWinPulse(): void {
		if (!this.winHighlightTween) return;
		this.winHighlightTween.kill();
		this.winHighlightTween = null;
		this.FRAME_HIGHLIGHT.visible = false;
		this.FRAME_HIGHLIGHT.alpha = PAY_HIGHLIGHT.INITIAL_ALPHA;
	}

	public destroy(): void {
		this._resultSub?.unsubscribe();
		this._stateSub?.unsubscribe();
		this.stopWinPulse();
		this.payTableContainer.destroy({ children: true });
	}

	private createHighlightSprite(): Sprite {
		const highlight = new Sprite(this.HIGHLIGHT_FRAME);
		highlight.scale.set(this.rowFrameScale);
		return highlight;
	}

}
