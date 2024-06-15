const fs = require('fs');
const path = require('path');

const petsFilePath = path.join(__dirname, '../database/pets.json');
const coinBalancesPath = path.join(__dirname, '../database/coin_balances');

const animalEmojis = [
    '👾', '👻', '🙈', '🙉', '🙊', '🐵', '🦁', '🐯', '🐱', '🐶', '🐺', '🐻', '🐨', '🐼', '🐹', '🐭', '🐰', '🦊', '🦝',
    '🐮', '🐷', '🐽', '🐗', '🦓', '🦄', '🐴', '🐲', '🦎', '🐉', '🦖', '🦕', '🐢', '🐊', '🐍', '🐸', '🐇', '🐁', '🐀',
    '🐈', '🐩', '🐕', '🦮', '🐕‍🦺', '🐖', '🐎', '🐄', '🐂', '🐃', '🐏', '🐑', '🐐', '🦌', '🦙', '🦥', '🦘', '🐘',
    '🦏', '🦛', '🐆', '🦒', '🐅', '🐒', '🦍', '🦧', '🐪', '🐫', '🐿️', '🦨', '🦡', '🦔', '🦦', '🦇', '🐦', '🐓',
    '🐔', '🐤', '🐣', '🐥', '🦅', '🦉', '🦜', '🕊️', '🦢', '🦆', '🦩', '🦚', '🦃', '🐧', '🦈', '🐬', '🐋', '🐳',
    '🐟', '🐠', '🐡', '🦐', '🦞', '🦀', '🦑', '🐙', '🦪', '🦂', '🕷️', '🕸️', '🐚', '🐌', '🐜', '🦗', '🦟', '🐝',
    '🐞', '🦋', '🐛', '🦠'
];

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

function getRandomStat(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomSkill() {
    const skills = ['fire', 'ice', 'water', 'grass'];
    return skills[Math.floor(Math.random() * skills.length)];
}

module.exports = {
    name: 'pet',
    description: 'Manage your pet.',
    role: 'user',
    cooldown: 0,
    credits: 'YAFB',
    execute(api, event, args, command) {
        const userId = event.senderID;
        const pets = loadPets();
        const coinBalance = loadCoinBalance(userId);

        if (args.length === 0) {
            if (pets[userId]) {
                const pet = pets[userId];
                let petInfo = `
Pet: ${pet.emoji} ${pet.name}
Description: ${pet.description}
Owner: ${pet.owner}
Attack: ${pet.attack}
HP: ${pet.hp}
Defense: ${pet.defense}
Skill: ${pet.skill}
Exp: ${pet.exp}
                `;
                // Display weak if HP is negative
                if (pet.hp < 0) {
                    petInfo += `\nyour pet is fainted (type arg heal to heal your pet)`;
                }
                api.sendMessage(petInfo, event.threadID, event.messageID);
            } else {
                api.sendMessage('You do not have a pet. Use "create emoji petname description" to create one.', event.threadID, event.messageID);
            }
        } else if (args[0] === 'create') {
            if (pets[userId]) {
                // Check if user has enough coins to override the existing pet
                if (coinBalance < 3000) {
                    api.sendMessage('You do not have enough coins to create a new pet. You need 3000 coins.', event.threadID, event.messageID);
                    return;
                }
                // Deduct the cost from user's balance
                const newBalance = coinBalance - 3000;
                saveCoinBalance(userId, newBalance);
            }
            const petEmoji = args[1];
            const petName = args[2];
            const description = args.slice(3).join(' ');
            // Ensure the pet emoji is one of the animal emojis
            if (!animalEmojis.includes(petEmoji)) {
                api.sendMessage('Please provide a valid animal emoji as the first argument.', event.threadID, event.messageID);
                return;
            }
            if (!petName || !description) {
                api.sendMessage('Please provide a pet name and description.', event.threadID, event.messageID);
                return;
            }
            pets[userId] = {
                name: petName,
                description: description,
                owner: userId,
                attack: getRandomStat(10, 15),
                hp: getRandomStat(60, 80),
                defense: getRandomStat(10, 15),
                skill: getRandomSkill(),
                exp: 10,
                emoji: petEmoji
            };
            savePets(pets);
            api.sendMessage(`Pet ${petEmoji} ${petName} created successfully!`, event.threadID, event.messageID);
        } else if (args[0] === 'list') {
            const petList = Object.values(pets).map(pet => `
${pet.emoji} Pet name: ${pet.name}
Description: ${pet.description}
Owner: ${pet.owner}
Attack: ${pet.attack}
HP: ${pet.hp}
Defense: ${pet.defense}
Exp: ${pet.exp}
Skill: ${pet.skill}
            `).join('\n\n');
            if (petList) {
                api.sendMessage(petList, event.threadID, event.messageID);
            } else {
                api.sendMessage('There are no pets to list.', event.threadID, event.messageID);
            }
        } else if (args[0] === 'heal') {
            if (pets[userId]) {
                const pet = pets[userId];
                if (pet.hp <= 0) {
                    pet.hp += pet.exp * 10;
                    savePets(pets);
                    api.sendMessage(`Your pet ${pet.emoji} ${pet.name} has been healed to ${pet.hp} HP.`, event.threadID, event.messageID);
                } else {
                    api.sendMessage('Your pet does not need healing.', event.threadID, event.messageID);
                }
            } else {
                api.sendMessage('You do not have a pet to heal.', event.threadID, event.messageID);
            }
        } else {
            api.sendMessage('Invalid command. Use "create emoji petname description" to create a pet, "list" to view all pets, or "heal" to heal your pet if it is weak.', event.threadID, event.messageID);
        }
    }
};