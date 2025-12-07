import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';
  returnUrl: string = '/home';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Si ya está logueado, redirigir al home
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit(): void {
    // Obtener la URL de retorno de los query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  async onSubmit(): Promise<void> {
    // Validaciones básicas
    if (!this.email || !this.password) {
      this.error = 'Por favor, completa todos los campos.';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.error = 'Por favor, ingresa un correo electrónico válido.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const response = await this.authService.login(this.email, this.password);
      
      console.log('Login exitoso:', response);
      
      // Redirigir a la página solicitada o al home
      this.router.navigate([this.returnUrl]);
      
    } catch (err: any) {
      console.error('Error en login:', err);
      
      if (err.status === 401) {
        this.error = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
      } else if (err.status === 0) {
        this.error = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else {
        this.error = 'Error al iniciar sesión. Por favor, intenta nuevamente.';
      }
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Método para limpiar errores cuando el usuario escribe
  onInputChange(): void {
    if (this.error) {
      this.error = '';
    }
  }
}