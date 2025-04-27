import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { routes } from 'src/app/core/helpers/routes';

@Component({
    selector: 'app-ui-toasts',
    templateUrl: './ui-toasts.component.html',
    styleUrl: './ui-toasts.component.scss',
    providers: [MessageService],
    standalone: false
})
export class UiToastsComponent {
  public routes = routes;
  constructor(private messageService: MessageService) {}

  show() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Hello, world! This is a toast message.',
    });
  }

  showPrimaryColor() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }

  showSecondaryColor() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'secondary-light-popover',
    });
  }

  showWarningColor() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }

  showInfoColor() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'info-light-popover',
    });
  }
  showSuccessColor() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'success-light-popover',
    });
  }
  showDangerColor() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'danger-light-popover',
    });
  }
  showPrimaryBackground() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-background-popover',
    });
  }

  showSecondaryBackground() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'secondary-background-popover',
    });
  }

  showWarningBackground() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'warning-background-popover',
    });
  }

  showInfoBackground() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'info-background-popover',
    });
  }
  showSuccessBackground() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'success-background-popover',
    });
  }
  showDangerBackground() {
    this.messageService.add({
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'danger-background-popover',
    });
  }

  showTopLeft() {
    this.messageService.add({
      key: 'tl',
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }

  showTopCenter() {
    this.messageService.add({
      key: 'tc',
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }

  showTopRight() {
    this.messageService.add({
      key: 'tr',
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }

  showMiddleLeft() {
    this.messageService.add({
      key: 'ml',
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }

  showBottomLeft() {
    this.messageService.add({
      key: 'bl',
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }

  showBottomCenter() {
    this.messageService.add({
      key: 'bc',
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }

  showBottomRight() {
    this.messageService.add({
      key: 'br',
      summary: 'Toast',
      detail: 'Your,toast message here.',
      styleClass: 'primary-light-popover',
    });
  }
}
