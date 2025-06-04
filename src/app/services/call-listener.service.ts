// src/app/services/call-listener.service.ts

import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, onSnapshot, CollectionReference, DocumentData } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { IncomingCallDialogComponent } from '../incoming-call-dialog/incoming-call-dialog.component';

@Injectable({ providedIn: 'root' })
export class CallListenerService {
  constructor(
    private firestore: Firestore,
    private router: Router,
    private dialog: MatDialog
  ) { }

  listenForIncomingCalls(userId: string): void {
    console.log("Call Checking");
    
    const callsRef = collection(this.firestore, 'calls') as CollectionReference<DocumentData>;
    const q = query(callsRef, where('to', '==', userId));
    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          console.log('📞 Incoming call detected:', change.doc.data());

          const callData = change.doc.data();
          this.dialog.open(IncomingCallDialogComponent, {
            data: {
              from: callData['from'],
              callId: change.doc.id
            },
            disableClose: true
          });
        }
      });
    });
  }
}
