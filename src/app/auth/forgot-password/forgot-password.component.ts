import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../service/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'vex-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    NgIf,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class ForgotPasswordComponent implements OnInit {
  form = this.fb.group({
    email: [null, [Validators.required, Validators.email]]
  });

  loading = false;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit() {}

  send() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.cd.markForCheck();

    const email = this.form.value.email;

    this.authService.restaurarContrasena(email!).pipe(
      finalize(() => {
        this.loading = false;
        this.cd.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.snackbar.open('Se ha enviado un correo electrónico con las instrucciones para restaurar tu contraseña', 'Cerrar', {
          duration: 5000
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        let mensaje = 'Error al enviar la solicitud de recuperación';

        if (error.error) {
          mensaje = error.error.mensaje ||
                   error.error.message ||
                   error.error.error ||
                   (typeof error.error === 'string' ? error.error : mensaje);
        } else if (error.message) {
          mensaje = error.message;
        }

        this.snackbar.open(mensaje, 'Cerrar', {
          duration: 7000,
          panelClass: ['alert-danger', 'snackbar-error'],
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }
}
