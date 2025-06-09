import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { WebrtcService } from '../services/webrtc.service';
import { collection, deleteDoc, getDoc, where } from 'firebase/firestore';
import { doc, onSnapshot } from '@angular/fire/firestore';
import { showMessage } from '../alerts_messages/alert-messages.component';
import { from } from 'rxjs';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css']
})
export class CallComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('localVideo', { static: true }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo',{ static: true }) remoteVideo!: ElementRef<HTMLVideoElement>;

  currentUserId = localStorage.getItem("user") || '';
  otherUserId!: string;
  private callDoc: any;
  callCompId: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private webrtcService: WebrtcService
  ) { }

  ngAfterViewInit(): void {
    // this.webrtcService.onRemoteStream((stream: MediaStream) => {
    //   if (this.remoteVideo?.nativeElement) {
    //     this.remoteVideo.nativeElement.srcObject = stream;
    //     this.remoteVideo.nativeElement.muted = true; // For autoplay testing
    //     this.remoteVideo.nativeElement.play().catch(e => console.log('Autoplay error:', e));
    //   }
    // });
    this.webrtcService.onRemoteStream((stream: MediaStream) => {
      const videoEl = this.remoteVideo?.nativeElement;
      if (videoEl) {
        console.log("🎯 Setting srcObject manually:", stream);

        // this.localVideo.nativeElement.srcObject = stream;
        // this.remoteVideo.nativeElement.srcObject = stream;
        stream.getTracks().forEach(track => {
          console.log(`${track.kind} - enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
        })
        // Remove existing tracks
        try {
          videoEl.srcObject = stream;
          // videoEl.onloadedmetadata = () => videoEl.play()
        } catch (e) {
          videoEl.srcObject = new MediaStream(stream);
        }
        // Force binding using Object.defineProperty fallback
        setTimeout(() => {
          console.log("✅ Final video.srcObject check", this.remoteVideo.nativeElement.srcObject);
          console.log("🎥 Remote tracks", stream.getTracks());
          videoEl.addEventListener("loadedmetadata",() => {
            console.log("🔊 Remote stream tracks:", stream.getTracks());
            videoEl.play().catch(err =>
              console.warn("Failed to autoplay remote video", err)
            );
          });
        }, 2000);
      }
    });
  }

  async ngOnInit() {
    this.callCompId = this.route.snapshot.params['uid'];
    this.otherUserId = (this.callCompId.split("_")[0] != this.currentUserId) ? this.callCompId.split("_")[0] : this.callCompId.split("_")[1];
    console.log(this.otherUserId);

    // this.webrtcService.resetConnection();

    this.callDoc = await this.firebaseService.createCallDoc(this.currentUserId, this.otherUserId);

    // Set up remote stream handler BEFORE signaling

    // Init local stream and bind to local video
    const localStream = await this.webrtcService.initLocalStream();
    this.localVideo.nativeElement.srcObject = localStream;


    const snapshot = await getDoc(this.callDoc);
    console.log(snapshot.data());

    const data: any = snapshot.data();
    console.log(this.otherUserId, this.currentUserId);

    if (data?.from === this.otherUserId && data?.to === this.currentUserId && data.offer) {
      // callee
      console.log('📲 Answering call...');
      await this.webrtcService.answerCall(this.callDoc);
    } else {
      // caller
      console.log('📞 Creating offer...');
      await this.webrtcService.createOffer(this.callDoc, this.currentUserId, this.otherUserId);
      onSnapshot(this.callDoc, (docSnap: any) => {
        const callData: any = docSnap.data();
        if (callData?.answer && !this.webrtcService.peerConnection.remoteDescription) {
          this.webrtcService.peerConnection.setRemoteDescription(
            new RTCSessionDescription(callData.answer)
          );
        }
      });
    }

    // Listen for ICE candidates
    this.webrtcService.listenForCandidates(this.callDoc, 'offer');
    this.webrtcService.listenForCandidates(this.callDoc, 'answer');
  }

  toggleMute() {
    const stream = this.localVideo.nativeElement.srcObject as MediaStream;
    const audioTracks = stream?.getAudioTracks();
    if (audioTracks && audioTracks.length > 0) {
      audioTracks.forEach(track => (track.enabled = !track.enabled));
    }
    // this.remoteVideo.nativeElement.onloadedmetadata = () => {
    console.log("🔊 Remote stream tracks:", stream.getTracks());
    console.log(this.localVideo.nativeElement.srcObject);
    console.log(this.remoteVideo.nativeElement.srcObject);
    
    // this.localVideo.nativeElement.srcObject.getTracks();
    this.localVideo.nativeElement.play().catch(err =>
      console.warn("Failed to autoplay local video", err)
    );
    this.remoteVideo.nativeElement.play().catch(err =>
      console.warn("Failed to autoplay remote video", err)
    );
    setInterval(() => this.remoteVideo.nativeElement.play().catch(e => console.log(e)), 1000)
    // };
  }

  // In CallComponent
  async endCall() {
    try {
      // Stop all media tracks
      const localStream = this.localVideo.nativeElement.srcObject as MediaStream;
      const remoteStream = this.remoteVideo.nativeElement.srcObject as MediaStream;

      localStream?.getTracks().forEach(track => track.stop());
      remoteStream?.getTracks().forEach(track => track.stop());

      // Clean up Firestore document
      if (this.callDoc) {
        await deleteDoc(this.callDoc);
        showMessage("Call Ended", "Call has been ended", "info");
      }
    } catch (err) {
      // console.error('Error ending call:', err);
      showMessage("Error", "Something went wrong", 'error');
    } finally {
      this.router.navigate(['/chat']);
    }
  }

  ngOnDestroy() {
    this.endCall();
  }
}
