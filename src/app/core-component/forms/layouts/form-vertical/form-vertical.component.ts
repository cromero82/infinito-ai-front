import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';
interface data {
  value: string;
}
@Component({
    selector: 'app-form-vertical',
    templateUrl: './form-vertical.component.html',
    styleUrls: ['./form-vertical.component.scss'],
    standalone: false
})
export class FormVerticalComponent {
  public routes = routes;
  public selectedValue1 = ''
  public selectedValue2 = '' ;
  public selectedValue3 = '' ;


  selectedList1: data[] = [
    {value: 'Select'},
    {value: 'A+'},
    {value: 'O+'},
    {value: 'B+'},
    {value: 'AB+'},
  ];
  selectedList2: data[] = [
    {value: 'Select State'},
    {value: 'California'},
    {value: 'Texas'},
    {value: 'Florida'},
  ];
  selectedList3: data[] = [
    {value: 'Select Country'},
    {value: 'USA'},
    {value: 'France'},
    {value: 'India'},
    {value: 'Spain'},
  ];
   

 

}
