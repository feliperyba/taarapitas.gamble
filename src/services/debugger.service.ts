import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { DebugConfig } from '../model/interfaces';

@Injectable()
export class DebuggerService {
	private readonly debugConfigValue: Subject<DebugConfig | null> = new BehaviorSubject<DebugConfig | null>(null);
	readonly debugConfigValue$ = this.debugConfigValue.asObservable();

	announceValue(value: DebugConfig) {
		this.debugConfigValue.next(value);
	}
}
