import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';
import Swal from 'sweetalert2';
interface data {
  value: string;
}

@Component({
    selector: 'app-department-grid',
    templateUrl: './department-grid.component.html',
    styleUrl: './department-grid.component.scss',
    standalone: false
})
export class DepartmentGridComponent {
  public routes = routes;
  public searchDataValue = '';
  public selectedValue1 = '';
  showFilter = false;
 
  
  public selectedValue2 = '';
  public selectedValue3 = '';
  selectedList1: data[] = [
    {value: 'Choose Type'},
    {value: 'Mitchum Daniel'},
    {value: 'Susan Lopez'},
   
  ];
  selectedList2: data[] = [
    {value: 'Choose Type'},
    {value: 'Mitchum Daniel'},
    {value: 'Susan Lopez'},
  ];
  selectedList3: data[] = [
    { value: 'Sort by Datee' },
    { value: 'Newest' },
    { value: 'Oldest' },
  ];
 

 

  confirmColor() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: ' btn btn-success',
        cancelButton: 'me-2 btn btn-danger',
      },
      buttonsStyling: false,
    });

    swalWithBootstrapButtons
      .fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        confirmButtonText: 'Yes, delete it!',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          swalWithBootstrapButtons.fire(
            'Deleted!',
            'Your file has been deleted.',
            'success'
          );
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire(
            'Cancelled',
            'Your imaginary file is safe :)',
            'error'
          );
        }
      });
  }
  constructor(private sidebar: SidebarService) {}

  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  public filter = false;
  openFilter() {
    this.filter = !this.filter;
  }
  
}
