module.exports = {
    description: "reply to unsend a message",
    role: "user",
    coins: 50,
    cooldown: 15,
    execute(api, event, args, commands) {
  if (event.messageReply.senderID != api.getCurrentUserID()) return api.sendMessage("I can't unsend from other message.", event.threadID, event.messageID);
  if (event.type != "message_reply") return api.sendMessage("Reply to bot message", event.threadID, event.messageID);
  return api.unsendMessage(event.messageReply.messageID, err => (err) ? console.warn("Something went wrong.", event.threadID, event.messageID) : '');
}
};