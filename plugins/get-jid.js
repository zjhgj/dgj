const { cmd } = require('../command');

cmd({
    pattern: "jid",
    alias: ["chatid", "gjid", "mylid"],  
    desc: "Get full JID and LID of current chat/user (Creator Only)",
    react: "🆔",
    category: "utility",
    filename: __filename,
}, async (conn, mek, m, { 
    from, isGroup, isCreator, reply, sender 
}) => {
    try {
        if (!isCreator) {
            return reply("❌ *Command Restricted* - Only my creator can use this.");
        }

        // Newsletter Context for professional branding
        const newsletterContext = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363418144382782@newsletter',
                newsletterName: 'KAMRAN-MD',
                serverMessageId: 143
            }
        };

        let responseText = "";

        if (isGroup) {
            const groupJID = from.includes('@g.us') ? from : `${from}@g.us`;
            responseText = `╭──〔 *🏠 GROUP JID* 〕\n├─ 🆔: \`${groupJID}\`\n╰───────────────────🚀`;
        } else {
            const userJID = sender.includes('@s.whatsapp.net') ? sender : `${sender}@s.whatsapp.net`;
            const userLID = m.userLid || (conn.user && conn.user.lid) || "Not Detected";
            
            responseText = `╭──〔 *👤 USER DETAILS* 〕\n├─ 🆔 JID: \`${userJID}\`\n├─ 🆔 LID: \`${userLID}\`\n╰───────────────────🚀`;
        }

        await conn.sendMessage(from, { 
            text: responseText,
            contextInfo: newsletterContext
        }, { quoted: mek });

    } catch (e) {
        console.error("JID Error:", e);
        reply(`⚠️ Error fetching JID:\n${e.message}`);
    }
});
