import { NgModule, isDevMode } from '@angular/core';
import {
  BrowserModule,
  provideClientHydration,
} from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './components/home/home.component';
import { FormsModule } from '@angular/forms';
import { NuevaReservaComponent } from './components/nueva-reserva/nueva-reserva.component';
import { LoginComponent } from './components/login/login.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { OfflineIndicatorComponent } from './components/offline-indicator/offline-indicator.component';
import { NetworkStatusService } from './services/network-status.service';
import { OfflineStorageService } from './services/offline-storage.service';
import { SyncService } from './services/sync.service';
import { HistorialComponent } from './components/historial/historial.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, NuevaReservaComponent, LoginComponent, OfflineIndicatorComponent, HistorialComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, FormsModule, 
  
  ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: !isDevMode(),
  // Register the ServiceWorker as soon as the application is stable
  // or after 30 seconds (whichever comes first).
  registrationStrategy: 'registerWhenStable:30000'
})],
  providers: [
    provideClientHydration(),
    NetworkStatusService,
    OfflineStorageService,
    SyncService
  ],  bootstrap: [AppComponent],
})
export class AppModule {}
