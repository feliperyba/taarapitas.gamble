import { Reel } from '../reel';
import { COMBINATIONS } from './combinations';

export interface WinResult {
	combination: COMBINATIONS;
	positionIndex: number;
}

export function applyWinHighlight(reel: Reel, positionIndex: number): void {
	for (const r of reel.reelArr) {
		r.container.children[positionIndex].tint = 0xff0000;
	}
	reel.reelWinSlotPos = positionIndex;
}

export function clearWinHighlight(reel: Reel, positionIndex: number): void {
	for (const r of reel.reelArr) {
		r.container.children[positionIndex].tint = 0xffffff;
	}
	reel.reelWinSlotPos = undefined;
}
