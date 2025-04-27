import { NgModule } from '@angular/core';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LightboxModule } from 'ngx-lightbox';
import { NgScrollbarModule } from 'ngx-scrollbar';

@NgModule({
  imports: [
    PopoverModule.forRoot(),
    TooltipModule.forRoot(),
    LightboxModule,
    NgScrollbarModule,
  ],
  exports: [
    PopoverModule,
    TooltipModule,
    LightboxModule,
    NgScrollbarModule,
  ],
  providers: [
    
  ],
})
export class NgxbootstrapModule {}
