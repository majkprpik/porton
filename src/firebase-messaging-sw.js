importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAO3m0m4of98-Jii4XNooFpjA2c0yyMoK0",
  authDomain: "porton-23805.firebaseapp.com",
  projectId: "porton-23805",
  storageBucket: "porton-23805.firebasestorage.app",
  messagingSenderId: "878411187876",
  appId: "1:878411187876:web:01f1c867087aea815a0831",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  const { title, ...rest } = payload.notification;
  self.registration.showNotification(title, rest);
});