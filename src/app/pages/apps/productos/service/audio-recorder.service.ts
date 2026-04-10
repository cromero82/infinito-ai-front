import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AudioRecorderService {
  private recorder: any = null;
  private stream: MediaStream | null = null;
  private recordingSubject = new Subject<Blob>();
  private isRecording = false;

  constructor(private ngZone: NgZone) {}

  async startRecording() {
    if (this.isRecording) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const RecordRTC = (window as any).RecordRTC;
      this.recorder = new RecordRTC(this.stream, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
      });
      this.recorder.startRecording();
      this.isRecording = true;
    } catch (err) {
      this.isRecording = false;
      throw err;
    }
  }

  async stopRecording() {
    if (!this.recorder || !this.isRecording) return;
    await new Promise(resolve => this.recorder.stopRecording(resolve));
    const audioBlob = this.recorder.getBlob();
    this.isRecording = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.ngZone.run(() => this.recordingSubject.next(audioBlob));
  }

  get recording$(): Observable<Blob> {
    return this.recordingSubject.asObservable();
  }

  get isRecordingActive(): boolean {
    return this.isRecording;
  }
}
