import { Component, Inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ClienteService, ClienteDto, CreateClienteRequest } from '../../ventas/service/cliente.service';

@Component({
  selector: 'vex-cliente-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    NgIf,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    DragDropModule,
    CdkDrag,
    CdkDragHandle
  ],
  templateUrl: './cliente-edit.component.html',
  styleUrl: './cliente-edit.component.scss'
})
export class ClienteEditComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  @ViewChild('nombreInput') nombreInput!: ElementRef<HTMLInputElement>;
  @ViewChild('telefonoInput') telefonoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('documentoInput') documentoInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ClienteEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClienteDto | null,
    private clienteService: ClienteService
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      telefono: [''],
      documento: ['']
    });

    if (data) {
      this.form.patchValue({
        nombre: data.nombre,
        telefono: data.telefono || '',
        documento: data.documento || ''
      });
    }
  }

  ngOnInit() {
    // Component initialization
  }

  ngAfterViewInit() {
    this.dialogRef.afterOpened().subscribe(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.setInitialFocus();
          this.setupDrag();
        }, 50);
      });
    });
  }

  private setupDrag() {
    const overlayElement = document.querySelector('.cdk-overlay-pane');
    if (overlayElement) {
      (overlayElement as HTMLElement).style.position = 'relative';
    }
  }

  private setInitialFocus() {
    try {
      const nombreValue = this.form.controls['nombre'].value;
      const telefonoValue = this.form.controls['telefono'].value;
      const documentoValue = this.form.controls['documento'].value;
      
      const allFieldsFilled = nombreValue && telefonoValue && documentoValue;
      
      if (allFieldsFilled && this.nombreInput?.nativeElement) {
        this.nombreInput.nativeElement.focus({ preventScroll: true });
        this.nombreInput.nativeElement.select();
        return;
      }
      
      if (!nombreValue && this.nombreInput?.nativeElement) {
        this.nombreInput.nativeElement.focus({ preventScroll: true });
        return;
      }
      
      if (!telefonoValue && this.telefonoInput?.nativeElement) {
        this.telefonoInput.nativeElement.focus({ preventScroll: true });
        return;
      }
      
      if (this.documentoInput?.nativeElement) {
        this.documentoInput.nativeElement.focus({ preventScroll: true });
      }
    } catch (e) {
      console.debug('Focus management skipped:', e);
    }
  }

  onTelefonoFocus() {
    if (this.telefonoInput?.nativeElement) {
      setTimeout(() => {
        this.telefonoInput.nativeElement.select();
      }, 0);
    }
  }

  onDocumentoFocus() {
    if (this.documentoInput?.nativeElement) {
      setTimeout(() => {
        this.documentoInput.nativeElement.select();
      }, 0);
    }
  }

  get isEditMode(): boolean {
    return !!(this.data && this.data.id && this.data.id !== 0);
  }

  get buttonLabel(): string {
    return this.isEditMode ? 'Actualizar cliente' : 'Registrar cliente';
  }

  save() {
    if (this.form.invalid) return;
    
    const form = this.form.value;
    const clienteRequest: CreateClienteRequest = {
      nombre: form.nombre,
      telefono: form.telefono || undefined,
      documento: form.documento || undefined
    };

    if (this.isEditMode) {
      const clienteId = this.data!.id;
      this.clienteService.updateCliente(clienteId, clienteRequest).subscribe({
        next: (result) => this.dialogRef.close({ ...result, _edit: true }),
        error: (err) => alert('Error al actualizar el cliente: ' + (err?.error?.message || err.message || err))
      });
    } else {
      this.clienteService.createCliente(clienteRequest).subscribe({
        next: (result) => this.dialogRef.close(result),
        error: (err) => alert('Error al guardar el cliente: ' + (err?.error?.message || err.message || err))
      });
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
