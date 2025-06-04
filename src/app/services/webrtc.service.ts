import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  collection,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  addDoc
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class WebrtcService {
  peerConnection: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream = new MediaStream();
  private candidateQueue: RTCIceCandidate[] = [];

  constructor(private firestore: Firestore) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Setup remote track listener immediately
    this.peerConnection.ontrack = (event) => {
      console.log("🎥 ontrack fired with streams:", event.streams);
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };
  }

  async initLocalStream(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });
    return this.localStream;
  }

  async createOffer(callDoc: any, from: string, to: string) {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    await setDoc(callDoc, {
      from,
      to,
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      timestamp: new Date().toISOString()
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const iceCandidate = event.candidate.toJSON();
        addDoc(collection(callDoc, 'offerCandidates'), iceCandidate);
      }
    };
  }

  async answerCall(callDoc: any) {
    const offer = await this.waitForOffer(callDoc);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await updateDoc(callDoc, {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      }
    });

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const iceCandidate = event.candidate.toJSON();
        addDoc(collection(callDoc, 'answerCandidates'), iceCandidate);
      }
    };
  }

  async waitForOffer(callDoc: any): Promise<any> {
    let offer: any = null;

    while (!offer) {
      const callSnapshot = await getDoc(callDoc);
      const data: any = callSnapshot.data();
      offer = data?.offer;

      if (!offer) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
      }
    }

    return offer;
  }

  async listenForCandidates(callDoc: any, type: 'offer' | 'answer') {
    const candidatesCol = collection(callDoc, `${type}Candidates`);

    onSnapshot(candidatesCol, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidateData = change.doc.data();
          const candidate = new RTCIceCandidate(candidateData);

          if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
            this.peerConnection.addIceCandidate(candidate).catch(console.error);
          } else {
            this.candidateQueue.push(candidate);
          }
        }
      });
    });

    this.processQueuedCandidatesWhenReady();
  }

  private async processQueuedCandidatesWhenReady() {
    while (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    for (const candidate of this.candidateQueue) {
      await this.peerConnection.addIceCandidate(candidate).catch(console.error);
    }

    this.candidateQueue = [];
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    callback(this.remoteStream);
  }
}
