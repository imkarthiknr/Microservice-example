import { GetDeleteComponent } from './component/get-delete/get-delete.component';
import { AddUpdateComponent } from './component/add-update/add-update.component';
import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './component/home/home.component'

const routes: Routes = [
  {path: '', component: GetDeleteComponent},
  {path: 'home', component: HomeComponent},
  {path: 'AddUpdate', component: AddUpdateComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
