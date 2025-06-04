import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CallListenerService } from '../services/call-listener.service';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-incoming-call-dialog',
  imports: [MatDialogContent,MatDialogActions],
  templateUrl: './incoming-call-dialog.component.html',
  styleUrl: './incoming-call-dialog.component.css',
  standalone:true,
})
export class IncomingCallDialogComponent {
constructor(
    @Inject(MAT_DIALOG_DATA) public data: { from: string; callId: string },
    private dialogRef: MatDialogRef<IncomingCallDialogComponent>,
    private router: Router,
    private _callService : CallListenerService,
    private firestore : Firestore
  ) {}

  acceptCall() {
    this.dialogRef.close();
    console.log(this.data);
    
    this.router.navigate(['/chat', this.data.callId,'call']);
  }

  async declineCall() {
    this.dialogRef.close();
    try {
      const callDocRef = doc(this.firestore, 'calls', this.data.callId);
      await deleteDoc(callDocRef);
      console.log('📴 Call declined');
      this.dialogRef.close();
    } catch (error) {
      console.error('❌ Error deleting call document:', error);
    }
    // Optional: Delete or update call document in Firestore
  }
}
