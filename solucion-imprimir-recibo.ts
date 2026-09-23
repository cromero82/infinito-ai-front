/**
 * SOLUCIÓN PARA IMPRIMIR RECIBO
 * 
 * Esta función debe reemplazar tu función imprimirRecibo() actual en recibo.component.ts
 * 
 * REQUISITOS:
 * 1. Verifica localStorage.getItem('imprimir-recibo') === 'true' antes de imprimir
 * 2. Usa window.open() para abrir una nueva ventana (como en tu ejemplo)
 * 3. Escribe el HTML directamente en la ventana
 * 4. Llama window.print() automáticamente cuando la ventana carga
 * 5. Cierra la ventana después de imprimir
 */

/**
 * Función principal de impresión - REEMPLAZA tu función imprimirRecibo() actual
 */
public imprimirRecibo(): void {
  // 1. Verificar localStorage antes de imprimir
  const debeImprimir = localStorage.getItem('imprimir-recibo') === 'true';
  
  if (!debeImprimir) {
    console.log('Impresión deshabilitada: imprimir-recibo no está en true');
    return;
  }

  // 2. Obtener los datos del recibo actual
  // AJUSTA ESTO según tu estructura de datos real
  const reciboData = {
    detalles: this.detallesRecibo || this.items || [], // Ajusta según tu propiedad
    total: this.totalRecibo || this.total || 0, // Ajusta según tu propiedad
    fecha: new Date(),
    numeroRecibo: this.numeroRecibo || '',
    cliente: this.cliente || '',
    // Agrega otros campos que necesites
  };

  // 3. Generar el HTML del recibo
  const htmlContent = this.generarHTMLRecibo(reciboData);

  // 4. Abrir ventana de impresión (CRÍTICO: usar window.open como en tu ejemplo)
  const printerWindow = window.open('', '_blank');
  
  if (!printerWindow) {
    alert('Por favor, permite ventanas emergentes para imprimir');
    return;
  }

  // 5. Escribir el HTML completo en la ventana
  printerWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Imprimir Recibo</title>
      <meta charset="UTF-8">
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }

        * {
          box-sizing: border-box;
        }

        html {
          padding: 0;
          margin: 0;
          font-family: 'Courier New', 'Courier', monospace;
          width: 80mm;
          font-size: 12px;
        }

        body {
          margin: 0;
          padding: 8px;
          width: 80mm;
          background: white;
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
          text-transform: uppercase;
        }

        .header p {
          margin: 2px 0;
          font-size: 10px;
        }

        .detalles {
          margin: 10px 0;
        }

        .detalle-item {
          margin: 5px 0;
          padding: 3px 0;
          border-bottom: 1px dotted #ccc;
        }

        .detalle-nombre {
          font-weight: bold;
          margin-bottom: 2px;
          font-size: 11px;
        }

        .detalle-info {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-top: 2px;
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
          margin: 5px 0;
        }

        tr, th, td {
          padding: 2px 0;
          border-bottom: 1px dotted #ccc;
          text-align: left;
        }

        .text-right {
          text-align: right;
        }

        .text-center {
          text-align: center;
        }

        .text-left {
          text-align: left;
        }

        .font-bold {
          font-weight: bold;
        }
      </style>
      <script>
        // Cerrar ventana después de imprimir (como en tu ejemplo)
        window.onafterprint = function() {
          setTimeout(function() {
            window.close();
          }, 100);
        };
        
        // Imprimir automáticamente cuando la ventana esté lista (CRÍTICO)
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

  // 6. Cerrar el documento para que se renderice
  printerWindow.document.close();
  
  // 7. Enfocar la ventana
  printerWindow.focus();
  
  // NOTA: window.print() se llamará automáticamente cuando la ventana cargue
  // gracias al window.onload en el script dentro del HTML
}

/**
 * Genera el HTML del recibo con los detalles y total
 * AJUSTA esta función según la estructura real de tus datos
 */
private generarHTMLRecibo(data: any): string {
  let html = `
    <div class="header">
      <h1>RECIBO DE PAGO</h1>
      <p>Fecha: ${this.formatearFecha(data.fecha)}</p>
      <p>Hora: ${this.formatearHora(data.fecha)}</p>
      ${data.numeroRecibo ? `<p>Recibo #: ${this.escapeHtml(data.numeroRecibo)}</p>` : ''}
    </div>

    <div class="detalles">
  `;

  // Agregar detalles del recibo
  if (data.detalles && data.detalles.length > 0) {
    data.detalles.forEach((detalle: any) => {
      const nombre = detalle.nombre || detalle.descripcion || detalle.producto || 'Item';
      const cantidad = detalle.cantidad || 1;
      const precio = detalle.precio || detalle.precioUnitario || 0;
      const subtotal = detalle.subtotal || (precio * cantidad);
      
      html += `
        <div class="detalle-item">
          <div class="detalle-nombre">${this.escapeHtml(String(nombre))}</div>
          <div class="detalle-info">
            <span>Cant: ${cantidad}</span>
            <span>Precio: $${this.formatearNumero(precio)}</span>
            <span class="text-right">Subtotal: $${this.formatearNumero(subtotal)}</span>
          </div>
        </div>
      `;
    });
  } else {
    html += `<p>No hay detalles disponibles</p>`;
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

/**
 * Función auxiliar para escapar HTML y prevenir XSS
 */
private escapeHtml(text: string | number): string {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * Formatea un número a dos decimales
 */
private formatearNumero(numero: number): string {
  if (numero === null || numero === undefined) return '0.00';
  return Number(numero).toFixed(2);
}

/**
 * Formatea la fecha
 */
private formatearFecha(fecha: Date): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  const dia = d.getDate().toString().padStart(2, '0');
  const mes = (d.getMonth() + 1).toString().padStart(2, '0');
  const año = d.getFullYear();
  return `${dia}/${mes}/${año}`;
}

/**
 * Formatea la hora
 */
private formatearHora(fecha: Date): string {
  if (!fecha) return '';
  const d = new Date(fecha);
  const horas = d.getHours().toString().padStart(2, '0');
  const minutos = d.getMinutes().toString().padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * ============================================
 * INTEGRACIÓN CON EL MODAL DE CONFIRMACIÓN
 * ============================================
 * 
 * Después de que se cierra el modal de "pago registrado correctamente",
 * llama a esta función:
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

/**
 * Ejemplo de cómo integrar con Swal (SweetAlert):
 * 
 * Swal.fire({
 *   title: '¡Éxito!',
 *   text: 'Pago registrado correctamente',
 *   icon: 'success',
 *   confirmButtonText: 'Cerrar'
 * }).then((result) => {
 *   if (result.isConfirmed) {
 *     this.onCerrarModalConfirmacion();
 *   }
 * });
 * 
 * O si usas otro tipo de modal:
 * 
 * modal.onClose.subscribe(() => {
 *   this.onCerrarModalConfirmacion();
 * });
 */
