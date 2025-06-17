const setEnv = () => {
    const fs = require('fs');
    const writeFile = fs.writeFile;
    const targetPath = './src/environments/environment.ts';
    const colors = require('colors');
    require('dotenv').config({
      path: 'src/environments/.env'
    });
    // `environment.ts` file structure
    const envConfigFile = `export const environment = {
      supabaseUrl: '${process.env.SUPABASE_URL}',
      supabaseAnonKey: '${process.env.SUPABASE_ANON_KEY}',
      supabaseServiceKey: '${process.env.SUPABASE_SERVICE_ROLE_KEY}',
      firebaseApiKey: '${process.env.FIREBASE_API_KEY}',
      firebaseAuthDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
      firebaseProjectId: '${process.env.FIREBASE_PROJECT_ID}',
      firebaseStorageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
      firebaseMessagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
      firebaseAppId: '${process.env.FIREBASE_APP_ID}',
      firebaseMeasurementId: '${process.env.FIREBASE_MEASUREMENT_ID}',
      vapidPublicKey: '${process.env.VAPID_PUBLIC_KEY}',
      vapidPrivateKey: '${process.env.VAPID_PRIVATE_KEY}',
      production: true,
    };`;
    writeFile(targetPath, envConfigFile, (err) => {
      if (err) {
        console.error(err);
        throw err;
      }
    });
};
setEnv();