import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private fetchUsersEndPoint: string;
  private fetchAllUsersEndPoint: string;
  private downloadFileEndPoint: string;
  private itrInitiatedEndPoint: string;
  private itrHistroryEndPoint: string;
  private filterItrEndPoint: string;
  public panNo: string = "";

  constructor(private httpClient: HttpClient) { 
    this.fetchUsersEndPoint = environment.API_ENDPOINT + "users";
    this.fetchAllUsersEndPoint = environment.API_ENDPOINT + "allUsers";
    this.downloadFileEndPoint = environment.API_ENDPOINT + "download";
    this.itrInitiatedEndPoint = environment.API_ENDPOINT + "checkStatus";
    this.itrHistroryEndPoint = environment.API_ENDPOINT + "checkItrHistory";
    this.filterItrEndPoint = environment.API_ENDPOINT + "filter";
  }

  fetchUsers(){
    return this.httpClient.get(this.fetchUsersEndPoint, { observe: 'response' });
  }

  fetchAllUsers(){
    return this.httpClient.get(this.fetchAllUsersEndPoint, { observe: 'response' });
  }

  downloadFile(panNumber: string, year: string, role: string, fileName: string){
    let data = {
      pan: panNumber,
      year: year,
      requestedBy: role,
      fileName: fileName
    }
    return this.httpClient.post(this.downloadFileEndPoint, data,{
      responseType: 'blob' as 'json',
      observe: 'response' as 'body'
    });
  }

  isItrInitiated(panNo: string){
    let data = {
      pan: panNo
    }
    return this.httpClient.post(this.itrInitiatedEndPoint, data,{ observe: 'response' });
  }

  fetchITRHistory(panNo: string){
    let data = {
      pan: panNo
    }
    return this.httpClient.post(this.itrHistroryEndPoint, data,{ observe: 'response' });
  }

  filter(panNo: string, year: string, status: string){
    let data = {
      pan: panNo ? panNo : "",
      year: year,
      status: status
    }

    return this.httpClient.post(this.filterItrEndPoint, data,{ observe: 'response' });
  }
}
