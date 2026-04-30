const { cmd } = require("../command");
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
        const query = q;
        if (!query) return reply("❌ Please provide a song name!\nEx: .song Alone Alan Walker");

        // Search Reaction
        await conn.sendMessage(from, { react: { text: "🔎", key: mek.key } });

        const search = await yts(query);
        if (!search.videos.length) return reply("❌ No results found.");

        const vid = search.videos[0];
        const MY_CHANNEL = "120363424268743982@newsletter"; // Aapka channel JID

        // Preview Message with Channel Context
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `╭━━〔 🎵 𝗠𝗨𝗦𝗜𝗖 𝗙𝗢𝗨𝗡𝗗 〕━━━╮
┃ 🎧 *Title* : ${vid.title}
┃ ⏱️ *Duration* : ${vid.timestamp}
┃ 👁️ *Views* : ${vid.views}
┃ 🔗 *Link* : ${vid.url}
╰━━━━━━━━━━━━━━━━━╯

⏳ *Downloading audio...*`,
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

        // API download
        let api = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(vid.url)}`;
        let { data } = await axios.get(api);

        if (!data?.status) return reply("❌ API error! Try again later.");

        // Sending Audio File
        await conn.sendMessage(from, {
            audio: { url: data.audio },
            mimetype: "audio/mpeg",
            ptt: false,
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
        console.error(err);
        reply("❌ Download failed: " + err.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
