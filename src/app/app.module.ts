import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { CommonModule, APP_BASE_HREF, LocationStrategy, HashLocationStrategy } from '@angular/common';
import { AppComponent } from './app.component';
import { DebuggerComponent } from '../components/debug/debug.component';
import { FormsModule } from '@angular/forms';
import { GameLogicService } from '../services/game-logic.service';
import { DebuggerService } from '../services/debugger.service';
@NgModule({
	declarations: [ AppComponent, DebuggerComponent ],
	imports: [ BrowserModule, FormsModule ],
	providers: [
		GameLogicService,
		DebuggerService,
		{ provide: APP_BASE_HREF, useValue: '/' },
		{ provide: LocationStrategy, useClass: HashLocationStrategy }
	],
	bootstrap: [ AppComponent ] // boostrap the app component
})
export class AppModule {}
