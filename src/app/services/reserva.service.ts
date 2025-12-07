import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  CreateSolicitudDto,
  DisponibilidadHora,
  SolicitudApartado,
} from '../models/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ReservaService {

   private apiUrl = '/api';


  constructor(private http: HttpClient) {}

  /**
   * Obtiene la disponibilidad de un aula en una fecha específica
   * GET /api/SolicitudApartado/Disponibilidad?aulaId={aulaId}&fecha={fecha}
   * @param aulaId ID del aula
   * @param fecha Fecha en formato YYYY-MM-DD
   */
  getDisponibilidad(
    aulaId: number,
    fecha: string
  ): Observable<DisponibilidadHora[]> {
    const params = new HttpParams()
      .set('aulaId', aulaId.toString())
      .set('fecha', fecha);

    return this.http.get<DisponibilidadHora[]>(
      `${this.apiUrl}/SolicitudApartado/Disponibilidad`,
      { params }
    );
  }

  /**
   * Crea una nueva solicitud de apartado/reserva
   * POST /api/SolicitudApartado/CreateSolicitud
   * @param dto Datos de la solicitud
   */
  createSolicitud(dto: CreateSolicitudDto): Observable<SolicitudApartado> {
    let response =  this.http.post<SolicitudApartado>(
      `${this.apiUrl}/SolicitudApartado/CreateSolicitud`,
      dto
    );
    return response;
  }

  /**
   * Obtiene todas las solicitudes (si necesitas este endpoint)
   * GET /api/SolicitudApartado
   */
  getSolicitudes(): Observable<SolicitudApartado[]> {
    return this.http.get<SolicitudApartado[]>(this.apiUrl);
  }

  /**
   * Obtiene una solicitud por ID
   * GET /api/SolicitudApartado/{id}
   */
  getSolicitudById(id: number): Observable<SolicitudApartado> {
    return this.http.get<SolicitudApartado>(`${this.apiUrl}/${id}`);
  }
}
