import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SolicitudApartado } from '../../models/interfaces';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  userName: string = '';
  totalReservas: number = 0;
  reservasActivas: number = 0;
  proximasReservas: any[] = [];
  loading: boolean = true;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Suscribirse para recibir actualizaciones automáticas del usuario
    this.authService.currentUser.subscribe((user) => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      // Asignar los valores que vienen actualizados desde refreshUser()
      this.userName = user.nombre;
      this.totalReservas = user.totalReservas;
      this.reservasActivas = user.totalActivasHoy;
      this.proximasReservas = user.proximasReservas || [];

      this.loading = false;

      console.log('Home actualizado con:', user);
    });
  }

  loadUserData(): void {
    let user = this.authService.currentUserValue;
    let userjSon = JSON.stringify(user);
    console.log(user?.proximasReservas);
    console.log('');
    if (user) {
      this.userName = user.nombre;
      this.totalReservas = user.totalReservas;
      this.reservasActivas = user.totalActivasHoy;
      this.proximasReservas = user.proximasReservas || [];
      this.loading = false;
    } else {
      // Si no hay usuario, redirigir al login
      this.router.navigate(['/login']);
    }
  }

  onNuevaReserva(): void {
    this.router.navigate(['/nueva-reserva']);
  }

  onHistorial(): void {
    this.router.navigate(['/historial']);
  }

  onPerfil(): void {
    console.log('Perfil clicked');
    // TODO: Navegar a la página de perfil
    // this.router.navigate(['/perfil']);
  }

  onSoporte(): void {
    console.log('Soporte clicked');
    // TODO: Navegar a la página de soporte
    // this.router.navigate(['/soporte']);
  }

  onLogout(): void {
    this.authService.logout();
  }

  // --- Nuevas y Modificadas Funciones de Formato para Próximas Reservas ---

  /**
   * Obtiene el nombre corto del día de la semana (ej: Mar, Jue).
   * @param dateOnlyString String de la propiedad Fecha (ej: "2025-11-11").
   * @returns Nombre corto del día.
   */
  getDayName(dateOnlyString: string): string {
    // Usamos el constructor Date con el string 'YYYY-MM-DD'
    const date = new Date(dateOnlyString + 'T00:00:00');
    return date
      .toLocaleDateString('es-MX', {
        weekday: 'short', // 'short' para "Mar."
      })
      .replace('.', ''); // Eliminar el punto (ej: "Mar")
  }

  /**
   * Formatea la fecha para mostrar el día y mes (ej: 11 Nov).
   * Se modificó para coincidir con el diseño.
   * @param dateOnlyString String de la propiedad Fecha (ej: "2025-11-11").
   * @returns Fecha formateada (ej: 11 Nov).
   */
  formatDate(dateOnlyString: string): string {
    // Usamos el constructor Date con el string 'YYYY-MM-DD'
    const date = new Date(dateOnlyString + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
      day: 'numeric', // Mostrar el día del mes (11, 13)
      month: 'short', // Mostrar el mes abreviado (Nov)
    });
  }

  /**
   * Formatea la hora para coincidir con el diseño (solo HH:MM en 24h).
   * @param timeOnlyString String de la propiedad HoraInicio o HoraFin (ej: "10:00:00").
   * @returns Hora formateada (ej: 10:00).
   */
  formatTime(timeString: string): string {
    // La TimeOnly de C# generalmente viene como "HH:MM:SS" o "HH:MM".
    // Tomamos los primeros 5 caracteres para obtener "HH:MM" (formato 24h)
    return timeString.substring(0, 5);
  }

  /**
   * Obtiene la clase CSS según el estado de la reserva.
   * @param estado Estado de la reserva (ej: "Confirmada", "Pendiente").
   * @returns Clase CSS para el estilo de la etiqueta.
   */
  getStatusClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return 'status-confirmada';
      case 'pendiente':
        return 'status-pendiente';
      default:
        return 'status-default';
    }
  }
}
