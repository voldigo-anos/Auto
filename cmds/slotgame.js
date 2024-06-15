const fs = require('fs');
const path = require('path');

const fruits = ['🍇', '🍉', '🍋', '🍒', '🍓', '🍍', '🥭', '🥝'];

// Function to generate a random pattern for the slot game
function generatePattern() {
    let pattern = [];
    for (let i = 0; i < 3; i++) {
        let row = [];
        for (let j = 0; j < 3; j++) {
            const randomFruit = fruits[Math.floor(Math.random() * fruits.length)];
            row.push(randomFruit);
        }
        pattern.push(row);
    }
    return pattern;
}

// Function to check if there are two or three of the same fruits in the middle row
function checkMiddleRow(pattern) {
    const middleRow = pattern[1];
    let consecutiveCount = 1;
    let maxConsecutiveCount = 1;
    let currentFruit = middleRow[0];

    // Iterate through the middle row to count consecutive fruits
    for (let i = 1; i < middleRow.length; i++) {
        if (middleRow[i] === currentFruit) {
            consecutiveCount++;
            if (consecutiveCount > maxConsecutiveCount) {
                maxConsecutiveCount = consecutiveCount;
            }
        } else {
            consecutiveCount = 1;
            currentFruit = middleRow[i];
        }
    }

    // Return the number of consecutive fruits in the middle row
    return maxConsecutiveCount;
}

// Function to calculate winnings based on the number of consecutive fruits in the middle row
function calculateWinnings(consecutiveCount, betAmount) {
    // Award winnings based on the number of consecutive fruits
    switch (consecutiveCount) {
        case 2:
            return betAmount * 7;
        case 3:
            return betAmount * 13;
        default:
            return 0;
    }
}

module.exports = {
    name: 'slot',
    description: 'Play the slot game by betting coins.',
    role: 'user',
    cooldown: 0, // 1 minute cooldown
    credits: 'rejardgwapo',
    execute(api, event, args, command) {
        const userId = event.senderID;
        const coinBalanceFile = path.join(__dirname, `../database/coin_balances/${userId}.json`);
        const betAmount = parseInt(args[0]);

        if (isNaN(betAmount) || betAmount <= 0) {
            api.sendMessage('Please enter a valid bet amount.', event.threadID, event.messageID);
            return;
        }

        let coinBalance = 0;
        if (fs.existsSync(coinBalanceFile)) {
            coinBalance = JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));
        }

        if (coinBalance < betAmount) {
            api.sendMessage(`You don't have enough coins to bet ${betAmount}.`, event.threadID, event.messageID);
            return;
        }

        const pattern = generatePattern();
        const consecutiveCount = checkMiddleRow(pattern);
        const winnings = calculateWinnings(consecutiveCount, betAmount);

        // Update the coin balance based on the winnings
        coinBalance += winnings;
        fs.writeFileSync(coinBalanceFile, JSON.stringify(coinBalance));

        let patternMessage = 'Here is the slot pattern:\n';
        pattern.forEach(row => {
            patternMessage += row.join(' ') + '\n';
        });

        let resultMessage = winnings > 0
            ? `Congratulations! You won ${winnings} coins!`
            : 'Sorry, you did not win anything.';

        api.sendMessage(`${patternMessage}\n${resultMessage}\nYou now have ${coinBalance} coins.`, event.threadID, event.messageID);
    }
};