const axios = require('axios');
const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😇', '🙂', '🙃', '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '😜', '😝', '😛', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'];

function getRandomEmoji() {
    return emojis[Math.floor(Math.random() * emojis.length)];
}

module.exports = {
    name: 'sessions',
    description: 'Show all bot sessions.',
    role: 'user',
    execute(api, event, args, command) {
        axios.get('http://fi3.bot-hosting.net:23173/api/active-sessions')
            .then(response => {
                const data = response.data;

                if (data.success && data.sessions && data.sessions.length > 0) {
                    let message = `There are ${data.sessions.length} active sessions:\n\n`;

                    // Iterate over sessions and get user info sequentially
                    (async () => {
                        for (const session of data.sessions) {
                            try {
                                const userInfo = await api.getUserInfo(session.admin_uid);
                                const adminName = userInfo[session.admin_uid].name;
                                message += `${getRandomEmoji()} Online\nAppState Name: ${session.appStateName}\nPrefix: ${session.prefix}\nAdmin: ${adminName}\n\n`;
                            } catch (error) {
                                console.error(`Error fetching user info for admin UID ${session.admin_uid}:`, error);
                                message += `${getRandomEmoji()} Online\nAppState Name: ${session.appStateName}\nPrefix: ${session.prefix}\nAdmin: ${session.admin_uid}\n\n`;
                            }
                        }
                        api.sendMessage(message, event.threadID, event.messageID);
                    })();
                } else {
                    api.sendMessage('No active sessions found.', event.threadID, event.messageID);
                }
            })
            .catch(error => {
                console.error('Error fetching active sessions:', error);
                api.sendMessage('An error occurred while fetching active sessions.', event.threadID, event.messageID);
            });
    }
};