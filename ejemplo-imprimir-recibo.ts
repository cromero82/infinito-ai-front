// Ejemplo de función de impresión para recibo basada en tu ejemplo
// Esta función debe ser agregada al componente recibo.component.ts

import { Component, ViewChild, ElementRef } from '@angular/core';

export class ReciboComponent {
  // Si tienes un componente hijo para el recibo, usa ViewChild
  // @ViewChild('reciboContent') reciboContent: ElementRef;
  
  // Datos del recibo (ajusta según tu estructura)
  reciboData: any = {
    detalles: [],
    total: 0,
    fecha: new Date(),
    // ... otros campos
  };

  /**
   * Función para imprimir el recibo en formato de tirilla (80mm)
   * Esta función verifica localStorage y luego imprime
   */
  public imprimirRecibo(): void {
    // Verificar si debe imprimir según localStorage
    const debeImprimir = localStorage.getItem('imprimir-recibo') === 'true';
    
    if (!debeImprimir) {
      console.log('Impresión deshabilitada en localStorage');
      return;
    }

    // Generar el HTML del recibo
    const reciboHTML = this.generarHTMLRecibo();

    // Abrir ventana de impresión
    const printerWindow = window.open('', '_blank');
    
    if (!printerWindow) {
      alert('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    printerWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Imprimir Recibo</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html {
            padding: 0;
            margin: 0;
            font-family: 'Courier New', monospace;
            width: 80mm;
            font-size: 12px;
          }

          body {
            margin: 0;
            padding: 8px;
            width: 80mm;
          }

          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }

          .header h1 {
            margin: 5px 0;
            font-size: 16px;
            font-weight: bold;
          }

          .header p {
            margin: 2px 0;
            font-size: 10px;
          }

          .detalle-item {
            margin: 5px 0;
            padding: 3px 0;
            border-bottom: 1px dotted #ccc;
          }

          .detalle-nombre {
            font-weight: bold;
            margin-bottom: 2px;
          }

          .detalle-info {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }

          .total {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
          }

          .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }

          p {
            margin-top: 0.25rem;
            margin-bottom: 0.25rem;
            white-space: pre-wrap;
          }

          .text-center {
            text-align: center;
          }

          .text-right {
            text-align: right;
          }

          .text-left {
            text-align: left;
          }

          .font-bold {
            font-weight: bold;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          tr, th, td {
            padding: 2px 0;
            border-bottom: 1px dotted #ccc;
          }

          .nowrap {
            overflow: hidden;
            text-overflow: clip;
            white-space: nowrap;
          }
        </style>
        <script>
          window.onafterprint = event => {
            window.close();
          };
          
          // Imprimir automáticamente cuando la ventana esté lista
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </head>
      <body>
        ${reciboHTML}
      </body>
      </html>
    `);

    printerWindow.document.close();
    printerWindow.focus();
    
    // La impresión se ejecutará automáticamente cuando la ventana cargue
    // gracias al window.onload en el script
  }

  /**
   * Genera el HTML del recibo con los detalles y total
   */
  private generarHTMLRecibo(): string {
    let html = `
      <div class="header">
        <h1>RECIBO DE PAGO</h1>
        <p>Fecha: ${this.formatearFecha(this.reciboData.fecha)}</p>
        <p>Hora: ${this.formatearHora(this.reciboData.fecha)}</p>
      </div>

      <div class="detalles">
    `;

    // Agregar detalles del recibo
    if (this.reciboData.detalles && this.reciboData.detalles.length > 0) {
      this.reciboData.detalles.forEach((detalle: any) => {
        html += `
          <div class="detalle-item">
            <div class="detalle-nombre">${this.escapeHtml(detalle.nombre || detalle.descripcion || 'Item')}</div>
            <div class="detalle-info">
              <span>Cant: ${detalle.cantidad || 1}</span>
              <span>Precio: $${this.formatearNumero(detalle.precio || 0)}</span>
              <span>Subtotal: $${this.formatearNumero(detalle.subtotal || detalle.precio || 0)}</span>
            </div>
          </div>
        `;
      });
    }

    html += `
      </div>

      <div class="total">
        <p>TOTAL: $${this.formatearNumero(this.reciboData.total || 0)}</p>
      </div>

      <div class="footer">
        <p>Gracias por su compra</p>
        <p>${new Date().getFullYear()}</p>
      </div>
    `;

    return html;
  }

  /**
   * Función auxiliar para escapar HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Formatea un número a dos decimales
   */
  private formatearNumero(numero: number): string {
    return numero.toFixed(2);
  }

  /**
   * Formatea la fecha
   */
  private formatearFecha(fecha: Date): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  /**
   * Formatea la hora
   */
  private formatearHora(fecha: Date): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Función que se llama después de cerrar el modal de confirmación
   * Esta debe ser llamada desde el callback del modal
   */
  public onCerrarModalConfirmacion(): void {
    // Verificar localStorage antes de imprimir
    const debeImprimir = localStorage.getItem('imprimir-recibo') === 'true';
    
    if (debeImprimir) {
      // Pequeño delay para asegurar que el modal se cerró completamente
      setTimeout(() => {
        this.imprimirRecibo();
      }, 300);
    }
  }
}
