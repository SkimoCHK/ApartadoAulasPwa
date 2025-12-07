import { Injectable } from '@angular/core';
import { NetworkStatusService } from './network-status.service';
import { OfflineStorageService } from './offline-storage.service';
import { ReservaService } from './reserva.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';

export interface SyncStatus {
  isSyncing: boolean;
  totalPending: number;
  syncedCount: number;
  failedCount: number;
  lastSyncDate: Date | null;
}

@Injectable({
  providedIn: 'root',
})
export class SyncService {
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isSyncing: false,
    totalPending: 0,
    syncedCount: 0,
    failedCount: 0,
    lastSyncDate: null,
  });

  public syncStatus$: Observable<SyncStatus> =
    this.syncStatusSubject.asObservable();

  constructor(
    private networkStatus: NetworkStatusService,
    private offlineStorage: OfflineStorageService,
    private reservaService: ReservaService,
    private authService: AuthService
  ) {
    // Escuchar cambios de red
    this.networkStatus.getNetworkStatus().subscribe((isOnline) => {
      if (isOnline) {
        console.log('🌐 Conexión restaurada, iniciando sincronización...');
        this.syncPendingReservas();
      }
    });

    // Sincronizar al inicio si hay conexión
    if (this.networkStatus.isOnline) {
      this.syncPendingReservas();
    }
  }

  /**
   * Sincroniza todas las reservas pendientes
   */
  async syncPendingReservas(): Promise<void> {
    if (!this.networkStatus.isOnline) {
      console.log('❌ No hay conexión para sincronizar');
      return;
    }

    const pendingReservas = this.offlineStorage
      .getPendingReservas()
      .filter((r) => r.syncStatus === 'pending' || r.syncStatus === 'error');

    if (pendingReservas.length === 0) {
      console.log('✅ No hay reservas pendientes');
      return;
    }

    // Actualizar estado
    this.updateSyncStatus({
      isSyncing: true,
      totalPending: pendingReservas.length,
      syncedCount: 0,
      failedCount: 0,
      lastSyncDate: this.syncStatusSubject.value.lastSyncDate,
    });

    console.log(`🔄 Sincronizando ${pendingReservas.length} reservas...`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const reserva of pendingReservas) {
      try {
        // Marcar como sincronizando
        this.offlineStorage.updateReservaStatus(reserva.id, 'syncing');

        // Intentar crear la reserva - Ahora es una Promise
        await this.reservaService.createSolicitud({
          fecha: reserva.fecha,
          horaInicio: reserva.horaInicio,
          horaFin: reserva.horaFin,
          motivo: reserva.motivo,
          usuarioId: reserva.usuarioId,
          aulaId: reserva.aulaId,
        });

        // Éxito - marcar como sincronizada
        this.offlineStorage.updateReservaStatus(reserva.id, 'synced');
        syncedCount++;

        console.log(
          `✅ Reserva sincronizada: ${
            reserva.aulaInfo?.nombre || reserva.aulaId
          }`
        );
      } catch (error: any) {
        // Error - marcar como error
        failedCount++;
        const errorMsg =
          error.message || error.error?.message || 'Error al sincronizar';
        this.offlineStorage.updateReservaStatus(reserva.id, 'error', errorMsg);

        console.error(`❌ Error sincronizando reserva ${reserva.id}:`, error);
      }
    }

    // Limpiar reservas sincronizadas exitosamente
    this.offlineStorage.clearSyncedReservas();

    // Actualizar información del usuario
    if (syncedCount > 0) {
      await this.authService.refreshUser();
    }

    // Actualizar timestamp de última sincronización
    this.offlineStorage.updateLastSync();

    // Actualizar estado final
    this.updateSyncStatus({
      isSyncing: false,
      totalPending: failedCount, // Solo las que fallaron quedan pendientes
      syncedCount,
      failedCount,
      lastSyncDate: new Date(),
    });

    // Notificar al usuario
    if (syncedCount > 0) {
      console.log(`✅ ${syncedCount} reserva(s) sincronizada(s) exitosamente`);
      this.showNotification(
        `✅ ${syncedCount} reserva(s) sincronizada(s)`,
        'success'
      );
    }

    if (failedCount > 0) {
      console.warn(`⚠️ ${failedCount} reserva(s) no pudieron sincronizarse`);
      this.showNotification(`⚠️ ${failedCount} reserva(s) fallaron`, 'warning');
    }
  }

  /**
   * Fuerza una sincronización manual
   */
  async forceSyncPendingReservas(): Promise<void> {
    if (!this.networkStatus.isOnline) {
      this.showNotification('❌ No hay conexión a internet', 'error');
      return;
    }

    await this.syncPendingReservas();
  }

  /**
   * Obtiene el estado actual de sincronización
   */
  getCurrentSyncStatus(): SyncStatus {
    return this.syncStatusSubject.value;
  }

  /**
   * Actualiza el estado de sincronización
   */
  private updateSyncStatus(status: SyncStatus): void {
    this.syncStatusSubject.next(status);
  }

  /**
   * Muestra una notificación al usuario
   */
  private showNotification(
    message: string,
    type: 'success' | 'warning' | 'error'
  ): void {
    // Aquí puedes usar un servicio de notificaciones/toasts si tienes
    // Por ahora solo un alert simple
    if (type === 'success') {
      console.log('🎉', message);
    } else if (type === 'warning') {
      console.warn('⚠️', message);
    } else {
      console.error('❌', message);
    }
  }

  /**
   * Reintenta sincronizar una reserva específica
   */
  async retrySingleReserva(reservaId: string): Promise<boolean> {
    if (!this.networkStatus.isOnline) {
      this.showNotification('❌ No hay conexión a internet', 'error');
      return false;
    }

    const reservas = this.offlineStorage.getPendingReservas();
    const reserva = reservas.find((r) => r.id === reservaId);

    if (!reserva) {
      console.error('Reserva no encontrada:', reservaId);
      return false;
    }

    try {
      this.offlineStorage.updateReservaStatus(reservaId, 'syncing');

      // Ahora es una Promise
      await this.reservaService.createSolicitud({
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        motivo: reserva.motivo,
        usuarioId: reserva.usuarioId,
        aulaId: reserva.aulaId,
      });

      this.offlineStorage.removePendingReserva(reservaId);
      await this.authService.refreshUser();

      this.showNotification('✅ Reserva sincronizada', 'success');
      return true;
    } catch (error: any) {
      const errorMsg =
        error.message || error.error?.message || 'Error al sincronizar';
      this.offlineStorage.updateReservaStatus(reservaId, 'error', errorMsg);
      this.showNotification(`❌ ${errorMsg}`, 'error');
      return false;
    }
  }

  /**
   * Cancela una reserva pendiente
   */
  cancelPendingReserva(reservaId: string): void {
    this.offlineStorage.removePendingReserva(reservaId);
    this.showNotification('Reserva pendiente cancelada', 'success');
  }
}
