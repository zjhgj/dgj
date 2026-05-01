const { cmd } = require('../command');

cmd({
    pattern: "jidtolink",
    alias: ["channelink", "getlink"],
    desc: "Get Channel link from JID",
    category: "tools",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.endsWith('@newsletter')) {
            return reply("❌ Please provide a valid JID.\nExample: `.jidtolink 120363418144382782@newsletter` ");
        }

        await conn.sendMessage(from, { react: { text: "🔎", key: mek.key } });

        // Sabse stable method: newsletterMetadata
        let res;
        try {
            res = await conn.newsletterMetadata("jid", q);
        } catch (err) {
            console.error("Metadata fetch failed:", err);
            res = null;
        }

        // Agar metadata nahi milti toh iska matlab hai bot account follow nahi kar raha
        if (!res || !res.invite) {
            return reply("❌ *Server Issue:* WhatsApp ne invite code nahi diya.\n\n*Fix:* Pehle bot account se is channel ko manually 'Follow' karein, phir ye command dein.");
        }

        const channelLink = `https://whatsapp.com/channel/${res.invite}`;
        const name = res.name || "WhatsApp Channel";
        
        let msg = `✅ *LINK GENERATED SUCCESS*\n\n`;
        msg += `📢 *Name:* ${name}\n`;
        msg += `🔗 *Link:* ${channelLink}\n\n`;
        msg += `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ*`;

        await conn.sendMessage(from, { 
            text: msg,
            contextInfo: {
                externalAdReply: {
                    title: name,
                    body: "Join Now",
                    mediaType: 1,
                    sourceUrl: channelLink,
                    thumbnailUrl: res.preview || "https://i.imgur.com/vHdfS5m.png",
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ Error: " + e.message);
    }
});
