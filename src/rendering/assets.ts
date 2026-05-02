import { Assets, Spritesheet, Texture } from 'pixi.js';

export interface AssetLoadProgress {
	path: string;
	loaded: number;
	total: number;
	pct: number;
}

const SPRITESHEET_PATH = 'assets/texture.json';
const STANDALONE_TEXTURE_PATHS = ['assets/symbol_01.png'] as const;

const cache = new Map<string, Texture>();

export async function preloadAssets(onProgress?: (progress: AssetLoadProgress) => void): Promise<void> {
	const total = 1 + STANDALONE_TEXTURE_PATHS.length;
	let loaded = 0;

	onProgress?.({
		path: SPRITESHEET_PATH,
		loaded,
		total,
		pct: 0
	});

	const spritesheet = await Assets.load<Spritesheet>(SPRITESHEET_PATH);

	for (const [frameName, texture] of Object.entries(spritesheet.textures)) {
		cache.set(`assets/${frameName}`, texture);
	}

	loaded += 1;

	onProgress?.({
		path: SPRITESHEET_PATH,
		loaded,
		total,
		pct: (loaded / total) * 100
	});

	for (const texturePath of STANDALONE_TEXTURE_PATHS) {
		const texture = await Assets.load<Texture>(texturePath);
		cache.set(texturePath, texture);
		loaded += 1;

		onProgress?.({
			path: texturePath,
			loaded,
			total,
			pct: (loaded / total) * 100
		});
	}
}

export function getTexture(path: string): Texture {
	const tex = cache.get(path);
	if (tex) {
		return tex;
	}

	const loadedTexture = Assets.get<Texture>(path);
	if (loadedTexture instanceof Texture) {
		cache.set(path, loadedTexture);
		return loadedTexture;
	}

	throw new Error(`Asset not loaded: ${path}`);
}
