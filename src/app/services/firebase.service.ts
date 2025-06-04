import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, serverTimestamp, query, where, orderBy, setDoc, doc, updateDoc, getDoc, CollectionReference, DocumentReference } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  usersCollection: CollectionReference;
  messagesCollection: CollectionReference;

  constructor(private firestore: Firestore) {
    this.usersCollection = collection(this.firestore, 'Employees');
    this.messagesCollection = collection(this.firestore, 'messages');
  }

  getUsers(): Observable<any[]> {
    return collectionData(this.usersCollection, { idField: 'uid' }) as Observable<any[]>;
  }

  sendMessage(from: string, to: string, text: string) {
    return addDoc(this.messagesCollection, {
      from,
      to,
      text,
      timestamp: serverTimestamp()
    });
  }

  getMessages(currentUid: string, otherUid: string): Observable<any[]> {
    const q = query(
      this.messagesCollection,
      where('from', 'in', [currentUid, otherUid]),
      where('to', 'in', [currentUid, otherUid]),
      orderBy('timestamp')
    );
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  updateUserStatus(uid: string, status: 'online' | 'offline') {
    return setDoc(doc(this.firestore, 'users', uid), { status }, { merge: true });
  }
  async createCallDoc(uid1: string, uid2: string): Promise<DocumentReference> {
    const callId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    return doc(this.firestore, 'calls', callId);
  }

}
