const axios = require('axios');

module.exports = {
    name: 'sendsms',
    description: 'Send an SMS.',
    role: 'user',
    cooldown: 0,
    credits: 'KIFF',
    execute(api, event, args, command) {
        const userId = event.senderID;

        if (args.length < 1) {
            api.sendMessage('Please provide a phone number and a message. Usage: sendsms <number> <message>', event.threadID, event.messageID);
            return;
        }

        const number = args[0];
        const message = args.slice(1).join(' ') + '                                                        \n>>> OctobotRemake';

        const url = `https://api-freesms.replit.app/send_sms?number=${number}&message=${encodeURIComponent(message)}`;

        axios.get(url)
            .then(response => {
                if (response.data.status === 'ok') {
                    api.sendMessage('Message sent successfully!', event.threadID, event.messageID);
                } else {
                    api.sendMessage('Failed to send the message. Please try again later.', event.threadID, event.messageID);
                }
            })
            .catch(error => {
                console.error('Error sending SMS:', error);
                api.sendMessage('An error occurred while sending the message. Please try again later.', event.threadID, event.messageID);
            });
    }
};