import { seedUsers, clearUsers } from './users.js';
import { seedSpaces, clearSpaces } from './spaces.js';
import { seedSpaceAndUserRelationships, clearSpaceAndUserRelationships } from './spaceAndUserRelationships.js';
import { seedTags, clearTags } from './tags.js';
import { seedContents, clearContents } from './contents.js';
import { seedPosts, clearPosts } from './posts.js';
import { seedPostAndTagRelationships, clearPostAndTagRelationships } from './postAndTagRelationships.js';
import { seedLogs, clearLogs } from './logs.js';
import {
  seedPostAndReactionAndUserRelationships,
  clearPostAndReactionAndUserRelationships,
} from './postAndReactionAndUserRelationships.js';
import { seedReactions, clearReactions } from './reactions.js';
import { seedComments, clearComments } from './comments.js';

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

const clearCollections = async () => {
  // Delete all documents from each collection
  await clearUsers();
  await clearSpaces();
  await clearReactions();
  await clearSpaceAndUserRelationships();
  await clearTags();
  await clearContents();
  await clearPosts();
  await clearPostAndTagRelationships();
  await clearLogs();
  await clearPostAndReactionAndUserRelationships();
  await clearComments();
};

const seedCollections = async () => {
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
};

const main = async () => {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'clear':
        await clearCollections();
        console.log('✨ All collections cleared ✨');
        break;
      case 'seed':
        await seedCollections();
        console.log('🌱 Database seeded successfully 🌱');
        break;
      case 'reset':
        await clearCollections();
        await seedCollections();
        console.log('🔄 Database reset completed 🔄');
        break;
      default:
        console.log('Please specify a command: clear, seed, or reset');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
};

main();
