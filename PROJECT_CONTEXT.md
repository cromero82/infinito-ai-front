app: esto es una version inicial de un sistema POS, existen funcionalidades para gestionar productos, registrar clientes, y el eje central es vender productos asociados a clientes, otras funcionalidades: consultar dichas ventas, registrar cortes de ventas, gestion de usuarios (autenticacion), trazabilidad de eventos en el sistema, copias de seguridad.hola estas ahi

contexto: 
a) Reiniciar sesion. Iniciar sesion, o finalizar e iniciar sesion nuevamente (ir a la seccion o componente (toolbar-user-dropdown) button (click)="logout()", e iniciar sesion en el componente (login.component) la app redirecciona por defecto: http://localhost:4200/apps/ventas

estructura de app: 
i) funcionalidad Ventas: en el enrutador: http://localhost:4200/apps/ventas
j) funcionalidad Productos: en la ruta: http://localhost:4200/apps/products/list
k) funcionalidad Historial ventas: en la ruta: http://localhost:4200/apps/ventas/historial
l) funcionalidad Dashboard cortes: en la ruta: http://localhost:4200/apps/ventas/dashboard

Enfoquemonos en la funcioalidad Ventas:
	esta conformado por siguientes componentes:
		TicketsComponent (tickets): Carga los tickets (tickets[]) que son como cuentas o registro maestro donde se agrupan a un cliente, usuario que atiende (Atendido o atendido Por) y la fecha con una sesion.
		alli existe el concepto de cliente identificado (cuyo nombre es distinto de ANONIMO)
		Estos tickets estan identificados por tabs (mat-tabs) y existe una agrupacion o boton
			-> componentes internos de tickets: 
					elemento clave: input #productSearchInput. es un input que tiene que tener el focus todo el tiempo (o estar escuchando) ya que debe estar asociado a una lectora de codigo de barras y cada vez que se lea un producto debe consultar el codigo de barras e identificar un producto. tambien es requerido para escribir alli un producto por nombre ya que algunos productos no tienen codigo de barras o requiero consultarlo con descripcion alfanumerico. este componente no deberia entrar en conflicto con otros input de edicion de texto ya que cuando otros editores (input) se estan ejecutando en otra funcionalidad que tiene el foco, esos procesos deben terminar y una vez los cambios se realizan, el focus debe volver a input #productSearchInput 
			
				a) detalle-ticket (DetalleTicket) es la lista de productos que se estan vendiendo (producto, Atendido, Cantidad, Subtotal). ofrece al usuario una vesta en forma de tabla a traves de un array de objetos: "detalles" (pero internamente tiene unos elementos para editar dichos elementos y nutrir la edicion con mayor facilidad)
					
					Interacciones o funcionalidades en operacion: DetalleTicket tiene unas funcionalidades internas:
						* Cargue de tickets. si me cambio de funcionalidad: existe un mecanismo de carga de tickets de usuarios identificados, o carga los tickets que ese usuario registro previamente en la sesion actual, si la recien ha iniciado sesion en el sistema, y no hay tickets identificados, entonces crea un nuevo ticket.
						
						* MTD - Moverme entre venta de productos usando teclas de direccion: una vez un ticket (con sus  detalles de recibo) es cargado, existe algo llamado "elemento Seleccionado", por defecto se ubica en el primer item (inclusive lo dibuja con un estilo diferente como elemento seleccionado) luego yo debo poder moverme usando las teclas de direccion.

						* ADE - Aumentar o Disminuir cantidad usando el teclado: al estar un item seleccionado, y presionar la tecla '+',  '-', esto debe modificar la cantidad del item 'detalles' es decir los productos de la venta actual (o recibo actual), es decir si la cantidad del item seleccionado es: 2,  y presiono la tecla '+' debe aumentarla a 3, si luego vuelvo a presionar pero esta vez la tecla '-' debe cambiar a 2, si presiono ahora dos veces la tecla  '-', entonces como ya no quedan cantidad 0 o -1 entonces elimina el producto. 
						
						* DC Prod - Doble click en item de la columna (producto) habilita o convierte (para el usuario) el label en una caja de texto ([formControl]="editingProductoCtrl") esto le permite al usuario modificar el producto y una vez el usuario termina si ejecuta la tecla 'Enter' el cambio se envia al servicio backend para modificar unicamente el nombre del producto. este comportamiento debe mantenerse hasta que el usuario haga clic afuera de otro elemento o presione la tecla enter, mientras tanto el usaurio puede mover las teclas de direccion o cambiar texto, este comportamiento no deberia entrar en conflicto con #productSearchInput (es decir no debe robarse el focus  #productSearchInput mientras esta edicion este en proceso)
						
						*DC ValorUnitario - Doble click en item de la columna (Valor unitario)  habilita o convierte (para el usuario) el label en una caja de texto de tipo numeric incremental ([formControl]="editingUnitarioCtrl") esto permite al usuario modificar el valor unitario (de ese producto obviamente), el focus debe mantenerse ahi mientras tanto, una vez el usuario presiona la tecla 'enter' o hace click afuera de dicho item el cambio es actualizado. este comportamiento no deberia entrar en conflicto con #productSearchInput (es decir no debe robarse el focus  #productSearchInput mientras esta edicion este en proceso)
						
						* DC Cantidad - Doble click en item de la columna (Cantidad) habilita o convierte (para el usuario) el label en una caja de texto de tipo numeric incremental [formControl]="editingCantidadCtrl" esto le permite al usuario modificar la cantidad de ese producto que va a vender, el focus debe mantenerse ahi mientras tanto, una vez el usuario presiona la tecla 'enter' o hace click afuera de dicho elemento el cambio es actualizado. este comportamiento no deberia entrar en conflicto con #productSearchInput (es decir no debe robarse el focus  #productSearchInput mientras esta edicion este en proceso)
						
						* Seleccionar item. Debe permitir cambiar el producto seleccinado en utilizando el mouse haciendo clic sobre cualquier campo de dicha fila (producto, atendio, valorunitario, cantidad) importante aclarar que la fila "Atendido" solo aparece en escenarios: Usuario identificado (y ademas otra condicion: fue atendido en dias distintos  y por personas distintas) y no es un campo editable.
	
					-> DetalleTicket tiene Componente internos:
						w) metodos-pago. Es un listado de metodos de pago. carga unos botones, existe uno de ellos llamado "EFECTIVO" con sigla "EF" el cual cuando el usuario hace clic en el, se ejecuta un componente modal (realmente este item lo recibe y procesa DetalleTicket) y en tal caso ejecuta el componente PagoEfectivoCambioComponent.
						x) PagoEfectivoCambioComponent. es un componente para calcular el cambio que debe devolversele al cliente cuando este paga ejemplo con un cash o billete de cierta denominacion. ejemplo: la factura vale 4000 y paga en efectivo con 10000, debe devolversele 6000. mientras el modal este en operacion el focus debe mantenerse en sus inputs internos (#pagaConInput) y no debe interferirse (enviar focus a otro componente como lo es #productSearchInput.
						y) edicion-recibo. es un componente que permite modificar el recibo o cuenta original, realmente obtiene los datos de otra tabla y hace una funcionalidad especifica, alli hay unos botones para ello, ese componente puede ejecutar internamente el componente 
				
				b) SelectorProductosComponent (selector-productos). Es el componente que una vez input #productSearchInput detecta que algun texto ha sido aceptado alli (digitado por el usuario usando el teclado o a traves de una lectura de codigo de barras (lo cual tambien es la insercion de un codigo como si un usuario se tratara), entonces se activa este componente, el cual se ejecuta de manera modal, internament tiene un input #searchInput (NO CONFUNDIR CON #productSearchInput EN EL COMPONENTE tickets) y se encarga de consultar productos y seleccionarlos (una ves seleccionado son tomados por el componente de tickets, el cual los envia o registra para que sean cargados en elcomponente DetalleTicket como un item de producto mas en venta) 
						
				x) QuickDetalleTicket se un componente que se ejecuta en modo modal, y sirve para generar un ticket con 1 unico item, es como hacer una cuenta rapida y registrarla en el sistema, no tiene mucha interaccion, salvo porque tiene dos inputs (1 para seleccionar un cliente[cliente-selector] y el otro para definir el total de la venta [#totalInput], no deberian inteferir con el focus de #productSearchInput deben continuar con el focus mientras esten en operacion.

---

## Comportamiento implementado (Ventas / Tickets / Detalle) — referencia para IA y mantenimiento

Resumen de decisiones ya codificadas en el repo. Al cambiar estos flujos, revisar los archivos citados para no reintroducir regresiones.

### Arquitectura del buscador de producto

- El **FormControl** del texto de búsqueda vive en **`DetalleTicketComponent`** (`productSearchCtrl`), pero el **`<input #productSearchInput>`** está en la plantilla de **`TicketsComponent`** enlazado a ese mismo control.
- **`DetalleTicketComponent`** emite **`focusSearchInputRequest`** cuando un flujo debe devolver el foco al buscador; **`TicketsComponent`** lo enlaza a **`focusProductSearch()`**.

### Búsqueda automática, debounce y `SelectorProductosComponent`

- En **`detalle-ticket.component.ts`**, `productSearchCtrl.valueChanges` usa **`debounceTime(400)`** y **`distinctUntilChanged()`** antes de llamar a **`performProductSearch`** (búsqueda preview vía API).
- **No** se deshabilita el input solo por estar `searchingProduct` en curso: deshabilitarlo hacía que, mientras la petición HTTP corría, **no entraran más caracteres** y se perdiera texto al abrir el modal (el usuario seguía escribiendo en el teclado pero el control ignoraba entrada).
- Cuando la petición preview **termina**, si el valor actual del control **ya no coincide** con el `term` de esa petición (el usuario siguió escribiendo), se **vuelve a lanzar** la búsqueda con el texto actual en lugar de abrir el selector con un término obsoleto.
- Al abrir el diálogo **`SelectorProductosComponent`**, el término inicial debe alinearse con el **valor actual** del control al cerrar la respuesta HTTP, no solo con el `term` capturado al inicio de la petición.
- Tras **elegir un producto** en el selector, antes de persistir el detalle se hace **`productSearchCtrl.setValue('', { emitEvent: false })`** para no disparar búsquedas duplicadas ni estados raros mientras el backend confirma el alta.

### Enter, `keyup` vs `keydown` y segundo modal

- En **`tickets.component.html`**, el buscador usa **`(keydown.enter)`** (no `keyup.enter`): al confirmar con Enter dentro del modal **`selector-productos`**, el **keyup** puede reaplicarse al `#productSearchInput` bajo el overlay y disparar otra búsqueda o **reabrir el modal**. El manejador usa **`Event`** + comprobación de **`isComposing`** donde aplica.
- En **`selector-productos.component.ts`**, al seleccionar con Enter se usa **`preventDefault`** y **`stopPropagation`** en el keydown del `#searchInput`.

### Foco en `#productSearchInput` al cambiar de tab de ticket

- **`TicketsComponent.focusProductSearch`**: doble **`requestAnimationFrame`**, intento de foco a **~100 ms**, y **reintento** si el foco activo no es el input (p. ej. **~320 ms** y otro intento a **+220 ms**), porque **`mat-tab-link`** a veces **vuelve a enfocar el tab** después del clic.
- **`fetchReciboForTicket`** admite un flag **`scheduleSearchFocusAfterApply`**: cuando el cambio de ticket viene de **`selectTicket`**, tras aplicar **`currentReciboId`** en el siguiente tick se programa otra pasada de **`focusProductSearch(false)`** para alinear foco con el recibo ya enlazado.

### Doble clic en tab → `EditarTabTicketComponent`

- Un doble clic genera **dos `click`** y luego **`dblclick`**. El segundo `click` tiene **`MouseEvent.detail === 2`**: en **`onTicketTabClick`** solo se llama **`focusProductSearch(false)`** cuando **`detail === 1`**, para no encolar dos ráfagas de foco.
- Al abrir el modal de edición de tab se activa **`suppressProductSearchFocusUntil`** (~1,2 s) para que los **`setTimeout`** ya programados por el primer clic **no roben el foco al `MatDialog`**; se limpia en **`afterClosed`**.
- El diálogo de editar tab usa **`autoFocus: true`** para que el primer control del modal (p. ej. cliente) pueda recibir foco una vez suprimida la competencia del buscador.

### Histórico de acciones en fila (`toggleHistoricoAcciones`)

- El icono que expande/contrae **`historicoAcciones`** es un **`<button>`**: al hacer clic, el foco pasa al botón.
- Tras **`toggleHistoricoAcciones`** en **`detalle-ticket.component.ts`**, en **`setTimeout(..., 0)`** se emite **`focusSearchInputRequest`** para devolver el foco al **`#productSearchInput`** sin obligar al cajero a hacer clic de nuevo en el buscador.

### Valores de tiempo (orientativos)

- **Debounce búsqueda producto (ticket / recibo)**: **400 ms** en `productSearchCtrl.valueChanges` dentro de **`detalle-ticket.component.ts`**. Es el tiempo de espera **después de que el usuario deja de escribir** antes de disparar la preview; no debe acortarse sin probar lectores de código de barras y tipeo rápido por nombre.
- **Debounce del modal `selector-productos`**: **400 ms** sobre **`searchCtrl`** en **`selector-productos.component.ts`** — es independiente del debounce del ticket; alimenta la tabla del modal una vez abierto.
- **Foco tras tab / Material**: reintentos en el orden de **100 ms → ~320 ms → +220 ms** (no son debounce de escritura; son **compensación de carrera** con el foco del navegador y **`mat-tab-link`**).
- **Supresión de foco al buscador** al abrir editar tab por doble clic: ventana del orden de **1200 ms** (`suppressProductSearchFocusUntil` en **`tickets.component.ts`**).
- **`toggleHistoricoAcciones`**: **`setTimeout(..., 0)`** solo para ejecutar el **`focusSearchInputRequest`** después del foco nativo del botón, no como debounce de entrada.

### Mapa rápido de código (ventas)

| Tema | Archivo(s) |
|------|------------|
| Input `#productSearchInput`, tabs, `focusProductSearch`, `onTicketTabClick`, supresión de foco, `fetchReciboForTicket(..., scheduleSearchFocusAfterApply)` | `src/app/pages/apps/ventas/tickets/tickets.component.ts`, `tickets.component.html` |
| `productSearchCtrl`, `performProductSearch`, apertura `SelectorProductos`, `openSelectorProductosDialog`, `focusSearchInputRequest`, `toggleHistoricoAcciones` | `src/app/pages/apps/ventas/detalle-ticket/detalle-ticket.component.ts`, `detalle-ticket.component.html` |
| Modal lista de productos, `#searchInput`, Enter / flechas | `src/app/pages/apps/ventas/selector-productos/selector-productos.component.ts`, `selector-productos.component.html` |
| Modal doble clic en tab (cliente / nombre ticket) | `src/app/pages/apps/ventas/editar-tab-ticket/editar-tab-ticket.component.html` (+ `.ts`) |

**Regla práctica para nuevas IAs:** si el síntoma es “se pierde texto”, “se abre el modal dos veces” o “el foco no vuelve al buscador”, revisar primero la tabla anterior antes de introducir nuevos `setTimeout` globales; muchas interacciones ya delegan en **`focusSearchInputRequest`** o en **`focusProductSearch`**.

Seguridad. La actual web app tiene un interceptor que agrega el tocken en cada peticion, por lo que cuando se vayan a realizar nuevos endpoint no es necesario agregar el tocken manualmente.