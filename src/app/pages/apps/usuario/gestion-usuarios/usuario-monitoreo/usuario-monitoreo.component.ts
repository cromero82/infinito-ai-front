import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../auth/service/auth.service';
import { BitacoraUsuarioService, BitacoraUsuarioDto, BitacoraUsuarioPage } from '../service/bitacora-usuario.service';

export interface UsuarioDto {
  id: string;
  nombre: string;
  correoElectronico: string;
  contrasena: string;
  telefono: string;
  activo: boolean;
  roles: Array<{
    id: number;
    nombre: string;
    sigla: string;
  }>;
}

@Component({
    selector: 'gm-usuario-monitoreo',
    templateUrl: './usuario-monitoreo.component.html',
    styleUrls: ['./usuario-monitoreo.component.scss'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
    ],
    encapsulation: ViewEncapsulation.None
})
export class UsuarioMonitoreoComponent implements OnInit, OnDestroy {
  usuarios: UsuarioDto[] = [];
  loading = false;
  error: string | null = null;
  selectedUsuarioId: string | null = null;
  fechaCtrl = new FormControl<Date | null>(null);
  
  // Bitácora state
  bitacora: BitacoraUsuarioDto[] = [];
  bitacoraLoading = false;
  bitacoraError: string | null = null;
  page = 0;
  size = 10;
  totalElements = 0;
  totalPages = 0;
  loadingMore = false;
  
  private destroy$ = new Subject<void>();
  @ViewChild('bitacoraList', { static: false }) bitacoraListRef?: ElementRef<HTMLDivElement>;

