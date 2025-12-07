import { Component, OnInit } from '@angular/core';
import {
  Aula,
  CreateSolicitudDto,
  DisponibilidadHora,
} from '../../models/interfaces';
import { ReservaService } from '../../services/reserva.service';
import { Router } from '@angular/router';
import { AulaService } from '../../services/aula.service';
import { stringify } from 'querystring';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-nueva-reserva',
  templateUrl: './nueva-reserva.component.html',
  styleUrl: './nueva-reserva.component.css',
})
export class NuevaReservaComponent implements OnInit {
  // Steps del wizard
  currentStep: number = 1;

  // Datos del formulario
  aulas: Aula[] = [];
  aulaSeleccionada: Aula | null = null;
  fechaSeleccionada: string = '';
  disponibilidad: DisponibilidadHora[] = [];
  horarioSeleccionado: DisponibilidadHora | null = null;
  motivo: string = '';

  // Estados
  loading: boolean = false;
  loadingDisponibilidad: boolean = false;
  error: string = '';

  // Usuario (temporal - reemplazar con el real del login)
  usuarioId: number = 7; // TODO: Obtener del servicio de autenticación

  constructor(
    private router: Router,
    private aulaService: AulaService,
    private reservaService: ReservaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAulas();
    this.setFechaMinima();
  }

  setFechaMinima(): void {
    // Establecer fecha mínima como hoy
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.fechaSeleccionada = `${year}-${month}-${day}`;
  }

  async loadAulas(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      this.aulas = await this.aulaService.getAulas();
      this.aulas = this.aulas.filter((aula) => aula.estatus); // Solo aulas activas
    } catch (err: any) {
      this.error = 'Error al cargar las aulas. Por favor, intenta nuevamente.';
      console.error('Error loading aulas:', err);
    } finally {
      this.loading = false;
    }
  }

  onSelectAula(aula: Aula): void {
    this.aulaSeleccionada = aula;
    this.disponibilidad = [];
    this.horarioSeleccionado = null;
    this.currentStep = 2;
  }

  async onFechaChange(): Promise<void> {
    if (!this.aulaSeleccionada || !this.fechaSeleccionada) return;

    this.loadingDisponibilidad = true;
    this.error = '';
    this.disponibilidad = [];
    this.horarioSeleccionado = null;

    try {
      this.disponibilidad =
        (await this.reservaService
          .getDisponibilidad(
            // Use await to resolve the Observable
            this.aulaSeleccionada.id,
            this.fechaSeleccionada
          )
          .toPromise()) ?? []; // Convert Observable to Promise
      this.currentStep = 3;
    } catch (err: any) {
      this.error =
        'Error al cargar la disponibilidad. Por favor, intenta nuevamente.';
      console.error('Error loading disponibilidad:', err);
    } finally {
      this.loadingDisponibilidad = false;
    }
  }

  onSelectHorario(horario: DisponibilidadHora): void {
    if (!horario.disponible) return;
    this.horarioSeleccionado = horario;
    this.currentStep = 4;
  }

  async onConfirmarReserva(): Promise<void> {
    if (!this.isFormValid()) {
      this.error = 'Por favor, completa todos los campos.';
      return;
    }

    this.loading = true;
    this.error = '';

    const userId = this.authService.userId;
    if (!userId) {
      this.error =
        'No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.';
      this.authService.logout();
      return;
    }

    try {
      const dto: CreateSolicitudDto = {
        fecha: this.fechaSeleccionada,
        horaInicio: this.horarioSeleccionado!.horaInicio,
        horaFin: this.horarioSeleccionado!.horaFin,
        motivo: this.motivo.trim(),
        usuarioId: userId,
        aulaId: this.aulaSeleccionada!.id,
      };

      const response = await firstValueFrom(
        this.reservaService.createSolicitud(dto)
      );
      console.log('Respuesta:', response);
      await this.authService.refreshUser();

      alert('¡Reserva creada exitosamente!');
      this.router.navigate(['/home']);
    } catch (err: any) {
      if (err.status === 409) {
        this.error = 'Ya existe una reserva en ese horario.';
      } else {
        this.error = err.error?.message || 'Error al crear la reserva.';
      }
    } finally {
      this.loading = false;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.aulaSeleccionada &&
      this.fechaSeleccionada &&
      this.horarioSeleccionado &&
      this.motivo.trim().length > 0
    );
  }

  formatTime(time: string): string {
    // Convertir "07:30:00" a "7:30 AM"
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  onBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 1) {
        this.aulaSeleccionada = null;
        this.disponibilidad = [];
        this.horarioSeleccionado = null;
        this.motivo = '';
      } else if (this.currentStep === 2) {
        this.disponibilidad = [];
        this.horarioSeleccionado = null;
        this.motivo = '';
      } else if (this.currentStep === 3) {
        this.horarioSeleccionado = null;
        this.motivo = '';
      }
    } else {
      this.router.navigate(['/home']);
    }
  }

  // Métodos auxiliares eliminados - Ya no son necesarios
}
