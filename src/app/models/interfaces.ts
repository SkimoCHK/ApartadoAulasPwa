export interface DisponibilidadHora {
  horaInicio: string; // "07:30:00"
  horaFin: string; // "08:30:00"
  disponible: boolean;
}

export interface CreateSolicitudDto {
  fecha: string; // "2024-12-06"
  horaInicio: string; // "07:30:00"
  horaFin: string; // "08:30:00"
  motivo: string;
  usuarioId: number;
  aulaId: number;
}

export interface SolicitudApartado {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  fechaSolicitud: string;
  usuarioId: number;
  aulaId: number;
}

export interface ReservaHistorial {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  fechaSolicitud: string;
  usuarioId: number;
  aulaId: number;
  aula: {
    id: number;
    nombre: string;
    descripcion: string;
    capacidadEstudiantes: number;
    estatus: boolean;
    tipoAulaId: number;
    edificioId: number;
  };
}

export interface Aula {
  id: number;
  nombre: string;
  descripcion?: string;
  capacidadEstudiantes: number;
  estatus: boolean;
  tipoAulaId: number;
  edificioId: number;
  tipoAula?: any;
  edificio?: any;
}

export interface SolicitudApartado {
  Fecha: string;
  HoraInicio: string; 
  HoraFin: string;
  Estado: string;
  Aula: Aula; 
  Motivo: string;
}

// Interfaces
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  idUsuario: number;
  nombre: string;
  totalReservas: number;
  totalActivasHoy: number;
  proximasReservas: SolicitudApartado[];
}
