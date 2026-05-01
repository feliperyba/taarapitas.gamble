import { Sprite, Application, Texture, FillGradient, TextStyle, Graphics, Container, Text } from 'pixi.js';
import { GameLogicService, GameStates } from '../../../services/game-logic.service';
import { COMBINATIONS, PayTable } from '../../pay-module/pay-table';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';

export class PayTableGUI {
	private descStyle = (() => {
		const g = new FillGradient(0, 0, 0, 1);
		g.addColorStop(0, '#fff6d7').addColorStop(1, '#d9b674');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: SCENE_LAYOUT.game.paytable.labelFontSize,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: g,
			stroke: { color: '#000', width: 3 },
			dropShadow: {
				color: '#C86913',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			}
		});
	})();

	private badgeStyle = (() => {
		const g = new FillGradient(0, 0, 0, 1);
		g.addColorStop(0, '#fffdf4').addColorStop(1, '#d7ba82');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 14,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: g,
			stroke: { color: '#000', width: 2 },
			dropShadow: {
				color: '#C86913',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			},
			letterSpacing: 0
		});
	})();

	private valueStyle = (() => {
		const g = new FillGradient(0, 0, 0, 1);
		g.addColorStop(0, '#fff8dd').addColorStop(1, '#c8973b');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: SCENE_LAYOUT.game.paytable.valueFontSize,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: g,
			stroke: { color: '#000', width: 3 },
			dropShadow: {
				color: '#f2ebb5',
				blur: 0,
				angle: Math.PI / 6,
				distance: 0
			}
		});
	})();

	private FRAME: Texture = getTexture('assets/paytable_frame.png');
	private HIGHLIGHT_FRAME: Texture = getTexture('assets/paytable_frame_highlight.png');
	private FRAME_HIGHLIGHT: Sprite;
	private payTableLayout = SCENE_LAYOUT.game.paytable;
	private readonly headerHeight = 4;
	private readonly listGap = 20;
	private readonly rowStep = 82;
	private readonly rowFrameScale = Math.min(
		(this.payTableLayout.width - 32) / this.FRAME.width,
		(this.payTableLayout.height - this.headerHeight - this.listGap - this.rowStep * 8) / this.FRAME.height,
		(this.rowStep - 4) / (32 * 2)
	);
	private readonly rowFrameWidth = this.FRAME.width * this.rowFrameScale;
	private readonly rowFrameHeight = this.FRAME.height * this.rowFrameScale;
	private readonly rowFrameX = Math.round((this.payTableLayout.width - this.rowFrameWidth) / 2);
	private readonly highlightOffsetX = ((this.HIGHLIGHT_FRAME.width - this.FRAME.width) * this.rowFrameScale) / 2;
	private readonly highlightOffsetY = ((this.HIGHLIGHT_FRAME.height - this.FRAME.height) * this.rowFrameScale) / 2;
	private readonly frameCircle = {
		centerX: 90,
		centerY: 90,
		radius: 82
	};

	public payTableContainer = new Container();
	public payTableObjs = [];
	public result: any;
	private changeAlpha = false;

	constructor(
		public app: Application,
		public sceneRoot: Container,
		public payTable: PayTable,
		public _gameLogicService: GameLogicService
	) {
		this.payTableContainer.x = this.payTableLayout.x;
		this.payTableContainer.y = this.payTableLayout.y;

		this.FRAME_HIGHLIGHT = this.createHighlightSprite();
		this.FRAME_HIGHLIGHT.visible = false;
		this.FRAME_HIGHLIGHT.alpha = 0.92;

		let positionY = this.headerHeight + this.listGap;
		let i = 0;
		for (const payStrategy of this.payTable.strategiesArr) {
			const rowText = this.getRowText(payStrategy.enumIndex);
			const payOptionRegion = new Container();
			const payFrame = new Sprite(this.FRAME);
			const iconMask = new Graphics();
			const iconRim = new Graphics();
			const payIcon = new Sprite(payStrategy.payIcon);
			const badgeText = new Text(rowText.detail, this.badgeStyle);
			const payDesc = new Text(rowText.label, this.descStyle);
			const payValue = new Text(payStrategy.enumIndex.toString(), this.valueStyle);
			const coin = new Sprite(getTexture('assets/coin_reward.png'));

			payOptionRegion.x = this.rowFrameX;
			payOptionRegion.y = positionY;
			payFrame.scale.set(this.rowFrameScale);
			payFrame.x = 0;
			payFrame.y = 0;

			const circleX = this.frameCircle.centerX * this.rowFrameScale;
			const circleY = this.frameCircle.centerY * this.rowFrameScale;
			const circleRadius = this.frameCircle.radius * this.rowFrameScale;
			const rowCenterY = this.rowFrameHeight / 2;

			iconRim.circle(circleX, circleY, circleRadius - 2).stroke({ color: 0xf7d7a5, alpha: 0.2, width: 2 });
			iconMask.circle(circleX, circleY, circleRadius - 3).fill({ color: 0xffffff, alpha: 1 });
			iconMask.alpha = 0.001;

			payIcon.anchor.set(0.5);
			payIcon.x = circleX;
			payIcon.y = circleY;
			payIcon.scale.x = payIcon.scale.y = Math.max(
				(circleRadius * 2.72) / payIcon.texture.width,
				(circleRadius * 2.72) / payIcon.texture.height
			);
			payIcon.mask = iconMask;

			payDesc.anchor.set(0, 0.5);
			payDesc.x = Math.round(196 * this.rowFrameScale);
			payDesc.y = rowCenterY - 13;
			this.fitTextToWidth(payDesc, 108, 0.72);

			badgeText.anchor.set(0, 0.5);
			badgeText.x = payDesc.x;
			badgeText.y = rowCenterY + 12;
			this.fitTextToWidth(badgeText, 108, 0.54);

			payValue.anchor.set(1, 0.5);
			payValue.x = this.rowFrameWidth - 36;
			payValue.y = rowCenterY + 1;
			this.fitTextToWidth(payValue, 64, 0.72);

			coin.anchor.set(0.5);
			coin.x = this.rowFrameWidth - 23;
			coin.y = rowCenterY + 1;
			coin.scale.x = coin.scale.y = Math.min(this.payTableLayout.coinSize / coin.width, this.payTableLayout.coinSize / coin.height);

			payOptionRegion.addChild(payIcon);
			payOptionRegion.addChild(iconMask);
			payOptionRegion.addChild(payFrame);
			payOptionRegion.addChild(iconRim);
			payOptionRegion.addChild(payDesc);
			payOptionRegion.addChild(badgeText);
			payOptionRegion.addChild(payValue);
			payOptionRegion.addChild(coin);

			this.payTableObjs[payStrategy.enumIndex] = { pos: i, rowY: positionY };
			this.payTableContainer.addChild(payOptionRegion);

			positionY += this.rowStep + this.payTableLayout.rowGap;
			i++;
		}

		this.sceneRoot.addChild(this.payTableContainer);
		this.payTableContainer.addChild(this.FRAME_HIGHLIGHT);
		this.payTable.payTableGUI = this;

		this.addPayWinAnimations();
	}

	public addPayWinAnimations() {
		this.app.ticker.add(() => {
			if (this._gameLogicService.state == GameStates.WIN && this.result != null) {
				const currPayObj = this.payTableObjs[this.result];
				this.FRAME_HIGHLIGHT.x = this.rowFrameX - this.highlightOffsetX;
				this.FRAME_HIGHLIGHT.y = currPayObj.rowY - this.highlightOffsetY;
				this.FRAME_HIGHLIGHT.visible = true;

				if (!this.changeAlpha) {
					if (this.FRAME_HIGHLIGHT.alpha < 0.56) {
						this.changeAlpha = !this.changeAlpha;
					}
					this.FRAME_HIGHLIGHT.alpha -= 0.035;
				}

				if (this.changeAlpha) {
					if (this.FRAME_HIGHLIGHT.alpha > 0.96) {
						this.changeAlpha = !this.changeAlpha;
					}
					this.FRAME_HIGHLIGHT.alpha += 0.035;
				}
			} else {
				this.FRAME_HIGHLIGHT.visible = false;
				this.FRAME_HIGHLIGHT.alpha = 0.92;
			}
		});
	}

	private createHighlightSprite(): Sprite {
		const highlight = new Sprite(this.HIGHLIGHT_FRAME);
		highlight.scale.set(this.rowFrameScale);
		return highlight;
	}

	private getRowText(combination: COMBINATIONS) {
		switch (combination) {
			case COMBINATIONS.CHERRY_BOTTOM:
				return { label: 'BOTTOM LINE', detail: '3 DARK ELF' };
			case COMBINATIONS.CHERRY_TOP:
				return { label: 'TOP LINE', detail: '3 DARK ELF' };
			case COMBINATIONS.CHERRY_CENTER:
				return { label: 'CENTER LINE', detail: '3 DARK ELF' };
			case COMBINATIONS.SEVEN:
				return { label: 'ANY LINE', detail: '3 MINOTAUR' };
			case COMBINATIONS.SEVEN_CHERRY:
				return { label: 'ANY LINE', detail: 'DARK ELF + MINOTAUR' };
			case COMBINATIONS.X3BAR:
				return { label: 'ANY LINE', detail: '3 3xGOBLINS' };
			case COMBINATIONS.X2BAR:
				return { label: 'ANY LINE', detail: '3 2xGOBLINS' };
			case COMBINATIONS.BAR:
				return { label: 'ANY LINE', detail: '3 GOBLINS' };
			case COMBINATIONS.ANY_BAR:
				return { label: 'ANY LINE', detail: 'ANY GOBLINS COMBO' };
			default:
				return { label: 'ANY LINE', detail: 'MATCH 3' };
		}
	}

	private fitTextToWidth(text: Text, maxWidth: number, minScale: number) {
		text.scale.set(1);
		if (text.width > maxWidth) {
			const nextScale = Math.max(minScale, maxWidth / text.width);
			text.scale.set(nextScale);
		}
	}
}
