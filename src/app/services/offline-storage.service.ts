import { Injectable } from '@angular/core';
import {
  CreateSolicitudDto,
  Aula,
  DisponibilidadHora,
} from '../models/interfaces';

export interface PendingReserva extends CreateSolicitudDto {
  id: string; // ID temporal único
  timestamp: number; // Cuando se creó
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  aulaInfo?: Aula; // Info del aula para mostrar
}

@Injectable({
  providedIn: 'root',
})
export class OfflineStorageService {
  private readonly STORAGE_KEYS = {
    PENDING_RESERVAS: 'pending_reservas',
    AULAS_CACHE: 'aulas_cache',
    DISPONIBILIDAD_CACHE: 'disponibilidad_cache',
    LAST_SYNC: 'last_sync_timestamp',
  };

  constructor() {}

  // =====================================================
  // RESERVAS PENDIENTES
  // =====================================================

  /**
   * Guarda una reserva pendiente de sincronizar
   */
  savePendingReserva(
    reserva: CreateSolicitudDto,
    aulaInfo?: Aula
  ): PendingReserva {
    const pendingReserva: PendingReserva = {
      ...reserva,
      id: this.generateId(),
      timestamp: Date.now(),
      syncStatus: 'pending',
      aulaInfo,
    };

    const pendingReservas = this.getPendingReservas();
    pendingReservas.push(pendingReserva);

    localStorage.setItem(
      this.STORAGE_KEYS.PENDING_RESERVAS,
      JSON.stringify(pendingReservas)
    );

    console.log('Reserva guardada offline:', pendingReserva);
    return pendingReserva;
  }

  /**
   * Obtiene todas las reservas pendientes
   */
  getPendingReservas(): PendingReserva[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.PENDING_RESERVAS);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Obtiene el número de reservas pendientes
   */
  getPendingReservasCount(): number {
    return this.getPendingReservas().filter((r) => r.syncStatus === 'pending')
      .length;
  }

  /**
   * Actualiza el estado de una reserva pendiente
   */
  updateReservaStatus(
    id: string,
    status: PendingReserva['syncStatus'],
    errorMessage?: string
  ): void {
    const reservas = this.getPendingReservas();
    const index = reservas.findIndex((r) => r.id === id);

    if (index !== -1) {
      reservas[index].syncStatus = status;
      if (errorMessage) {
        reservas[index].errorMessage = errorMessage;
      }
      localStorage.setItem(
        this.STORAGE_KEYS.PENDING_RESERVAS,
        JSON.stringify(reservas)
      );
    }
  }

  /**
   * Elimina una reserva pendiente (después de sincronizar)
   */
  removePendingReserva(id: string): void {
    const reservas = this.getPendingReservas();
    const filtered = reservas.filter((r) => r.id !== id);
    localStorage.setItem(
      this.STORAGE_KEYS.PENDING_RESERVAS,
      JSON.stringify(filtered)
    );
  }

  /**
   * Limpia todas las reservas sincronizadas
   */
  clearSyncedReservas(): void {
    const reservas = this.getPendingReservas();
    const pending = reservas.filter((r) => r.syncStatus !== 'synced');
    localStorage.setItem(
      this.STORAGE_KEYS.PENDING_RESERVAS,
      JSON.stringify(pending)
    );
  }

  // =====================================================
  // CACHE DE AULAS
  // =====================================================

  /**
   * Guarda las aulas en caché
   */
  setAulasCache(aulas: Aula[]): void {
    localStorage.setItem(this.STORAGE_KEYS.AULAS_CACHE, JSON.stringify(aulas));
    console.log('Aulas guardadas en caché');
  }

  /**
   * Obtiene las aulas del caché
   */
  getAulasCache(): Aula[] {
    const data = localStorage.getItem(this.STORAGE_KEYS.AULAS_CACHE);
    return data ? JSON.parse(data) : [];
  }

  // =====================================================
  // CACHE DE DISPONIBILIDAD
  // =====================================================

  /**
   * Guarda disponibilidad en cache (por aula y fecha)
   */
  cacheDisponibilidad(
    aulaId: number,
    fecha: string,
    disponibilidad: DisponibilidadHora[]
  ): void {
    const key = `${aulaId}_${fecha}`;
    const cache = this.getDisponibilidadCache();

    cache[key] = {
      data: disponibilidad,
      timestamp: Date.now(),
    };

    localStorage.setItem(
      this.STORAGE_KEYS.DISPONIBILIDAD_CACHE,
      JSON.stringify(cache)
    );
  }

  /**
   * Obtiene disponibilidad del cache
   */
  getCachedDisponibilidad(
    aulaId: number,
    fecha: string
  ): DisponibilidadHora[] | null {
    const key = `${aulaId}_${fecha}`;
    const cache = this.getDisponibilidadCache();

    if (!cache[key]) return null;

    const { data, timestamp } = cache[key];

    // Cache válido por 1 hora
    const maxAge = 60 * 60 * 1000;
    if (Date.now() - timestamp < maxAge) {
      return data;
    }

    return null;
  }

  private getDisponibilidadCache(): any {
    const cached = localStorage.getItem(this.STORAGE_KEYS.DISPONIBILIDAD_CACHE);
    return cached ? JSON.parse(cached) : {};
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  /**
   * Actualiza timestamp de última sincronización
   */
  updateLastSync(): void {
    localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  }

  /**
   * Obtiene el timestamp de la última sincronización
   */
  getLastSync(): number | null {
    const timestamp = localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
    return timestamp ? parseInt(timestamp) : null;
  }

  /**
   * Limpia todo el cache
   */
  clearAllCache(): void {
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    console.log('Cache limpiado completamente');
  }

  /**
   * Genera un ID único temporal
   */
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene el tamaño del cache en KB
   */
  getCacheSize(): number {
    let totalSize = 0;
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length;
      }
    });
    return Math.round(totalSize / 1024); // KB
  }
}
