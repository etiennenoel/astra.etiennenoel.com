import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Added this line

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
    AppRoutingModule,
    FormsModule // Added this line
  ],
  providers: [
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [RootComponent]
})
export class AppModule { }
