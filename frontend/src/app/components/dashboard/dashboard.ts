import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  msg: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    // Check for success message from login
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.msg = params['message'];
        this.showToast();
      }
    });
  }

  private showToast() {
    console.log('Dashboard showToast called with message:', this.msg);
    const toastEl = document.getElementById('msgToast');
    console.log('Dashboard toast element found:', !!toastEl);

    if (toastEl && this.msg.trim() !== '') {
      // Using Bootstrap's Toast API
      const bootstrap = (window as any).bootstrap;
      console.log('Dashboard Bootstrap available:', !!bootstrap);

      if (bootstrap && bootstrap.Toast) {
        const toast = new bootstrap.Toast(toastEl, { delay: 2000 });
        toast.show();
        console.log('Dashboard toast shown');
      } else {
        console.warn('Bootstrap Toast not available');
      }
    } else {
      console.warn('Toast element not found');
    }
  }
}
