// Ejemplo de cómo integrar la impresión después de cerrar el modal
// Este código muestra cómo debe verse la función de confirmar pago

export class ReciboComponent {
  
  /**
   * Función que se ejecuta al confirmar el pago efectivo
   */
  confirmarPagoEfectivo(): void {
    // Llamar al endpoint para pagar
    this.pagarRecibo().subscribe(
      (response) => {
        // Si el pago fue exitoso, mostrar modal de confirmación
        this.mostrarModalPagoExitoso();
      },
      (error) => {
        // Manejar error
        console.error('Error al procesar el pago:', error);
      }
    );
  }

  /**
   * Muestra el modal de "pago registrado correctamente"
   * Ejemplo con Swal (SweetAlert) o similar
   */
  mostrarModalPagoExitoso(): void {
    // Ejemplo con Swal
    Swal.fire({
      title: '¡Éxito!',
      text: 'Pago registrado correctamente',
      icon: 'success',
      confirmButtonText: 'Cerrar',
      allowOutsideClick: false
    }).then((result) => {
      // Este callback se ejecuta cuando se cierra el modal
      if (result.isConfirmed || result.dismiss === Swal.DismissReason.close) {
        // Verificar localStorage y imprimir si es necesario
        this.verificarEImprimir();
      }
    });

    // O si usas otro tipo de modal, el patrón sería:
    // modal.onClose.subscribe(() => {
    //   this.verificarEImprimir();
    // });
  }

  /**
   * Verifica localStorage y ejecuta la impresión si es necesario
   */
  verificarEImprimir(): void {
    const debeImprimir = localStorage.getItem('imprimir-recibo') === 'true';
    
    if (debeImprimir) {
      // Pequeño delay para asegurar que el modal se cerró completamente
      setTimeout(() => {
        this.imprimirRecibo();
      }, 300);
    }
  }

  /**
   * Función de impresión mejorada basada en tu ejemplo
   */
  imprimirRecibo(): void {
    // Obtener los datos del recibo actual
    const reciboData = this.obtenerDatosRecibo();
    
    // Generar HTML
    const htmlContent = this.generarHTMLRecibo(reciboData);

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

          table {
            width: 100%;
            border-collapse: collapse;
          }

          tr, th, td {
            padding: 2px 0;
            border-bottom: 1px dotted #ccc;
          }
        </style>
        <script>
          window.onafterprint = function() {
            window.close();
          };
          
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `);

    printerWindow.document.close();
    printerWindow.focus();
  }

  /**
   * Obtiene los datos del recibo actual
   * Ajusta según tu estructura de datos
   */
  private obtenerDatosRecibo(): any {
    return {
      detalles: this.detallesRecibo || [],
      total: this.totalRecibo || 0,
      fecha: new Date(),
      // ... otros campos que necesites
    };
  }

  /**
   * Genera el HTML del recibo
   */
  private generarHTMLRecibo(data: any): string {
    let html = `
      <div class="header">
        <h1>RECIBO DE PAGO</h1>
        <p>Fecha: ${this.formatearFecha(data.fecha)}</p>
        <p>Hora: ${this.formatearHora(data.fecha)}</p>
      </div>

      <div class="detalles">
    `;

    // Agregar detalles
    if (data.detalles && data.detalles.length > 0) {
      data.detalles.forEach((detalle: any) => {
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
        <p>TOTAL: $${this.formatearNumero(data.total || 0)}</p>
      </div>

      <div class="footer">
        <p>Gracias por su compra</p>
        <p>${new Date().getFullYear()}</p>
      </div>
    `;

    return html;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private formatearNumero(numero: number): string {
    return numero.toFixed(2);
  }

  private formatearFecha(fecha: Date): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  private formatearHora(fecha: Date): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
}
