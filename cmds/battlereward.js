const fs = require('fs');
const path = require('path');

const petsFilePath = path.join(__dirname, '../database/pets.json');
const achievementsPath = path.join(__dirname, '../database/achievements');
const battleHistoryPath = path.join(__dirname, '../database/battle_history.json');
const coinBalancesPath = path.join(__dirname, '../database/coin_balances');

if (!fs.existsSync(achievementsPath)) {
    fs.mkdirSync(achievementsPath);
}

function loadPets() {
    if (fs.existsSync(petsFilePath)) {
        return JSON.parse(fs.readFileSync(petsFilePath, 'utf8'));
    }
    return {};
}

function loadCoinBalance(userId) {
    const coinBalanceFile = path.join(coinBalancesPath, `${userId}.json`);
    if (fs.existsSync(coinBalanceFile)) {
        return JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));
    }
    return 0;
}

function saveCoinBalance(userId, balance) {
    const coinBalanceFile = path.join(coinBalancesPath, `${userId}.json`);
    fs.writeFileSync(coinBalanceFile, JSON.stringify(balance));
}

function loadBattleHistory() {
    if (fs.existsSync(battleHistoryPath)) {
        return JSON.parse(fs.readFileSync(battleHistoryPath, 'utf8'));
    }
    return {};
}

function loadAchievements(userId) {
    const achievementsFile = path.join(achievementsPath, `${userId}.json`);
    if (fs.existsSync(achievementsFile)) {
        return JSON.parse(fs.readFileSync(achievementsFile, 'utf8'));
    }
    return { lastClaimed: null, battles: 0, rewards: [] };
}

function saveAchievements(userId, achievements) {
    const achievementsFile = path.join(achievementsPath, `${userId}.json`);
    fs.writeFileSync(achievementsFile, JSON.stringify(achievements, null, 2));
}

function awardCoins(userId, coins) {
    let balance = loadCoinBalance(userId);
    balance += coins;
    saveCoinBalance(userId, balance);
    return coins;
}

module.exports = {
    name: 'achievements',
    description: 'Show your battle achievements and claim rewards.',
    cooldown: 0,
    credits: 'Yafb',
    role: 'user',
    execute(api, event) {
        const userId = event.senderID;
        const pets = loadPets();
        const battleHistory = loadBattleHistory();
        const achievements = loadAchievements(userId);

        const today = new Date().toISOString().split('T')[0];
        if (achievements.lastClaimed === today) {
            api.sendMessage('You have already claimed your reward today. Try again tomorrow.', event.threadID, event.messageID);
            return;
        }

        // Gather all pets battled by the user
        const battledPets = [];
        if (battleHistory[userId]) {
            for (const opponentId in battleHistory[userId]) {
                if (pets[opponentId]) {
                    battledPets.push({ name: pets[opponentId].name, emoji: pets[opponentId].emoji });
                }
            }
        }

        // Show battled pets
        if (battledPets.length > 0) {
            const petList = battledPets.map(pet => `${pet.emoji} ${pet.name}`).join('\n');
            api.sendMessage(`You have battled the following pets:\n${petList}`, event.threadID, event.messageID);
        } else {
            api.sendMessage('You have not battled any pets yet.', event.threadID, event.messageID);
        }

        // Update achievements
        achievements.battles += battledPets.length;
        achievements.lastClaimed = today;

        // para sa battlers
        const rewards = [
            { battles: 5, coins: 100000 },
            { battles: 10, coins: 600000 },
            { battles: 15, coins: 800000 },
            { battles: 20, coins: 1000000 }
        ];

        let rewardMessage = 'Rewards claimed today:\n';
        let anyRewards = false;

        rewards.forEach(reward => {
            if (achievements.battles >= reward.battles && !achievements.rewards.includes(reward.battles)) {
                achievements.rewards.push(reward.battles);
                const coinsAwarded = awardCoins(userId, reward.coins);
                rewardMessage += `Battled ${reward.battles} pets: ${coinsAwarded} coins\n`;
                anyRewards = true;
            }
        });

        if (anyRewards) {
            api.sendMessage(rewardMessage, event.threadID, event.messageID);
        } else {
            api.sendMessage('No new rewards available today.', event.threadID, event.messageID);
        }

        saveAchievements(userId, achievements);
    }
};