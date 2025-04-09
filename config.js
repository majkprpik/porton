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
    production: true,
    };
    `;
    writeFile(targetPath, envConfigFile, (err) => {
      if (err) {
        console.error(err);
        throw err;
      }
    });
};
setEnv();