import { Component } from '@angular/core';
import { SidebarService, routes } from 'src/app/core/core.index';
import { Editor, Toolbar } from 'ngx-editor';
interface data {
  value: string;
}
@Component({
    selector: 'app-add-product',
    templateUrl: './add-product.component.html',
    styleUrl: './add-product.component.scss',
    standalone: false
})
export class AddProductComponent {
  isProductVisible: boolean = true;
  isProductVisible1: boolean = true;
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic', 'format_clear'],
    ['underline', 'strike'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['image'],
    ['link'],
  ];
  public routes = routes;
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

  selectedList1: data[] = [
    { value: 'Choose' },
    { value: 'Thomas' },
    { value: 'Rasmussen' },
    { value: 'Fred john' },
  ];
  selectedList2: data[] = [
    { value: 'Choose' },
    { value: 'Legendary' },
    { value: 'Determined' },
    { value: 'Sincere' },
  ];
  selectedList3: data[] = [
    { value: 'Choose' },
    { value: 'Lenovo' },
    { value: 'Electronics' },
  ];
  selectedList4: data[] = [
    { value: 'Choose' },
    { value: 'Lenovo' },
    { value: 'Electronics' },
  ];
  selectedList5: data[] = [
    { value: 'Choose' },
    { value: 'Fruits' },
    { value: 'Computers' },
    { value: 'Shoes' },
  ];
  selectedList6: data[] = [
    { value: 'Choose' },
    { value: 'Nike' },
    { value: 'Bolt' },
  ];
  selectedList7: data[] = [
    { value: 'Choose' },
    { value: 'Kg' },
    { value: 'Pc' },
  ];
  selectedList8: data[] = [{ value: 'Exclusive' }, { value: 'Sales Tax' }];
  selectedList9: data[] = [
    { value: 'Choose' },
    { value: 'Percentage' },
    { value: 'Cash' },
  ];
  selectedList10: data[] = [
    { value: 'Choose' },
    { value: 'Percentage' },
    { value: 'Cash' },
  ];
  selectedList11: data[] = [
    { value: 'Choose' },
    { value: 'Code34' },
    { value: 'Code35' },
    { value: 'Code36' },
  ];
  selectedList12: data[] = [
    { value: 'Choose' },
    { value: 'Code34' },
    { value: 'Code35' },
    { value: 'Code36' },
  ];
  tags = ['red', 'Black'];
  constructor(private sidebar: SidebarService) {}
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  public image: boolean[] = [true, true, true];

  public removeImg(index: number) {
    this.image[index] = !this.image[index];
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
