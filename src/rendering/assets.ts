import { Assets, Texture } from 'pixi.js';

const ASSET_PATHS = [
	'assets/3xBAR.png',
	'assets/BAR.png',
	'assets/2xBAR.png',
	'assets/7.png',
	'assets/Cherry.png',
	'assets/berserker.png',
	'assets/berserker_background.png',
	'assets/warrior.png',
	'assets/warrior_background.png',
	'assets/cleric.png',
	'assets/cleric_background.png',
	'assets/mage.png',
	'assets/mage_background.png',
	'assets/life_icon.png',
	'assets/credit_icon.png',
	'assets/button.png',
	'assets/button-HOVER.png',
	'assets/button-PUSH.png',
	'assets/background_frame.png',
	'assets/paytable_frame.png',
	'assets/paytable_frame_highlight.png',
	'assets/char_frame.png',
	'assets/life_bar.png',
	'assets/potion_icon.png',
	'assets/skill_bar_full.png',
	'assets/skill_bar_empty.png',
	'assets/CherryIcon.png',
	'assets/7Icon.png',
	'assets/CherrySevenIcon.png',
	'assets/X3BarIcon.png',
	'assets/X2BarIcon.png',
	'assets/BarIcon.png',
	'assets/AnyBarIcon.png',
	'assets/coin.png',
	'assets/coin_reward.png',
	'assets/xp_reward.png',
	'assets/info.png',
	'assets/info-HOVER.png',
	'assets/info-PUSH.png',
	'assets/protected_icon.png',
	'assets/hit.png',
	'assets/lose_msg.png'
];

const cache = new Map<string, Texture>();

export async function preloadAssets(onProgress?: (pct: number) => void): Promise<void> {
	const total = ASSET_PATHS.length;
	let loaded = 0;
	for (const path of ASSET_PATHS) {
		const texture = await Assets.load<Texture>(path);
		cache.set(path, texture);
		loaded++;
		onProgress?.(Math.round((loaded / total) * 100));
	}
}

export function getTexture(path: string): Texture {
	const tex = cache.get(path);
	if (!tex) {
		throw new Error(`Asset not loaded: ${path}`);
	}
	return tex;
}
