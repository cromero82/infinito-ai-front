import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { routes } from 'src/app/core/core.index';
import Swal from 'sweetalert2';


@Component({
    selector: 'app-kanban-low',
    templateUrl: './kanban-low.component.html',
    styleUrl: './kanban-low.component.scss',
    standalone: false
})
export class KanbanLowComponent implements OnInit{
  routes = routes
  public lstOne: CompanyCard[] = [];
  public lstTwo: CompanyCard[] = [];
  public lstThree: CompanyCard[] = [];
  public lstFour: CompanyCard[] = [];
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
  ngOnInit(): void {
    this.lstOne = [
      {
        Logo: "Web Layout",
        id:1,
        kanbanPower: "Low",
        PowerClass:
          "badge bg-success badge-xs d-flex align-items-center justify-content-center",
        Name: "PRJ-154",
      },
      {
        Logo: "Web Layout",
        id:2,
        kanbanPower: "Low",
        PowerClass:
          "badge bg-success badge-xs d-flex align-items-center justify-content-center",
        Name: "PRJ-155",
      },
    ];
    this.lstTwo = [
      {
        Logo: "Web Layout",
        id:1,
        kanbanPower: "Low",
        PowerClass:
          "badge bg-success badge-xs d-flex align-items-center justify-content-center",
        Name: "PRJ-156",
      },
      {
        Logo: "Web Layout",
        id:2,
        kanbanPower: "Low",
        PowerClass:
          "badge bg-success badge-xs d-flex align-items-center justify-content-center",
        Name: "PRJ-157",
      },
    ];
    this.lstThree = [
      {
        Logo: "Web Layout",
        id:1,
        kanbanPower: "Low",
        PowerClass:
          "badge bg-success badge-xs d-flex align-items-center justify-content-center",
        Name: "PRJ-159",
      },
    ];
    this.lstFour = [
      {
        Logo: "Web Layout",
        id:1,
        kanbanPower: "Low",
        PowerClass:
          "badge bg-success badge-xs d-flex align-items-center justify-content-center",
        Name: "PRJ-161",
      },
    ];


  }
  //  drap and drop
  onDrop(event: CdkDragDrop<CompanyCard[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
interface CompanyCard {
  id:number;
  Logo: string;
  kanbanPower: string;
  PowerClass: string;
  Name: string;
}
