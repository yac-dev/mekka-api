// import User from '../models/users';
// import './src/databases/mongoose.js';
require('../src/databases/mongoose');

module.exports = {
  async up(db, client) {
    // Use the native MongoDB driver to update documents
    await db.collection('users').updateMany(
      { lastNotificationOpened: { $exists: false } },
      { $set: { lastNotificationOpened: null } } // or a specific default date
    );
  },

  async down(db, client) {
    // Implement rollback logic if necessary
    // Example: Revert the lastNotificationOpened field to its previous state
    await db
      .collection('users')
      .updateMany({ lastNotificationOpened: null }, { $unset: { lastNotificationOpened: '' } });
  },
};
