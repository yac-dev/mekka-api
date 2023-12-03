import http from 'http';
import app from './app.js';

const port = process.env.PORT || 3500;
const server = http.createServer(app);

// dynamic portにしないとherokuで動かねー。まじ詰まったわ。。。。
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
