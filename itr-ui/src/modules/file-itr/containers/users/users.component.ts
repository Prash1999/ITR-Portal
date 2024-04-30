import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PaginationInstance } from 'ngx-pagination';
import { TokenManagerService } from '@modules/app-common/services/TokenManagerService';
import { UsersService } from '@modules/file-itr/services/users.service';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from "ngx-spinner";


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit{
  userList: any;
  public config: PaginationInstance = {
    itemsPerPage: 5,
    currentPage: 1
  };


  constructor(private usersService: UsersService, private toastr: ToastrService, private router: Router, public spinner: NgxSpinnerService,
    private tokenManagerService: TokenManagerService,){ }

  ngOnInit(): void {
    this.fetchUserList();
  }
  
  fetchUserList() {
    this.usersService.fetchAllUsers().subscribe({
      next: (response) => {
        let resBody: any = response.body;
        console.log(resBody);

        if (!resBody["error"]) {
          this.userList = resBody;
          console.log(this.userList);
          
        } else {
          this.toastr.error("Something went wrong", "Error", { closeButton: true });
        }
      },
      error: (err) => {
        this.toastr.error("Something went wrong", "Error", { closeButton: true });
        console.log(err);
      }
    })
  }

  redirectToFileUpload(){
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
}
