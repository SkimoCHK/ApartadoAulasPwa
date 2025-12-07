import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Aula } from '../models/interfaces';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AulaService {

 private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las aulas disponibles
   * GET /api/Aula
   */
  async getAulas(): Promise<Aula[]> {
    try {
      return await firstValueFrom(this.http.get<Aula[]>(`${this.apiUrl}/Aula`));
    } catch (error) {
      console.error('Error en getAulas:', error);
      throw error;
    }
  }

  /**
   * Obtiene un aula por ID
   * GET /api/Aula/{id}
   */
  async getAulaById(id: number): Promise<Aula> {
    try {
      return await firstValueFrom(this.http.get<Aula>(`${this.apiUrl}/Aula/${id}`));
    } catch (error) {
      console.error('Error en getAulaById:', error);
      throw error;
    }
  }
}
