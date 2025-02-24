import firebase from "firebase/app"
import "firebase/firestore"
import "firebase/auth"
import "firebase/storage"
const firebaseConfig = {
    apiKey: "AIzaSyA78u3spI8q7LLbvuDPSffDZJybaka1mOQ",
    authDomain: "vue-blog-system-548f4.firebaseapp.com",
    projectId: "vue-blog-system-548f4",
    storageBucket: "vue-blog-system-548f4.firebasestorage.app",
    messagingSenderId: "124414662224",
    appId: "1:124414662224:web:7d4397c733cc71d51ee355"
  };

  firebase.initializeApp(firebaseConfig);

  let db = firebase.firestore();
  let auth = firebase.auth();
  let storage = firebase.storage();
  let timestamp = firebase.firestore.FieldValue.serverTimestamp;

  export {db , timestamp , auth ,storage};