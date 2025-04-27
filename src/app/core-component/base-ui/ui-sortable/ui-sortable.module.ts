import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UiSortableRoutingModule } from './ui-sortable-routing.module';
import { UiSortableComponent } from './ui-sortable.component';
import { CdkDrag, CdkDropList} from '@angular/cdk/drag-drop';


@NgModule({
  declarations: [
    UiSortableComponent
  ],
  imports: [
    CommonModule,
    UiSortableRoutingModule,
    CdkDrag,
    CdkDropList,
  ]
})
export class UiSortableModule { }
