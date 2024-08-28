import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';


const firebaseConfig = {
    apiKey: "AIzaSyBk2wt_Wx6W-9I5wUq8zOgMLHasv5xzyFI",
    authDomain: "proyecto-ame-9244c.firebaseapp.com",
    projectId: "proyecto-ame-9244c",
    storageBucket: "proyecto-ame-9244c.appspot.com",
    messagingSenderId: "725782305273",
    appId: "1:725782305273:web:216bc339a4ca1887788528"
};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export {
    auth,
    firestore,
    storage,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    RecaptchaVerifier,
    ref,
    uploadBytes,
    listAll,
    getDownloadURL,
    deleteObject,
    collection,
    addDoc,
    deleteDoc,
    doc
};
