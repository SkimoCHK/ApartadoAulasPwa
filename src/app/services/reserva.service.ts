import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  CreateSolicitudDto,
  DisponibilidadHora,
  SolicitudApartado,
} from '../models/interfaces';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private offlineStorage: OfflineStorageService,
    private networkStatus: NetworkStatusService
  ) {}

  /**
   * Obtiene la disponibilidad de un aula en una fecha específica
   */
  getDisponibilidad(
    aulaId: number,
    fecha: string
  ): Observable<DisponibilidadHora[]> {
    if (!this.networkStatus.isOnline) {
      return throwError(() => new Error('Sin conexión a internet'));
    }

    const params = new HttpParams()
      .set('aulaId', aulaId.toString())
      .set('fecha', fecha);

    return new Observable((subscriber) => {
      this.http
        .get<DisponibilidadHora[]>(
          `${this.apiUrl}/SolicitudApartado/Disponibilidad`,
          { params }
        )
        .pipe(
          catchError((error) => {
            subscriber.error(error);
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (disponibilidad) => {
            this.offlineStorage.cacheDisponibilidad(
              aulaId,
              fecha,
              disponibilidad
            );
            subscriber.next(disponibilidad);
            subscriber.complete();
          },
          error: (error) => {
            subscriber.error(error);
          },
        });
    });
  }

  /**
   * Crea una nueva solicitud de apartado/reserva
   */
  async createSolicitud(dto: CreateSolicitudDto): Promise<SolicitudApartado> {
    try {
      const response = await new Promise<SolicitudApartado>(
        (resolve, reject) => {
          this.http
            .post<SolicitudApartado>(
              `${this.apiUrl}/SolicitudApartado/CreateSolicitud`,
              dto
            )
            .pipe(
              catchError((error: HttpErrorResponse) => {
                // Extraer el mensaje de error del body si existe
                const errorMessage = this.extractErrorMessage(error);
                const customError = new Error(errorMessage);
                (customError as any).status = error.status;
                (customError as any).statusCode = error.status;
                reject(customError);
                return throwError(() => customError);
              })
            )
            .subscribe({
              next: resolve,
              error: reject,
            });
        }
      );

      console.log('✅ Reserva creada exitosamente en línea');
      return response;
    } catch (error: any) {
      // Si hay error y estamos offline
      if (!this.networkStatus.isOnline) {
        console.warn('📱 Sin conexión - Guardando reserva como pendiente');
        const aula = this.offlineStorage
          .getAulasCache()
          .find((a) => a.id === dto.aulaId);
        this.offlineStorage.savePendingReserva(dto, aula);
        throw new Error(
          'OFFLINE: Reserva guardada localmente. Se sincronizará cuando haya conexión.'
        );
      }

      // Re-lanzar el error
      throw error;
    }
  }

  /**
   * Extrae el mensaje de error de la respuesta HTTP
   */
  private extractErrorMessage(error: HttpErrorResponse): string {
    // Intentar diferentes formas de obtener el mensaje
    if (error.error?.errorMessage) {
      return error.error.errorMessage;
    }
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.error?.detail) {
      return error.error.detail;
    }
    if (typeof error.error === 'string') {
      return error.error;
    }

    // Mensajes por código de estado
    switch (error.status) {
      case 409:
        return 'Ya existe una reserva en ese horario. Por favor, selecciona otro.';
      case 400:
        return 'Datos inválidos. Por favor, verifica tu solicitud.';
      case 401:
        return 'No estás autenticado. Por favor, inicia sesión nuevamente.';
      case 403:
        return 'No tienes permisos para crear esta reserva.';
      case 500:
        return 'Error en el servidor. Por favor, intenta más tarde.';
      default:
        return `Error: ${error.status} ${error.statusText}`;
    }
  }

  getSolicitudes(): Observable<SolicitudApartado[]> {
    return this.http.get<SolicitudApartado[]>(this.apiUrl);
  }

  getSolicitudById(id: number): Observable<SolicitudApartado> {
    return this.http.get<SolicitudApartado>(`${this.apiUrl}/${id}`);
  }
}
