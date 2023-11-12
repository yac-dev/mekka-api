import express from 'express';
import cors from 'cors';
import './databases/mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import authRouter from './routers/auth';
import spacesRouter from './routers/spaces';
import postsRouter from './routers/posts';
import momentsRouter from './routers/moments';
import reactionStatusesRouter from './routers/reactionStatuses';
import stickersRouter from './routers/stickers';
import commentsRouter from './routers/comments';
import tagsRouter from './routers/tags';
import usersRouter from './routers/users';
import postAndTagRelationshipsRouter from './routers/postAndTagRelationship';
import userAndReactionRelationshipsRouter from './routers/userAndReactionRelationships';
import spaceAndUserRelationshipsRouter from './routers/spaceAndUserRelationships';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/buffer', express.static(path.join(__dirname, '..', 'buffer')));

app.get('/', (request, response) => {
  response.send('Hello guest');
});
app.use('/api/auth', authRouter);
app.use('/api/spaces', spacesRouter);
app.use('/api/posts', postsRouter);
app.use('/api/moments', momentsRouter);
app.use('/api/reactionstatuses', reactionStatusesRouter);
app.use('/api/stickers', stickersRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/users', usersRouter);
app.use('/api/postandtagrelationships', postAndTagRelationshipsRouter);
app.use('/api/userandreactionrelationships', userAndReactionRelationshipsRouter);
app.use('/api/spaceanduserrelationships', spaceAndUserRelationshipsRouter);

export default app;
