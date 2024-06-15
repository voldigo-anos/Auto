const axios = require('axios');

const fs = require('fs');

module.exports = {

    name: 'detectbot',

    description: 'Detect and remove another bot in the group chat',

    role: 'admin', // Only admin can use this command

    cooldown: 600, // 10 minutes cooldown

    execute: async (api, event, args, command) => {

        const threadID = event.threadID;

        const detectedBots = new Set();

        let detecting = true;

        api.sendMessage('Starting bot detection. Monitoring messages for the next 10 minutes...', threadID);

        // Stop detection after 10 minutes

        setTimeout(() => {

            detecting = false;

            if (detectedBots.size > 0) {

                detectedBots.forEach(botID => {

                    api.removeUserFromGroup(botID, threadID, (err) => {

                        if (err) {

                            console.error(`Failed to remove bot ${botID}:`, err);

                        } else {

                            api.sendMessage(`Removed detected bot: ${botID}`, threadID);

                        }

                    });

                });

            } else {

                api.sendMessage('No bots detected during the monitoring period.', threadID);

            }

        }, 10 * 60 * 1000);

        // Listen for messages and message replies

        api.listenMqtt((err, event) => {

            if (err) {

                console.error('Error listening to events:', err);

                return;

            }

            if (detecting && event.threadID === threadID && (event.type === 'message' || event.type === 'message_reply')) {

                // Detect potential bot messages

                const botIndicators = [

                    "command not found",

                    "does not exist",

                    "no prompt provided",

                    "invalid command"

                ];

                const message = event.body.toLowerCase();

                if (botIndicators.some(indicator => message.includes(indicator))) {

                    detectedBots.add(event.senderID);

                    console.log(`Detected bot message from user ${event.senderID}: ${event.body}`);

                }

            }

        });

    }

};