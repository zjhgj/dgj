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

        // Force Metadata fetch with invite check
        let res = await conn.newsletterMetadata("jid", q).catch(() => null);

        // Agar metadata khali hai, toh Newsletter Query try karein
        if (!res || !res.invite) {
            // Kuch bots mein direct fetch newsletter ka option hota hai
            res = await conn.getNewsletterInfoWithJid(q).catch(() => null);
        }

        if (!res || !res.invite) {
            return reply("❌ *Abhi bhi link nahi mil raha!*\n\n*Solution:* Bot account se ek baar is channel ko 'Follow' karein, ya phir channel ki settings mein ja kar usey 'Public' check karein.");
        }

        const channelLink = `https://whatsapp.com/channel/${res.invite}`;
        
        let msg = `✅ *LINK GENERATED SUCCESS*\n\n`;
        msg += `📢 *Name:* ${res.name || "KAMRAN-MD"}\n`;
        msg += `🔗 *Link:* ${channelLink}\n\n`;
        msg += `> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ*`;

        await conn.sendMessage(from, { 
            text: msg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: res.name || "WhatsApp Channel",
                    body: "Join Now",
                    mediaType: 1,
                    sourceUrl: channelLink,
                    thumbnailUrl: res.preview || "https://i.imgur.com/vHdfS5m.png",
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ Error: " + e.message);
    }
});
