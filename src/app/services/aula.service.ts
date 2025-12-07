import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Aula } from '../models/interfaces';
import { firstValueFrom } from 'rxjs';
import { OfflineStorageService } from './offline-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AulaService {
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private offlineStorage: OfflineStorageService
  ) {}

  /**
   * Obtiene todas las aulas disponibles
   * Intenta primero la red, si falla usa caché offline
   */
  async getAulas(): Promise<Aula[]> {
    try {
      const aulas = await firstValueFrom(
        this.http.get<Aula[]>(`${this.apiUrl}/Aula`)
      );
      // Guarda en caché si se obtienen correctamente
      this.offlineStorage.setAulasCache(aulas);
      return aulas;
    } catch (error) {
      console.error('Error en getAulas (intentando caché offline):', error);
      // Si falla, intenta obtener del caché offline
      const cachedAulas = this.offlineStorage.getAulasCache();
      if (cachedAulas && cachedAulas.length > 0) {
        console.log('Usando aulas en caché offline');
        return cachedAulas;
      }
      throw error;
    }
  }

  /**
   * Obtiene un aula por ID
   */
  async getAulaById(id: number): Promise<Aula> {
    try {
      return await firstValueFrom(
        this.http.get<Aula>(`${this.apiUrl}/Aula/${id}`)
      );
    } catch (error) {
      console.error('Error en getAulaById:', error);
      throw error;
    }
  }
}
