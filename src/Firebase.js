import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, listAll, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
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
