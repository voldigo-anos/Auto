const fs = require('fs');
const path = require('path');

const petsFilePath = path.join(__dirname, '../database/pets.json');
const coinBalancesPath = path.join(__dirname, '../database/coin_balances');

const itemPrices = {
    "magicpotion": 10000000000,
    "vitamin-d": 50000000,
    "powerpotion": 80000000,
    "rockpotion": 500000000,
    "skillplus": 100000000,
    "frozen-hart": 1000000000,
    "oldnote": 400000,
    "dogtag": 600000,
    "transmute": 800000
};

const itemDescriptions = {
    "magicpotion": "Adds +5 all stats",
    "vitamin-d": "Adds 5 defense per potion to your pet.",
    "powerpotion": "Adds 5 attack per potion to your pet.",
    "rockpotion": "Adds 70 exp per potion to your pet.",
    "skillplus": "Randomly selects a new skill for your pet.",
    "frozen-hart": "Sets your pet's skill to ice.",
    "oldnote": "Edits your pet's description.",
    "dogtag": "Changes your pet's name.",
    "transmute": "Transmute your pet to any kind."
};

const itemLogic = {
    "magicpotion": (pet, amount) => {
        pet.exp += 50 * amount;

        pet.attack += 5 * amount;
        pet.defense += 5 * amount;
        pet.hp += 1000 * amount;
        return { pet, change: `added ${5 * amount} to all stats` };
    },
    "vitamin-d": (pet, amount) => {
        const change = 5 * amount;
        pet.defense += change;
        if (pet.defense > 1500) pet.defense = 1500; // Max defense
        return { pet, change: `+${change} defense` };
    },
    "powerpotion": (pet, amount) => {
        const change = 5 * amount;
        pet.attack += change;
        if (pet.attack > 2000) pet.attack = 2000; // Max attack
        return { pet, change: `+${change} attack` };
    },
    "rockpotion": (pet, amount) => {
        const change = 70 * amount;
        pet.exp += change;
        if (pet.exp > 1000) pet.exp = 9999; // Max exp
        return { pet, change: `+${change} exp` };
    },
    "skillplus": (pet) => {
        const skills = ['fire', 'ice', 'water', 'grass'];
        pet.skill = skills[Math.floor(Math.random() * skills.length)];
        return { pet, change: `Skill set to ${pet.skill}` };
    },
    "frozen-hart": (pet) => {
        pet.skill = 'ice';
        return { pet, change: `Skill set to ice` };
    },
    "oldnote": (pet, description) => {
        pet.description = description;
        return { pet, change: `Description updated` };
    },
    "dogtag": (pet, newName) => {
        pet.name = newName;
        return { pet, change: `Name changed to ${newName}` };
    },
    "transmute": (pet, newEmoji) => {
        pet.emoji = newEmoji;
        return { pet, change: `Emoji changed to ${newEmoji}` };
    }
};

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
    name: 'petshop',
    description: 'Browse and purchase items for your pet.',
    role: 'user',
    execute(api, event, args, command) {
        const userId = event.senderID;

        // Check if args array is empty or undefined
        if (!args || args.length === 0) {
            let itemList = 'Available items in the pet shop:\n';
            Object.entries(itemPrices).forEach(([itemName, price]) => {
                itemList += `${itemName}: ${price} coins\nDescription: ${itemDescriptions[itemName]}\n\n`;
            });
            api.sendMessage(itemList, event.threadID, event.messageID);
            return;
        }

        // Convert the item name to lowercase
        const item = args[0].toLowerCase();

        // Check if the provided item exists
        if (!itemPrices[item]) {
            api.sendMessage('Invalid item.', event.threadID, event.messageID);
            return;
        }

        // Check if amount is required and provided
        const amountRequiredItems = ["magicpotion", "vitamin-d", "powerpotion", "rockpotion"];
        let amount = 1; // Default amount
        if (amountRequiredItems.includes(item)) {
            if (args.length < 2 || isNaN(args[1]) || parseInt(args[1]) <= 0) {
                api.sendMessage(`Please specify a valid amount for ${item}.`, event.threadID, event.messageID);
                return;
            }
            amount = parseInt(args[1]);
        }

        // Path to the user's coin balance file
        const coinBalancePath = path.join(__dirname, `../database/coin_balances/${userId}.json`);

        // Check if the file containing the user's coin balance exists
        if (!fs.existsSync(coinBalancePath)) {
            api.sendMessage('You do not have enough coins to purchase this item.', event.threadID, event.messageID);
            return;
        }

        // Load the user's coin balance
        const coinBalance = loadCoinBalance(userId);

        // Calculate the total price
        const totalPrice = itemPrices[item] * amount;

        // Check if the user has enough coins to purchase the item
        if (coinBalance < totalPrice) {
            const neededCoins = totalPrice - coinBalance;
            api.sendMessage(`You need ${neededCoins} more coins to purchase this item.`, event.threadID, event.messageID);
            return;
        }

        // Load the pet data
        const petData = loadPets();

        // Check if the user has a pet
        if (!petData[userId]) {
            api.sendMessage('You do not have a pet. Use the "create" command to create one.', event.threadID, event.messageID);
            return;
        }

        // Verify additional arguments for specific items
        if ((item === 'dogtag' || item === 'oldnote' || item === 'transmute') && args.length < 2) {
            api.sendMessage(`The item "${item}" requires additional information. Please provide the necessary details.`, event.threadID, event.messageID);
            return;
        }

        // Apply the logic associated with the purchased item to the pet
        const { pet: updatedPet, change } = itemLogic[item](petData[userId], args.slice(1).join(' '));

        // Update the pet data with the changes
        petData[userId] = updatedPet;

        // Check if pet stats exceed maximum values and adjust if necessary
        if (petData[userId].attack > 2000) petData[userId].attack = 2000; // Max attack
        if (petData[userId].hp > 10000) petData[userId].hp = 10000; // Max HP
        if (petData[userId].defense > 1500) petData[userId].defense = 1500; // Max defense
if (petData[userId].exp > 9999) petData[userId].exp = 9999;
        // Write the updated pet data to the file
        savePets(petData);

        // Deduct the cost of the item from the user's coin balance
        const newCoinBalance = coinBalance - totalPrice;
        saveCoinBalance(userId, newCoinBalance);

        // Send a detailed confirmation message to the user
        let confirmationMessage = `Item "${item}" purchased successfully!\nAmount: ${amount}\nTotal Cost: ${totalPrice} coins\nChange: ${change}\n\nYour pet's new stats:\n`;
        confirmationMessage += `${petData[userId].name}\n`;
        confirmationMessage += `HP: ${petData[userId].hp}\n`;
        confirmationMessage += `Attack: ${petData[userId].attack}\n`;
        confirmationMessage += `Defense: ${petData[userId].defense}\n`;
        confirmationMessage += `Skill: ${petData[userId].skill}\n`;
        if (petData[userId].description) confirmationMessage += `Description: ${petData[userId].description}\n`;
        if (petData[userId].emoji) confirmationMessage += `Emoji: ${petData[userId].emoji}\n`;
        confirmationMessage += `Remaining coins: ${newCoinBalance}\n`;

        api.sendMessage(confirmationMessage, event.threadID, event.messageID);
    }
};