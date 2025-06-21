module.exports = {
  async up(db, client) {
    await db.collection('spaces').updateMany(
      {
        $or: [{ hours: { $exists: false } }, { capacity: { $exists: false } }],
      },
      {
        $set: {
          hours: { from: '12am', to: '12am' },
          capacity: -1,
        },
      }
    );
  },

  async down(db, client) {
    await db.collection('spaces').updateMany(
      {
        $or: [{ hours: { $exists: false } }, { capacity: { $exists: false } }],
      },
      {
        $unset: {
          hours: '',
          capacity: '',
        },
      }
    );
  },
};
