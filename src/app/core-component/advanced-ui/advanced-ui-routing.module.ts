import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdvancedUiComponent } from './advanced-ui.component';

const routes: Routes = [
  { path: '', component: AdvancedUiComponent,children:[
    {
      path: 'ui-timeline',
      loadChildren: () =>
        import('./ui-timeline/ui-timeline.module').then(
          (m) => m.UiTimelineModule
        ),
    },
    {
      path: 'ui-text-editor',
      loadChildren: () =>
        import('./ui-text-editor/ui-text-editor.module').then(
          (m) => m.UiTextEditorModule
        ),
    },
    {
      path: 'ui-scrollbar',
      loadChildren: () =>
        import('./ui-scrollbar/ui-scrollbar.module').then(
          (m) => m.UiScrollbarModule
        ),
    },
    {
      path: 'ui-ribbon',
      loadChildren: () =>
        import('./ui-ribbon/ui-ribbon.module').then((m) => m.UiRibbonModule),
    },
    {
      path: 'ui-rating',
      loadChildren: () =>
        import('./ui-rating/ui-rating.module').then((m) => m.UiRatingModule),
    },
    {
      path: 'ui-drag-drop',
      loadChildren: () =>
        import('./ui-drag-drop/ui-drag-drop.module').then(
          (m) => m.UiDragDropModule
        ),
    },
    {
      path: 'ui-counter',
      loadChildren: () =>
        import('./ui-counter/ui-counter.module').then((m) => m.UiCounterModule),
    },
    {
      path: 'ui-clipboard',
      loadChildren: () =>
        import('./ui-clipboard/ui-clipboard.module').then(
          (m) => m.UiClipboardModule
        ),
    },
  ] },
  { path: 'ui-stickynote', loadChildren: () => import('./ui-stickynote/ui-stickynote.module').then(m => m.UiStickynoteModule) },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdvancedUiRoutingModule {}
