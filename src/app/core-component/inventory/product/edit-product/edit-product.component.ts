import { Component } from '@angular/core';
import { Editor, Toolbar } from 'ngx-editor';
import { SidebarService, routes } from 'src/app/core/core.index';
interface data {
  value: string;
}

@Component({
    selector: 'app-edit-product',
    templateUrl: './edit-product.component.html',
    styleUrl: './edit-product.component.scss',
    standalone: false
})

export class EditProductComponent {
  public routes = routes
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'format_clear'],
    ['underline', 'strike'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['image'],
    ['link'],
  ];
  public selectedValue1 = '';
  public selectedValue2 = '';
  public selectedValue3 = '';
  public selectedValue4 = '';
  public selectedValue5 = '';
  public selectedValue6 = '';
  public selectedValue7 = '';
  public selectedValue8 = '';
  public selectedValue9 = '';
  public selectedValue10 = '';
  public selectedValue11 = '';
  public selectedValue12 = '';
  public selectedValue13 = '';
  public selectedValue14 = '';
  public selectedValue15 = '';
  public selectedValue16 = '';
  public selectedValue17 = '';
  public image: boolean[] = [true, true, true];

  selectedList1: data[] = [
    { value: 'Electro Mart' },
    { value: 'Rasmussen' },
    { value: 'Fred john' },
  ];
  selectedList2: data[] = [
    { value: 'Lavish Warehouse ' },
    { value: 'Determined' },
    { value: 'Sincere' },
  ];
  selectedList3: data[] = [{ value: 'Computers' }, { value: 'Electronics' }];
  selectedList4: data[] = [{ value: 'Laptop' },{ value: 'Computers' }, { value: 'Shoes' }];
  selectedList5: data[] = [
    { value: 'Fruits' },
    { value: 'Computers' },
    { value: 'Shoes' },
  ];
  selectedList6: data[] = [{ value: 'Lenova' }, { value: 'Bolt' }];
  selectedList7: data[] = [{ value: 'Pcs' }, { value: 'Pc' }];
  selectedList8: data[] = [
    { value: 'Transactional selling' },
    { value: 'Solution selling' },
  ];
  selectedList9: data[] = [
    { value: 'Code34' },
    { value: 'Code35' },
    { value: 'Code36' },
  ];
  selectedList10: data[] = [{ value: 'Sales' },{ value: 'Exclusive' }];
  selectedList11: data[] = [{ value: 'Percentage' }, { value: 'Cash' }];
  selectedList12: data[] = [
    { value: 'Choose' },
    { value: 'Color' },
    { value: 'Red' },
    { value: 'Black' },
  ];
  selectedList13: data[] = [{ value: 'Percentage' }, { value: 'Cash' }];
  selectedList14: data[] = [{ value: 'Choose' }, { value: 'Code34' }];
  selectedList15: data[] = [
    { value: 'Choose' },
    { value: 'Direct' },
    { value: 'Indirect' },
  ];
  selectedList16: data[] = [
    { value: 'Choose' },
    { value: 'Income Tax' },
    { value: 'Service Tax' },
  ];
  selectedList17: data[] = [
    { value: 'Choose' },
    { value: 'Percentage' },
    { value: 'Early Payment' },
  ];
  constructor(private sidebar: SidebarService) {}
  tags = ['red', 'Black'];
  public removeImg(index: number) {
    this.image[index] = !this.image[index];
  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  ngOnInit(): void {
    this.editor = new Editor();
  }
  ngOnDestroy(): void {
    this.editor.destroy();
  }
  isVisible=false;
 addRow():void{
  this.isVisible=true;
 }
 removeRow():void{
  this.isVisible=false;
 }
 isImage:boolean[]=[false];
 imageRemove(index:number):void{
  this.isImage[index]=!this.isImage[index];
 }
}
