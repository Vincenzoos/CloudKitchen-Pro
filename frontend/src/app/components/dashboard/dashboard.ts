import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Database } from '../../services/database';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  msg: string = '';
  user: any = {};
  stats: any = {};
  student: any = {};
  private refreshSubscription?: Subscription;

  constructor(private route: ActivatedRoute, private database: Database) { }

  ngOnInit() {
    // Check for success message from login
    this.route.queryParams.subscribe(params => {
      if (params['message']) {
        this.msg = params['message'];
        this.showToast();
      }
    });

    // Load dashboard data immediately on init
    this.loadDashboardData();
  }

  ngAfterViewInit() {
    // Set up real-time updates every 30 seconds after view initializes
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadDashboardData();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private loadDashboardData() {
    const userId = localStorage.getItem('userId');
    console.log('Logged in userId:', userId);
    if (userId) {
      this.database.getDashboardData(userId).subscribe({
        next: (response: any) => {
          this.user = response.user;
          this.stats = response.stats;
          this.student = response.student;
        },
        error: (err) => {
          console.error('Failed to load dashboard data:', err);
        }
      });
    }
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
