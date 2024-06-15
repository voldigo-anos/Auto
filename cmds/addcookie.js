const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    description: 'add cookie to ur database for later use ',
    role: 'user',
    cooldown: 3,
    credits: 'Rejard',
    execute: async function(api, event, args) {
        const [cookieValue] = args;
        if (!cookieValue) {
            api.sendMessage(`🪷 | Please provide a cookie value to add/update the cookie.`, event.threadID, event.messageID);
            return;
        }

        const createDir = async (dir) => {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error('Error creating directory:', error);
            }
        };

        const userDataDir = path.join(__dirname, '..', 'database', 'users');
        await createDir(userDataDir);

        const uid = event.senderID;
        const userFilePath = path.join(userDataDir, `${uid}.json`);

        const readUserData = async () => {
            try {
                const data = await fs.readFile(userFilePath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                return {};
            }
        };

        const writeUserData = async (data) => {
            try {
                await fs.writeFile(userFilePath, JSON.stringify(data, null, 2), 'utf8');
            } catch (error) {
                console.error('Error writing user data:', error);
            }
        };

        const userData = await readUserData();
        userData.cookie = cookieValue;
        await writeUserData(userData);
        api.sendMessage('🍪 Cookie added/updated successfully.', event.threadID, event.messageID);
    }
};