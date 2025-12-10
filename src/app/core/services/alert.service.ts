import { Injectable } from '@angular/core';
import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class AlertService {

    // Success Toast (no intrusivo)
    public success(message: string, title: string = '¡Éxito!'): void {
        Swal.fire({
            icon: 'success',
            title,
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    // Error Toast
    public error(message: string, title: string = 'Error'): void {
        Swal.fire({
            icon: 'error',
            title,
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
        });
    }

    // Warning Toast
    public warning(message: string, title: string = 'Advertencia'): void {
        Swal.fire({
            icon: 'warning',
            title,
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    // Info Toast
    public info(message: string, title: string = 'Información'): void {
        Swal.fire({
            icon: 'info',
            title,
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }

    // Confirmación (reemplaza confirm())
    public async confirm(
        message: string,
        title: string = '¿Estás seguro?',
        confirmText: string = 'Sí, continuar',
        cancelText: string = 'Cancelar',
        confirmColor: string = '#3b82f6'
    ): Promise<boolean> {
        const result: SweetAlertResult = await Swal.fire({
            title,
            text: message,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            confirmButtonColor: confirmColor,
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            focusCancel: true
        });

        return result.isConfirmed;
    }

    // Confirmación de eliminación (estilo destructivo)
    public async confirmDelete(
        itemName: string,
        message: string = 'Esta acción no se puede deshacer'
    ): Promise<boolean> {
        return this.confirm(
            `¿Eliminar "${itemName}"? ${message}`,
            'Confirmar eliminación',
            'Sí, eliminar',
            'Cancelar',
            '#ef4444' // Rojo para acciones destructivas
        );
    }

    // Alert modal (reemplaza alert())
    public alert(
        message: string,
        title: string = 'Atención',
        icon: 'success' | 'error' | 'warning' | 'info' = 'info'
    ): Promise<SweetAlertResult> {
        return Swal.fire({
            icon,
            title,
            text: message,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6'
        });
    }

    // Loading (para operaciones asíncronas)
    public loading(title: string = 'Cargando...'): void {
        Swal.fire({
            title,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    // Cerrar loading
    public closeLoading(): void {
        Swal.close();
    }
}

