const fs = require('fs');

const path = require('path');

const axios = require('axios');

const vouchersUrl = 'https://pastebin.com/raw/GaUWAukN';

const claimedVouchersPath = path.join(__dirname, '../database/claimed_vouchers.json');

const coinBalancesPath = path.join(__dirname, '../database/coin_balances');

function loadClaimedVouchers() {

    if (fs.existsSync(claimedVouchersPath)) {

        return JSON.parse(fs.readFileSync(claimedVouchersPath, 'utf8'));

    }

    return {};

}

function saveClaimedVouchers(claimedVouchers) {

    fs.writeFileSync(claimedVouchersPath, JSON.stringify(claimedVouchers, null, 2));

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

    name: 'voucher',

    description: 'Claim a voucher for coins. Visit leechshares for coins.',

    role: 'user',

    cooldown: 0,

    credits: 'YAFB',

    execute: async (api, event, args) => {

        const userId = event.senderID;

        const voucherCode = args[0];

        if (!voucherCode) {

            api.sendMessage('Please provide a voucher code.', event.threadID, event.messageID);

            return;

        }

        try {

            const response = await axios.get(vouchersUrl);

            const vouchers = response.data;

            const claimedVouchers = loadClaimedVouchers();

            if (claimedVouchers[voucherCode] && claimedVouchers[voucherCode].includes(userId)) {

                api.sendMessage('You have already claimed this voucher.', event.threadID, event.messageID);

                return;

            }

            if (!vouchers[voucherCode]) {

                api.sendMessage('Invalid voucher code.', event.threadID, event.messageID);

                return;

            }

            const voucherAmount = vouchers[voucherCode];

            let coinBalance = loadCoinBalance(userId);

            coinBalance += voucherAmount;

            saveCoinBalance(userId, coinBalance);

            if (!claimedVouchers[voucherCode]) {

                claimedVouchers[voucherCode] = [];

            }

            claimedVouchers[voucherCode].push(userId);

            saveClaimedVouchers(claimedVouchers);

            api.sendMessage(`Voucher claimed successfully! You have received ${voucherAmount} coins.`, event.threadID, event.messageID);

        } catch (error) {

            console.error('Error fetching vouchers:', error);

            api.sendMessage('There was an error claiming the voucher. Please try again later.', event.threadID, event.messageID);

        }

    }

};