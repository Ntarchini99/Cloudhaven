import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBk2wt_Wx6W-9I5wUq8zOgMLHasv5xzyFI",
    authDomain: "proyecto-ame-9244c.firebaseapp.com",
    projectId: "proyecto-ame-9244c",
    storageBucket: "proyecto-ame-9244c.appspot.com",
    messagingSenderId: "725782305273",
    appId: "1:725782305273:web:216bc339a4ca1887788528"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar instancias de Auth, Firestore y Storage
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, firestore, storage, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, ref, uploadBytes, listAll, getDownloadURL, deleteObject, collection, addDoc, deleteDoc, doc };