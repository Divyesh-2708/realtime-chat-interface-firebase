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
import { collection, deleteDoc, getDoc } from 'firebase/firestore';
import { doc } from '@angular/fire/firestore';
import { showMessage } from '../alerts_messages/alert-messages.component';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firebaseService: FirebaseService,
    private webrtcService: WebrtcService
  ) { }

  async ngOnInit() {
    this.otherUserId = this.route.snapshot.params['uid'].split(`_${this.currentUserId}`)[0];

    this.callDoc = await this.firebaseService.createCallDoc(this.currentUserId, this.otherUserId);

    // // Step 1: Set up remote stream handler BEFORE signaling
    this.webrtcService.onRemoteStream((stream) => {
      this.remoteVideo.nativeElement.srcObject = stream;
    });

    // Step 2: Init local stream and bind to local video
    const localStream = await this.webrtcService.initLocalStream();
    this.localVideo.nativeElement.srcObject = localStream;

    // // Step 3: Determine if initiating or answering call
    // const callSnapshot = await getDoc(this.callDoc);
    // if (!callSnapshot.exists()) {
    //   console.log("📞 Creating offer...");
    //   await this.webrtcService.createOffer(this.callDoc, this.currentUserId, this.otherUserId);
    // } else {
    //   console.log("📲 Answering call...");
    //   await this.webrtcService.answerCall(this.callDoc);
    // }

    const snapshot = await getDoc(this.callDoc);
    console.log(snapshot);
    
    const data:any = snapshot.data();
    console.log(this.otherUserId,this.currentUserId);
    
    if (data?.from === this.otherUserId && data?.to === this.currentUserId && data.offer) {
      // This user is the callee
      console.log('📲 Answering call...');
      await this.webrtcService.answerCall(this.callDoc);
    } else {
      // This user is the caller
      console.log('📞 Creating offer...');
      await this.webrtcService.createOffer(this.callDoc, this.currentUserId, this.otherUserId);
    }
    // Step 4: Listen for ICE candidates
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

  async endCall() {
    try {
      if (this.callDoc) {
        await deleteDoc(this.callDoc);
        showMessage("Call Ended", "call has been ended", "info")
      }
    } catch (err) {
      showMessage("Error", "Something went wrong", 'error')
    }

    // Optionally navigate away
    this.router.navigate(['/chat']);
  }

  ngOnDestroy() {
    this.endCall();
  }
}
