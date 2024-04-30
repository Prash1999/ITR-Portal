import { Component, OnInit } from '@angular/core';
import { TokenManagerService } from '@modules/app-common/services/TokenManagerService';
import { environment } from 'src/environments/environment';
import { DashboardService } from '../dashboard.service';
import { ToastrService } from 'ngx-toastr';
import {  NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userName: any;
  panCard: any;
  mobileNumber: any;
  email: any;
  userDetails: any;
  editMode: boolean = false;
  sessionAttributes = environment.SESSION_ATTRIBUTES;
  constructor(private tokenManagerService: TokenManagerService, private dashboradService: DashboardService,
    private toastr: ToastrService, private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    // this.userName = this.tokenManagerService.getItemFromSessionStorage(this.sessionAttributes.USERNAME);
    this.panCard = this.tokenManagerService.getItemFromSessionStorage(this.sessionAttributes.PAN_NO);
    this.getData()
  }

  getData() {
    this.dashboradService.getUsersData(this.panCard).subscribe(
      {
        next: (data) => {
          this.userDetails = data.body;
          console.log(this.userDetails);
          this.userName = this.userDetails.userName;
          this.panCard = this.userDetails.pancard;
          this.mobileNumber = this.userDetails.mobileNumber;
          this.email = this.userDetails.email;
        },
        error: (error) => {
          console.error('Error:', error);
        }
      }
      // data => {
      //   this.userDetails = data;
      //   console.log(this.userDetails);
      //   this.userName = this.userDetails.userName;
      // },
      // error => {
      //   console.error('Error:', error);
      // }
    );
  }

  onEdit() {
    this.editMode = true;
  }

  onUpdate() {
    this.editMode = false;
    console.log(this.userName);
    this.spinner.show();
    this.dashboradService.updateProfile(this.userName, this.email, this.mobileNumber).subscribe({
      next: (resp) => {
        let response: any = resp.body;
        if (!response["error"]) {
          setTimeout(() => {
            this.spinner.hide();
            this.toastr.success("Profile updated successfully", "Profile update", { closeButton: true });
          },2000); 
        } else {
          this.userName = this.userDetails.userName;
          this.panCard = this.userDetails.pancard;
          this.mobileNumber = this.userDetails.mobileNumber;
          this.email = this.userDetails.email;
          this.toastr.error("Failed to update profile", "Error", { closeButton: true });
          this.spinner.hide();
        }
      },
      error: (err) => {
        this.userName = this.userDetails.userName;
        this.panCard = this.userDetails.pancard;
        this.mobileNumber = this.userDetails.mobileNumber;
        this.email = this.userDetails.email;
        this.spinner.hide();
        this.toastr.error("Something went wrong", "Error", { closeButton: true });
        console.log(err);
      }
    })

  }

  onCancel() {
    this.editMode = false;
    this.userName = this.userDetails.userName;
    this.panCard = this.userDetails.pancard;
    this.mobileNumber = this.userDetails.mobileNumber;
    this.email = this.userDetails.email;
  }

}
