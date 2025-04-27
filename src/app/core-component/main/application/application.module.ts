import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApplicationRoutingModule } from './application-routing.module';
import { ApplicationComponent } from './application.component';
import { FileArchivedComponent } from './file/file-archived/file-archived.component';
import { FileDocumentComponent } from './file/file-document/file-document.component';
import { FileFavouritesComponent } from './file/file-favourites/file-favourites.component';
import { FileManagerComponent } from './file/file-manager/file-manager.component';
import { FileManagerDeletedComponent } from './file/file-manager-deleted/file-manager-deleted.component';
import { FileRecentComponent } from './file/file-recent/file-recent.component';
import { sharedModule } from 'src/app/shared/shared.module';
import { FileSharedComponent } from './file/file-shared/file-shared.component';
import { ChatComponent } from './chat/chat.component';
import { CallHistoryComponent } from './call/call-history/call-history.component';
import { AudioCallComponent } from './call/audio-call/audio-call.component';
import { TodoComponent } from './todo/todo.component';
import { NotesComponent } from './notes/notes.component';
import { VideoCallComponent } from './call/video-call/video-call.component';
import { SocialFeedComponent } from './social-feed/social-feed.component';
import { KanbanComponent } from './kanban/kanban.component';


@NgModule({
  declarations: [
    ApplicationComponent,
    FileArchivedComponent,
    FileDocumentComponent,
    FileFavouritesComponent,
    FileManagerComponent,
    FileManagerDeletedComponent,
    FileRecentComponent,
    FileSharedComponent,
    ChatComponent,
    CallHistoryComponent,
    AudioCallComponent,
    TodoComponent,
    NotesComponent,
    VideoCallComponent,
    SocialFeedComponent,
    KanbanComponent,
  ],
  imports: [
    CommonModule,
    ApplicationRoutingModule,
    sharedModule
  ]
})
export class ApplicationModule { }
