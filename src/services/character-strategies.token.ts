import { InjectionToken } from '@angular/core';
import type { CharStrategy } from '../model/char-module/char-strategy/char-strategy';

export const CHARACTER_STRATEGIES = new InjectionToken<CharStrategy[]>(
	'CHARACTER_STRATEGIES'
);
