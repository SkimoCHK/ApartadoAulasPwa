import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  Aula,
  CreateSolicitudDto,
  DisponibilidadHora,
} from '../../models/interfaces';
import { ReservaService } from '../../services/reserva.service';
import { Router } from '@angular/router';
import { AulaService } from '../../services/aula.service';
import { AuthService } from '../../services/auth.service';
import { NetworkStatusService } from '../../services/network-status.service';
import {
  OfflineStorageService,
  PendingReserva,
} from '../../services/offline-storage.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-nueva-reserva',
  templateUrl: './nueva-reserva.component.html',
  styleUrl: './nueva-reserva.component.css',
})
export class NuevaReservaComponent implements OnInit, OnDestroy {
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
  isOnline: boolean = false;
  pendingReservas: PendingReserva[] = [];

  // Horarios fijos para offline
  private readonly HORARIOS_FIJOS: DisponibilidadHora[] = [
    { horaInicio: '07:30:00', horaFin: '08:30:00', disponible: true },
    { horaInicio: '08:30:00', horaFin: '09:30:00', disponible: true },
    { horaInicio: '09:30:00', horaFin: '10:30:00', disponible: true },
    { horaInicio: '10:30:00', horaFin: '11:30:00', disponible: true },
    { horaInicio: '11:30:00', horaFin: '12:30:00', disponible: true },
    { horaInicio: '12:30:00', horaFin: '13:30:00', disponible: true },
    { horaInicio: '13:30:00', horaFin: '14:30:00', disponible: true },
    { horaInicio: '14:30:00', horaFin: '15:00:00', disponible: true },
  ];

  // Usuario
  usuarioId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private aulaService: AulaService,
    private reservaService: ReservaService,
    private authService: AuthService,
    private networkStatus: NetworkStatusService,
    private offlineStorage: OfflineStorageService
  ) {}

  ngOnInit(): void {
    this.loadAulas();
    this.setFechaMinima();

    // Obtener usuario ID
    this.usuarioId = this.authService.userId || 0;

    // Monitorear estado de la red
    this.networkStatus
      .getNetworkStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOnline) => {
        this.isOnline = isOnline;
        if (isOnline) {
          this.checkPendingReservas();
        }
      });

    // Mostrar reservas pendientes
    this.loadPendingReservas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFechaMinima(): void {
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
      this.aulas = this.aulas.filter((aula) => aula.estatus);
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
      // Si estamos online, intenta obtener disponibilidad real del servidor
      if (this.isOnline) {
        this.disponibilidad =
          (await this.reservaService
            .getDisponibilidad(this.aulaSeleccionada.id, this.fechaSeleccionada)
            .toPromise()) ?? [];
      } else {
        // Si estamos offline, mostrar horarios fijos
        console.log(
          '📱 Modo offline - Mostrando horarios fijos de 7:30 AM a 3:00 PM'
        );
        this.disponibilidad = JSON.parse(JSON.stringify(this.HORARIOS_FIJOS));
      }
      this.currentStep = 3;
    } catch (err: any) {
      // Si hay error obteniendo disponibilidad y estamos online
      if (this.isOnline) {
        this.error =
          'Error al cargar la disponibilidad. Por favor, intenta nuevamente.';
        console.error('Error loading disponibilidad:', err);
      } else {
        // Si estamos offline, mostrar los horarios fijos
        console.log(
          '📱 Error obteniéndose disponibilidad, usando horarios fijos'
        );
        this.disponibilidad = JSON.parse(JSON.stringify(this.HORARIOS_FIJOS));
        this.currentStep = 3;
      }
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

    if (this.usuarioId <= 0) {
      this.error =
        'No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.';
      this.authService.logout();
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const dto: CreateSolicitudDto = {
        fecha: this.fechaSeleccionada,
        horaInicio: this.horarioSeleccionado!.horaInicio,
        horaFin: this.horarioSeleccionado!.horaFin,
        motivo: this.motivo.trim(),
        usuarioId: this.usuarioId,
        aulaId: this.aulaSeleccionada!.id,
      };

      await this.reservaService.createSolicitud(dto);

      // Éxito
      if (this.isOnline) {
        alert('✅ ¡Reserva creada exitosamente!');
        await this.authService.refreshUser();
      } else {
        alert(
          '📱 Reserva guardada localmente. Se enviará cuando haya conexión.'
        );
        this.loadPendingReservas();
      }
    } catch (err: any) {
      if (err.message?.includes('OFFLINE')) {
        // Guardada offline correctamente
        alert(
          '📱 Reserva guardada localmente. Se enviará cuando haya conexión.'
        );
        this.loadPendingReservas();
      } else if (err.statusCode === 409 || err.status === 409) {
        // Error de conflicto de horario
        this.error = '⚠️ ' + err.message;
        this.loading = false;
        return;
      } else if (err.message) {
        // Cualquier otro error con mensaje
        this.error = '❌ ' + err.message;
        this.loading = false;
        return;
      } else {
        // Error genérico
        this.error =
          '❌ Error al crear la reserva. Por favor, intenta nuevamente.';
        this.loading = false;
        return;
      }
    }

    // Si llegamos aquí, fue exitoso - redirigir a home
    this.resetForm();
    this.loading = false;
    this.router.navigate(['/home']);
  }

  /**
   * Carga las reservas pendientes de sincronizar
   */
  loadPendingReservas(): void {
    this.pendingReservas = this.offlineStorage.getPendingReservas();
  }

  /**
   * Verifica si hay reservas pendientes cuando regresa la conexión
   */
  checkPendingReservas(): void {
    this.loadPendingReservas();
    if (this.pendingReservas.length > 0) {
      console.log(
        `🔄 Hay ${this.pendingReservas.length} reserva(s) pendiente(s) de sincronizar`
      );
      alert(
        `🔄 ${this.pendingReservas.length} reserva(s) pendiente(s) se sincronizarán automáticamente...`
      );
    }
  }

  /**
   * Reintentar una reserva específica
   */
  async retryReserva(reserva: PendingReserva): Promise<void> {
    if (!this.isOnline) {
      this.error = 'No hay conexión a internet';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      this.offlineStorage.updateReservaStatus(reserva.id, 'syncing');

      const dto: CreateSolicitudDto = {
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        motivo: reserva.motivo,
        usuarioId: reserva.usuarioId,
        aulaId: reserva.aulaId,
      };

      await this.reservaService.createSolicitud(dto);

      this.offlineStorage.updateReservaStatus(reserva.id, 'synced');
      this.loadPendingReservas();
      alert('✅ Reserva sincronizada exitosamente');
    } catch (err: any) {
      const errorMsg =
        err.error?.message || err.message || 'Error al sincronizar';
      this.offlineStorage.updateReservaStatus(reserva.id, 'error', errorMsg);
      this.error = '❌ ' + errorMsg;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Elimina una reserva pendiente
   */
  deletePendingReserva(reservaId: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
      this.offlineStorage.removePendingReserva(reservaId);
      this.loadPendingReservas();
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
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  onBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 1) {
        this.resetForm();
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

  private resetForm(): void {
    this.aulaSeleccionada = null;
    this.disponibilidad = [];
    this.horarioSeleccionado = null;
    this.motivo = '';
    this.currentStep = 1;
    this.error = '';
  }
}
