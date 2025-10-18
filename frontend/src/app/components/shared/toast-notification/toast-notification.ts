import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-toast-notification',
    standalone: true,
    template: `
        <!-- Toast Notification -->
        <div aria-live="polite" aria-atomic="true" class="position-fixed top-0 start-50 translate-middle-x p-3"
            style="z-index: 1080;">
            <div [id]="toastId" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <img src="https://img.icons8.com/ios-filled/40/000000/sushi.png" class="rounded me-2"
                        alt="CloudKitchen Pro Logo" style="width: 1.5rem; height: 1.5rem;">
                    <strong class="me-auto">CloudKitchen Pro</strong>
                    <small class="text-body-secondary">Now</small>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    {{ message }}
                </div>
            </div>
        </div>
    `,
    styles: []
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
