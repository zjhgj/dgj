const { cmd } = require('../command');

cmd({
    pattern: "jidtolink",
    alias: ["channelink", "getlink"],
    desc: "Convert Channel JID to Link",
    category: "tools",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.endsWith('@newsletter')) {
            return reply("❌ Please provide a valid Channel JID.\nExample: `.jidtolink 120363424268743982@newsletter` ");
        }

        // Search reaction
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        // Direct Metadata Fetch
        const data = await conn.newsletterMetadata("jid", q).catch(e => {
            console.error("Metadata Error:", e);
            return null;
        });

        if (!data || !data.invite) {
            return reply("❌ *Server Issue:* WhatsApp ne is JID ka invite code nahi diya.\n\n*Wajah:* Shayad channel private hai ya bot ko permission nahi hai.");
        }

        const channelLink = `https://whatsapp.com/channel/${data.invite}`;
        const channelName = data.name || "WhatsApp Channel";

        let text = `✅ *CHANNEL LINK EXTRACTED*\n\n`;
        text += `📝 *Name:* ${channelName}\n`;
        text += `🆔 *JID:* ${q}\n`;
        text += `🔗 *Link:* ${channelLink}\n\n`;
        text += `> *⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ ⚡*`;

        await conn.sendMessage(from, { 
            text: text,
            contextInfo: {
                externalAdReply: {
                    title: channelName,
                    body: "Click to Join This Channel",
                    mediaType: 1,
                    sourceUrl: channelLink,
                    thumbnailUrl: data.preview || "https://i.imgur.com/vHdfS5m.png", // Default image if preview fails
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ *Error:* Kuch technical masala hai. Check karein bot sahi se connected hai ya nahi.");
    }
});
