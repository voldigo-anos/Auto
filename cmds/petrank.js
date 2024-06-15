const fs = require('fs');
const path = require('path');

const winLossRecordPath = path.join(__dirname, '../database/win_loss_record.json');
const petsFilePath = path.join(__dirname, '../database/pets.json');

function loadWinLossRecord() {
    if (fs.existsSync(winLossRecordPath)) {
        return JSON.parse(fs.readFileSync(winLossRecordPath, 'utf8'));
    }
    return {};
}

function loadPets() {
    if (fs.existsSync(petsFilePath)) {
        return JSON.parse(fs.readFileSync(petsFilePath, 'utf8'));
    }
    return {};
}

function saveWinLossRecord(record) {
    fs.writeFileSync(winLossRecordPath, JSON.stringify(record, null, 2));
}

function calculateWinRate(wins, losses) {
    if (wins + losses === 0) return 0;
    return (wins / (wins + losses)) * 100;
}

function clearWinLossRecord(petId) {
    const winLossRecord = loadWinLossRecord();
    if (winLossRecord.hasOwnProperty(petId)) {
        winLossRecord[petId] = { wins: 0, losses: 0, draws: 0 };
        saveWinLossRecord(winLossRecord);
        return true;
    }
    return false;
}

module.exports = {
    name: 'leaderboard',
    description: 'Shows the highest win rate pets.',
    cooldown: 0,
    credits: 'Yafb',
    role: 'user',
    execute(api, event, args) {
        const winLossRecord = loadWinLossRecord();
        const pets = loadPets();
        
        // Assuming event.senderID is the pet ID or can be mapped to it
        const petId = event.senderID;

        if (args.length === 1 && args[0] === 'clear') {
            if (clearWinLossRecord(petId)) {
                api.sendMessage(`Successfully cleared record for pet ${pets[petId].name}.`, event.threadID, event.messageID);
            } else {
                api.sendMessage(`Pet with ID ${petId} not found or has no recorded battles.`, event.threadID, event.messageID);
            }
            return;
        } else if (args.length > 1 && args[0] === 'clear') {
            api.sendMessage('Invalid command. Use only "leaderboard clear" to clear your pet\'s record.', event.threadID, event.messageID);
            return;
        }

        if (Object.keys(winLossRecord).length === 0) {
            api.sendMessage('No battles have been recorded yet.', event.threadID, event.messageID);
            return;
        }

        const leaderboard = Object.entries(winLossRecord)
            .map(([petId, record]) => {
                const pet = pets[petId];
                const winRate = calculateWinRate(record.wins, record.losses);
                return {
                    emoji: pet.emoji,
                    name: pet.name,
                    wins: record.wins,
                    losses: record.losses,
                    draws: record.draws || 0,
                    winRate: winRate.toFixed(2)
                };
            })
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, 30); // Limit to top 30 pets

        let leaderboardMessage = '🏆 Pet Leaderboard 🏆\n\n';
        leaderboard.forEach((pet, index) => {
            leaderboardMessage += `${index + 1}. ${pet.emoji} ${pet.name}\n`;
            leaderboardMessage += `   Wins: ${pet.wins} | Losses: ${pet.losses} | Draws: ${pet.draws} | Win Rate: ${pet.winRate}%\n\n`;
        });

        api.sendMessage(leaderboardMessage, event.threadID, event.messageID);
    }
};