import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appImageZoomOverlay]',
  standalone: true
})
export class ImageZoomOverlayDirective {
  @Input('appImageZoomOverlay') zoomSrc: string | undefined;
  private overlayImg: HTMLImageElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter', ['$event'])
  onMouseEnter(event: MouseEvent) {
    if (!this.zoomSrc) return;
    const hostEl = this.el.nativeElement as HTMLElement;
    // Hide the original image
    hostEl.style.opacity = '0';
    hostEl.style.transition = 'opacity 0.1s';

    this.overlayImg = this.renderer.createElement('img');
    if (this.overlayImg) {
      this.overlayImg.src = this.zoomSrc;
      this.renderer.setStyle(this.overlayImg, 'position', 'fixed');
      this.renderer.setStyle(this.overlayImg, 'pointer-events', 'none');
      this.renderer.setStyle(this.overlayImg, 'object-fit', 'cover');
      this.renderer.setStyle(this.overlayImg, 'border-radius', '8px');
      this.renderer.setStyle(this.overlayImg, 'box-shadow', '0 4px 16px rgba(0,0,0,0.25)');
      this.renderer.setStyle(this.overlayImg, 'z-index', '2147483647');
      this.renderer.setStyle(this.overlayImg, 'background', 'white');
      this.renderer.setStyle(this.overlayImg, 'border', '2px solid #eee');
      this.renderer.setStyle(this.overlayImg, 'display', 'block');
      // Place the overlay at the mouse position, offset so the mouse is over the center
      const zoom = 2.5;
      const rect = hostEl.getBoundingClientRect();
      const zoomedWidth = rect.width * zoom;
      const zoomedHeight = rect.height * zoom;
      // Place the overlay so the mouse is at the center of the zoomed image
      const left = event.clientX - zoomedWidth / 2;
      const top = event.clientY - zoomedHeight / 2;
      this.renderer.setStyle(this.overlayImg, 'left', `${left}px`);
      this.renderer.setStyle(this.overlayImg, 'top', `${top}px`);
      this.renderer.setStyle(this.overlayImg, 'width', `${zoomedWidth}px`);
      this.renderer.setStyle(this.overlayImg, 'height', `${zoomedHeight}px`);
      document.body.appendChild(this.overlayImg);
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.overlayImg) {
      const hostEl = this.el.nativeElement as HTMLElement;
      const zoom = 2.5;
      const rect = hostEl.getBoundingClientRect();
      const zoomedWidth = rect.width * zoom;
      const zoomedHeight = rect.height * zoom;
      const left = event.clientX - zoomedWidth / 2;
      const top = event.clientY - zoomedHeight / 2;
      this.overlayImg.style.left = `${left}px`;
      this.overlayImg.style.top = `${top}px`;
      this.overlayImg.style.width = `${zoomedWidth}px`;
      this.overlayImg.style.height = `${zoomedHeight}px`;
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    // Restore the original image
    const hostEl = this.el.nativeElement as HTMLElement;
    hostEl.style.opacity = '';
    hostEl.style.transition = '';
    if (this.overlayImg) {
      document.body.removeChild(this.overlayImg);
      this.overlayImg = null;
    }
  }
}
