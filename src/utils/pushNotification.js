import { Expo } from 'expo-server-sdk';
const expo = new Expo();
// notificationベットで分けた方がいいね。。。
// let notificationTitle = '';

// const spaceAndUserRelationships = await SpaceAndUserRelationship.find({
//   space: spaceId,
//   user: { $ne: createdBy },
// })
//   .populate({ path: 'user' })
//   .select({ pushToken: 1 });
// const membersPushTokens = spaceAndUserRelationships.map((rel) => {
//   return rel.user.pushToken;
// });

// const notificationData = {
//   notificationType: 'Post',
//   spaceId: spaceId,
//   tagId: tagIds[0],
// };

// const chunks = expo.chunkPushNotifications(
//   membersPushTokens.map((token) => ({
//     to: token,
//     sound: 'default',
//     data: notificationData,
//     title: 'Member has posted.',
//     body: caption,
//   }))
// );

// const tickets = [];

// for (let chunk of chunks) {
//   try {
//     let receipts = await expo.sendPushNotificationsAsync(chunk);
//     tickets.push(...receipts);
//     console.log('Push notifications sent:', receipts);
//   } catch (error) {
//     console.error('Error sending push notification:', error);
//   }
// }
