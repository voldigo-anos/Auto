const fs = require('fs');
const path = require('path');

const petsFilePath = path.join(__dirname, '../database/pets.json');
const coinBalancesPath = path.join(__dirname, '../database/coin_balances');
const battleLogsPath = path.join(__dirname, '../database/battle_logs');
const winLossRecordPath = path.join(__dirname, '../database/win_loss_record.json');
//try
const battleHistoryPath = path.join(__dirname, '../database/battle_history.json');

// Function to load battle history from the database
function loadBattleHistory() {
    if (fs.existsSync(battleHistoryPath)) {
        return JSON.parse(fs.readFileSync(battleHistoryPath, 'utf8'));
    }
    return {};
}

// Function to save battle history to the database
function saveBattleHistory(history) {
    fs.writeFileSync(battleHistoryPath, JSON.stringify(history, null, 2));
}
// Create battle logs directory if it doesn't exist
if (!fs.existsSync(battleLogsPath)) {
    fs.mkdirSync(battleLogsPath);
}

// Create win-loss record file if it doesn't exist
if (!fs.existsSync(winLossRecordPath)) {
    fs.writeFileSync(winLossRecordPath, JSON.stringify({}), 'utf8');
}

function loadPets() {
    if (fs.existsSync(petsFilePath)) {
        return JSON.parse(fs.readFileSync(petsFilePath, 'utf8'));
    }
    return {};
}

