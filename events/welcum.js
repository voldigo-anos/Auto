const fs = require('fs');
const path = require('path');

module.exports = {
  async handleEvent(api, event) {
    if (!event.logMessageData?.addedParticipants) return;

    const botId = api.getCurrentUserID();
    const isBotAdded = event.logMessageData.addedParticipants.some(participant => participant.userFbId === botId);

    if (isBotAdded) {
      const introMessage = `Hello everyone! I'm OctobotRemake, your friendly group assistant!`;

      try {
        await api.sendMessage(introMessage, event.threadID);
        await api.changeNickname("OctobotRemake", event.threadID, botId);
      } catch (error) {
        console.error("Error introducing bot or changing nickname:", error);
      }

      return; // Early return if the bot was added
    }

    try {
      const groupInfo = await api.getThreadInfo(event.threadID);
      const memberCount = groupInfo.participantIDs.length;
      const groupName = groupInfo.threadName;

      for (const participant of event.logMessageData.addedParticipants) {
        try {
          const info = await api.getUserInfo(participant.userFbId);
          const { name } = info[participant.userFbId];
          const welcomeMessage = `Welcome ${name} to ${groupName}, Congrats! You are the ${memberCount}th member!`;

          await api.sendMessage(welcomeMessage, event.threadID);
        } catch (error) {
          console.error(`Error fetching user info or sending message for user ID ${participant.userFbId}:`, error);
        }
      }
    } catch (error) {
      console.error("Error fetching group info:", error);
    }
  }
};