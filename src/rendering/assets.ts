import { Assets, Spritesheet, Texture } from 'pixi.js';

export interface AssetLoadProgress {
	path: string;
	loaded: number;
	total: number;
	pct: number;
}

const SPRITESHEET_PATH = 'assets/texture.json';

const cache = new Map<string, Texture>();

export async function preloadAssets(onProgress?: (progress: AssetLoadProgress) => void): Promise<void> {
	onProgress?.({
		path: SPRITESHEET_PATH,
		loaded: 0,
		total: 1,
		pct: 0
	});

	const spritesheet = await Assets.load<Spritesheet>(SPRITESHEET_PATH);

	for (const [frameName, texture] of Object.entries(spritesheet.textures)) {
		cache.set(`assets/${frameName}`, texture);
	}

	onProgress?.({
		path: SPRITESHEET_PATH,
		loaded: 1,
		total: 1,
		pct: 100
	});
}

export function getTexture(path: string): Texture {
	const tex = cache.get(path);
	if (!tex) {
		throw new Error(`Asset not loaded: ${path}`);
	}
	return tex;
}
