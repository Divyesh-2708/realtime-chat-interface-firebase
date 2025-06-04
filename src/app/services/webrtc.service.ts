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

  constructor(private firestore: Firestore) {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302'}],
      iceCandidatePoolSize:10,
    });
  }

  async initLocalStream(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });
    return this.localStream;
  }

  async createOffer(callDocRef: any, from: string, to: string) {
    this.resetConnection();
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);


    const offerCandidatesCollection = collection(this.firestore, `${callDocRef.path}/offerCandidates`);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidatesCollection, event.candidate.toJSON());
      }
    };
    await setDoc(callDocRef, {
      from,
      to,
      offer,
      timestamp: new Date().toISOString()
    });
  }

  async answerCall(callDocRef: any) {
    this.resetConnection();
    const callSnapshot = await getDoc(callDocRef);
    const callData: any = callSnapshot.data();
    if (!callData?.offer) {
      throw new Error('Offer not found.');
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await updateDoc(callDocRef, { answer });

    const answerCandidatesCollection = collection(this.firestore, `${callDocRef.path}/answerCandidates`);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidatesCollection, event.candidate.toJSON());
      }
    };
  }

  async listenForCandidates(callDocRef: any, type: 'offer' | 'answer') {
    const candidatesCollection = collection(this.firestore, `${callDocRef.path}/${type}Candidates`);
    const queue: RTCIceCandidateInit[] = [];

    // onSnapshot(candidatesCollection, (snapshot) => {
    //   snapshot.docChanges().forEach((change) => {
    //     if (change.type === 'added') {
    //       const data = change.doc.data();
    //       const candidate = new RTCIceCandidate(data);

    //       if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
    //         this.peerConnection.addIceCandidate(candidate).catch(console.error);
    //       } else {
    //         queue.push(candidate);
    //       }
    //     }
    //   });
    // });

    onSnapshot(candidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data: any = change.doc.data();

          // Validate the candidate structure
          if (!data || !data.candidate || typeof data.candidate !== 'string') {
            console.warn('⚠️ Skipping malformed ICE candidate:', data);
            return;
          }

          const iceCandidateInit: RTCIceCandidateInit = {
            candidate: data.candidate,
            sdpMLineIndex: data.sdpMLineIndex,
            sdpMid: data.sdpMid,
          };

          // Queue or add
          if (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
            console.log('🕗 Remote description not ready, queuing ICE:', iceCandidateInit);
            queue.push(iceCandidateInit);
          } else {
            this.peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidateInit))
              .then(() => console.log('✅ Added ICE candidate (live):', iceCandidateInit))
              .catch(err => console.error('❌ Error adding ICE candidate (live):', err));
          }
        }
      });
    });

    // Wait until remote description is set
    const waitUntilRemoteReady = async () => {
      while (!this.peerConnection.remoteDescription || !this.peerConnection.remoteDescription.type) {
        await new Promise(res => setTimeout(res, 100));
      }

      for (const c of queue) {
        if (!c.candidate || c.candidate.trim() === '') {
          console.warn('⚠️ Skipping empty queued ICE:', c);
          continue;
        }
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(c));
        } catch (err) {
          console.error('Error adding queued ICE candidate:', err);
        }
      }
    };
    waitUntilRemoteReady();
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    // this.peerConnection.addEventListener('track', async (event) => {
    //   const [remoteStreama] = event.streams;
    //   remoteStream.srcObject = remoteStream;
    // });
    this.peerConnection.addEventListener('track', event => {
    console.log('Got remote track:', event.streams[0]);
    event.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      this.remoteStream.addTrack(track);
    });
  });
  }

  resetConnection() {
    this.peerConnection?.close();

    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    this.remoteStream = new MediaStream();

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    this.peerConnection.ontrack = (event) => {
      console.log("in track",event.streams[0]);
      
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };
  }

}
