import { Sprite, Graphics, Container } from 'pixi.js';
import { gsap } from 'gsap';
import { Char } from '../char';
import { getTexture } from '../../../rendering/assets';
import { SCENE_LAYOUT } from '../../../rendering/viewport';
import { COLOR_WHITE, COLOR_DAMAGE_FLASH } from '../../constants/colors';

const HERO_FRAME_CENTER_OFFSET = 160;
const PORTRAIT_MASK_RADIUS_BASE = 100;
const PORTRAIT_OFFSET_X_FRACTION = 0.05;
const PORTRAIT_OFFSET_Y_FRACTION = 0.70;
const PROTECTED_ICON_OFFSET_X = 192;
const PROTECTED_ICON_OFFSET_Y = 16;
const PROTECTED_ICON_MAX_SIZE = 40;

export class HeroCrest {
	public readonly container = new Container();
	public frame!: Sprite;
	public frameFlash!: Sprite;
	public portraitCenterX = 0;
	public portraitCenterY = 0;
	private protectedIcon!: Sprite;
	private lastProtectedState: boolean | null = null;

	public setup(char: Char): void {
		const heroCrest = SCENE_LAYOUT.game.heroCrest;
		const frameTexture = getTexture('assets/char_frame.png');
		const frameScale = heroCrest.width / frameTexture.width;
		const portraitCenterX = heroCrest.x + Math.round(HERO_FRAME_CENTER_OFFSET * frameScale);
		const portraitCenterY = heroCrest.y + Math.round(HERO_FRAME_CENTER_OFFSET * frameScale);
		const portraitMaskRadius = Math.round(PORTRAIT_MASK_RADIUS_BASE * frameScale);
		const portrait = new Sprite(char.portrait);
		const portraitMask = new Graphics();

		this.frame = new Sprite(frameTexture);
		this.frame.scale.set(frameScale);
		this.frame.x = heroCrest.x;
		this.frame.y = heroCrest.y;
		this.portraitCenterX = portraitCenterX;
		this.portraitCenterY = portraitCenterY;

		this.frameFlash = new Sprite(frameTexture);
		this.frameFlash.scale.set(frameScale);
		this.frameFlash.x = this.frame.x;
		this.frameFlash.y = this.frame.y;
		this.frameFlash.tint = COLOR_DAMAGE_FLASH;
		this.frameFlash.alpha = 0;

		const coverW = portraitMaskRadius * 5;
		const coverH = portraitMaskRadius * 5;
		const texW = portrait.texture.width || portrait.width;
		const texH = portrait.texture.height || portrait.height;
		portrait.scale.set(Math.max(coverW / texW, coverH / texH));
		portrait.anchor.set(0.5);
		portrait.x = portraitCenterX - Math.round(portraitMaskRadius * PORTRAIT_OFFSET_X_FRACTION);
		portrait.y = portraitCenterY + Math.round(portraitMaskRadius * PORTRAIT_OFFSET_Y_FRACTION);

		portraitMask.circle(portraitCenterX, portraitCenterY, portraitMaskRadius).fill({ color: COLOR_WHITE, alpha: 1 });
		portrait.mask = portraitMask;

		this.protectedIcon = new Sprite(getTexture('assets/protected_icon.png'));
		this.protectedIcon.anchor.set(0.5);
		this.protectedIcon.x = portraitCenterX + PROTECTED_ICON_OFFSET_X;
		this.protectedIcon.y = portraitCenterY - PROTECTED_ICON_OFFSET_Y;
		this.protectedIcon.scale.x = this.protectedIcon.scale.y = Math.min(PROTECTED_ICON_MAX_SIZE / this.protectedIcon.width, PROTECTED_ICON_MAX_SIZE / this.protectedIcon.height);
		this.protectedIcon.visible = false;

		this.container.addChild(portrait);
		this.container.addChild(portraitMask);
		this.container.addChild(this.frame);
		this.container.addChild(this.frameFlash);
		this.container.addChild(this.protectedIcon);
	}

	public updateProtected(visible: boolean): void {
		if (visible === this.lastProtectedState) return;
		this.lastProtectedState = visible;
		this.protectedIcon.visible = visible;
	}

	public destroy(): void {
		gsap.killTweensOf([this.container, this.container.scale, this.frame, this.frameFlash]);
	}
}
