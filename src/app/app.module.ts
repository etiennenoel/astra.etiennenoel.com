import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import {RootComponent} from './components/root/root.component';
import { HomeComponent } from './pages/home/home.component';
import {LayoutComponent} from './components/layout/layout.component';

@NgModule({
  declarations: [
    LayoutComponent,
    RootComponent,


    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
