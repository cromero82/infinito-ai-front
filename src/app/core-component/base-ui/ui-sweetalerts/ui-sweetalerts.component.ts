import { Component } from '@angular/core';
import { routes } from 'src/app/core/helpers/routes';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-ui-sweetalerts',
    templateUrl: './ui-sweetalerts.component.html',
    styleUrl: './ui-sweetalerts.component.scss',
    standalone: false
})
export class UiSweetalertsComponent {
  public routes = routes;

  basicAlert() {
    Swal.fire("Any fool can use a computer")
   
  }
  withTitle() {
    Swal.fire({
      title: "The Internet?",
      text: "That thing is still around?"

    })
  }
  footerAlert() {
    Swal.fire({
      title: 'Oops...',
      text: 'Something went wrong!',
      footer: '<a href="javascript:void(0);">Why do I have this issue?</a>'
    })
  }
  topStart() {
    Swal.fire ({
      position: "top-start",
      text: "Your work has been saved"
    })
  }
  topEnd() {
    Swal.fire ({
      position: "top-end",
      text: "Your work has been saved"
    })
  }
  bottomStart() {
    Swal.fire ({
      position: "bottom-start",
      text: "Your work has been saved"
    })
  }
  bottomEnd() {
    Swal.fire ({
      position: "bottom-end",
      text: "Your work has been saved"
    })
  }
  typeSuccess() {
    Swal.fire ({
      title: "Good Job!",
      text: "You clicked the button!"
    })
  }
  typeInfo() {
    Swal.fire ({
      title: "Info",
      text: "You clicked the button!"
    })
  }
  typeWarning() {
    Swal.fire ({
      title: "Warning",
      text: "You clicked the button!"
    })
  }
  typeError() {
    Swal.fire ({
      title: "Error",
      text: "You clicked the button!"
    })
  }
  confirmText() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'me-2 btn btn-danger'
      },
      buttonsStyling: false
    })
    
    swalWithBootstrapButtons.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        swalWithBootstrapButtons.fire(
          'Deleted!',
          'Your file has been deleted.',
          'success'
        )
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        swalWithBootstrapButtons.fire(
          'Cancelled',
          'Your imaginary file is safe :)',
          'error'
        )
      }
    })
  }
  confirmColor() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: ' btn btn-success',
        cancelButton: 'me-2 btn btn-danger'
      },
      buttonsStyling: false
    })
    
    swalWithBootstrapButtons.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Yes, delete it!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        swalWithBootstrapButtons.fire(
          'Deleted!',
          'Your file has been deleted.',
          'success'
        )
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        swalWithBootstrapButtons.fire(
          'Cancelled',
          'Your imaginary file is safe :)',
          'error'
        )
      }
    })
  }
  clickout(){
    Swal.fire ({
      title: "Click outside to close!",
      text: "This is a cool message!"
    })
  }
 
  autoclose() {
    let timerInterval: ReturnType<typeof setInterval>;
    Swal.fire({
      title: 'Auto close alert!',
      html: 'I will close in <b></b> milliseconds.',
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => {
        timerInterval = setInterval(() => {
          const content = Swal.getHtmlContainer();
          if (content) {
            const b = content.querySelector('b');
            if (b) {
              // Use optional chaining operator to safely access getTimerLeft() result
              b.textContent = Swal.getTimerLeft()?.toString() ?? '';
            }
          }
        }, 100);
      },
      willClose: () => {
        clearInterval(timerInterval);
      },
    })
  }
  async showPrompt() {
    const steps = ['1', '2', '3'];
    const answers: string[] = [];
  
    for (const step of steps) {
      const result = await Swal.fire({
        title: `Question ${step}`,
        input: 'text',
        confirmButtonText: 'Next &rarr;',
        showCancelButton: true,
        customClass: {
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-danger ml-1',
        },
        buttonsStyling: false,
      });
  
      if (result.dismiss === Swal.DismissReason.cancel) {
        // Handle cancel button press if needed
        return; // You may choose to handle this differently
      }
      if (typeof result.value === 'string') { // Ensure result.value is a string
        answers.push(result.value);
      }
    }
  }
}
