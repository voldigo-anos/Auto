const fs = require('fs');
const path = require('path');

const coinBalancesPath = path.join(__dirname, '../database/coin_balances');
const coinTransferLogsPath = path.join(__dirname, '../database/coin_transfer_logs');

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

// Function to load coin transfer logs
function loadCoinTransferLogs(userId) {
    const coinTransferLogFile = path.join(coinTransferLogsPath, `${userId}.json`);
    if (fs.existsSync(coinTransferLogFile)) {
        return JSON.parse(fs.readFileSync(coinTransferLogFile, 'utf8'));
    }
    return [];
}

// Function to save coin transfer logs
function saveCoinTransferLogs(userId, logs) {
    const coinTransferLogFile = path.join(coinTransferLogsPath, `${userId}.json`);
    fs.writeFileSync(coinTransferLogFile, JSON.stringify(logs));
}

// Function to check if the user has reached the daily transfer limit
function canTransferCoinsToday(logs) {
    const today = new Date().toISOString().split('T')[0];
    const transfersToday = logs.filter(log => log.date === today);
    return transfersToday.length < 10;
}

module.exports = {
    description: 'Give Coins to users',
    role: 'admin',
    credits: 'rejardgwapo',
    cooldown: 0,
    execute(api, event, args, command) {
        const senderId = event.senderID;
        const receiverId = args[0];
        const amount = parseInt(args[1]);
        const note = args.slice(2).join(' ') || 'No note provided';

        if (!receiverId || isNaN(amount) || amount <= 0 || amount > 10000000) {
            api.sendMessage('Usage: setbal <receiver_id> <amount> <note> (max 10,000,000)', event.threadID, event.messageID);
            return;
        }

        // Load sender's transfer logs
        let senderLogs = loadCoinTransferLogs(senderId);

        if (!canTransferCoinsToday(senderLogs)) {
            api.sendMessage('You can only give coins 10 times a day.', event.threadID, event.messageID);
            return;
        }

        // Load receiver's coin balance
        let receiverBalance = loadCoinBalance(receiverId);
        // Add the amount to receiver's balance
        receiverBalance += amount;
        saveCoinBalance(receiverId, receiverBalance);

        // Record the transfer in the sender's logs
        const transferLog = { date: new Date().toISOString().split('T')[0], amount, note };
        senderLogs.push(transferLog);
        saveCoinTransferLogs(senderId, senderLogs);

        api.sendMessage(`You have successfully shared ${amount} coins with user ${receiverId}.\nNote: ${note}`, event.threadID, event.messageID);

        // Notify the receiver
        api.sendMessage(`You have received ${amount} coins from user ${senderId}.\nNote: ${note}`, receiverId);
    }
};