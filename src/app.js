import express from 'express';
import cors from 'cors';
import './databases/mongoose.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import authRouter from './routers/auth.js';
import spacesRouter from './routers/spaces.js';
import postsRouter from './routers/posts.js';
import momentsRouter from './routers/moments.js';
import reactionStatusesRouter from './routers/reactionStatuses.js';
import stickersRouter from './routers/stickers.js';
import commentsRouter from './routers/comments.js';
import tagsRouter from './routers/tags.js';
import iconsRouter from './routers/icons.js';
import usersRouter from './routers/users.js';
import postAndTagRelationshipsRouter from './routers/postAndTagRelationship.js';
import userAndReactionRelationshipsRouter from './routers/userAndReactionRelationships.js';
import spaceAndUserRelationshipsRouter from './routers/spaceAndUserRelationships.js';
import postAndReactionAndUserRelationshipsRouter from './routers/postAndReactionAndUserRelationships.js';
import logsRouter from './routers/logs.js';
import { handleErrors } from './controllers/errors.js';

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
app.use('/api/icons', iconsRouter);
app.use('/api/users', usersRouter);
app.use('/api/postandtagrelationships', postAndTagRelationshipsRouter);
app.use('/api/userandreactionrelationships', userAndReactionRelationshipsRouter);
app.use('/api/spaceanduserrelationships', spaceAndUserRelationshipsRouter);
app.use('/api/postandreactionanduserrelationships', postAndReactionAndUserRelationshipsRouter);
app.use('/api/logs', logsRouter);

app.use(handleErrors);

export default app;
