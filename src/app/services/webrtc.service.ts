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
  private candidateQueue: RTCIceCandidateInit[] = [];
  private isRemoteDescriptionSet = false;

  constructor(private firestore: Firestore) {
    this.initializePeer();
  }

  initializePeer() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 5
    });

    // Enhanced ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      console.log('New ICE candidate:', event.candidate);
    };

    this.peerConnection.onicecandidateerror = (event) => {
      console.error('ICE candidate error:', event);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };

    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection.signalingState);
      if (this.peerConnection.signalingState === 'stable') {
        this.processCandidateQueue();
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log("🎥 Received remote track:", event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
    };

    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
    };
  }

  async initLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      this.localStream.getTracks().forEach(track => {
        console.log(`Adding local ${track.kind} track to peer connection`);
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
        const candidateData = this.prepareCandidateData(event.candidate);
        addDoc(offerCandidates, candidateData)
          .then(() => console.log('Offer candidate saved'))
          .catch(err => console.error('Error saving offer candidate:', err));
      }
    };

    const offer = await this.peerConnection.createOffer();
    console.log('Created offer:', offer);
    await this.peerConnection.setLocalDescription(offer);
    console.log('Local description set');

    await setDoc(callDocRef, {
      from,
      to,
      offer,
      timestamp: new Date().toISOString()
    });
    console.log('Offer saved to Firestore');
  }

  async answerCall(callDocRef: any) {
    const callSnapshot = await getDoc(callDocRef);
    const callData: any = callSnapshot.data();
    if (!callData?.offer) throw new Error('Offer not found.');

    console.log('Setting remote description:', callData.offer);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));
    this.isRemoteDescriptionSet = true;

    const answer = await this.peerConnection.createAnswer();
    console.log('Created answer:', answer);
    await this.peerConnection.setLocalDescription(answer);
    console.log('Local description set');

    await updateDoc(callDocRef, { answer });
    console.log('Answer saved to Firestore');

    const answerCandidates = collection(this.firestore, `${callDocRef.path}/answerCandidates`);
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidateData = this.prepareCandidateData(event.candidate);
        addDoc(answerCandidates, candidateData)
          .then(() => console.log('Answer candidate saved'))
          .catch(err => console.error('Error saving answer candidate:', err));
      }
    };
  }

  async listenForCandidates(callDocRef: any, type: 'offer' | 'answer') {
    const candidatesCollection = collection(this.firestore, `${callDocRef.path}/${type}Candidates`);
    
    onSnapshot(candidatesCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log(`Received ${type} candidate:`, data);
          
          if (this.isValidCandidate(data)) {
            if (this.peerConnection.remoteDescription) {
              this.addIceCandidateSafely(data);
            } else {
              this.candidateQueue.push(data);
              console.log('Queuing candidate until remote description is set');
            }
          }
        }
      });
    });
  }

  private prepareCandidateData(candidate: RTCIceCandidate): RTCIceCandidateInit {
    return {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      usernameFragment: candidate.usernameFragment || null
    };
  }

  private isValidCandidate(candidate: RTCIceCandidateInit): boolean | undefined |string{
    return (
      candidate.candidate && 
      candidate.sdpMid !== undefined && 
      candidate.sdpMLineIndex !== undefined
    );
  }

  private async addIceCandidateSafely(candidateData: RTCIceCandidateInit) {
    try {
      const candidate = new RTCIceCandidate(candidateData);
      await this.peerConnection.addIceCandidate(candidate);
      console.log('Successfully added ICE candidate');
    } catch (error) {
      console.log('Error adding ICE candidate:', error);
      // Optionally retry or implement fallback
    }
  }

  private async processCandidateQueue() {
    while (this.candidateQueue.length > 0) {
      const candidate = this.candidateQueue.shift();
      if (candidate) {
        await this.addIceCandidateSafely(candidate);
      }
    }
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        if (!this.remoteStream.getTracks().some(t => t.id === track.id)) {
          this.remoteStream.addTrack(track);
        }
      });
      callback(this.remoteStream);
    };
  }

  resetConnection() {
    try {
      // Stop all media tracks
      this.localStream?.getTracks().forEach(track => track.stop());
      this.remoteStream?.getTracks().forEach(track => track.stop());
      
      // Close peer connection
      this.peerConnection?.close();
      
      console.log('Connection reset complete');
    } catch (error) {
      console.error('Error resetting connection:', error);
    } finally {
      // Reinitialize
      this.remoteStream = new MediaStream();
      this.candidateQueue = [];
      this.isRemoteDescriptionSet = false;
      this.initializePeer();
    }
  }
}