const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'givecoins',
    description: 'Give coins to a user.',
    role: 'owner', // Only admins can execute this command
    credits: 'rejardgwapo',
    cooldown: 0, // No cooldown
    execute(api, event, args, command) {
        const recipientId = args[0];
        const amount = parseInt(args[1]);

        if (!recipientId || isNaN(amount) || amount <= 0) {
            api.sendMessage('Please provide a valid user ID and amount of coins.', event.threadID, event.messageID);
            return;
        }

        const coinBalanceFile = path.join(__dirname, `../database/coin_balances/${recipientId}.json`);
        let coinBalance = 0;

        if (fs.existsSync(coinBalanceFile)) {
            coinBalance = JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));
        }

        coinBalance += amount;
        fs.writeFileSync(coinBalanceFile, JSON.stringify(coinBalance));

        api.sendMessage(`Successfully gave ${amount} coins to user with ID ${recipientId}. They now have ${coinBalance} coins.`, event.threadID, event.messageID);
    }
};