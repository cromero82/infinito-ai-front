import { Component, ElementRef, Renderer2 } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';  
@Component({
  selector: 'app-pos-5',
  standalone: false,
  
  templateUrl: './pos-5.component.html',
  styleUrl: './pos-5.component.scss'
})
export class Pos5Component {
istab=true;
  istab2=false;
  istab3=false;
  istab4=false;
  istab5=false;
  istab6=false;
  istab7=false;
   constructor(
      private renderer: Renderer2, private el: ElementRef
    ){}
PosSlider3:OwlOptions={
  items: 6,
      loop:false,
      margin:8,
      nav:false,
      dots: false,
      autoplay:false,
      smartSpeed: 1000,
      autoWidth:true,
      responsive:{
        0:{
          items:2
        },
        500:{
          items:6
        },
        768:{
          items:6
        },
        991:{
          items:5
        },
        1200:{
          items:6
        },
        1400:{
          items:6
        }
      }
}
openTab():void{
  this.istab=true;
  this.istab2=false;
  this.istab3=false;
  this.istab4=false;
  this.istab5=false;
  this.istab6=false;
  this.istab7=false;
}
openTab2():void{
  this.istab2=true;
  this.istab=false;
  this.istab3=false;
  this.istab4=false;
  this.istab5=false;
  this.istab6=false;
  this.istab7=false;


}
openTab3():void{
  this.istab3=true;
  this.istab=false;
  this.istab2=false;
  this.istab4=false;
  this.istab5=false;
  this.istab6=false;
  this.istab7=false;
}
openTab4():void{
  this.istab4=true;
  this.istab=false;
  this.istab3=false;
  this.istab2=false;
  this.istab5=false;
  this.istab6=false;
  this.istab7=false;
}
openTab5():void{
  this.istab5=true;
  this.istab=false;
  this.istab3=false;
  this.istab4=false;
  this.istab2=false;
  this.istab6=false;
  this.istab7=false;
}
openTab6():void{
  this.istab6=true;
  this.istab=false;
  this.istab3=false;
  this.istab4=false;
  this.istab5=false;
  this.istab2=false;
  this.istab7=false;
}
openTab7():void{
  this.istab7=true;
  this.istab=false;
  this.istab3=false;
  this.istab4=false;
  this.istab5=false;
  this.istab2=false;
  this.istab6=false;
}

ngAfterViewInit(): void {
  const divElements: HTMLElement[] = Array.from(this.el.nativeElement.querySelectorAll('.product-info.card'));
const productList: HTMLElement | null = this.el.nativeElement.querySelector('.product-list.border-0.p-0');
const productList2: HTMLElement | null = this.el.nativeElement.querySelector('.empty-cart');

  const checkActiveElements = () => {
    const hasActive = divElements.some((el: HTMLElement) => el.classList.contains('active'));
    if (productList) {
      this.renderer.setStyle(productList, 'display', hasActive ? 'block' : 'none');
      if(productList2){
        this.renderer.setStyle(productList2, 'display',hasActive?'none':'flex')
      }
    }
  };
  divElements.forEach((divElement: HTMLElement) => {
    this.renderer.listen(divElement, 'click', () => {
      if (divElement.classList.contains('active')) {
        this.renderer.removeClass(divElement, 'active');
      } else {
        this.renderer.addClass(divElement, 'active');
      }
      checkActiveElements();
    });
  });
  checkActiveElements();
}
}
