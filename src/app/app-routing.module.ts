import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NuevaReservaComponent } from './components/nueva-reserva/nueva-reserva.component';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { HistorialComponent } from './components/historial/historial.component';

const routes: Routes = [
  {
    path:'login',
    component:LoginComponent  
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate:[authGuard]
  },
  {
    path: 'nueva-reserva',
    component: NuevaReservaComponent,
    canActivate:[authGuard]
  },
  {
    path: 'historial',
    component: HistorialComponent,
    canActivate:[authGuard]
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
