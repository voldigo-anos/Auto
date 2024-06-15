const axios = require('axios');
const fs = require('fs');

const url = "https://gpt4withcustommodel.onrender.com/";

module.exports = {
  description: "Generate image in emi",
  role: "user",
  credits: 'deku | AkhiroDEV',
  cooldown: 8,
  execute(api, event, args) {
    function r(msg) {
      api.sendMessage(msg, event.threadID, event.messageID);
    }
    
    if (args.length === 0) {
      return r('Missing prompt!');
    }

    const prompt = args.join(" ");
    if (!prompt) {
      return r('Missing prompt!');
    }

    axios.get(`${url}imagine?prompt=${encodeURIComponent(prompt)}`, { responseType: 'arraybuffer' })
      .then(response => {
        const buffer = Buffer.from(response.data, "utf8");
        const path = 'cache/emi.png';

        fs.writeFileSync(path, buffer);

        api.sendMessage({
          attachment: fs.createReadStream(path)
        }, event.threadID, (error, info) => {
          if (error) {
            console.error('Error sending message:', error);
          }
          fs.unlinkSync(path);
        }, event.messageID);
      })
      .catch(error => {
        r(error.message);
      });
  }
};