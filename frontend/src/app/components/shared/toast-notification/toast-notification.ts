import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-toast-notification',
    standalone: true,
    templateUrl: './toast-notification.html',
    styleUrls: ['./toast-notification.css']
})
export class ToastNotificationComponent implements OnInit {
    @Input() message: string = '';
    @Input() toastId: string = 'appToast';
    @Input() delay: number = 2000;

    ngOnInit(): void {
        // Auto-show if message is provided
        if (this.message.trim() !== '') {
            this.show();
        }
    }

    show(): void {
        setTimeout(() => {
            const toastEl = document.getElementById(this.toastId);
            if (toastEl && this.message.trim() !== '') {
                const bootstrap = (window as any).bootstrap;
                if (bootstrap && bootstrap.Toast) {
                    const toast = new bootstrap.Toast(toastEl, { delay: this.delay });
                    toast.show();
                }
            }
        }, 0);
    }
}
