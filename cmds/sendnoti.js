module.exports = {
    description: "Sends A Notification to All GC",
    role: "botadmin",
    cooldown: 15,
    async execute(api, event, args, commands) {
        try {
            const threadList = await api.getThreadList(25, null, ["INBOX"]);
            let sentCount = 0;
            const custom = args.join(" ");

            async function sendMessage(thread) {
                try {
                    await api.sendMessage(
                        `📣ᴍᴇꜱꜱᴀɢᴇ ꜰʀᴏᴍ ᴀᴅᴍɪɴ:\n---------\n${custom}`,
                        thread.threadID
                    );
                    sentCount++;
                } catch (error) {
                    console.error(`Error sending message to thread ${thread.threadID}:`, error);
                }
            }

            for (const thread of threadList) {
                if (sentCount >= 20) {
                    break;
                }
                if (thread.isGroup && thread.name !== thread.threadID && thread.threadID !== event.threadID) {
                    await sendMessage(thread);
                }
            }

            if (sentCount > 0) {
                api.sendMessage(`› Sent the notification successfully to ${sentCount} groups.`, event.threadID, event.messageID);
            } else {
                api.sendMessage("› No eligible group threads found to send the message to.", event.threadID);
            }
        } catch (err) {
            console.error("An error occurred during execution:", err);
            api.sendMessage("› An error occurred while sending the notification. Please try again later.", event.threadID);
        }
    }
};