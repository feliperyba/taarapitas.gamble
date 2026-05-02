import { Sprite, Application, Texture, FillGradient, TextStyle, Graphics, Container, Rectangle, Text, NineSliceSprite } from 'pixi.js';
import {
	type CharStrategy
} from '../../char-module/char-strategy/char-strategy';
import type { CharSelectHandler } from '../../char-select-handler';
import { CharTargetType } from '../../interfaces';
import { Button } from '../../gui-module/button';
import { getTexture } from '../../../rendering/assets';
import { DESIGN_WIDTH, SCENE_LAYOUT } from '../../../rendering/viewport';
import { DROP_SHADOW_DEFAULT } from '../../pixi-styles';
import { CHAR_SELECT } from '../../constants/layout';

export class CharSelectionScreen {
	private readonly btnTexture!: Texture;
	private readonly btnOverTexture!: Texture;
	private readonly btnPushTexture!: Texture;
	private titleStyle!: TextStyle;
	private descStyle!: TextStyle;
	private nameStyle!: TextStyle;
	private buttonStyle!: TextStyle;

	private readonly charClasses: CharStrategy[];

	private readonly charButtons: Button[] = [];

	public readonly selectCharContainer = new Container();

	constructor(private readonly app: Application, private readonly handler: CharSelectHandler, charClasses: CharStrategy[]) {
		this.charClasses = charClasses;
		this.btnTexture = getTexture('assets/button.png');
		this.btnOverTexture = getTexture('assets/button-HOVER.png');
		this.btnPushTexture = getTexture('assets/button-PUSH.png');

		this.createStyles();
		this.layoutCards();
	}

	private createStyles(): void {
		this.titleStyle = this.buildTitleStyle();
		this.descStyle = this.buildDescStyle();
		this.nameStyle = this.buildNameStyle();
		this.buttonStyle = this.buildButtonStyle();
	}

