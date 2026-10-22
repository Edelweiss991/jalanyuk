import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`JalanYuk API berjalan di http://localhost:${env.PORT}`);
});
