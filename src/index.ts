import http from 'http';
import app from './app'; // Assuming app.ts is also refactored to TypeScript

const port: number = parseInt(process.env.PORT || '3500', 10);
const server: http.Server = http.createServer(app);

// Comment in Japanese: Heroku requires a dynamic port, otherwise it won't work.
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
