import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsSidebarComponent } from './settings-sidebar.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    SettingsSidebarComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [SettingsSidebarComponent],
})
export class SettingsSidebarModule { }
