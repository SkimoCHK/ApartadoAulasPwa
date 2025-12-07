import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public online$: Observable<boolean> = this.onlineSubject.asObservable();

  constructor() {
    // Escuchar eventos de conexión
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(status => {
      console.log('Estado de red:', status ? 'Online' : 'Offline');
      this.onlineSubject.next(status);
    });
  }

  /**
   * Obtiene el estado actual de la conexión
   */
  get isOnline(): boolean {
    return this.onlineSubject.value;
  }

  /**
   * Obtiene el estado actual como Observable
   */
  getNetworkStatus(): Observable<boolean> {
    return this.online$;
  }
}