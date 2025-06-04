// Filename: webrtc.service.fixed.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  addDoc
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class WebrtcService {
  peerConnection!: RTCPeerConnection;
  localStream!: MediaStream;
  remoteStream = new MediaStream();

  constructor(private firestore: Firestore) {
    this.initializePeer();
  }

  initializePeer() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }],
    });

    this.peerConnection.ontrack = (event) => {
      console.log("🎥 Got track from remote:", event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };
  }

  // async initLocalStream(): Promise<MediaStream> {
  //   this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

  //   this.localStream.getTracks().forEach(track => {
  //     this.peerConnection.addTrack(track, this.localStream);
  //   });

  //   return this.localStream;
  // }

  async initLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Clear any existing tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async createOffer(callDocRef: any, from: string, to: string) {
    const offerCandidates = collection(this.firestore, `${callDocRef.path}/offerCandidates`);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    await setDoc(callDocRef, {
      from,
      to,
      offer,
      timestamp: new Date().toISOString()
    });
  }

  async answerCall(callDocRef: any) {
    const callSnapshot = await getDoc(callDocRef);
    const callData: any = callSnapshot.data();
    if (!callData?.offer) throw new Error('Offer not found.');

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await updateDoc(callDocRef, { answer });

    const answerCandidates = collection(this.firestore, `${callDocRef.path}/answerCandidates`);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };
  }

  async listenForCandidates(callDocRef: any, type: 'offer' | 'answer') {
    const candidatesCollection = collection(this.firestore, `${callDocRef.path}/${type}Candidates`);
    const queue: RTCIceCandidateInit[] = [];

    onSnapshot(candidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const candidate = new RTCIceCandidate(data);

          if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
            this.peerConnection.addIceCandidate(candidate).catch(console.error);
          } else {
            queue.push(data);
          }
        }
      });
    });

    const waitUntilRemoteReady = async () => {
      while (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
        await new Promise(res => setTimeout(res, 100));
      }

      for (const c of queue) {
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(c));
        } catch (err) {
          console.error('Error adding queued ICE:', err);
        }
      }
    };
    waitUntilRemoteReady();
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    callback(this.remoteStream);
  }

  resetConnection() {
    try {
      this.peerConnection?.close();
    } catch { }
    this.remoteStream = new MediaStream();
    this.initializePeer();
  }
}
