module.exports = {
  async handleEvent(api, event) {
    // Exit early if the bot itself has left the group
    if (event.logMessageData?.leftParticipantFbId === api.getCurrentUserID()) return;

    // Check if a participant has left the group
    if (event.logMessageData?.leftParticipantFbId) {
      const userId = event.logMessageData.leftParticipantFbId;
      const threadId = event.threadID;

      try {
        // Fetch user info
        const info = await api.getUserInfo(userId);
        const userName = info[userId]?.name;

        if (!userName) {
          throw new Error(`User name not found for ID: ${userId}`);
        }

        // Attempt to re-add the user to the group
        api.addUserToGroup(userId, threadId, (error) => {
          if (error) {
            api.sendMessage(`Unable to re-add member ${userName} to the group!`, threadId);
          } else {
            api.sendMessage(`Active antiout mode, ${userName} has been re-added to the group successfully!`, threadId);
          }
        });
      } catch (error) {
        console.error("Error fetching user info or re-adding user:", error);
        api.sendMessage(`An error occurred while trying to re-add the member.`, threadId);
      }
    }
  }
};