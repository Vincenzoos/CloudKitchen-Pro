import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Database } from '../../services/database';
import { interval, Subscription } from 'rxjs';
import { ToastNotificationComponent } from '../shared/toast-notification/toast-notification';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ToastNotificationComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(ToastNotificationComponent) toastComponent!: ToastNotificationComponent;

  msg: string = '';
  user: any = {};
  stats: any = {};
  student: any = {};
  userId: string = '';
  private refreshSubscription?: Subscription;

  constructor(private route: ActivatedRoute, private database: Database) { }

  ngOnInit() {
    // Get userId from route query parameters
    this.route.queryParams.subscribe(params => {
      this.userId = params['userId'];
      if (params['message']) {
        this.msg = params['message'];
        this.showToast();
      }
      // Load dashboard data whenever userId or query params change
      if (this.userId) {
        this.loadDashboardData();
      }
    });
  }

  ngAfterViewInit() {
    // Set up real-time updates every 30 seconds after view initializes
    this.refreshSubscription = interval(30000).subscribe(() => {
      if (this.userId) {
        this.loadDashboardData();
      }
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private loadDashboardData() {
    console.log('Logged in userId:', this.userId);
    if (this.userId) {
      this.database.getDashboardData(this.userId).subscribe({
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
    if (this.toastComponent) {
      this.toastComponent.message = this.msg;
      this.toastComponent.show();
      console.log('Dashboard toast shown');
    } else {
      console.warn('Toast component not found');
    }
  }
}
