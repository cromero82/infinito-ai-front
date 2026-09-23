import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NotificacionEmailPagoDto } from '../service/gestion-notificaciones-medios.service';

export type VistaMensaje = 'NORMAL' | 'WYSIWYG';

export interface MensajeCompletoDialogData {
  notificacion: NotificacionEmailPagoDto;
}

/**
 * Mensaje original (cuerpoRaw). Toggle:
 * - NORMAL: texto plano (links clicables; si el raw es HTML, se ve sin etiquetas).
 * - WYSIWYG: intenta renderizar HTML con estilos (iframe aislado).
 */
@Component({
  selector: 'app-notificacion-mensaje-completo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Mensaje completo</h2>
    <mat-dialog-content class="msg-content">
      <p class="meta">
        <strong>Asunto:</strong> {{ data.notificacion.asunto || '—' }}
      </p>
      <p class="meta">
        <strong>Recibido:</strong>
        {{ data.notificacion.recibidoEn | date: 'dd/MM/yyyy HH:mm:ss' }}
      </p>

      <div class="vista-bar">
        <mat-button-toggle-group
          [(ngModel)]="vista"
          name="vistaMensaje"
          aria-label="Modo de visualización">
          <mat-button-toggle value="NORMAL">Original</mat-button-toggle>
          <mat-button-toggle value="WYSIWYG">Web</mat-button-toggle>
        </mat-button-toggle-group>
        <span class="vista-hint">{{ hintVista }}</span>
      </div>

      @if (vista === 'NORMAL') {
        <div class="cuerpo-box" [innerHTML]="normalHtml"></div>
      } @else {
        <iframe
          class="wysiwyg-frame"
          title="Vista WYSIWYG del correo"
          [srcdoc]="wysiwygSrcdoc"
          sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"></iframe>
        @if (!esHtml) {
          <p class="aviso-plano">
            Este correo se guardó como texto plano (sin HTML). La vista WYSIWYG
            aplica un formato básico; los vínculos siguen disponibles.
          </p>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="copiar()">
        <mat-icon svgIcon="mat:content_copy"></mat-icon>
        Copiar texto
      </button>
      <button mat-flat-button color="primary" type="button" mat-dialog-close>
        Cerrar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .msg-content {
        min-width: min(720px, 92vw);
        max-width: 860px;
      }
      .meta {
        margin: 0 0 6px;
        font-size: 0.875rem;
      }
      .vista-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 14px;
        margin: 10px 0 12px;
      }
      .vista-hint {
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.55);
      }
      .cuerpo-box {
        white-space: pre-wrap;
        word-break: break-word;
        background: #f4f5f7;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 8px;
        padding: 14px 16px;
        font-size: 13.5px;
        line-height: 1.45;
        max-height: 58vh;
        overflow: auto;
        user-select: text;
      }
      .cuerpo-box a {
        color: #1565c0;
        word-break: break-all;
      }
      .wysiwyg-frame {
        display: block;
        width: 100%;
        height: min(58vh, 520px);
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 8px;
        background: #fff;
      }
      .aviso-plano {
        margin: 8px 0 0;
        font-size: 0.75rem;
        color: rgba(0, 0, 0, 0.55);
      }
      mat-dialog-actions button mat-icon {
        width: 18px;
        height: 18px;
        margin-right: 4px;
        vertical-align: middle;
      }
    `
  ]
})
export class NotificacionMensajeCompletoDialogComponent {
  vista: VistaMensaje = 'WYSIWYG';
  readonly esHtml: boolean;
  readonly normalHtml: SafeHtml;
  readonly wysiwygSrcdoc: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MensajeCompletoDialogData,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {
    const raw = this.textoCompleto;
    this.esHtml = this.looksLikeHtml(raw);
    const plain = this.esHtml ? this.stripHtml(raw) : raw;
    this.normalHtml = this.sanitizer.bypassSecurityTrustHtml(
      this.linkify(plain)
    );
    this.wysiwygSrcdoc = this.buildWysiwygDocument(raw, this.esHtml);
  }

  get hintVista(): string {
    return this.vista === 'NORMAL'
      ? 'Texto original / plano, fácil de copiar vínculos.'
      : 'Vista web con estilos (HTML del correo o formato básico).';
  }

  get textoCompleto(): string {
    const n = this.data.notificacion;
    const raw = (n.cuerpoRaw || '').trim();
    if (raw) {
      return raw;
    }
    return (n.cuerpoTexto || '').trim() || '(sin cuerpo)';
  }

  copiar(): void {
    const text = this.esHtml
      ? this.stripHtml(this.textoCompleto)
      : this.textoCompleto;
    void navigator.clipboard.writeText(text).then(
      () =>
        this.snackBar.open('Mensaje copiado al portapapeles', 'Cerrar', {
          duration: 2200
        }),
      () =>
        this.snackBar.open('No se pudo copiar', 'Cerrar', { duration: 2500 })
    );
  }

  private looksLikeHtml(text: string): boolean {
    const t = text.trim().toLowerCase();
    if (t.startsWith('<!doctype') || t.startsWith('<html')) {
      return true;
    }
    return /<\/?(?:html|body|div|table|p|br|a|span|img|style|font)\b/i.test(
      text
    );
  }

  private stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const text = doc.body?.textContent || html;
    return text.replace(/\n{3,}/g, '\n\n').trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private linkify(text: string): string {
    const escaped = this.escapeHtml(text);
    return escaped.replace(
      /(https?:\/\/[^\s<>"']+)/gi,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  private buildWysiwygDocument(raw: string, isHtml: boolean): string {
    if (isHtml) {
      // Aísla el HTML del correo; sin scripts (sandbox del iframe).
      return raw;
    }
    const body = this.linkify(raw);
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{margin:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    font-size:14px;line-height:1.5;color:#1a2332;background:#fff;white-space:pre-wrap;word-break:break-word;}
  a{color:#1565c0;word-break:break-all;}
</style></head><body>${body}</body></html>`;
  }
}
