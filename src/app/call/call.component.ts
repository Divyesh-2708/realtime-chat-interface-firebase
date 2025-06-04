import {
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
export class CallComponent implements OnInit, OnDestroy {
  @ViewChild('localVideo', { static: true }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: true }) remoteVideo!: ElementRef<HTMLVideoElement>;

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

  async ngOnInit() {
    this.callCompId = this.route.snapshot.params['uid'];
    this.otherUserId = (this.callCompId.split("_")[0] != this.currentUserId)? this.callCompId.split("_")[0] : this.callCompId.split("_")[1];
    console.log(this.otherUserId);

    this.webrtcService.resetConnection();

    this.callDoc = await this.firebaseService.createCallDoc(this.currentUserId, this.otherUserId);
    // Init local stream and bind to local video
    const localStream = await this.webrtcService.initLocalStream();
    this.localVideo.nativeElement.srcObject = localStream;

    // Set up remote stream handler BEFORE signaling
    this.webrtcService.onRemoteStream((stream) => {
      this.remoteVideo.nativeElement.srcObject = stream;

      // 👇 Ensure the video plays after metadata is loaded
      this.remoteVideo.nativeElement.onloadedmetadata = () => {
        console.log('🎬 Remote video metadata loaded, playing video...');
        this.remoteVideo.nativeElement.play();
      };
    });


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
    console.error('Error ending call:', err);
    showMessage("Error", "Something went wrong", 'error');
  } finally {
    this.router.navigate(['/chat']);
  }
}

  ngOnDestroy() {
    this.endCall();
  }
}
