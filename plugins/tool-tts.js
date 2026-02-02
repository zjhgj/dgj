const converter = require('../data/converter');
const axios = require('axios');
const { cmd } = require('../command');
const googleTTS = require('google-tts-api');

cmd({
    pattern: "tts",
    desc: "Text to Voice",
    category: "audio",
    react: "🎤",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Need some text.");

        // Step 1: Get TTS URL
        const url = googleTTS.getAudioUrl(q, {
            lang: 'hi',
            slow: false,
            host: 'https://translate.google.com',
        });

        // Step 2: Download audio as buffer
        const { data } = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        // Step 3: Convert to WhatsApp PTT (opus)
        const ptt = await converter.toPTT(Buffer.from(data), 'mp3');

        // Step 4: Send as voice note
        await conn.sendMessage(from, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

    } catch (e) {
        reply(String(e));
    }
});
