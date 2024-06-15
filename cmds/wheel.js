const fs = require('fs');
const path = require('path');

const wheels = new Map();

function generateUniqueCode() {
    return `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
}

function pickRandomWinner(players) {
    const winnerIndex = Math.floor(Math.random() * players.length);
    return players[winnerIndex];
}

function getRemainingTimeMessage(timeRemaining) {
    return `Wheel running... ${timeRemaining / 1000} seconds remaining.`;
}

function distributeWinnings(api, threadID, lobby, callback) {
    const winner = pickRandomWinner(lobby.players);
    const totalBet = lobby.players.length * lobby.betAmount;
    const winnerId = winner.id;
    const coinBalanceFile = path.join(__dirname, `../database/coin_balances/${winnerId}.json`);

    let coinBalance = 0;
    if (fs.existsSync(coinBalanceFile)) {
        coinBalance = JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));
    }

    coinBalance += totalBet;
    fs.writeFileSync(coinBalanceFile, JSON.stringify(coinBalance));

    let resultMessage = `Time's up! The winner is ${winner.name}, winning ${totalBet} coins!`;

    callback(resultMessage);
}

module.exports = {
    name: 'wheel',
    description: 'Create a fortune wheel and join the game to win all bets.',
    role: 'user',
    credits: 'rejardgwapo',
    cooldown: 0, // No cooldown
    execute(api, event, args, command) {
        const userId = event.senderID;
        const subCommand = args[0];

        if (subCommand === 'create') {
            const betAmount = parseInt(args[1]);
            if (isNaN(betAmount) || betAmount <= 0) {
                api.sendMessage('Please provide a valid bet amount.', event.threadID, event.messageID);
                return;
            }

            const coinBalanceFile = path.join(__dirname, `../database/coin_balances/${userId}.json`);
            let coinBalance = 0;
            if (fs.existsSync(coinBalanceFile)) {
                coinBalance = JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));
            }

            if (coinBalance < betAmount) {
                api.sendMessage(`You don't have enough coins to bet ${betAmount}.`, event.threadID, event.messageID);
                return;
            }

            coinBalance -= betAmount;
            fs.writeFileSync(coinBalanceFile, JSON.stringify(coinBalance));

            const lobbyCode = generateUniqueCode();
            wheels.set(lobbyCode, { betAmount, players: [{ id: userId, name: '' }] });

            api.getUserInfo(userId, (err, userInfo) => {
                if (!err) {
                    wheels.get(lobbyCode).players[0].name = userInfo[userId].name;
                }
                api.sendMessage(`Wheel created! Use the code "${lobbyCode}" to join. The game will run for 1 minute.`, event.threadID, event.messageID);
api.sendMessage(`${lobbyCode}`, event.threadID, event.messageID);
                let timeRemaining = 60000; // 1 minute
                const interval = setInterval(() => {
                    timeRemaining -= 20000;
                    if (timeRemaining <= 0) {
                        clearInterval(interval);
                        const lobby = wheels.get(lobbyCode);
                        distributeWinnings(api, event.threadID, lobby, (resultMessage) => {
                            wheels.delete(lobbyCode);
                            api.sendMessage(resultMessage, event.threadID);
                        });
                    } else {
                        api.sendMessage(getRemainingTimeMessage(timeRemaining), event.threadID, event.messageID);
                    }
                }, 20000);
            });
        } else if (subCommand === 'join') {
            const lobbyCode = args[1];
            if (!lobbyCode || !wheels.has(lobbyCode)) {
                api.sendMessage('Please provide a valid lobby code.', event.threadID, event.messageID);
                return;
            }

            const lobby = wheels.get(lobbyCode);
            const betAmount = lobby.betAmount;

            const coinBalanceFile = path.join(__dirname, `../database/coin_balances/${userId}.json`);
            let coinBalance = 0;
            if (fs.existsSync(coinBalanceFile)) {
                coinBalance = JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));
            }

            if (coinBalance < betAmount) {
                api.sendMessage(`You don't have enough coins to bet ${betAmount}.`, event.threadID, event.messageID);
                return;
            }

            if (lobby.players.find(player => player.id === userId)) {
                api.sendMessage('You have already joined this wheel.', event.threadID, event.messageID);
                return;
            }

            coinBalance -= betAmount;
            fs.writeFileSync(coinBalanceFile, JSON.stringify(coinBalance));

            api.getUserInfo(userId, (err, userInfo) => {
                if (!err) {
                    const playerName = userInfo[userId].name;
                    lobby.players.push({ id: userId, name: playerName });
                    api.sendMessage(`${playerName} has joined the wheel.`, event.threadID, event.messageID);
                }
            });
        } else {
            api.sendMessage('Invalid command. Use "wheel create <betAmount>" to create a wheel or "wheel join <lobbyCode>" to join a wheel.', event.threadID, event.messageID);
        }
    }
};