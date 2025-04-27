import { Component } from '@angular/core';
import { SidebarService } from 'src/app/core/service/sidebar/sidebar.service';

@Component({
    selector: 'app-audio-call',
    templateUrl: './audio-call.component.html',
    styleUrl: './audio-call.component.scss',
    standalone: false
})
export class AudioCallComponent {
  isAddMeetingClassVisible = false;

  toggleAddMeetingClass() {
    this.isAddMeetingClassVisible = !this.isAddMeetingClassVisible;
  }
  closeChat() {
    this.isAddMeetingClassVisible = false;
  }
  isMuted = false;
  isMuteButtonClicked = false;
  toggleMute() {
    this.isMuted = !this.isMuted;
  }
  toggleMute1() {
    this.isMuted = !this.isMuted;
    this.isMuteButtonClicked = true;
  }
  constructor(private sidebar: SidebarService){

  }
  isCollapsed: boolean = false;
  toggleCollapse() {
    this.sidebar.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  isOtherMicOffClicked: boolean = false;

  toggleOtherMicOff() {
    this.isOtherMicOffClicked = !this.isOtherMicOffClicked;
  }
}