	private buildTitleStyle(): TextStyle {
		const grad = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		grad.addColorStop(0, '#753213').addColorStop(1, '#FAE888');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 58,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: grad,
			stroke: { color: '#000', width: 3 },
			dropShadow: DROP_SHADOW_DEFAULT,
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.charSelect.cardWidth - SCENE_LAYOUT.charSelect.contentInset * 2,
			align: 'center'
		});
	}

	private buildDescStyle(): TextStyle {
		const grad = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		grad.addColorStop(0, '#ffffff').addColorStop(1, '#cccccc');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 30,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: grad,
			stroke: { color: '#000', width: 3 },
			dropShadow: DROP_SHADOW_DEFAULT,
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.charSelect.cardWidth - SCENE_LAYOUT.charSelect.contentInset * 2,
			align: 'center'
		});
	}

	private buildNameStyle(): TextStyle {
		const grad = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		grad.addColorStop(0, '#ffffff').addColorStop(1, '#cccccc');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 42,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: grad,
			stroke: { color: '#000', width: 5 },
			dropShadow: DROP_SHADOW_DEFAULT,
			wordWrap: true,
			wordWrapWidth: CHAR_SELECT.NAME_WORD_WRAP_WIDTH,
			align: 'center'
		});
	}

	private buildButtonStyle(): TextStyle {
		const grad = new FillGradient({
			start: { x: 0, y: 0 },
			end: { x: 0, y: 1 },
			textureSpace: 'local'
		});
		grad.addColorStop(0, '#ffffff').addColorStop(1, '#cccccc');
		return new TextStyle({
			fontFamily: 'Primitive',
			fontSize: 44,
			fontStyle: 'normal',
			fontWeight: 'bold',
			fill: grad,
			stroke: { color: '#000', width: 6 },
			dropShadow: DROP_SHADOW_DEFAULT,
			wordWrap: true,
			wordWrapWidth: SCENE_LAYOUT.charSelect.selectButtonWidth - CHAR_SELECT.BUTTON_WORD_WRAP_PADDING,
			align: 'center'
		});
	}

	private layoutCards(): void {
		let i = 0;
		for (const char of this.charClasses) {
			const card = this.buildCharCard(char, i);
			this.selectCharContainer.addChild(card);
			i++;
		}
	}

	private buildCharCard(char: CharStrategy, index: number): Container {
		const cardLayout = SCENE_LAYOUT.charSelect;
		const columnStep = cardLayout.cardWidth + cardLayout.columnGap;
		const totalWidth = this.charClasses.length * cardLayout.cardWidth +
			(this.charClasses.length - 1) * cardLayout.columnGap;
		const cardX = (DESIGN_WIDTH - totalWidth) / 2 + index * columnStep;
		const contentCenterX = cardLayout.cardWidth / 2;

		const cardContainer = new Container();
		cardContainer.x = cardX;
		cardContainer.y = cardLayout.top;
		cardContainer.hitArea = new Rectangle(0, 0, cardLayout.cardWidth, cardLayout.cardHeight);

		const classBackground = this.createClassBackground(char);
		const classPortrait = this.createClassPortrait(char, cardLayout, contentCenterX);
		const classNameText = this.createClassNameText(char, contentCenterX, cardLayout);
		const { statPanel, lifeIcon, lifeText, creditIcon, creditsText } = this.createStatRow(char, cardLayout, contentCenterX);
		const { descPanel, skillText } = this.createSkillDesc(char, cardLayout, contentCenterX);
		const btnSelect = this.createSelectButton(char, cardLayout, contentCenterX);
		this.charButtons.push(btnSelect);

		cardContainer.addChild(classBackground);
		cardContainer.addChild(statPanel);
		cardContainer.addChild(descPanel);
		cardContainer.addChild(classPortrait);
		cardContainer.addChild(classNameText);
		cardContainer.addChild(lifeIcon);
		cardContainer.addChild(lifeText);
		cardContainer.addChild(creditIcon);
		cardContainer.addChild(creditsText);
		cardContainer.addChild(skillText);
		cardContainer.addChild(btnSelect.btnContainer);

		cardContainer.eventMode = 'static';
		cardContainer.cursor = 'pointer';

		return cardContainer;
	}

	private createClassBackground(char: CharStrategy): NineSliceSprite {
		const cardLayout = SCENE_LAYOUT.charSelect;
		return new NineSliceSprite({
			texture: char.BACKGROUND,
			width: cardLayout.cardWidth,
			height: cardLayout.cardHeight,
			leftWidth: CHAR_SELECT.NINE_SLICE_INSET.LEFT,
			topHeight: CHAR_SELECT.NINE_SLICE_INSET.TOP,
			rightWidth: CHAR_SELECT.NINE_SLICE_INSET.RIGHT,
			bottomHeight: CHAR_SELECT.NINE_SLICE_INSET.BOTTOM
		});
	}

	private createClassPortrait(char: CharStrategy, cardLayout: typeof SCENE_LAYOUT.charSelect, contentCenterX: number): Sprite {
		const classPortrait = new Sprite(char.PORTRAIT);
		classPortrait.scale.x = classPortrait.scale.y = Math.min(
			cardLayout.portraitSize / classPortrait.width,
			cardLayout.portraitSize / classPortrait.height
		);
		classPortrait.x = contentCenterX - classPortrait.width / 2;
		classPortrait.y = cardLayout.portraitY;
		return classPortrait;
	}

	private createClassNameText(char: CharStrategy, contentCenterX: number, cardLayout: typeof SCENE_LAYOUT.charSelect): Text {
		const classNameText = new Text({ text: char.NAME, style: this.titleStyle });
		classNameText.anchor.set(0.5);
		classNameText.x = contentCenterX;
		classNameText.y = cardLayout.titleY;
		return classNameText;
	}

	private createStatRow(char: CharStrategy, cardLayout: typeof SCENE_LAYOUT.charSelect, contentCenterX: number): {
		statPanel: Graphics; lifeIcon: Sprite; lifeText: Text; creditIcon: Sprite; creditsText: Text
	} {
		const statPanel = new Graphics();
		const lifeIcon = new Sprite(getTexture('assets/life_icon.png'));
		const creditIcon = new Sprite(getTexture('assets/credit_icon.png'));
		const creditsText = new Text({ text: char.CREDITS.toString(), style: this.nameStyle });
		const lifeText = new Text({ text: char.LIFE.toString(), style: this.nameStyle });

		const panelX = cardLayout.contentInset;
		const panelWidth = cardLayout.cardWidth - cardLayout.contentInset * 2;
		const statCenterY = cardLayout.statPanelY + cardLayout.statPanelHeight / 2;
		const lifeCenterX = contentCenterX - CHAR_SELECT.STAT_CENTER_OFFSET;
		const creditCenterX = contentCenterX + CHAR_SELECT.STAT_CENTER_OFFSET;

		statPanel.roundRect(panelX, cardLayout.statPanelY, panelWidth, cardLayout.statPanelHeight, 6)
			.fill({ color: CHAR_SELECT.STAT_PANEL.FILL, alpha: CHAR_SELECT.STAT_PANEL.FILL_ALPHA })
			.stroke({ color: CHAR_SELECT.STAT_PANEL.STROKE, alpha: CHAR_SELECT.STAT_PANEL.STROKE_ALPHA, width: CHAR_SELECT.STAT_PANEL.STROKE_WIDTH });
		lifeIcon.width = cardLayout.statIconSize;
		lifeIcon.height = cardLayout.statIconSize;
		lifeIcon.anchor.set(0.5);
		lifeIcon.x = lifeCenterX;
		lifeIcon.y = statCenterY;

		lifeText.anchor.set(0.5);
		lifeText.x = lifeIcon.x;
		lifeText.y = lifeIcon.y + CHAR_SELECT.STAT_TEXT_Y_OFFSET;

		creditIcon.width = cardLayout.statIconSize;
		creditIcon.height = cardLayout.statIconSize;
		creditIcon.anchor.set(0.5);
		creditIcon.x = creditCenterX;
		creditIcon.y = statCenterY;

		creditsText.anchor.set(0.5);
		creditsText.x = creditIcon.x;
		creditsText.y = creditIcon.y + CHAR_SELECT.STAT_TEXT_Y_OFFSET;

		return { statPanel, lifeIcon, lifeText, creditIcon, creditsText };
	}

	private createSkillDesc(char: CharStrategy, cardLayout: typeof SCENE_LAYOUT.charSelect, contentCenterX: number): {
		descPanel: Graphics; skillText: Text
	} {
		const descPanel = new Graphics();
		const skillText = new Text({ text: char.SKILL_DESC, style: this.descStyle });

		const panelX = cardLayout.contentInset;
		const panelWidth = cardLayout.cardWidth - cardLayout.contentInset * 2;

		descPanel.roundRect(panelX, cardLayout.descPanelY, panelWidth, cardLayout.descPanelHeight, 6)
			.fill({ color: CHAR_SELECT.DESC_PANEL.FILL, alpha: CHAR_SELECT.DESC_PANEL.FILL_ALPHA })
			.stroke({ color: CHAR_SELECT.DESC_PANEL.STROKE, alpha: CHAR_SELECT.DESC_PANEL.STROKE_ALPHA, width: CHAR_SELECT.DESC_PANEL.STROKE_WIDTH });
		skillText.anchor.set(0.5);
		skillText.x = contentCenterX;
		skillText.y = cardLayout.descPanelY + cardLayout.descPanelHeight / 2;

		return { descPanel, skillText };
	}

	private createSelectButton(char: CharStrategy, cardLayout: typeof SCENE_LAYOUT.charSelect, contentCenterX: number): Button {
		const btnSelect = new Button(
			cardLayout.selectButtonHeight,
			cardLayout.selectButtonWidth,
			this.btnTexture,
			this.btnOverTexture,
			this.btnPushTexture,
			'Select',
			this.buttonStyle
		);

		btnSelect.btnContainer.on('pointerdown', () => {
			const createdChar = char.create();
			if (char.TARGET_TYPE === CharTargetType.Reel) {
				createdChar.charContext.target = this.handler.reel;
			} else {
				createdChar.charContext.target = createdChar;
			}
			this.handler.char = createdChar;
			this.handler.setup();
		});

		btnSelect.btnContainer.x = contentCenterX - cardLayout.selectButtonWidth / 2;
		btnSelect.btnContainer.y = cardLayout.cardHeight - cardLayout.selectButtonHeight - cardLayout.selectButtonBottom;

		return btnSelect;
	}

	public destroy(): void {
		for (const btn of this.charButtons) {
			btn.destroy();
		}
		this.charButtons.length = 0;
		this.titleStyle?.destroy();
		this.descStyle?.destroy();
		this.nameStyle?.destroy();
		this.buttonStyle?.destroy();
		this.selectCharContainer.destroy({ children: true });
	}
}
