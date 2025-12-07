import { Component, OnInit } from '@angular/core';
import { NetworkStatusService } from '../../services/network-status.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-offline-indicator',
  template: `
    <div class="offline-indicator" *ngIf="!isOnline || pendingCount > 0">
      <!-- Modo Offline -->
      <div class="indicator offline" *ngIf="!isOnline">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        <span>Sin conexión</span>
      </div>

      <!-- Reservas Pendientes -->
      <div class="indicator pending" *ngIf="pendingCount > 0" (click)="onShowPending()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>{{ pendingCount }} pendiente{{ pendingCount > 1 ? 's' : '' }}</span>
        <button class="sync-btn" (click)="onSync($event)" *ngIf="isOnline && !isSyncing">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
        <div class="sync-spinner" *ngIf="isSyncing"></div>
      </div>
    </div>
  `,
  styles: [`
    .offline-indicator {
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      display: flex;
      gap: 8px;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        transform: translateX(-50%) translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }

    .indicator {
      background: white;
      padding: 10px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
    }

    .indicator.offline {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffc107;
    }

    .indicator.offline svg {
      color: #ffc107;
    }

    .indicator.pending {
      background: #e0f2f1;
      color: #00796b;
      border: 1px solid #009688;
      cursor: pointer;
      transition: all 0.2s;
    }

    .indicator.pending:hover {
      background: #b2dfdb;
      transform: scale(1.02);
    }

    .indicator.pending svg {
      color: #009688;
    }

    .sync-btn {
      background: #009688;
      border: none;
      border-radius: 4px;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      margin-left: 4px;
    }

    .sync-btn:hover {
      background: #00796b;
    }

    .sync-btn svg {
      color: white;
    }

    .sync-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #b2dfdb;
      border-top-color: #009688;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 4px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .offline-indicator {
        top: 50px;
        left: 10px;
        right: 10px;
        transform: none;
        flex-direction: column;
      }

      .indicator {
        padding: 8px 12px;
        font-size: 12px;
      }
    }
  `]
})
export class OfflineIndicatorComponent implements OnInit {
  isOnline: boolean = true;
  pendingCount: number = 0;
  isSyncing: boolean = false;

  constructor(
    private networkStatus: NetworkStatusService,
    private offlineStorage: OfflineStorageService,
    private syncService: SyncService
  ) {}

  ngOnInit(): void {
    // Suscribirse al estado de red
    this.networkStatus.getNetworkStatus().subscribe(status => {
      this.isOnline = status;
    });

    // Actualizar conteo de pendientes cada segundo
    setInterval(() => {
      this.updatePendingCount();
    }, 1000);

    // Suscribirse al estado de sincronización
    this.syncService.syncStatus$.subscribe(status => {
      this.isSyncing = status.isSyncing;
      this.updatePendingCount();
    });
  }

  updatePendingCount(): void {
    this.pendingCount = this.offlineStorage.getPendingReservasCount();
  }

  onShowPending(): void {
    // Mostrar modal o navegar a lista de pendientes
    const pending = this.offlineStorage.getPendingReservas();
    console.log('Reservas pendientes:', pending);
    
    // Por ahora solo un alert
    if (pending.length > 0) {
      const list = pending.map(r => 
        `• ${r.aulaInfo?.nombre || 'Aula ' + r.aulaId} - ${r.fecha} ${r.horaInicio.substring(0, 5)}`
      ).join('\n');
      
      alert(`Reservas pendientes de sincronizar:\n\n${list}`);
    }
  }

  async onSync(event: Event): Promise<void> {
    event.stopPropagation();
    await this.syncService.forceSyncPendingReservas();
  }
}