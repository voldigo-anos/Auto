const fs = require('fs');
const path = require('path');

// Path to the config file
const configFilePath = path.join(__dirname, '../config.json');

// Function to load config data from file
function loadConfig() {
    try {
        const configData = fs.readFileSync(configFilePath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error loading config file:', error);
        return {};
    }
}

// Function to save config data to file
function saveConfig(config) {
    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
        console.log('Config file updated successfully.');
    } catch (error) {
        console.error('Error saving config file:', error);
    }
}

module.exports = {
    name: 'ownerupdate',
    description: 'Update bot configuration',
    cooldown: 3,
    role: 'owner',
    execute(api, event, args) {
        // Check if command has required arguments
        if (args.length < 2) {
            api.sendMessage('Invalid command format. Use `owner <key> <value>`.', event.threadID);
            return;
        }

        // Load current config data
        let config = loadConfig();

        // Extract key and value from arguments
        const key = args[0].toUpperCase();
        const value = args.slice(1).join(' ');

        // Check if the key exists in the config
        if (!config.hasOwnProperty(key)) {
            api.sendMessage(`Invalid key "${key}".`, event.threadID);
            return;
        }

        // Update the config with the new value
        config[key] = value;

        // Save updated config
        saveConfig(config);

        // Inform user about successful update
        api.sendMessage(`Successfully updated ${key} in config to "${value}".`, event.threadID);
    }
};