function savePets(pets) {
    fs.writeFileSync(petsFilePath, JSON.stringify(pets, null, 2));
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

function loadWinLossRecord() {
    if (fs.existsSync(winLossRecordPath)) {
        return JSON.parse(fs.readFileSync(winLossRecordPath, 'utf8'));
    }
    return {};
}

function saveWinLossRecord(record) {
    fs.writeFileSync(winLossRecordPath, JSON.stringify(record, null, 2));
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function applySkillEffect(attacker, defender) {
    const weaknesses = {
        fire: 'water',
        ice: 'fire',
        water: 'grass',
        grass: 'ice'
    };
    let additionalDamage = 0;
    let skillEffect = '';
    if (weaknesses[attacker.skill] === defender.skill) {
        additionalDamage = 2;
        skillEffect = 'super effective';
    } else if (attacker.skill === 'ice') {
        skillEffect = 'frozen';
    } else if (attacker.skill === 'fire' && Math.random() < 0.5) {
        skillEffect = 'burn';
    } else if (attacker.skill === 'water' && Math.random() < 0.5) {
        skillEffect = 'waterPistol';
    }
    return { additionalDamage, skillEffect };
}

function battleRound(attacker, defender, multiplier = 1) {
    const { additionalDamage, skillEffect } = applySkillEffect(attacker, defender);
    const defenseChance = Math.random(); // Random chance to block damage based on defense
    const damageMultiplier = multiplier;
    const totalDamage = (attacker.attack + additionalDamage) * damageMultiplier - (defenseChance < 0.3 ? defender.defense : 0);
    defender.hp -= totalDamage;
    return {
        totalDamage,
        skillEffect,
        defenderHP: defender.hp
    };
}

function updatePetStats(pet) {
    pet.attack = Math.min(pet.attack + 3, 2000);
    pet.hp = Math.min(pet.hp + 10, 10000);
    pet.defense = Math.min(pet.defense + 3, 1500);
    pet.exp += getRandomNumber(15, 20);
}

function updatePetStats2(pet) {
    pet.attack = Math.min(pet.attack + 1, 2000);
    pet.hp = Math.min(pet.hp + 5, 10000);
    pet.defense = Math.min(pet.defense + 1, 1500);
    pet.exp += getRandomNumber(5, 15);
}

function awardCoins(userId) {
    const coins = getRandomNumber(15, 30); // Random amount between 15 and 30
    let balance = loadCoinBalance(userId);
    balance += coins;
    saveCoinBalance(userId, balance);
    return coins;
}

function updateWinLossRecord(winnerId, loserId) {
    const record = loadWinLossRecord();
    if (!record[winnerId]) {
        record[winnerId] = { wins: 0, losses: 0 };
    }
    if (!record[loserId]) {
        record[loserId] = { wins: 0, losses: 0 };
    }
    record[winnerId].wins += 1;
    record[loserId].losses += 1;
    saveWinLossRecord(record);
}

module.exports = {
    name: 'battle',
    description: 'Battle your pet against another pet.',
    cooldown: 0,
    credits: 'Yafb',
    role: 'user',
    execute(api, event, args) {
        const userId = event.senderID;
        const pets = loadPets();

        if (!pets[userId]) {
            api.sendMessage('You do not have a pet to battle with. Use the "pet" command to create one.', event.threadID, event.messageID);
            return;
        }

        const opponentId = args[0];
        if (!opponentId || !pets[opponentId]) {
            api.sendMessage('Invalid opponent ID or the opponent does not have a pet.', event.threadID, event.messageID);
            return;
        }

        const userPet = pets[userId];
        const opponentPet = pets[opponentId];
          // Load battle history
        const battleHistory = loadBattleHistory();

        // Check if the user has battled the opponent today
        if (battleHistory[userId] && battleHistory[userId][opponentId]) {
            api.sendMessage('You have already battled this pet today. Please try again tomorrow.', event.threadID, event.messageID);
            return;
        }
        
        // Set the HP of both pets based on their experience
        userPet.hp = Math.min(userPet.exp * 10, 10000);
        opponentPet.hp = Math.min(opponentPet.exp * 10, 10000);

        let battleLog = [];
        let frozen = false;

        for (let round = 1; round <= 3; round++) {
            if (!frozen) {
                const userAttack = battleRound(userPet, opponentPet, 1.5);
                let userAttackMessage = `Round ${round}: ${userPet.name} deals ${userAttack.totalDamage.toFixed(2)} damage to ${opponentPet.name}. (${userAttack.skillEffect})`;
                if (userAttack.skillEffect === 'burn') {
                    userAttackMessage += ` ${opponentPet.name} is burned!`;
                }
                battleLog.push(userAttackMessage);
                if (userAttack.skillEffect === 'frozen') {
                    frozen = true;
                }
            }

            if (opponentPet.hp <= 0) {
                break;
            }

            if (!frozen) {
                const opponentAttack = battleRound(opponentPet, userPet, 1.5);
                let opponentAttackMessage = `Round ${round}: ${opponentPet.name} deals ${opponentAttack.totalDamage.toFixed(2)} damage to ${userPet.name}. (${opponentAttack.skillEffect})`;
                if (opponentAttack.skillEffect === 'burn') {
                    opponentAttackMessage += ` ${userPet.name} is burned!`;
                } else if (opponentAttack.skillEffect === 'waterPistol') {
                    opponentAttackMessage += ` ${opponentPet.name} uses Water Pistol, dealing additional damage!`;
                }
                if (opponentAttack.skillEffect === 'grassHeal') {
                    opponentAttackMessage += ` ${opponentPet.name} heals itself by 10% HP!`;
                }
                battleLog.push(opponentAttackMessage);
                if (opponentAttack.skillEffect === 'frozen') {
                    frozen = true;
                }
            }

            if (userPet.hp <= 0) {
                break;
            }

            frozen = false; // Reset frozen status for the next round
        }

        let winner;
        if (userPet.hp <= 0 && opponentPet.hp <= 0) {
            battleLog.push('It\'s a draw!');
        } else if (userPet.hp <= 0) {
            winner = opponentPet;
            updatePetStats(opponentPet);
            updateWinLossRecord(opponentId, userId);
        } else if (opponentPet.hp <= 0) {
            winner = userPet;
            updatePetStats(userPet);
            updateWinLossRecord(userId, opponentId);
        } else if (userPet.hp > opponentPet.hp) {
            winner = userPet;
            updatePetStats(userPet);
            updatePetStats2(opponentPet);
            updateWinLossRecord(userId, opponentId);
        } else {
            winner = opponentPet;
            updatePetStats(opponentPet);
            updatePetStats2(userPet);
            updateWinLossRecord(opponentId, userId);
        }

        if (winner) {
            const coinsAwarded = awardCoins(winner.owner);
            battleLog.push(`${winner.emoji} ⛏️ ${winner === userPet ? opponentPet.emoji : userPet.emoji}`);
            battleLog.push(`${winner.name} has slain ${winner === userPet ? opponentPet.name : userPet.name}!`);
            battleLog.push(`${winner.name} earned ${coinsAwarded} coins and gained experience!`);
            battleLog.push(`${winner.name} - Exp: ${winner.exp}, Attack: ${winner.attack}, HP: ${winner.hp}, Defense: ${winner.defense}`);
        }

        savePets(pets);

        // Save battle log to file
        const battleLogFilePath = path.join(battleLogsPath, `battle_log_${Date.now()}.txt`);
        fs.writeFileSync(battleLogFilePath, battleLog.join('\n'), 'utf8');

        const sendBattleLogMessage = () => {
            api.sendMessage({
                body: 'Battle log:',
                attachment: fs.createReadStream(battleLogFilePath)
            }, event.threadID, () => {
                // Remove the file after sending
                fs.unlinkSync(battleLogFilePath);
            });
        };

        // Send each message with a 3-second delay
        let messageIndex = 0;
        const sendMessages = () => {
            if (messageIndex < battleLog.length) {
                api.sendMessage(battleLog[messageIndex], event.threadID, () => {
                    messageIndex++;
                    setTimeout(sendMessages, 3000);
                });
            } else {
                // Send the full battle log as an attachment at the end
                setTimeout(sendBattleLogMessage, 2000);
            }
        };

        sendMessages();
        // After the battle, record it in the battle history
        if (!battleHistory[userId]) {
            battleHistory[userId] = {};
        }
        battleHistory[userId][opponentId] = true;
        saveBattleHistory(battleHistory);
    //}
}
    }
    //;
  //  }}
