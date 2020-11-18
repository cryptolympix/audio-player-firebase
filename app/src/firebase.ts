// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from 'firebase/app';

// Add the Firebase services that you want to use
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/database';
import 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAm-ih6CxPbquOMTj6STZkvPOZSdxcO_-o',
  authDomain: 'audio-player-sync.firebaseapp.com',
  databaseURL: 'https://audio-player-sync.firebaseio.com',
  projectId: 'audio-player-sync',
  storageBucket: 'audio-player-sync.appspot.com',
  messagingSenderId: '513335075455',
  appId: '1:513335075455:web:644fef4500e272af76554a',
};

firebase.initializeApp(firebaseConfig);

export default firebase;
