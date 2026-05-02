import { Application } from 'pixi.js';

export interface PixiInitOptions {
	width: number;
	height: number;
	background: number;
	resolution: number;
	autoDensity: boolean;
}

export async function createPixiApp(options: Partial<PixiInitOptions>): Promise<Application> {
	const app = new Application();
	await app.init(options);

	app.canvas.style.display = 'block';
	app.canvas.style.position = 'absolute';
	app.canvas.style.inset = '0';

	return app;
}
