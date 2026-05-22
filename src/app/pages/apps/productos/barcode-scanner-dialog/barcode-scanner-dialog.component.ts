import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  CameraDevice
} from 'html5-qrcode';

const SCANNER_ELEMENT_ID = 'barcode-scanner-viewport';

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF
];

@Component({
  selector: 'gm-barcode-scanner-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './barcode-scanner-dialog.component.html',
  styleUrl: './barcode-scanner-dialog.component.scss'
})
export class BarcodeScannerDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('scannerHost') scannerHost?: ElementRef<HTMLElement>;

  loading = true;
  errorMessage: string | null = null;
  canSwitchCamera = false;

  private scanner: Html5Qrcode | null = null;
  private cameras: CameraDevice[] = [];
  private cameraIndex = 0;
  private scanHandled = false;
  private starting = false;

  constructor(private dialogRef: MatDialogRef<BarcodeScannerDialogComponent>) {}

  ngAfterViewInit(): void {
    void this.initScanner();
  }

  ngOnDestroy(): void {
    void this.destroyScanner();
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  async cambiarCamara(): Promise<void> {
    if (this.cameras.length < 2 || this.starting) return;
    this.cameraIndex = (this.cameraIndex + 1) % this.cameras.length;
    await this.restartScanner();
  }

  private async initScanner(): Promise<void> {
    if (!document.getElementById(SCANNER_ELEMENT_ID)) {
      this.errorMessage = 'No se pudo iniciar el visor de la cámara.';
      this.loading = false;
      return;
    }

    try {
      this.cameras = await Html5Qrcode.getCameras();
      this.canSwitchCamera = this.cameras.length > 1;
      this.cameraIndex = this.pickPreferredCameraIndex(this.cameras);
      await this.startScanner();
    } catch (err) {
      this.loading = false;
      this.errorMessage = this.mapCameraError(err);
    }
  }

  private pickPreferredCameraIndex(cameras: CameraDevice[]): number {
    if (cameras.length === 0) return 0;
    const backIdx = cameras.findIndex((c) =>
      /back|rear|trasera|environment/i.test(c.label)
    );
    return backIdx >= 0 ? backIdx : 0;
  }

  private async startScanner(): Promise<void> {
    if (this.starting) return;
    this.starting = true;
    this.loading = true;
    this.errorMessage = null;

    try {
      if (!this.scanner) {
        this.scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
          formatsToSupport: BARCODE_FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false
        });
      }

      const cameraConfig = this.resolveCameraConfig();
      await this.scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => ({
            width: Math.min(viewfinderWidth * 0.85, 320),
            height: Math.min(viewfinderHeight * 0.45, 160)
          }),
          aspectRatio: 1.777778
        },
        (decodedText) => this.onBarcodeDetected(decodedText),
        () => {
          /* errores por frame sin lectura; se ignoran */
        }
      );
      this.loading = false;
    } catch (err) {
      this.loading = false;
      this.errorMessage = this.mapCameraError(err);
    } finally {
      this.starting = false;
    }
  }

  private resolveCameraConfig(): string | MediaTrackConstraints {
    const selected = this.cameras[this.cameraIndex];
    if (selected?.id) {
      return selected.id;
    }
    return { facingMode: 'environment' };
  }

  private async restartScanner(): Promise<void> {
    await this.destroyScanner();
    this.scanner = null;
    await this.startScanner();
  }

  private onBarcodeDetected(raw: string): void {
    if (this.scanHandled) return;
    const codigo = raw?.trim();
    if (!codigo) return;

    this.scanHandled = true;
    void this.destroyScanner().finally(() => {
      this.dialogRef.close(codigo);
    });
  }

  private async destroyScanner(): Promise<void> {
    if (!this.scanner) return;
    try {
      if (this.scanner.isScanning) {
        await this.scanner.stop();
      }
      this.scanner.clear();
    } catch {
      /* liberar cámara aunque falle stop */
    }
  }

  private mapCameraError(err: unknown): string {
    const name =
      err instanceof DOMException
        ? err.name
        : (err as { name?: string })?.name ?? '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return 'Permiso de cámara denegado. Habilítelo en la configuración del navegador o del dispositivo.';
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'No se encontró ninguna cámara en este dispositivo.';
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'La cámara está en uso por otra aplicación. Ciérrela e intente de nuevo.';
    }
    if (name === 'SecurityError') {
      return 'El navegador bloqueó el acceso a la cámara. Use HTTPS o localhost.';
    }
    const msg = (err as { message?: string })?.message?.trim();
    return msg || 'No se pudo activar la cámara.';
  }
}
