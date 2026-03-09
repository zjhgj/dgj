const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");

// --- Helper Functions ---

function normalizeYouTubeUrl(url) {
    const match = url.match(/(?:youtu.be\/|youtube.com\/shorts\/|youtube.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
    return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

/**
 * Fetch Audio Link (Koyeb API)
 */
async function fetchAudioData(url) {
    try {
        const apiUrl = `https://api.skyzopedia.web.id/download/ytdl-mp3?apikey=skyy&url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);
        return data.status && data.data ? data.data.url : null;
    } catch (e) { return null; }
}

// --- MAIN AUDIO COMMAND ---

cmd({
    pattern: "song",
    alias: ["play", "audio", "music"],
    react: "🎧",
    desc: "Download YouTube Audio (MP3).",
    category: "download",
    filename: __filename,
},
async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply(`*❓ Usage:* \`${prefix}song <name / link>\`\n\n*Example:* \`${prefix}song Tera Chehra\``);

        // Searching Reaction
        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // Step 1: Search Video
        let ytdata;
        const checkUrl = normalizeYouTubeUrl(q);

        if (checkUrl) {
            const videoId = checkUrl.split('v=')[1];
            ytdata = await yts({ videoId });
        } else {
            const search = await yts(q);
            if (!search.videos.length) return reply("❌ *No results found for your query!*");
            ytdata = search.videos[0];
        }

        // --- Stylish Caption ---
        const caption = `
╭━━━━━━━〔 𝐘𝐓 𝐏𝐋𝐀𝐘𝐄𝐑 〕━━━━━━━┈⊷
┃
┃ 🎵 *𝗧𝗶𝘁𝗹𝗲:* ${ytdata.title}
┃ 🕒 *𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻:* ${ytdata.timestamp}
┃ 👤 *𝗖𝗵𝗮𝗻𝗻𝗲𝗹:* ${ytdata.author.name}
┃ 👁️ *𝗩𝗶𝗲𝘄𝘀:* ${ytdata.views.toLocaleString()}
┃ 🗓️ *𝗨𝗽𝗹𝗼𝗮𝗱𝗲𝗱:* ${ytdata.ago}
┃ 🔗 *𝗟𝗶𝗻𝗸:* ${ytdata.url}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━┈⊷
⚡ *Preparing your audio, please wait...*

> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`;

        // Send Thumbnail with Caption
        await conn.sendMessage(from, { 
            image: { url: ytdata.thumbnail || ytdata.image }, 
            caption: caption 
        }, { quoted: mek });

        // Step 2: Fetch Audio Data
        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
        const audioUrl = await fetchAudioData(ytdata.url);

        if (!audioUrl) {
            return reply("❌ *Download Failed:* API server is not responding. Try again later.");
        }

        // Step 3: Send Audio File
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${ytdata.title}.mp3`,
            ptt: false
        }, { quoted: mek });

        // Final Success Reaction
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("⚠️ *Critical Error:* Gagal memproses permintaan audio.");
    }
});
