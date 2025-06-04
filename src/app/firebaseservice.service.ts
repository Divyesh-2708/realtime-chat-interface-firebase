import { inject, Injectable } from '@angular/core';
import { addDoc, collection, Firestore, updateDoc, getDoc, getDocs, doc, query, where } from '@angular/fire/firestore';
import { from, map, Observable } from 'rxjs';
import { CollectionReference, deleteDoc, DocumentData } from 'firebase/firestore';

// import { doc, getDoc, getDocs} from 'firebase/firestore';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor() { }
  firestore = inject(Firestore)
  // Employees =  collection(this.firestore,"Employees");

  async AddEmployee(employee: any) {
      const emp = await addDoc(collection(this.firestore, 'Employees'), {
        name: employee.name,
        image: employee.image,
        bio: employee.bio,
        gender: employee.gender,
        hobbies: employee.hobbies,
        skills: employee.skills,
        designation: employee.designation,
        email: employee.email,
        dob: employee.dob,
        address: employee.address,
      })
      return emp;
  }

  async getEmployees() { 
    const collec = await getDocs(collection(this.firestore,'Employees'));
    
    return new Observable((observer) => {
      const userArray = collec.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      observer.next(userArray);
      observer.complete();
    });
  }

  getEmployee(id: any) {
    const emp = doc(this.firestore, 'Employees', id);
    return new Observable((observer) => {
      getDoc(emp).then(data => {
        if (data.exists()) {
          observer.next(data.data());
          observer.complete();
        }
      });
    })
  }

  updateEmployee(employee: any) {
    const emp = doc(this.firestore, `Employees/${employee.id}`);
    updateDoc(emp, employee)
    return emp;
  }

  async deleteEmployee(employee: any) {
    const emp = doc(this.firestore, `Employees/${employee}`);
    deleteDoc(emp)
  }

  loginWithEmailAndPassword(email: string, password: string): Observable<any | null> {
    const usersRef = collection(this.firestore, 'Employees') as CollectionReference<DocumentData>;

    const q = query(
      usersRef,
      where('email', '==', email),
      // where('password', '==', password)
    );

    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const userData = doc.data() as object;
          const userId = doc.id;
          return { id: userId, ...userData };
        } else {
          return null;
        }
      })
    );
  }
} 
