import { Component, OnInit } from '@angular/core';
import {DataService} from '../../service/data.service'
@Component({
  selector: 'app-add-update',
  templateUrl: './add-update.component.html',
  styleUrls: ['./add-update.component.css']
})
export class AddUpdateComponent implements OnInit {

  constructor(private dataService: DataService ) { }
  pid:number;
  pwd:string;
  email:string;
  ngOnInit(): void {
  }
  post(){
    if (this.pid >= 0 && this.pwd !== "" && this.email !== ""){
      this.dataService
        .sendPostRequest(this.pid, this.pwd, this.email)
        .subscribe(response=>{
          console.log(response);
          let jsonObj = JSON.parse(JSON.stringify(response));
          if(jsonObj.insertion === "success"){
            alert("Successfully Inserted");
          }
    });
    }else {
      alert("Enter proper details");
    }
  }


  put(){
    if (this.pid >= 0 && this.pwd !== "" && this.email !== ""){
      this.dataService
        .sendPutRequest(this.pid, this.pwd, this.email)
        .subscribe(response=>{
          console.log(response);
          let jsonObj = JSON.parse(JSON.stringify(response));
          if(jsonObj.updation === "success"){
            alert("Successfully Updated");
          }
    });
    }else {
      alert("Enter proper details");
    }
  }
}
