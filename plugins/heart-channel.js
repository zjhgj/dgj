const { cmd } = require("../command");
const axios = require("axios");

/**
 * KAMRAN-MD YTMP3 Engine
 */
async function Ytmp3(url) {
    try {
        const oembed = await axios.get("https://www.youtube.com/oembed", {
            params: { url: url, format: "json" },
            headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" }
        });

        const convert = await axios.post("https://hub.ytconvert.org/api/download", {
            url: url,
            os: "android",
            output: { type: "audio", format: "mp3" },
            audio: { bitrate: "128k" }
        }, { headers: { "Accept": "application/json", "Content-Type": "application/json" } });

        const statusUrl = convert.data.statusUrl;
        let result;

        // Status polling logic
        for (let i = 0; i < 15; i++) { // Max 30 seconds limit
            const status = await axios.get(statusUrl, { headers: { "Accept": "application/json" } });
            if (status.data.status === "completed") {
                result = status.data;
                break;
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        if (!result) throw new Error("Conversion timed out.");
        return { title: result.title || oembed.data.title, duration: result.duration, download: result.downloadUrl };
    } catch (err) {
        throw err;
    }
}

cmd({
    pattern: "mp3",
    alias: ["yta", "ytmp3"],
    react: "🎵",
    desc: "Download YouTube Audio (MP3).",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    if (!q) return reply(`❓ *Example:* ${prefix + command} https://youtube.com/watch?v=xxxx`);
    
    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
    reply("🚀 *KAMRAN-MD:* Processing MP3 conversion...");

    try {
        const data = await Ytmp3(q);
        
        await conn.sendMessage(from, {
            audio: { url: data.download },
            mimetype: "audio/mpeg",
            ptt: false, // Set true if you want it as a voice note
            caption: `🎵 *${data.title}*\n\n> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`
        }, { quoted: m });

        await conn.sendMessage(from, { react: { text: "✅", key: m.key } });
    } catch (e) {
        console.error(e);
        reply("❌ *Error:* Failed to download audio. Try again later.");
    }
});
            
