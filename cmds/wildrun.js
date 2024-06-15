const fs = require('fs');
const path = require('path');

const petsFilePath = path.join(__dirname, '../database/pets.json');
const coinBalancesPath = path.join(__dirname, '../database/coin_balances');

// Enemy lists and their stats ranges
const enemies = {
    easy: ['🪱', '🐛', '🦋', '🐞', '🐝', '🪰', '🪳', '🦟', '🪲', '🦗', '🐜', '🐌', '🐚', '🕷️', '🦂'],
    normal: ['🙈', '🙉', '🙊', '🐵', '🦁', '🐯', '🐱', '🐶', '🐺'],
    medium: ['🐻', '🐻‍❄️', '🐨', '🐼', '🐹', '🐭', '🐰', '🦊', '🦝'],
    hard: ['🐮', '🐷', '🐗', '🦓', '🦄', '🐴', '🫎', '🐲'],
    evil: ['🤖', '👾', '👻']
};

const attackRanges = {
    easy: [3, 15],
    normal: [70, 150],
    medium: [150, 500],
    hard: [500, 1000],
    evil: [2000, 2500]
};

const defenseRanges = {
    easy: 10,
    normal: 50,
    medium: 100,
    hard: 300,
    evil: 800
};

const hpRanges = {
    easy: 20,
    normal: 200,
    medium: 1000,
    hard: 3000,
    evil: 5000
};

const rewards = {
    easy: { coins: 50, exp: 8 },
    normal: { coins: 70, exp: 13 },
    medium: { coins: 100, exp: 16 },
    hard: { coins: 1000, exp: 23 },
    evil: { coins: 2000, exp: 27 }
};

function getRandomEnemy(difficulty) {
    const enemyList = enemies[difficulty];
    const randomEnemy = enemyList[Math.floor(Math.random() * enemyList.length)];
    const attackRange = attackRanges[difficulty];
    const randomAttack = Math.floor(Math.random() * (attackRange[1] - attackRange[0] + 1)) + attackRange[0];
    const randomDefense = defenseRanges[difficulty];
    const randomHp = hpRanges[difficulty];

    return {
        emoji: randomEnemy,
        attack: randomAttack,
        defense: randomDefense,
        hp: randomHp
    };
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

module.exports = {
    name: 'wildbattle',
    description: 'Engage in a wild battle with a random enemy.',
    role: 'user',
    execute(api, event, args, command) {
        const userId = event.senderID;

        // Validate difficulty argument
        const difficulty = args[0] ? args[0].toLowerCase() : null;
        if (!difficulty || !enemies[difficulty]) {
            api.sendMessage('Please specify a valid difficulty level: easy, normal, medium, hard, or evil.', event.threadID, event.messageID);
            return;
        }

        // Path to the file containing pet data
        const petDataPath = path.join(__dirname, '../database/pets.json');

        // Check if the file containing pet data exists
        if (!fs.existsSync(petDataPath)) {
            api.sendMessage('You do not have a pet. Use the "create" command to create one.', event.threadID, event.messageID);
            return;
        }

        // Load the pet data
        const petData = loadPets();

        // Check if the user has a pet
        if (!petData[userId]) {
            api.sendMessage('You do not have a pet. Use the "create" command to create one.', event.threadID, event.messageID);
            return;
        }

        const pet = petData[userId];

        // Check if the pet's HP is negative
        if (pet.hp < 0) {
            api.sendMessage('Your pet\'s HP is negative. Heal ur pet type (prefix)pet heal to heal', event.threadID, event.messageID);
            return;
        }

        const enemy = getRandomEnemy(difficulty);

        // Announce the wild animal appearance
        api.sendMessage(`A wild animal appears: ${enemy.emoji}!!!`, event.threadID, event.messageID);

        // Simulate the battle rounds
        const battleLogs = [];
        for (let round = 1; round <= 3; round++) {
            /*const petDamage = Math.max(0, pet.attack - enemy.defense);
            const enemyDamage = Math.max(0, enemy.attack - pet.defense);*/
const petDamage = Math.max(0, pet.attack * 5 );

const enemyDamage = Math.max(0, enemy.attack * 5);
            enemy.hp -= petDamage;
            pet.hp -= enemyDamage;

            battleLogs.push(`Round ${round}:\n${pet.emoji} Your pet dealt ${petDamage} damage to the wild ${enemy.emoji}!\nThe wild ${enemy.emoji} dealt ${enemyDamage} damage to your pet ${pet.emoji}!\n`);
            
            if (enemy.hp <= 0 || pet.hp <= 0) break; // End battle if either side's HP goes below or equal to 0
        }

        // Determine the outcome
        let resultMessage;
        if (enemy.hp <= 0 && pet.hp > 0) {
            const reward = rewards[difficulty];
            resultMessage = `You won! The wild ${enemy.emoji} has been defeated.\nYou earned ${reward.coins} coins and ${reward.exp} experience points.`;

            // Update pet's experience and user's coin balance
            pet.exp += reward.exp;
            const coinBalance = loadCoinBalance(userId);
            saveCoinBalance(userId, coinBalance + reward.coins);
        } else if (pet.hp <= 0 && enemy.hp > 0) {
            resultMessage = `You lost! Your pet ${pet.emoji} has been defeated by the wild ${enemy.emoji}.`;
        } else {
            resultMessage = `It's a draw! Both your pet ${pet.emoji} and the wild ${enemy.emoji} are still standing.`;
        }

        // Save the updated pet data
        petData[userId] = pet;
        savePets(petData);

        // Send battle logs with a delay
        const sendLogs = (logIndex) => {
            if (logIndex < battleLogs.length) {
                api.sendMessage(battleLogs[logIndex], event.threadID, () => {
                    setTimeout(() => sendLogs(logIndex + 1), 3000);
                });
            } else {
                api.sendMessage(resultMessage, event.threadID, event.messageID);
            }
        };

        sendLogs(0);
    }
};