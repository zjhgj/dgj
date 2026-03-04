const { cmd } = require("../command");
const axios = require("axios");
const converter = require('../data/converter'); // Path check kar lein (data/ ya lib/)

/**
 * Timezone & Azan URL Handler
 */
function getAzanUrl() {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const wibHours = (utcHours + 7) % 24; // WIB Logic

    if (wibHours >= 3 && wibHours <= 5) {
        return "https://api.autoresbot.com/mp3/azan-subuh.m4a";
    } else {
        return "https://api.autoresbot.com/mp3/azan-umum.m4a";
    }
}

cmd({
    pattern: "azan",
    alias: ["adzan", "namaz"],
    react: "🕋",
    desc: "Play Azan audio as a Voice Note.",
    category: "islamic",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        // Step 1: React with Clock
        await conn.sendMessage(from, { 
            react: { text: "⏰", key: m.key } 
        });

        // Step 2: Audio URL fetch karein
        const audioUrl = getAzanUrl();
        
        // Step 3: Audio ko Buffer mein download karein (Converter ke liye)
        const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'utf-8');

        // Step 4: Converter use karke PTT (Ogg/Opus) mein badlein
        // Isse audio 'Voice Note' ki tarah dikhega
        const pttAudio = await converter.toPTT(buffer, 'm4a');

        // Step 5: Send Voice Note using KAMRAN-MD Socket
        await conn.sendMessage(from, {
            audio: pttAudio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: m }); // Fix: mek ko m se replace kiya

        await conn.sendMessage(from, { 
            react: { text: "✅", key: m.key } 
        });

    } catch (e) {
        console.error("KAMRAN-MD Azan/PTT Error:", e);
        await conn.sendMessage(from, { 
            react: { text: "⛔", key: m.key } 
        });
        reply("❌ *KAMRAN-MD Error:* Audio conversion failed.");
    }
});
