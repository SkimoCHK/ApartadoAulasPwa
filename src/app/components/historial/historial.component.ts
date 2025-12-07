import { Component, OnInit } from '@angular/core';
import { ReservaHistorial } from '../../models/interfaces';
import { ReservaService } from '../../services/reserva.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css',
})
export class HistorialComponent implements OnInit {
  reservas: ReservaHistorial[] = [];
  loading: boolean = false;
  error: string = '';

  // Filtros
  filtroEstado: string = '';
  estados: string[] = ['Confirmada', 'Cancelada', 'Completada', 'Pendiente'];

  usuarioId: number = 0;

  constructor(
    private reservaService: ReservaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioId = this.authService.userId || 0;
    if (this.usuarioId > 0) {
      this.loadHistorial();
    } else {
      this.error = 'No hay usuario logueado';
      this.authService.logout();
    }
  }

  async loadHistorial(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      this.reservas = await this.reservaService.getHistorialReservas(
        this.usuarioId
      );
      console.log('Historial cargado:', this.reservas);
    } catch (err: any) {
      this.error =
        'Error al cargar el historial. Por favor, intenta nuevamente.';
      console.error('Error loading historial:', err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Obtiene las reservas filtradas por estado (si se selecciona uno)
   */
  get reservasFiltradas(): ReservaHistorial[] {
    if (!this.filtroEstado) {
      return this.reservas;
    }
    return this.reservas.filter((r) => r.estado === this.filtroEstado);
  }

  /**
   * Formatea la fecha a formato legible
   */
  formatDate(fecha: string): string {
    try {
      // Si viene con timestamp (ISO format), extraer solo la fecha
      if (fecha.includes('T')) {
        fecha = fecha.split('T')[0];
      }

      const date = new Date(fecha + 'T00:00:00');
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return fecha; // Si hay error, devolver la fecha original
    }
  }

  /**
   * Obtiene el nombre del día de la semana
   */
  getDayName(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  }

  /**
   * Formatea la hora
   */
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  /**
   * Obtiene la clase CSS según el estado
   */
  getStatusClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return 'status-confirmada';
      case 'cancelada':
        return 'status-cancelada';
      case 'completada':
        return 'status-completada';
      case 'pendiente':
        return 'status-pendiente';
      default:
        return 'status-default';
    }
  }

  /**
   * Obtiene el color del icono según el estado
   */
  getStatusIcon(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return '✅';
      case 'cancelada':
        return '❌';
      case 'completada':
        return '✔️';
      case 'pendiente':
        return '⏳';
      default:
        return '📋';
    }
  }

  /**
   * Volver atrás
   */
  onBack(): void {
    this.router.navigate(['/home']);
  }

  /**
   * Limpiar filtro
   */
  clearFilter(): void {
    this.filtroEstado = '';
  }

  /**
   * Retornar el total de reservas filtradas
   */
  get totalReservas(): number {
    return this.reservasFiltradas.length;
  }
}
