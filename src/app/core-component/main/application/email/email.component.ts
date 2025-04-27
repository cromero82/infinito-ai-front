import { Component } from '@angular/core';

@Component({
    selector: 'app-email',
    templateUrl: './email.component.html',
    styleUrls: ['./email.component.scss'],
    standalone: false
})
export class EmailComponent {
  checkAll: boolean = false;
  checkbox1: boolean = false;
  checkbox2: boolean = false;
  checkbox3: boolean = false;
  checkbox4: boolean = false;
  checkbox5: boolean = false;
  checkbox6: boolean = false;
  checkbox7: boolean = false;
  checkbox8: boolean = false;
  checkbox9: boolean = false;
  checkbox10: boolean = false;


  toggleAllCheckboxes() {
    this.checkbox1 = this.checkAll;
    this.checkbox2 = this.checkAll;
    this.checkbox3 = this.checkAll;
    this.checkbox4 = this.checkAll;
    this.checkbox5 = this.checkAll;
    this.checkbox6 = this.checkAll;
    this.checkbox7 = this.checkAll;
    this.checkbox8 = this.checkAll;
    this.checkbox9 = this.checkAll;
    this.checkbox10 = this.checkAll;
  }
}
