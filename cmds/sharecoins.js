const fs = require('fs');

const path = require('path');

const coinBalancesPath = path.join(__dirname, '../database/coin_balances');

// Function to load a user's coin balance

function loadCoinBalance(userId) {

    const coinBalanceFile = path.join(coinBalancesPath, `${userId}.json`);

    if (fs.existsSync(coinBalanceFile)) {

        return JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));

    }

    return 0;

}

// Function to save a user's coin balance

function saveCoinBalance(userId, balance) {

    const coinBalanceFile = path.join(coinBalancesPath, `${userId}.json`);

    fs.writeFileSync(coinBalanceFile, JSON.stringify(balance));

}

module.exports = {

    name: 'sharecoins',

    description: 'Share your coins with another user.',

    role: 'user',

    credits: 'rejardgwapo',

    cooldown: 0,

    execute(api, event, args, command) {

        const senderId = event.senderID;

        const receiverId = args[0];

        const amount = parseInt(args[1]);

        if (!receiverId || isNaN(amount) || amount <= 0) {

            api.sendMessage('Usage: !sharecoins <receiver_id> <amount>', event.threadID, event.messageID);

            return;

        }

        if (receiverId === senderId) {

            api.sendMessage('You cannot share coins with yourself.', event.threadID, event.messageID);

            return;

        }

        // Load sender's coin balance

        let senderBalance = loadCoinBalance(senderId);

        if (senderBalance < amount) {

            api.sendMessage(`You do not have enough coins to share ${amount} coins.`, event.threadID, event.messageID);

            return;

        }

        // Deduct the amount from sender's balance

        senderBalance -= amount;

        saveCoinBalance(senderId, senderBalance);

        // Load receiver's coin balance

        let receiverBalance = loadCoinBalance(receiverId);

        // Add the amount to receiver's balance

        receiverBalance += amount;

        saveCoinBalance(receiverId, receiverBalance);

        api.sendMessage(`You have successfully shared ${amount} coins with user ${receiverId}.`, event.threadID, event.messageID);

        // Notify the receiver

        api.sendMessage(`You have received ${amount} coins from user ${senderId}.`, receiverId);

    }

};