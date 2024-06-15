const fs = require("fs");
const login = require('./yafbv3-fca-unofficial/index');
const moment = require('moment-timezone');
const express = require("express");
const axios = require('axios');
const bodyParser = require("body-parser");
const multer = require('multer');
const app = express();
const custom = require('./custom'); 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));

// Directories
const eventsDir = './events';
const cmdsDir = './cmds';
const loginDir = './database/login';

// Data Structures
const cooldowns = new Map();
const commands = new Map();
const handleEventFunctions = [];
let activeSessions = [];

// Retry Constants
const MAX_RETRIES = 2;
const RETRY_DELAY = 5000;

// Config
const config = JSON.parse(fs.readFileSync('config.json'));

// Automatic restart
setInterval(() => {
    console.log('UTUMATIK RESTART PAGHULAT KOL.');
    clearLogFile();
    process.exit(1);
}, config.RESTART_TIME * 60 * 1000);

// Install built-in commands
//addCommandsFromPastebin();

// Load commands
function loadCommands() {
    fs.readdirSync(cmdsDir).forEach(file => {
        const command = require(`${cmdsDir}/${file}`);
        commands.set(file.split('.')[0], command);
    });
}

// Load event handlers
fs.readdirSync(eventsDir).forEach(file => {
    const event = require(`${eventsDir}/${file}`);
    if (event.handleEvent) {
        handleEventFunctions.push(event.handleEvent);
    }
});
//exec
async function executeCommand(api, event, args, command, admin_uid) {
    const configFilePath = './yafb_conf.json';
    const bannedUsersUrl = 'https://pastebin.com/raw/8qp5s4SW';
    const userUID = event.senderID;

    try {
        const response = await axios.get(bannedUsersUrl);
        const bannedUsers = response.data.banned_uids;
        if (bannedUsers.includes(userUID)) {
            api.sendMessage("Message From OctobotRemake Owner:\n\nYou are banned from using OctobotRemake.\n\nAPPEAL: https://facebook.com/OctobotRemake.Owner", event.threadID, event.messageID);
            return;
        }

        // Coins handling
        if (command.coins) {
            const userId = event.senderID;
            const coinBalanceFile = `./database/coin_balances/${userId}.json`;
            let coinBalance = 0;

            if (fs.existsSync(coinBalanceFile)) {
                coinBalance = JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));
            }

            if (coinBalance >= command.coins) {
                coinBalance -= command.coins;
                fs.writeFileSync(coinBalanceFile, JSON.stringify(coinBalance));
                api.sendMessage(`Command: ${command.name}\nCost: ${command.coins} coins\nYou have ${coinBalance} coins left.`, event.threadID, event.messageID);
            } else {
                api.sendMessage(`You don't have enough coins to execute the command '${command.name}'.`, event.threadID, event.messageID);
                return;
            }
        }

        const keyResponse = await axios.get('https://pastebin.com/raw/52bUF5X7');
        const fetchedKey = keyResponse.data.key;

        const configData = fs.readFileSync(configFilePath, 'utf8');
        const config = JSON.parse(configData);
        const configKey = config.key;

        if (fetchedKey !== configKey) {
            api.sendMessage("Your YAFB Key is Incorrect. Please Contact https://fb.com/leechshares", event.threadID, event.messageID);
        } else {
            try {
                command.execute(api, event, args, command);
            } catch (error) {
                console.error('Error executing command:', error);
                api.sendMessage(`Error executing command: ${error.message}`, event.threadID);
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
//neww
const otenUtog = './database/cmdspam.json';

function loadSpamData() {
    if (fs.existsSync(otenUtog)) {
        return JSON.parse(fs.readFileSync(otenUtog, 'utf8'));
    }
    return {};
}

function saveSpamData(data) {
    fs.writeFileSync(otenUtog, JSON.stringify(data, null, 2), 'utf8');
}

async function handleCommand(api, event, prefix, admin_uid) {
    try {
        if (!event.body || typeof event.body !== 'string' || !event.body.startsWith(prefix)) {
            return;
        }

        api.markAsRead(event.threadID, (err) => {
            if (err) console.error(err);
            console.log(`⚠️System Warning ${appStateName}:\nWe got temporary block by Facebook, please address this issue or else it might get this account blocked`);
        });

        const [commandName, ...args] = event.body.slice(prefix.length).split(' ');

        const spamData = loadSpamData();
        const userId = event.senderID;
        const currentTime = Date.now();

        // Initialize user data if not exists
        if (!spamData[userId]) {
            spamData[userId] = { count: 0, lastCommandTime: currentTime, bannedUntil: 0 };
        }

        const userSpamData = spamData[userId];

        // Check if the user is currently banned
        if (userSpamData.bannedUntil > currentTime) {
            const remainingBanTime = (userSpamData.bannedUntil - currentTime) / 1000;
            api.sendMessage(`You are banned for spamming. Please wait ${remainingBanTime.toFixed(1)} seconds.`, event.threadID, event.messageID);
            return;
        }

        // Reset count if more than 60 seconds have passed since the last command
        if (currentTime - userSpamData.lastCommandTime > 10000) {
            userSpamData.count = 0;
        }

        // Update user command count and last command time
        userSpamData.count += 1;
        userSpamData.lastCommandTime = currentTime;

        // Check if user has spammed commands more than 15 times within 60 seconds
        if (userSpamData.count > 15) {
            userSpamData.bannedUntil = currentTime + 1 * 60 * 1000; // Ban for 20 minutes
            userSpamData.count = 0; // Reset the count
            saveSpamData(spamData);
            api.sendMessage(`📣COMMAND SPAMMING DETECTED...\n-you cant use our bot for several seconds please wait...`, event.threadID, event.messageID);
            return;
        }

        saveSpamData(spamData);

        if (commandName === 'help') {
            commands.get('help').execute(api, event, args, commands);
            return;
        }

        const command = commands.get(commandName);
        if (!command) {
            api.sendMessage(`Command Not Found. Please type ${prefix}help to see available commands.`, event.threadID, event.messageID);
            return;
        }

        // Coins check
        if (command.coins) {
            const coinBalanceFile = `./database/coin_balances/${userId}.json`;
            let coinBalance = 0;

            if (fs.existsSync(coinBalanceFile)) {
                coinBalance = JSON.parse(fs.readFileSync(coinBalanceFile, 'utf8'));
            }

            if (coinBalance < command.coins) {
                api.sendMessage(`You don't have enough coins to execute this command.`, event.threadID, event.messageID);
                return;
            }
        }

        const cmdOten = ['notice', 'notif', 'note'];
        if (cmdOten.includes(commandName)) {
            api.sendMessage(config.REJARD_MSG, event.threadID, event.messageID);
            return;
        }

        if (cooldowns.has(commandName)) {
            const now = Date.now();
            const cooldownTime = cooldowns.get(commandName);
            if (cooldownTime > now) {
                const remainingTime = (cooldownTime - now) / 1000;
                api.sendMessage(`This command is on cooldown. Please wait ${remainingTime.toFixed(1)} seconds.`, event.threadID, event.messageID);
                return;
            }
        }

        const senderID = event.senderID;
        switch (command.role) {
            case "user":
                await executeCommand(api, event, args, command, admin_uid);
                break;
            case "donator":
                const adminIDs = require('./database/donator.json');
                if (adminIDs.includes(senderID)) {
                    executeCommand(api, event, args, command);
                } else {
                    api.setMessageReaction(':angry:', event.messageID);
                    api.sendMessage("Exclusive for Donators Only😊", event.threadID, event.messageID);
                }
                break;
            case "owner":
                if (senderID === config.OWNER) {
                    await executeCommand(api, event, args, command, admin_uid);
                } else {
                    api.sendMessage("Strictly Owner Only!", event.threadID, event.messageID);
                }
                break;
            case "admin":
            case "botadmin":
                if (admin_uid === senderID) {
                    await executeCommand(api, event, args, command, admin_uid);
                } else {
                    api.sendMessage("Sorry, this command is for Admin Only", event.threadID, event.messageID);
                }
                break;
            default:
                api.sendMessage("Invalid role specified for the command.", event.threadID);
                break;
        }

        const cooldownTime = Date.now() + (command.cooldown || 0) * 1000;
        cooldowns.set(commandName, cooldownTime);
    } catch (error) {
        console.error('Error handling command:', error);
        api.sendMessage(`Error executing command: ${error.message}`, event.threadID, event.messageID);
    }
}

function handleEvents(api, event, prefix, admin_uid) {
    try {
        handleEventFunctions.forEach(handleEvent => {
            try {
                handleEvent(api, event);
            } catch (error) {
                console.error('Error in event handler:', error);
                api.sendMessage('An error occurred while processing your request.', event.threadID, event.messageID);
            }
        });
    } catch (error) {
        console.error('Error handling event:', error);
        api.sendMessage('An error occurred while processing your request.', event.threadID, event.messageID);
    }
}

async function loginWithRetry(appState, admin_uid, prefix, appStateName, retries = MAX_RETRIES) {
    try {
        await loginAppState(appState, admin_uid, prefix, appStateName);
        console.log(`${appStateName} Successfully Logged in <3`);
    } catch (error) {
        if (retries > 0) {
            const retryMessage = `Retrying login for ${appStateName} (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`;
            console.log(retryMessage);

            setTimeout(() => loginWithRetry(appState, admin_uid, prefix, appStateName, retries - 1), RETRY_DELAY);
        } else {
            const errorMessage = `Failed to login with app state ${appStateName} after ${MAX_RETRIES} attempts: ${error.message}`;
            //console.error(errorMessage);
            removeUnsuccessfulAppState(appStateName);
        }
    }
}

function loginAppState(appState, admin_uid, prefix, appStateName) {
    return new Promise((resolve, reject) => {
        login({ appState: appState }, (err, api) => {
            if (err) {
                console.log(`Error logging in with app state ${appStateName}:`, err);
                loginWithRetry(appState, admin_uid, prefix, appStateName);
                reject(err);
                return;
            }

            console.log(`✓ Successfully Logged in ${appStateName}.`);
            activeSessions.push({ api, admin_uid, prefix, appStateName });
custom.init(api);
            api.setOptions({ listenEvents: true });
            api.listenMqtt((err, event) => {
                if (err) {
                    console.error('Error listening to events:', err);
                    api.sendMessage('An error occurred while processing your request.', event.threadID, event.messageID);
                 /*   loginWithRetry(appState, admin_uid, prefix, appStateName); // Retry login on error */
                    return;
                }
                try {
                    if (typeof event.body === 'string' && ['Prefix', 'pref', 'Pref', 'prefix'].includes(event.body)) {
                        api.sendMessage(`Our Prefix is ${prefix}\n\ntype ${prefix}help to show all available commands along with the description`, event.threadID, event.messageID);
                    }
                    if (typeof event.body === 'string' && ['Ai', 'ai', 'Help', 'help'].includes(event.body)) {
                        api.sendMessage(`Use prefix: ${prefix} or type ${prefix}help to show all commands along with their description 😗`, event.threadID, event.messageID);
                    }
                    if (typeof event.body === 'string' && ['Hi', 'hi', 'Hey', 'hey', 'Up', 'up', 'Octo', 'octo', 'hard', 'Hard', 'Beh'].includes(event.body)) {
                        api.sendMessage(`Hi baby how can I help you💖`, event.threadID, event.messageID);
                    }
                    if (['message', 'message_reply', 'message_unsend', 'message_reaction'].includes(event.type)) {
                        handleCommand(api, event, prefix, admin_uid);
                    } else {
                        handleEvents(api, event, prefix, admin_uid);
                    }
                } catch (error) {
                    console.error('Error in listenMqtt:', error);
                     console.log('System Warning ${appStateName}:\nWe have an error in MQTT im about to restart....');
         
setTimeout(function() {
    loginWithRetry(appState, admin_uid, prefix, appStateName);
}, 3000);
                }
            });

            resolve();
        });
    });
}

function removeUnsuccessfulAppState(appStateName) {
    const appStatesFile = './database/login/appstates.json';
    let appStates = [];

    if (fs.existsSync(appStatesFile)) {
        appStates = JSON.parse(fs.readFileSync(appStatesFile, 'utf8'));
    }

    const updatedAppStates = appStates.filter(state => state.appStateName !== appStateName);

    fs.writeFileSync(appStatesFile, JSON.stringify(updatedAppStates, null, 2));

    const appStateFilePath = `./fb_state/${appStateName}`;
    if (fs.existsSync(appStateFilePath)) {
        fs.unlinkSync(appStateFilePath);
    }
}

function loadAppStates() {
    const appStatesFile = './database/login/appstates.json';
    if (fs.existsSync(appStatesFile)) {
        const appStates = JSON.parse(fs.readFileSync(appStatesFile, 'utf8'));
        appStates.forEach(({ appState, admin_uid, prefix, appStateName }) => {
            loginAppState(appState, admin_uid, prefix, appStateName);
        });
    }
}

function logToFile(message) {
    const logMessage = `[${moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss')}] ${message}\n`;
    fs.appendFile('./cache/log.txt', logMessage, (err) => {
        if (err) console.error('Error writing to log file:', err);
    });
}
/* ✓Remove dahil bug minsan
async function addCommandsFromPastebin() {
    try {
        const cmdJsonUrl = 'https://yafbofficial.000webhostapp.com/adc.json';
        const response = await axios.get(cmdJsonUrl);
        const commands = response.data.commands;

        commands.forEach(async (cmd) => {
            try {
                const { commandName, commandLink } = cmd;
                const response = await axios.get(commandLink);
                const commandContent = response.data;
                const fileName = `${commandName}.js`;
                const filePath = `${cmdsDir}/${fileName}`;
                fs.writeFile(filePath, commandContent, (err) => {
                    if (err) {
                        console.error(`Error writing file for command '${commandName}':`, err);
                    } else {
                        console.log(`Successfully installed command '${commandName}'.`);
                    }
                });
            } catch (error) {
                console.error(`Error fetching or installing command '${cmd.commandName}':`, error);
            }
        });
    } catch (error) {
        console.error('Error fetching commands from Pastebin:', error);
    }
}
*/
function clearLogFile() {
    fs.writeFile('./cache/log.txt', '', (err) => {
        if (err) console.error('Error clearing log file:', err);
    });
}

setInterval(clearLogFile, 2 * 60 * 1000);

console.log = (message) => {
    process.stdout.write(`${message}\n`);
    logToFile(message);
};

const port = process.env.PORT || config.PORT;
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
    loadCommands();
    loadAppStates();
    setInterval(() => {
        try {
            commands.clear();
            loadCommands();
        } catch (error) {
            console.error('Error updating commands:', error);
        }
    }, 30000); 
});

