import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(public httpClient: HttpClient) { }
  private url1 = "http://127.0.0.1:6102/customer/";
  private url2 = "http://127.0.0.1:6102/customers/";

  public sendGetRequest(key) {
    return this.httpClient.get(this.url1+key);
  }

  public sendDeleteRequest(key) {
    return this.httpClient.delete(this.url1+key);
  }

  public sendPostRequest(key, pwd, email) {
    return this.httpClient.post(this.url2+key,{"Password": pwd, "Email": email});
  }

  public sendPutRequest(key, pwd, email) {
    return this.httpClient.put(this.url2+key,{"Password": pwd,"Email": email});
  }
}
