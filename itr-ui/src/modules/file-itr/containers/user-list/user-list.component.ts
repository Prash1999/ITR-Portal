import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaginationInstance } from 'ngx-pagination';
import { TokenManagerService } from '@modules/app-common/services/TokenManagerService';
import { UsersService } from '@modules/file-itr/services/users.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";
import { environment } from 'src/environments/environment';
import { DashboardService } from '@modules/navigation/containers/dashboard.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  public years: any = ["2010", "2011", "2012", "2013", "2014", "2015", "2023"];
  public statuses: any = ["New", "In Progress", "Complete"];
  public filterForm: any = FormGroup;
  public selectedYear = "";
  pan = "";
  year = "";
  status = ""
  userList: any;
  public config: PaginationInstance = {
    itemsPerPage: 5,
    currentPage: 1
  };

  constructor(private formBuilder: FormBuilder, private usersService: UsersService, private toastr: ToastrService, private router: Router, public spinner: NgxSpinnerService,
    private tokenManagerService: TokenManagerService, private dashboardService: DashboardService) { }

  ngOnInit() {
    this.filterForm = this.formBuilder.group({
      Pan: [""],
      year: ["Year"],
      status: ["Status"]
    });
      this.fetchUserListForDashboard(this.dashboardService.dashboardFlag);
  }

  onSubmit() {
    this.pan = this.filterForm.get("Pan").value;
    this.year = this.filterForm.get("year").value;
    this.status = this.filterForm.get("status").value;

    this.usersService.filter(this.pan, this.year, this.status).subscribe({
      next: (response) => {
        let resBody: any = response.body;
        console.log(resBody);

        if (!resBody["error"]) {
          this.userList = resBody.users;
          if (this.userList.length == 0) {
            alert("No data available");
            this.filterForm.get("Pan").setValue("");
            this.filterForm.get("year").setValue("Year");
            this.filterForm.get("status").setValue("Status");
            this.fetchUserListForDashboard("New");

          }
          console.log(this.userList);

        } else {
          this.toastr.error("Something went wrong", "Error", { closeButton: true });
        }
      },
      error: (error) => {
        this.toastr.error("Something went wrong", "Error", { closeButton: true });
        console.log(error);
      }
    })

  }

  // fetchUserList() {
  //   this.usersService.fetchUsers().subscribe({
  //     next: (response) => {
  //       let resBody: any = response.body;
  //       console.log(resBody);

  //       if (!resBody["error"]) {
  //         this.userList = resBody;
  //         console.log(this.userList);

  //       } else {
  //         this.toastr.error("Something went wrong", "Error", { closeButton: true });
  //       }
  //     },
  //     error: (err) => {
  //       this.toastr.error("Something went wrong", "Error", { closeButton: true });
  //       console.log(err);
  //     }
  //   })
  // }

  fetchUserListForDashboard(dashboardFlag: string) {
    let year = new Date().getFullYear().toString();
    dashboardFlag = dashboardFlag == "Complete"? dashboardFlag : dashboardFlag = "New";

    this.usersService.filter("", year, dashboardFlag).subscribe({
      next: (response) => {
        let resBody: any = response.body;
        console.log(resBody);

        if (!resBody["error"]) {
          this.userList = resBody.users;
          this.dashboardService.dashboardFlag = "";
          console.log(this.userList);
        } else {
          this.toastr.error("Something went wrong", "Error", { closeButton: true });
        }
      },
      error: (error) => {
        this.toastr.error("Something went wrong", "Error", { closeButton: true });
        console.log(error);
      }
    })

  }

  downloadFile(panNo: string, year: string, fileName: string) {
    let requestedBy = this.tokenManagerService.getItemFromSessionStorage(environment.SESSION_ATTRIBUTES.USER_ROLE);
    this.usersService.downloadFile(panNo, year, requestedBy, fileName).subscribe({
      next: (res: any) => {
        let response: any = res.body;
        if (!response["error"]) {
          const fileName = this.getFileNameFromResponse(res);
          this.saveFile(response, fileName);
        } else {
          this.toastr.error("Failed to download file", "Error", { closeButton: true });
        }
      },
      error: (err) => {
        this.toastr.error("Failed to download file", "Error", { closeButton: true });
        console.log(err.URL);
      }
    }
    );
  }

  private getFileNameFromResponse(response: any): string {
    const contentDisposition = response.headers.get('content-disposition');
    const match = contentDisposition.match(/filename="?(.+)""?/);
    return match ? match[1] : 'file';
  }

  private saveFile(data: Blob, fileName: string) {
    const blob = new Blob([data], { type: data.type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  redirectToFileUpload(panNumber: string) {
    this.usersService.panNo = panNumber;
    this.router.navigate(['/file-itr/upload-file']);
  }

  displayStatus(status: string) {
    if (status == "New") return 'btn btn-danger';
    else if (status == "In Progress") return 'btn btn-sm btn-warning';
    else return 'btn btn-success';
  }

  onPageChange(number: any) {
    // this.logEvent(`pageChange(${number})`);
    this.config.currentPage = number;
  }

  testSpinner() {
    this.spinner.show();
    setTimeout(() => {
      this.spinner.hide();
    }, 3000)
  }
}
