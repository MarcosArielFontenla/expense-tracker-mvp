import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class UpgradeService {
    showUpgradeModal(message: string, title: string = 'Limit Reached') {
        Swal.fire({
            title: title,
            text: message || 'Has alcanzado el límite de tu plan actual.',
            icon: title === 'Limit Reached' ? 'warning' : 'info',
            showCancelButton: true,
            confirmButtonText: 'Actualizar Plan',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#ef4444'
        }).then((result) => {
            if (result.isConfirmed) {
                // For MVP, show info on how to upgrade
                Swal.fire(
                    'Actualizar Plan',
                    'Para actualizar su plan, comuníquese con el soporte o vaya a la página de configuración (próximamente).',
                    'info'
                );
            }
        });
    }
}
