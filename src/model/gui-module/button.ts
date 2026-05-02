import { Sprite, Rectangle, Texture, TextStyle, Container, Text } from 'pixi.js';

export class Button {
	public btnContainer = new Container();
	public Btn: Sprite;
	public btnText: Text;
	private disabled = false;
	private hovered = false;
	private pressed = false;

	constructor(
		private containerHeight: number,
		private containerWidth: number,
		private textureBtn: Texture,
		private textureBtnOver: Texture,
		private textureBtnDown: Texture,
		public text: string,
		private style: TextStyle
	) {
		this.btnContainer.hitArea = new Rectangle(0, 0, containerWidth, containerHeight);

		this.Btn = new Sprite(textureBtn);
		this.Btn.anchor.set(0.5);

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
		this.btnText.y = this.containerHeight * 0.45;

		this.btnContainer.addChild(this.Btn);
		this.btnContainer.addChild(this.btnText);

		this.btnContainer.eventMode = 'static';
		this.btnContainer.cursor = 'pointer';
		this.updateTexture();
	}

	private updateTexture() {
		let nextTexture = this.textureBtn;

		if (this.disabled) {
			nextTexture = this.textureBtnDown;
		} else if (this.pressed) {
			nextTexture = this.textureBtnDown;
		} else if (this.hovered) {
			nextTexture = this.textureBtnOver;
		}

		this.Btn.texture = nextTexture;
		this.layoutButtonSprite(nextTexture);
	}

	private layoutButtonSprite(texture: Texture) {
		const sourceWidth = texture.orig.width || texture.width;
		const sourceHeight = texture.orig.height || texture.height;
		const scaleX = this.containerWidth / sourceWidth;
		const scaleY = this.containerHeight / sourceHeight;

		this.Btn.scale.set(scaleX, scaleY);
		this.Btn.position.set(this.containerWidth / 2, this.containerHeight / 2);
	}

	public setDisabled(disabled: boolean) {
		if (this.disabled === disabled) {
			return;
		}
		this.disabled = disabled;
		this.btnContainer.alpha = disabled ? 0.62 : 1;
		this.btnContainer.cursor = disabled ? 'default' : 'pointer';
		this.btnText.alpha = disabled ? 0.86 : 1;
		this.updateTexture();
	}
}
