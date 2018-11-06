import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable()
export class DebuggerService {
	private debugConfigValue: Subject<any> = new BehaviorSubject<any>(null);
	debugConfigValue$ = this.debugConfigValue.asObservable();

	// Service message commands
	announceValue(value: any) {
		if (this.debugConfigValue != value) {
			this.debugConfigValue.next(value);
		}
	}
}
