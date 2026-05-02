import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { DebugConfig } from '../model/interfaces';

@Injectable({ providedIn: 'root' })
export class DebuggerService {
	private readonly _debugConfig$: ReplaySubject<DebugConfig> = new ReplaySubject<DebugConfig>(1);
	readonly debugConfig$ = this._debugConfig$.asObservable();

	announceDebugConfig(value: DebugConfig): void {
		this._debugConfig$.next(value);
	}
}