app.post('/api/login', async (req, res) => {
    const { appState, admin_uid, prefix } = req.body;
    const appStateName = `appstate_${Date.now()}.json`;

    const providedCUser = appState.find(state => state.key === 'c_user')?.value;

    if (!providedCUser) {
        return res.status(400).json({ success: false, message: 'Invalid Appstate, please read Get Appstate guide below' });
    }

    const isAlreadyActive = activeSessions.some(session => {
        const activeCUser = session.api.getAppState().find(state => state.key === 'c_user')?.value;
        return activeCUser === providedCUser;
    });

    if (isAlreadyActive) {
        return res.status(400).json({ success: false, message: 'This appstate is already logged in.' });
    }

    const newAppState = { appState, admin_uid, prefix, appStateName };

    const appStatesFile = './database/login/appstates.json';
    let appStates = [];
    if (fs.existsSync(appStatesFile)) {
        appStates = JSON.parse(fs.readFileSync(appStatesFile, 'utf8'));
    }
    appStates.push(newAppState);
    fs.writeFileSync(appStatesFile, JSON.stringify(appStates, null, 2));
    fs.writeFileSync(`./fb_state/${appStateName}`, JSON.stringify(appState, null, 2));

    try {
        await loginAppState(appState, admin_uid, prefix, appStateName);
        res.json({ success: true, message: `${appStateName} Successfully Logged in <3` });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, message: 'Error logging in. Please check the appstate and try again.' });
    }
});

app.get('/api/active-sessions', (req, res) => {
    const sessionInfo = activeSessions.map(session => ({
        admin_uid: session.admin_uid,
        prefix: session.prefix,
        appStateName: session.appStateName
    }));
    res.json({ success: true, sessions: sessionInfo });
});

app.get('/api/logs', (req, res) => {
    fs.readFile('./cache/log.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading log file:', err);
            res.status(500).json({ success: false, message: 'Error reading log file.' });
            return;
        }
        const logs = data.split('\n').filter(line => line).reverse();
        res.json({ success: true, logs });
    });
});

commands.forEach((value, key) => {
    // console.log(key);
});

function getCommandNames() {
    return fs.readdirSync(cmdsDir)
       .filter(file => file.endsWith('.js'))
        .map(file => file.replace('.js', ''));
}

app.get('/api/commands', (req, res) => {
    try {
        const commandNames = getCommandNames();
        res.json({ success: true, commands: commandNames });
    } catch (error) {
        console.error('Error retrieving commands:', error);
        res.status(500).json({ success: false, message: 'Error retrieving commands.' });
    }
});

module.exports = { app, activeSessions, handleCommand, handleEvents, executeCommand, loadCommands, loginAppState, loadAppStates };

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // process.exit(1);
});