  constructor(
    private authService: AuthService,
    private bitacoraUsuarioService: BitacoraUsuarioService,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsuarios(): void {
    this.loading = true;
    this.error = null;
    
    this.authService.obtenerUsuarios().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (usuarios: unknown) => {
        this.usuarios = usuarios as UsuarioDto[];
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Error loading usuarios', err);
        this.error = 'Error al cargar la lista de usuarios.';
        this.loading = false;
      }
    });
  }

  selectUsuario(usuario: UsuarioDto): void {
    if (this.selectedUsuarioId === usuario.id) {
      return; // Already selected
    }
    
    this.selectedUsuarioId = usuario.id;
    this.bitacora = [];
    this.bitacoraError = null;
    this.page = 0;
    this.loadBitacora(usuario.id);
  }

  onFechaChange(): void {
    if (!this.selectedUsuarioId) {
      return;
    }
    
    this.page = 0;
    this.loadBitacora(this.selectedUsuarioId);
  }

  clearFecha(): void {
    this.fechaCtrl.setValue(null);
    if (this.selectedUsuarioId) {
      this.page = 0;
      this.loadBitacora(this.selectedUsuarioId);
    }
  }

  loadBitacora(userId: string): void {
    if (this.page === 0) {
      this.bitacoraLoading = true;
      this.bitacora = [];
    } else {
      this.loadingMore = true;
    }
    this.bitacoraError = null;
    
    // Format date as YYYY-MM-DD if a date is selected
    let fechaParam: string | undefined;
    if (this.fechaCtrl.value) {
      const date = this.fechaCtrl.value;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      fechaParam = `${year}-${month}-${day}`;
    }
    
    this.bitacoraUsuarioService.searchBitacoraUsuario(userId, this.page, this.size, fechaParam).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (page: BitacoraUsuarioPage) => {
        const newContent = page.content ?? [];
        
        if (this.page === 0) {
          this.bitacora = newContent;
        } else {
          this.bitacora = this.bitacora.concat(newContent);
        }
        
        this.totalElements = page.totalElements ?? 0;
        this.totalPages = page.totalPages ?? 0;
        this.bitacoraLoading = false;
        this.loadingMore = false;
      },
      error: (err) => {
        console.error('Error loading bitacora', err);
        this.bitacoraError = 'Error al cargar la bitácora del usuario.';
        this.bitacoraLoading = false;
        this.loadingMore = false;
      }
    });
  }

  onBitacoraListScroll(): void {
    if (!this.bitacoraListRef?.nativeElement || !this.selectedUsuarioId) {
      return;
    }

    const element = this.bitacoraListRef.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    const remainingScroll = scrollHeight - (scrollTop + clientHeight);
    const estimatedItemHeight = 60;
    const triggerThreshold = Math.max(100, estimatedItemHeight * 2);
    const isNearBottom = remainingScroll <= triggerThreshold;

    if (isNearBottom && this.page < this.totalPages - 1 && !this.loadingMore && !this.bitacoraLoading) {
      this.page = this.page + 1;
      this.loadBitacora(this.selectedUsuarioId);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeStr = date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase();

    if (dateOnly.getTime() === today.getTime()) {
      return `Hoy, ${timeStr}`;
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return `Ayer, ${timeStr}`;
    } else {
      const daysDiff = Math.floor((today.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) {
        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = daysOfWeek[date.getDay()];
        return `${dayName}, ${timeStr}`;
      } else {
        const day = date.getDate();
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const monthName = months[date.getMonth()];
        return `${day}-${monthName}, ${timeStr}`;
      }
    }
  }

  getSelectedUsuario(): UsuarioDto | null {
    if (!this.selectedUsuarioId) {
      return null;
    }
    return this.usuarios.find(u => u.id === this.selectedUsuarioId) || null;
  }

  formatValorAntes(valorAntes: string, valorDespues: string): SafeHtml {
    if (!valorAntes) {
      return this.sanitizer.bypassSecurityTrustHtml('-');
    }

    if (!valorDespues) {
      // Solo hay valor antes, mostrar completo
      return this.sanitizer.bypassSecurityTrustHtml(this.formatJsonHighlight(valorAntes, 'removed'));
    }

    try {
      const antesObj = JSON.parse(valorAntes);
      const despuesObj = JSON.parse(valorDespues);
      
      return this.sanitizer.bypassSecurityTrustHtml(this.formatObjectWithRemovals(antesObj, despuesObj));
    } catch (error) {
      // Si no son JSON válidos, comparar como strings
      return this.sanitizer.bypassSecurityTrustHtml(this.highlightStringDiff(valorAntes, valorDespues, 'removed'));
    }
  }

  formatValorDespues(valorAntes: string, valorDespues: string): SafeHtml {
    if (!valorDespues) {
      return this.sanitizer.bypassSecurityTrustHtml('-');
    }

    if (!valorAntes) {
      // Solo hay valor después, mostrar completo
      return this.sanitizer.bypassSecurityTrustHtml(this.formatJsonHighlight(valorDespues, 'added'));
    }

    try {
      const antesObj = JSON.parse(valorAntes);
      const despuesObj = JSON.parse(valorDespues);
      
      return this.sanitizer.bypassSecurityTrustHtml(this.formatObjectWithAdditions(antesObj, despuesObj));
    } catch (error) {
      // Si no son JSON válidos, comparar como strings
      return this.sanitizer.bypassSecurityTrustHtml(this.highlightStringDiff(valorAntes, valorDespues, 'added'));
    }
  }

  private formatJsonHighlight(jsonString: string, type: 'added' | 'removed'): string {
    try {
      const obj = JSON.parse(jsonString);
      const keys = Object.keys(obj);
      const className = type === 'added' ? 'diff-added-line' : 'diff-removed-line';
      
      let html = '<div class="diff-json">';
      keys.forEach(key => {
        const value = JSON.stringify(obj[key]);
        html += `<div class="${className}"><strong>${this.escapeHtml(key)}</strong>: ${this.removeQuotesFromValue(value)}</div>`;
      });
      html += '</div>';
      return html;
    } catch {
      const className = type === 'added' ? 'diff-added' : 'diff-removed';
      return `<span class="${className}">${this.escapeHtml(jsonString)}</span>`;
    }
  }

  private formatObjectWithRemovals(antes: any, despues: any): string {
    const antesKeys = Object.keys(antes || {});
    const despuesKeys = Object.keys(despues || {});
    
    const removedKeys = antesKeys.filter(k => !despuesKeys.includes(k));
    const commonKeys = antesKeys.filter(k => despuesKeys.includes(k));
    
    let html = '<div class="diff-json">';
    
    // Mostrar claves eliminadas - buscar si hay un valor similar en despues para comparar
    removedKeys.forEach(key => {
      const valueAntes = String(antes[key]);
      // Buscar si hay algún valor similar en despues para comparar
      const valorSimilarEnDespues = this.findSimilarValue(valueAntes, Object.values(despues || {}));
      
      if (valorSimilarEnDespues) {
        // Hay un valor similar, resaltar solo las diferencias
        const highlighted = this.highlightStringDiff(valueAntes, valorSimilarEnDespues, 'removed');
        html += `<div><strong>${this.escapeHtml(key)}</strong>: ${highlighted}</div>`;
      } else {
        // No hay valor similar, mostrar completo en rojo
        const style = 'background-color:rgba(244,67,54,0.5);color:#c62828;padding:3px 6px;border-radius:4px;font-weight:bold;';
        html += `<div><strong>${this.escapeHtml(key)}</strong>: <span style="${style}">${this.escapeHtml(valueAntes)}</span></div>`;
      }
    });
    
    // Mostrar claves comunes
    commonKeys.forEach(key => {
      const antesValue = antes[key];
      const despuesValue = despues[key];
      
      if (JSON.stringify(antesValue) !== JSON.stringify(despuesValue)) {
        // Valores diferentes - resaltar solo las diferencias
        // Convertir a string sin las comillas del JSON para comparar solo el valor
        const antesStr = typeof antesValue === 'string' ? antesValue : JSON.stringify(antesValue).replace(/^"|"$/g, '');
        const despuesStr = typeof despuesValue === 'string' ? despuesValue : JSON.stringify(despuesValue).replace(/^"|"$/g, '');
        const highlighted = this.highlightStringDiff(antesStr, despuesStr, 'removed');
        html += `<div><strong>${this.escapeHtml(key)}</strong>: ${highlighted}</div>`;
      } else {
        // Valores iguales - mostrar normal
        const valueStr = typeof antesValue === 'string' ? antesValue : JSON.stringify(antesValue);
        html += `<div><strong>${this.escapeHtml(key)}</strong>: ${this.removeQuotesFromValue(valueStr)}</div>`;
      }
    });
    
    html += '</div>';
    return html;
  }

  private formatObjectWithAdditions(antes: any, despues: any): string {
    const antesKeys = Object.keys(antes || {});
    const despuesKeys = Object.keys(despues || {});
    
    const addedKeys = despuesKeys.filter(k => !antesKeys.includes(k));
    const commonKeys = antesKeys.filter(k => despuesKeys.includes(k));
    
    let html = '<div class="diff-json">';
    
    // Mostrar claves comunes
    commonKeys.forEach(key => {
      const antesValue = antes[key];
      const despuesValue = despues[key];
      
      if (JSON.stringify(antesValue) !== JSON.stringify(despuesValue)) {
        // Valores diferentes - resaltar solo las diferencias
        // Convertir a string sin las comillas del JSON para comparar solo el valor
        const antesStr = typeof antesValue === 'string' ? antesValue : JSON.stringify(antesValue).replace(/^"|"$/g, '');
        const despuesStr = typeof despuesValue === 'string' ? despuesValue : JSON.stringify(despuesValue).replace(/^"|"$/g, '');
        const highlighted = this.highlightStringDiff(antesStr, despuesStr, 'added');
        html += `<div><strong>${this.escapeHtml(key)}</strong>: ${highlighted}</div>`;
      } else {
        // Valores iguales - mostrar normal
        const valueStr = typeof despuesValue === 'string' ? despuesValue : JSON.stringify(despuesValue);
        html += `<div><strong>${this.escapeHtml(key)}</strong>: ${this.removeQuotesFromValue(valueStr)}</div>`;
      }
    });
    
    // Mostrar claves agregadas - buscar si hay un valor similar en antes para comparar
    addedKeys.forEach(key => {
      const valueDespues = String(despues[key]);
      // Buscar si hay algún valor similar en antes para comparar
      const valorSimilarEnAntes = this.findSimilarValue(valueDespues, Object.values(antes || {}));
      
      if (valorSimilarEnAntes) {
        // Hay un valor similar, resaltar solo las diferencias
        const highlighted = this.highlightStringDiff(valorSimilarEnAntes, valueDespues, 'added');
        html += `<div><strong>${this.escapeHtml(key)}</strong>: ${highlighted}</div>`;
      } else {
        // No hay valor similar, mostrar completo en verde
        const style = 'background-color:rgba(76,175,80,0.5);color:#2e7d32;padding:3px 6px;border-radius:4px;font-weight:bold;';
        html += `<div><strong>${this.escapeHtml(key)}</strong>: <span style="${style}">${this.escapeHtml(valueDespues)}</span></div>`;
      }
    });
    
    html += '</div>';
    return html;
  }

  private highlightStringDiff(before: string, after: string, type: 'added' | 'removed'): string {
    if (!before || !after) {
      return this.escapeHtml(before || after || '');
    }

    if (before === after) {
      return this.escapeHtml(before);
    }

    const target = type === 'removed' ? before : after;
    const other = type === 'removed' ? after : before;
    
    // Encontrar el prefijo común al inicio (comparación carácter por carácter)
    let prefixEnd = 0;
    const minLen = Math.min(target.length, other.length);
    while (prefixEnd < minLen && target[prefixEnd] === other[prefixEnd]) {
      prefixEnd++;
    }
    
    // Encontrar el sufijo común al final
    // Comparar desde el final, pero solo en la parte que queda después del prefijo común
    let suffixStart = 0;
    const targetRemaining = target.length - prefixEnd;
    const otherRemaining = other.length - prefixEnd;
    const maxSuffixLen = Math.min(targetRemaining, otherRemaining);
    
    while (suffixStart < maxSuffixLen && 
           target[target.length - 1 - suffixStart] === other[other.length - 1 - suffixStart]) {
      suffixStart++;
    }
    
    // Extraer las partes
    const prefix = target.substring(0, prefixEnd);
    const diff = target.substring(prefixEnd, target.length - suffixStart);
    const suffix = target.substring(target.length - suffixStart);
    
    // Verificar que realmente haya una diferencia
    if (diff.length === 0 || (prefix.length === 0 && suffix.length === 0 && target !== other)) {
      // Si no se detectó diferencia pero los strings son diferentes, mostrar todo
      const backgroundColor = type === 'removed' ? 'rgba(244,67,54,0.5)' : 'rgba(76,175,80,0.5)';
      const textColor = type === 'removed' ? '#c62828' : '#2e7d32';
      const style = `background-color:${backgroundColor};color:${textColor};padding:3px 6px;border-radius:4px;font-weight:bold;`;
      return `<span style="${style}">${this.escapeHtml(target)}</span>`;
    }
    
    // Solo resaltar si hay una diferencia real (hay prefijo o sufijo común)
    if (prefix.length > 0 || suffix.length > 0) {
      const backgroundColor = type === 'removed' ? 'rgba(244,67,54,0.5)' : 'rgba(76,175,80,0.5)';
      const textColor = type === 'removed' ? '#c62828' : '#2e7d32';
      const style = `background-color:${backgroundColor};color:${textColor};padding:2px 4px;border-radius:3px;font-weight:bold;`;
      
      return `${this.escapeHtml(prefix)}<span style="${style}">${this.escapeHtml(diff)}</span>${this.escapeHtml(suffix)}`;
    }
    
    // Fallback: mostrar todo como diferencia
    const backgroundColor = type === 'removed' ? 'rgba(244,67,54,0.5)' : 'rgba(76,175,80,0.5)';
    const textColor = type === 'removed' ? '#c62828' : '#2e7d32';
    const style = `background-color:${backgroundColor};color:${textColor};padding:3px 6px;border-radius:4px;font-weight:bold;`;
    return `<span style="${style}">${this.escapeHtml(target)}</span>`;
  }

  private findSimilarValue(targetValue: string, values: any[]): string | null {
    const targetStr = String(targetValue);
    
    // Buscar un valor que tenga un prefijo o sufijo común significativo con el target
    for (const val of values) {
      const valStr = String(val);
      
      // Si tienen un prefijo común de al menos 5 caracteres o un sufijo común
      const minCommonLen = Math.min(targetStr.length, valStr.length);
      if (minCommonLen >= 5) {
        // Verificar prefijo común
        let prefixLen = 0;
        while (prefixLen < minCommonLen && targetStr[prefixLen] === valStr[prefixLen]) {
          prefixLen++;
        }
        
        // Verificar sufijo común
        let suffixLen = 0;
        while (suffixLen < minCommonLen - prefixLen && 
               targetStr[targetStr.length - 1 - suffixLen] === valStr[valStr.length - 1 - suffixLen]) {
          suffixLen++;
        }
        
        // Si hay al menos 5 caracteres comunes (prefijo o sufijo), considerarlo similar
        if (prefixLen >= 5 || suffixLen >= 5 || (prefixLen + suffixLen) >= 5) {
          return valStr;
        }
      }
    }
    
    return null;
  }

  private removeQuotesFromValue(value: string): string {
    // Si el valor es un string JSON con comillas al inicio y final, removerlas
    if (value && value.startsWith('"') && value.endsWith('"') && value.length > 1) {
      // Escapar el contenido antes de remover las comillas
      return this.escapeHtml(value.substring(1, value.length - 1));
    }
    return this.escapeHtml(value);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  navigateToHistorialVentas(referenciaId: number): void {
    this.router.navigate(['/apps/tickets/historial'], { 
      queryParams: { sesionId: referenciaId }
    });
  }
}