import type { Char } from './char-module/char';
import type { Reel } from './reel';

export interface CharSelectHandler {
	readonly reel: Reel;
	char: Char;
	setup(): void;
}
