import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  template: '<h1>Welcome!</h1><br><p>You got Registered</p>',
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
