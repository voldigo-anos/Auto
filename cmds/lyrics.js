const axios = require('axios');

module.exports = {
    description: "Lyrics Finder",
    role: "user", // user, botadmin, or admin
    cooldown: 5,
    coins: 5,
    credits: "Grey, Converted by CJ Villavito",
    execute(api, event, args, commands) {
        const song = args.join(' ');

        if (!song) {
            return api.sendMessage('Please enter a song.', event.threadID, event.messageID);
        } else {
            const apiUrl = `https://markdevs-last-api-cvxr.onrender.com/search/lyrics?q=${encodeURIComponent(song)}`;
            
            axios.get(apiUrl)
                .then(res => {
                    const { lyrics, title, artist } = res.data.result;

                    if (lyrics && title && artist) {
                        const message = `Title: ${title}\n\nArtist: ${artist}\n\nLyrics: ${lyrics}`;
                        api.sendMessage(message, event.threadID, event.messageID);
                    } else {
                        api.sendMessage('Sorry, the lyrics could not be found.', event.threadID, event.messageID);
                    }
                })
                .catch(error => {
                    console.error('Lyrics API error:', error);
                    api.sendMessage('Failed to fetch lyrics.', event.threadID, event.messageID);
                });
        }
    }
};