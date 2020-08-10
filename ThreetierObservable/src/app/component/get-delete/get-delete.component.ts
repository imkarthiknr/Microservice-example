
import { Component, OnInit } from '@angular/core';
import {DataService} from '../../service/data.service'
@Component({
  selector: 'app-get-delete',
  templateUrl: './get-delete.component.html',
  styleUrls: ['./get-delete.component.css']
})
export class GetDeleteComponent implements OnInit {

  constructor(private dataService: DataService ) { }
  id:number;
  res;
  ngOnInit(): void {
  }
  get(){
    if (this.id >= 0){
      this.dataService
        .sendGetRequest(this.id)
        .subscribe(response=>{
          console.log(response);
          let jsonObj = JSON.parse(JSON.stringify(response));
          this.res = jsonObj.CustID + ' - ' + jsonObj.CustName;
    });
    }else {
      alert("Enter proper bill number");
    }
  }


  delete(){
    if (this.id >= 0){
      this.dataService
        .sendDeleteRequest(this.id)
        .subscribe(response=>{
          console.log(response);
          let jsonObj = JSON.parse(JSON.stringify(response));
          if(jsonObj.deletion === "success"){
            alert("Successfully deleted");
          }
    });
    }else {
      alert("Enter proper bill number");
    }
  }

}
