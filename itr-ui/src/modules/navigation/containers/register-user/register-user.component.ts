import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '@modules/login/services/login.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register-user',
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.scss']
})
export class RegisterUserComponent implements OnInit{
  registrationForm: FormGroup;
  constructor(private loginService: LoginService, private toastr: ToastrService, private spinner: NgxSpinnerService){}

  ngOnInit(): void {
    this.registrationForm = new FormGroup({
      userName: new FormControl('', Validators.required),
      mobileNumber: new FormControl('', [Validators.required, Validators.minLength(10)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      pancard: new FormControl('', [Validators.required, Validators.minLength(10)]),
      role: new FormControl('', Validators.required),
      password: new FormControl('', [Validators.required, Validators.minLength(3)])
    });
  }

  registerUser(){
    if (this.registrationForm.valid) {
      console.log(this.registrationForm.value)
      this.spinner.show();
      this.loginService.registerUser(this.registrationForm.value).subscribe(
        {
          next:(response:any) => {
            
            if (!response.error) {
              setTimeout(()=>{
                this.spinner.hide();
                this.registrationForm.reset();
                this.toastr.success(response.message, "Success", { closeButton: true });
              }, 1500);
            }
            if (response.error) {
              this.registrationForm.reset();
              this.spinner.hide();
              this.toastr.error(response.message, "Error", { closeButton: true });
            }
          },
          error: (err) => {
            this.registrationForm.reset();
            this.spinner.hide();
            console.log(err);
            this.toastr.error("Something went wrong, please try again", "Error", { closeButton: true });
          }
        }
      );
    }
  }
}
