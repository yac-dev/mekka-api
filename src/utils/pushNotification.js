import { Expo } from 'expo-server-sdk';
const expo = new Expo();

// const notificationData = {
//   notificationType: 'Post',
//   spaceId: spaceId,
//   tagId: tagIds[0],
// };

export const sendPushNotifications = async (pushTokens, notificationData, notificationTitle, notificationBody) => {
  const chunks = expo.chunkPushNotifications(
    pushTokens.map((token) => ({
      to: token,
      sound: 'default',
      data: notificationData,
      title: notificationTitle,
      body: notificationBody,
    }))
  );

  const tickets = [];

  for (let chunk of chunks) {
    try {
      let receipts = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...receipts);
      console.log('Push notifications sent successfully', receipts);
    } catch (error) {
      console.error('Failed to send push notifications', error);
    }
  }
};
