import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  totalClients: any;
  completedFiles: any;
  newFiles: any;
  constructor(private dashboradService: DashboardService, private router: Router) { }

  ngOnInit(): void {
    this.getData();
  }

  getData() {
    this.dashboradService.getData().subscribe({
      next: (data) => {
        this.totalClients = data.totalClients;
        this.completedFiles = data.completeFileCount;
        this.newFiles = data.newFileCount;
      },
      error: (error) => {
        console.error('Error:', error);
      }
    }
    );
  }

  redirectToItr(dashboardFlag: string){
    this.router.navigate(['/file-itr/user-list']);
    this.dashboradService.dashboardFlag = dashboardFlag;
  }
}
