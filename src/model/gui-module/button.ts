import { Sprite, Rectangle, Texture, TextStyle, Container, Text } from 'pixi.js';

const BUTTON_TEXT_Y_RATIO = 0.45;
const DISABLED_CONTAINER_ALPHA = 0.62;
const DISABLED_TEXT_ALPHA = 0.86;

export class Button {
	public readonly btnContainer = new Container();
	public readonly btn!: Sprite;
	public readonly btnText!: Text;
	private disabled = false;
	private hovered = false;
	private pressed = false;

	constructor(
		private readonly containerHeight: number,
		private readonly containerWidth: number,
		private readonly textureBtn: Texture,
		private readonly textureBtnOver: Texture,
		private readonly textureBtnDown: Texture,
		public readonly text: string,
		private readonly style: TextStyle
	) {
		this.btnContainer.hitArea = new Rectangle(0, 0, containerWidth, containerHeight);

		this.btn = new Sprite(textureBtn);
		this.btn.anchor.set(0.5);

		this.btnContainer
			.on('pointerover', () => {
				this.hovered = true;
				this.updateTexture();
			})
			.on('pointerout', () => {
				this.hovered = false;
				this.pressed = false;
				this.updateTexture();
			})
			.on('pointerdown', () => {
				this.pressed = true;
				this.updateTexture();
			})
			.on('pointerup', () => {
				this.pressed = false;
				this.updateTexture();
			})
			.on('pointerupoutside', () => {
				this.pressed = false;
				this.hovered = false;
				this.updateTexture();
			});

		this.btnText = new Text({ text, style });
		this.btnText.anchor.set(0.5);
		this.btnText.x = this.containerWidth / 2;
		this.btnText.y = this.containerHeight * BUTTON_TEXT_Y_RATIO;

		this.btnContainer.addChild(this.btn);
		this.btnContainer.addChild(this.btnText);

		this.btnContainer.eventMode = 'static';
		this.btnContainer.cursor = 'pointer';
		this.updateTexture();
	}

	private updateTexture(): void {
		let nextTexture = this.textureBtn;

		if (this.disabled) {
			nextTexture = this.textureBtnDown;
		} else if (this.pressed) {
			nextTexture = this.textureBtnDown;
		} else if (this.hovered) {
			nextTexture = this.textureBtnOver;
		}

		this.btn.texture = nextTexture;
		this.layoutButtonSprite(nextTexture);
	}

	private layoutButtonSprite(texture: Texture): void {
		const sourceWidth = texture.orig.width || texture.width;
		const sourceHeight = texture.orig.height || texture.height;
		const scaleX = this.containerWidth / sourceWidth;
		const scaleY = this.containerHeight / sourceHeight;

		this.btn.scale.set(scaleX, scaleY);
		this.btn.position.set(this.containerWidth / 2, this.containerHeight / 2);
	}

	public setDisabled(disabled: boolean): void {
		if (this.disabled === disabled) {
			return;
		}
		this.disabled = disabled;
		this.btnContainer.alpha = disabled ? DISABLED_CONTAINER_ALPHA : 1;
		this.btnContainer.cursor = disabled ? 'default' : 'pointer';
		this.btnText.alpha = disabled ? DISABLED_TEXT_ALPHA : 1;
		this.updateTexture();
	}

	public destroy(): void {
		this.btnContainer.removeAllListeners();
	}
}
