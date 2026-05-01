const { cmd } = require("../command"); // 'Const' ko 'const' kar diya
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "song",
    alias: ["play", "ytmp3"],
    desc: "Download songs from YouTube.",
    category: "download",
    react: "🎧",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a song name!\nEx: .song Alone Alan Walker");

        // Search Reaction
        await conn.sendMessage(from, { react: { text: "🔎", key: mek.key } });

        const search = await yts(q);
        if (!search || !search.videos.length) return reply("❌ No results found.");

        const vid = search.videos[0];
        const MY_CHANNEL = "120363424268743982@newsletter";

        // Preview Message
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `╭━━〔 🎵 𝗠𝗨𝗦𝗜𝗖 𝗙𝗢𝗨𝗡𝗗 〕━━━╮\n┃ 🎧 *Title* : ${vid.title}\n┃ ⏱️ *Duration* : ${vid.timestamp}\n┃ 👁️ *Views* : ${vid.views}\n┃ 🔗 *Link* : ${vid.url}\n╰━━━━━━━━━━━━━━━━━╯\n\n⏳ *Downloading audio...*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: MY_CHANNEL,
                    newsletterName: "KAMRAN-MD", 
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // API Request with Error Handling
        let api = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(vid.url)}`;
        let response = await axios.get(api);
        let data = response.data;

        if (!data || !data.status || !data.audio) {
            return reply("❌ Failed to fetch audio link. Try again later.");
        }

        // Sending Audio File
        await conn.sendMessage(from, {
            audio: { url: data.audio },
            mimetype: "audio/mpeg",
            ptt: false, // Voice note banana hai to true kar dein
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: MY_CHANNEL,
                    newsletterName: "KAMRAN-MD",
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (err) {
        console.error("Error in song command:", err);
        reply("❌ Error: " + (err.response?.data?.message || err.message));
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

