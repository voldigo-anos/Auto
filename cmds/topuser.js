const fs = require('fs');
const path = require('path');

const MAX_COINS = 9999999999999999; // 999 billion
const coinBalancesPath = path.join(__dirname, '../database/coin_balances');
const petsFilePath = path.join(__dirname, '../database/pets.json');

function loadCoinBalances() {
    let coinBalances = {};

    fs.readdirSync(coinBalancesPath).forEach(file => {
        const userId = file.split('.')[0];
        const balance = JSON.parse(fs.readFileSync(path.join(coinBalancesPath, file)));
        coinBalances[userId] = balance;
    });

    return coinBalances;
}

function loadPets() {
    if (fs.existsSync(petsFilePath)) {
        return JSON.parse(fs.readFileSync(petsFilePath, 'utf8'));
    }
    return {};
}

module.exports = {
    name: 'top1',
    description: 'Show users with the maximum coins.',
    cooldown: 0,
    credits: 'Yafb',
    role: 'user',
    async execute(api, event, args, command) {
        const coinBalances = loadCoinBalances();
        const pets = loadPets();

        let maxCoinUsers = [];

        // Check and set maximum coin limit
        for (let userId in coinBalances) {
            if (coinBalances[userId] > MAX_COINS) {
                coinBalances[userId] = MAX_COINS;
                fs.writeFileSync(path.join(coinBalancesPath, `${userId}.json`), JSON.stringify(MAX_COINS));
            }
            if (coinBalances[userId] === MAX_COINS) {
                maxCoinUsers.push(userId);
            }
        }

        if (maxCoinUsers.length === 0) {
            api.sendMessage('No users found with the maximum coin amount.', event.threadID, event.messageID);
            return;
        }

        let topUsersMessage = '🏆 Users with the Maximum Coins 🏆\n\n';

        for (const userId of maxCoinUsers) {
            const userInfo = await api.getUserInfo(userId);
            const userName = userInfo[userId] ? userInfo[userId].name : 'Unknown User';
            topUsersMessage += `User: ${userName}\n`;
            topUsersMessage += `Coins: ${coinBalances[userId]}\n`;

            if (pets[userId]) {
                topUsersMessage += `Pet Name: ${pets[userId].name}\n\n`;
            } else {
                topUsersMessage += 'Pet Name: None\n\n';
            }
        }

        api.sendMessage(topUsersMessage, event.threadID, event.messageID);
    }
};