import { ChangeDetectorRef, Component } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { fadeInUp400ms } from '@vex/animations/fade-in-up.animation';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../service/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'vex-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [fadeInUp400ms],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    NgIf,
    MatIconModule,
    MatCheckboxModule,
    RouterLink,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ]
})
export class RegisterComponent {
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    passwordConfirm: ['', [Validators.required, this.passwordMatchValidator]]
  });

  inputType = 'password';
  visible = false;
  loading = false;
  readonly fieldId = Math.random().toString(36).substring(7);

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private snackbar: MatSnackBar,
    private authService: AuthService
  ) {}

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const form = control.parent;
    if (!form) return null;

    const password = form.get('password')?.value;
    const passwordConfirm = control.value;

    if (password && passwordConfirm && password !== passwordConfirm) {
      return { passwordMismatch: true };
    }
    return null;
  }

  send() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.cd.markForCheck();

    const { name, email, telefono, password } = this.form.value;

    this.authService.registro({
      nombre: name!,
      correoElectronico: email!,
      contrasena: password!,
      telefono: telefono!
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cd.markForCheck();
      })
    ).subscribe({
      next: () => {
        this.snackbar.open('Registro exitoso', 'Cerrar', {
          duration: 3000
        });
        this.router.navigate(['/apps/tickets']);
      },
      error: (error) => {
        let mensaje = 'Error al registrar usuario';

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

  toggleVisibility() {
    if (this.visible) {
      this.inputType = 'password';
      this.visible = false;
      this.cd.markForCheck();
    } else {
      this.inputType = 'text';
      this.visible = true;
      this.cd.markForCheck();
    }
  }
}
