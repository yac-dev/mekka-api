import { seedUsers } from './users.js';
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
  process.exit(0);
};

main();