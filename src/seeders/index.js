import { seedUsers } from './users.js';
import { seedSpaces } from './spaces.js';
import { seedSpaceAndUserRelationships } from './spaceAndUserRelationships.js';
import mongoose from 'mongoose';

mongoose
  .connect('mongodb+srv://yosuke:yorkkoji%401358@cluster0.a6sqv.mongodb.net/mekka-dev?retryWrites=true&w=majority', {
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
  await seedSpaceAndUserRelationships();
  process.exit(0);
};

main();
