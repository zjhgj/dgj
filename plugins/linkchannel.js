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
        // Agar user ne JID nahi di
        if (!q) return reply("❌ Please provide a Channel JID.\nExample: .jidtolink 120363294025000000@newsletter");

        // JID se sirf numbers nikalne ke liye (agar @newsletter saath ho)
        let jid = q.split("@")[0];

        // WhatsApp Channel ka direct link format
        // Note: Newsletter JID se link banane ke liye ye format use hota hai
        const channelLink = `https://whatsapp.com/channel/${jid}`;

        let text = `✅ *CHANNEL LINK GENERATED*\n\n`;
        text += `🆔 *JID:* ${q}\n`;
        text += `🔗 *Link:* ${channelLink}\n\n`;
        text += `> *⚡ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ ⚡*`;

        await conn.sendMessage(from, { 
            text: text,
            contextInfo: {
                externalAdReply: {
                    title: "KAMRAN-MD CHANNEL TOOL",
                    body: "Click to open channel",
                    mediaType: 1,
                    sourceUrl: channelLink,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ Invalid JID or Error occurred.");
    }
});
  
