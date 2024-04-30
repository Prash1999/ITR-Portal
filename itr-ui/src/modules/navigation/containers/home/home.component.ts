import { Component, OnInit, ViewChild,ElementRef } from '@angular/core';
// import { MatSidenav } from '@angular/material/sidenav';
import { delay, filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { LoginService } from '@modules/login/services/login.service';
import { TokenManagerService } from '@modules/app-common/services/TokenManagerService';
import { environment } from 'src/environments/environment';
import { throwError } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';
import { UsersService } from '@modules/file-itr/services/users.service';
import { ToastrService } from 'ngx-toastr';
// import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  @ViewChild('useThisTemplateVar') elRef : ElementRef; 
  public toggle: boolean = false;
  public isMenuCollapse: boolean = true;
  public isPageOpen : boolean = true;
  public isHomeOpen : boolean = true;
  public userRole : string = "";
  public panNumber : string = "";
  public userName : string = "";
  public isItrInitiatedFlag : boolean = false;
  public userAgent: string = navigator.userAgent;
  public isMobile: boolean = false;
  sessionAttributes = environment.SESSION_ATTRIBUTES;
  
  constructor(private loginService: LoginService, private tokenManagerService: TokenManagerService,
    private router: Router, public spinner: NgxSpinnerService, private usersService: UsersService, private toastr: ToastrService,
    ){

  }

  ngOnInit() {
    this.userRole = this.tokenManagerService.getItemFromSessionStorage(this.sessionAttributes.USER_ROLE);
    this.panNumber = this.tokenManagerService.getItemFromSessionStorage(this.sessionAttributes.PAN_NO);
    this.userName = this.tokenManagerService.getItemFromSessionStorage(this.sessionAttributes.USERNAME);
    this.isItrFileInitiated();
    this.isMobileDevice();
    // console.log(this.isMobileDevice());
    // console.log(this.isTabletDevice());
    
    
  }

 toggleSidebar(){
  console.log(this.toggle);
  
  this.toggle = !this.toggle;

  console.log(this.toggle);
  console.log(this.elRef.nativeElement.className);
  
 }


 async logOut(){
  if (!await this.tokenManagerService.getItemFromSessionStorage(
    this.sessionAttributes.IS_LOGGEDIN
  )) {
    this.router.navigateByUrl("/login");
  } else {
    const refreshToken = await this.tokenManagerService.getItemFromSessionStorage(
      this.sessionAttributes.MY_REFRESH_TOKEN
    );
    this.spinner.show();
      this.loginService.logout(refreshToken).subscribe({
        next: (response) => {
          setTimeout(() =>{
            this.spinner.hide();
            this.tokenManagerService.removeUserTokenDataFromSessionStorage();
            this.router.navigateByUrl("/login");
          },2000)
        },
        error: (err) => {
          throwError(()=>(err));
        }
      }
      );
  }
 }

 isItrFileInitiated(){
  this.usersService.isItrInitiated(this.panNumber).subscribe({
    next: (res)=>{
      let resBody: any = res.body;
      console.log(resBody);
      
      if (!resBody["error"]) {
        console.log("in if");
        
       this.isItrInitiatedFlag = resBody.itrStatusFlag;
      } else {
        this.toastr.error("Failed to fetch ITR status", "Error", { closeButton: true });
      }
    },
    error: (err)=> {
      console.log(err);
      this.toastr.error("Something went wrong", "Error", { closeButton: true });
    }
  })
 }

 redirectToHome(){
  if(this.userRole == "admin"){
    this.router.navigate(["/file-itr/user-list"]);
  }else{
    this.router.navigate(["/file-itr/table"]);
  }
 }

 redirectToDashborad(){
  if(this.userRole == "admin"){
    this.router.navigate(["/dashboard"]);
  }else{
    this.router.navigate(["/file-itr/table"]);
  }
 }

 redirectToProfile(){
  this.router.navigate(["/profile"]);
 }
 redirectToUploadFile(){
  this.router.navigate(["/file-itr/upload-file"]);
 }

 redirectToChangePassword(){
  this.router.navigate(["/change-password"]);
 }

 redirectToRegister(){
  this.router.navigate(["/register"]);
 }

 redirectToUsers(){
  this.router.navigate(["/file-itr/users"]);
 }

isMobileDevice = () => {
  const regexs = [/(Android)(.+)(Mobile)/i, /BlackBerry/i, /iPhone|iPod/i, /Opera Mini/i, /IEMobile/i]
  this.isMobile =  regexs.some((b) => this.userAgent.match(b));
  console.log(this.isMobile);
  
}

isTabletDevice = (): boolean => {
  const regex = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/
  return regex.test(this.userAgent.toLowerCase())
}


 testFunction(){
  this.loginService.test().subscribe({
    next: ()=> {
      console.log("Working");
      
    }
  })
 }
}
