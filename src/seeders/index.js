import { seedUsers } from './users.js';
import { seedSpaces } from './spaces.js';
import { seedSpaceAndUserRelationships } from './spaceAndUserRelationships.js';
import { seedTags } from './tags.js';
import { seedContents } from './contents.js';
import { seedPosts } from './posts.js';
import { seedPostAndTagRelationships } from './postAndTagRelationships.js';
import { seedLogs } from './logs.js';
import { seedPostAndReactionAndUserRelationships } from './postAndReactionAndUserRelationships.js';
import { seedReactions } from './reactions.js';
import { seedComments } from './comments.js';

import mongoose from 'mongoose';

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('👍 Database connection succeeded 👍');
  })
  .catch((error) => {
    console.log('💩 Database connection failed... 💩');
    console.log(error);
  });

const main = async () => {
  await seedUsers();
  await seedSpaces();
  await seedReactions();
  await seedSpaceAndUserRelationships();
  await seedTags();
  await seedContents();
  await seedPosts();
  await seedPostAndTagRelationships();
  await seedLogs();
  await seedPostAndReactionAndUserRelationships();
  await seedComments();
  process.exit(0);
};

main();
