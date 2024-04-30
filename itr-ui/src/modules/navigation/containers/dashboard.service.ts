import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private totalClientandItrFileCount: string;
  private fetchClientProfile: any;
  private updateProfileEndpoint: string;
  public dashboardFlag: string = "";

  constructor(private http: HttpClient) {
    this.totalClientandItrFileCount = environment.API_ENDPOINT + "users/totalClientandItrFileCount";
    this.fetchClientProfile = environment.API_ENDPOINT + "users/fetchClientProfile";
    this.updateProfileEndpoint = environment.API_ENDPOINT + "profile";
  }

  getData(): Observable<any> {
    return this.http.get<any>(this.totalClientandItrFileCount);
  }

  getUsersData(panCard: any){
    const body = { pan: panCard };
    console.log("body", body)
    return this.http.post(this.fetchClientProfile, body, {observe: "response"});
  }

  updateProfile(username: any, email: any, mobNo: any){
    const body = {
      userName: username,
      email: email,
      mobileNumber: mobNo
    }
    return this.http.post(this.updateProfileEndpoint, body, {observe: "response"});
  }
}
