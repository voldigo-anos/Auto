const axios = require('axios');

module.exports.config = {
	name: "baby",
	version: "1.0.0",
	credits: "dipto",//converted by cliff
	role: 0,
  hasPermision: 0,
	description: "Chat with bot",
	hasPrefix: false,
  usePrefix: false,
  commandCategory: "BabySim",
	usages: "{pn}[anyMessage] teach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR remove [YourMessage] OR remove [YourMessage] - [indexNumber] or msg or list OR edit [YourMessage] - [NewReply]",
  usage: "{pn}[anyMessage] teach [YourMessage] - [Reply1], [Reply2], [Reply3]... OR remove [YourMessage] OR remove [YourMessage] - [indexNumber] or msg or list OR edit [YourMessage] - [NewReply]",
	cooldown: 5,
  cooldowns: 5,
	aliases: ["baby", "bbe", "babe"],
};

module.exports.run = async function ({ api, event, args }) {
	const dipto = args.join(" ").toLowerCase();
	const uid = event.senderID;
	let command;
	let comd;
	let final;
	try {
		if (!args[0]) {
			const ran = ["Bolo baby", "hum", "type help baby"];
			const r = ran[Math.floor(Math.random() * ran.length)];
			return api.sendMessage(r, event.threadID, event.messageID);
		} else if (args[0] === 'remove') {
			const fina = dipto.replace("remove ", "");
			const respons = await axios.get(`https://noobs-api.onrender.com/dipto/baby?remove=${fina}`);
			const dat = respons.data.message;
			api.sendMessage(`${dat}`, event.threadID, event.messageID);
		} else if (args[0] === 'rm' && dipto.includes('-')) {
			const fina = dipto.replace("rm ", "");
			const fi = fina.split(' - ')[0]
			const f = fina.split(' - ')[1]
			const respons = await axios.get(`https://noobs-api.onrender.com/dipto/baby?remove=${fi}&index=${f}`);
			const da = respons.data.message;
			api.sendMessage(`${da}`, event.threadID, event.messageID);
		} else if (args[0] === 'list') {
			const respo = await axios.get(`https://noobs-api.onrender.com/dipto/baby?list=all`);
			const d = respo.data.length;
			api.sendMessage(`Total Teach ${d}`, event.threadID, event.messageID);
		} else if (args[0] === 'msg' || args[0] === 'message') {
			const fuk = dipto.replace("msg ", "");
			const respo = await axios.get(`https://noobs-api.onrender.com/dipto/baby?list=${fuk}`);
			const d = respo.data.data;
			api.sendMessage(`Message ${fuk} = ${d}`, event.threadID, event.messageID);
		} else if (args[0] === 'edit') {
			command = dipto.split(' - ')[1];
			if (command.length < 2) {
				return api.sendMessage('❌ | Invalid format! Use edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
			}
			const res = await axios.get(`https://noobs-api.onrender.com/dipto/baby?edit=${args[1]}&replace=${command}`);
			const dA = res.data.message;
			api.sendMessage(`changed ${dA}`, event.threadID, event.messageID);
		} else if (args[0] === 'teach' && args[1] !== 'amar') {
			command = dipto.split(' - ')[1];
			comd = dipto.split(' - ')[0];
			final = comd.replace("teach ", "");
			if (command.length < 2) {
				return api.sendMessage('❌ | Invalid format! Use [YourMessage] - [Reply1], [Reply2], [Reply3]... OR remove [YourMessage] OR list OR edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
			}
			const re = await axios.get(`https://noobs-api.onrender.com/dipto/baby?teach=${final}&reply=${command}`);
			const tex = re.data.message;
			api.sendMessage(`✅ Replies added ${tex}`, event.threadID, event.messageID);
		} else if (args[0] === 'teach' && args[1] === 'amar') {
			command = dipto.split(' - ')[1];
			comd = dipto.split(' - ')[0];
			final = comd.replace("teach ", "");
			if (command.length < 2) {
				return api.sendMessage('❌ | Invalid format! Use [YourMessage] - [Reply1], [Reply2], [Reply3]... OR remove [YourMessage] OR list OR edit [YourMessage] - [NewReply]', event.threadID, event.messageID);
			}
			const re = await axios.get(`https://noobs-api.onrender.com/dipto/baby?teach=${final}&senderID=${uid}&reply=${command}`);
			const tex = re.data.message;
			api.sendMessage(`✅ Replies added ${tex}`, event.threadID, event.messageID);
		} else if (dipto.includes('amar name ki') || dipto.includes('amr nam ki') || dipto.includes('amar nam ki') || dipto.includes('amr name ki')) {
			const response = await axios.get(`https://noobs-api.onrender.com/dipto/baby?text=amar name ki&senderID=${uid}`);
			const data = response.data.reply;
			api.sendMessage(`${data}`, event.threadID, event.messageID);
		} else {
			const response = await axios.get(`https://noobs-api.onrender.com/dipto/baby?text=${dipto}`);
			const data = response.data.reply;
			api.sendMessage(`${data}`, event.threadID, event.messageID);
		}
	} catch (e) {
		console.log(e)
		api.sendMessage("Check console for error ", event.threadID, event.messageID);
	}
        }
