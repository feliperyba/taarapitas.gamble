import { Sprite, Graphics, Container, Text, Rectangle } from 'pixi.js';
import { gsap } from 'gsap';
import { Char } from '../char';
import { Reel } from '../../reel';
import { GameLogicService } from '../../../services/game-logic.service';
import { GameStates } from '../../game-states';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { createGradientTextStyle, buildPanelGraphics } from '../../pixi-helpers';
import { SKILL_CHARGE_MAX } from '../../constants/skill';
import { clearWinHighlight } from '../../pay-module/win-highlighter';
import { SKILL_PANEL as LAYOUT } from '../../constants/layout';
import { SKILL_PANEL as ANIM } from '../../constants/animation';
const COLOR_SKILL_GLOW_OUTER = 0xf0912c;
const COLOR_SKILL_GLOW_INNER = 0x070302;

export class SkillPanel {
	private skillReady!: Sprite;
	private skillOff!: Sprite;
	private skillGlow!: Graphics;
	private skillStateText: Text = new Text({ text: '' });
	private skillPulseActive = false;
	private lastRenderedSpecialBar = -1;

	private readonly panelTitleStyle = createGradientTextStyle({
		fillStops: ['#fff5cf', '#c18f40'],
		fontSize: 20,
		strokeWidth: 3,
		letterSpacing: 1
	});

	private readonly panelNoteStyle = createGradientTextStyle({
		fillStops: ['#fef4dc', '#be9860'],
		fontSize: 18,
		strokeWidth: 3,
		wordWrap: true,
		wordWrapWidth: SCENE_LAYOUT.game.skillWell.width - 130
	});

	public setup(parent: Container, char: Char, gameLogicService: GameLogicService, reel: Reel): void {
		const skillWell = SCENE_LAYOUT.game.skillWell;
		const skillContainer = new Container();
		const panel = new Graphics();
		const trim = new Graphics();
		const title = new Text({ text: 'SKILL', style: this.panelTitleStyle });
		this.skillGlow = new Graphics();
		this.skillOff = new Sprite(getTexture('assets/skill_bar_empty.png'));
		this.skillReady = new Sprite(getTexture('assets/skill_bar_full.png'));

		buildPanelGraphics(panel, trim, skillWell);

		title.anchor.set(0.5, 0);
		title.x = skillWell.centerX;
		title.y = skillWell.y + 4;

		skillContainer.x = skillWell.centerX;
		skillContainer.y = skillWell.y + LAYOUT.CONTAINER_Y_OFFSET;
		skillContainer.eventMode = 'static';
		skillContainer.cursor = 'pointer';
		skillContainer.hitArea = new Rectangle(-skillWell.width / 2 + LAYOUT.HIT_AREA_WIDTH_OFFSET, LAYOUT.HIT_AREA_Y_OFFSET, skillWell.width - LAYOUT.HIT_AREA_WIDTH_OFFSET * 2, LAYOUT.HIT_AREA_HEIGHT);

		this.skillGlow.circle(0, 0, LAYOUT.GLOW_OUTER_RADIUS).fill({ color: COLOR_SKILL_GLOW_OUTER, alpha: 0.1 });
		this.skillGlow.circle(0, 0, LAYOUT.GLOW_INNER_RADIUS).fill({ color: COLOR_SKILL_GLOW_INNER, alpha: 0.74 });

		this.skillOff.anchor.set(0.5);
		this.skillOff.scale.x = this.skillOff.scale.y = Math.min(LAYOUT.OFF_MAX_SIZE / this.skillOff.width, LAYOUT.OFF_MAX_SIZE / this.skillOff.height);
		this.skillOff.alpha = 1;

		this.skillReady.anchor.set(0.5);
		this.skillReady.scale.x = this.skillReady.scale.y = Math.min(LAYOUT.READY_MAX_SIZE / this.skillReady.width, LAYOUT.READY_MAX_SIZE / this.skillReady.height);
		this.skillReady.visible = false;

		this.skillStateText = new Text({ text: 'Charge 0 / 3', style: this.panelNoteStyle });
		this.skillStateText.anchor.set(0.5, 0);
		this.skillStateText.x = skillWell.centerX;
		this.skillStateText.y = skillWell.y + LAYOUT.STATE_TEXT_Y_OFFSET;

		skillContainer.on('pointerdown', () => {
			if (
				(char.specialBar >= SKILL_CHARGE_MAX && gameLogicService.state === GameStates.WAITING) ||
				gameLogicService.state === GameStates.WIN
			) {
				if (gameLogicService.state === GameStates.WIN) {
					const winPos = reel.reelWinSlotPos;
					
					if (winPos !== undefined) {
						clearWinHighlight(reel, winPos);
					}
				}

				char.setUsingSkill(true);
				char.charContext.useClassSkill(char.charContext.target);

				if (char.charContext.target instanceof Char) {
					char.setUsingSkill(false);
					char.setSpecialBar(0);
				}
			}
		});

		skillContainer.addChild(this.skillGlow);
		skillContainer.addChild(this.skillOff);
		skillContainer.addChild(this.skillReady);

		parent.addChild(panel);
		parent.addChild(trim);
		parent.addChild(title);
		parent.addChild(skillContainer);
		parent.addChild(this.skillStateText);
	}

	public render(specialBar: number): void {
		if (specialBar === this.lastRenderedSpecialBar) return;
		this.lastRenderedSpecialBar = specialBar;

		if (specialBar >= SKILL_CHARGE_MAX) {
			this.skillReady.visible = true;
			this.skillOff.alpha = ANIM.ALPHA.LOW_LIFE_PULSE;

			if (!this.skillPulseActive) {
				this.skillPulseActive = true;
				this.skillReady.alpha = 1;
				gsap.killTweensOf(this.skillReady);
				gsap.to(this.skillReady, {
					alpha: ANIM.ALPHA.SKILL_READY_PULSE_MIN,
					duration: ANIM.DURATION.READY_PULSE,
					ease: 'sine.inOut',
					yoyo: true,
					repeat: -1
				});
			}

			this.skillGlow.alpha = ANIM.ALPHA.SKILL_GLOW_BASE + this.skillReady.alpha * ANIM.ALPHA.SKILL_GLOW_RANGE;
			this.skillStateText.text = 'Ready to cast';
		} else {
			if (this.skillPulseActive) {
				this.skillPulseActive = false;
				gsap.killTweensOf(this.skillReady);
			}
			this.skillReady.visible = false;
			this.skillReady.alpha = 1;
			this.skillOff.alpha = ANIM.ALPHA.SKILL_OFF;
			this.skillGlow.alpha = ANIM.ALPHA.SKILL_OFF;
			this.skillStateText.text = `Charge ${specialBar} / ${SKILL_CHARGE_MAX}`;
		}
	}

	public destroy(): void {
		gsap.killTweensOf(this.skillReady);
	}
}
