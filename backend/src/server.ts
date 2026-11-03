import { env } from './config/env.js';
import { buildApp } from './app.js';

const start = async () => {
  const app = buildApp();

  const PORT = Number(env.PORT) || 3000;

  try {
    await app.listen({ 
      port: PORT, 
      host: '0.0.0.0' 
    });
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();