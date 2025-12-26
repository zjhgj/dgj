const { cmd } = require('../command');

cmd({
    pattern: "end",
    alias: ["byeall", "kickall", "endgc"],
    desc: "Removes all members from the group except specified whitelist numbers",
    category: "owner",
    react: "⚠️",
    filename: __filename
},
async (conn, mek, m, {
    from, isGroup, reply, groupMetadata, isCreator, botNumber
}) => {
    try {
        if (!isGroup) return reply("❌ Yeh command sirf groups mein kaam karta hai.");
        if (!isCreator) return reply("❌ Sirf *Owner* hi is command ka use kar sakta hai.");

        // --- Updated Whitelist (Purane numbers hata diye gaye hain) ---
        const ignoreList = [
            "923195068309", // New whitelisted number 1
            "923147158309", // New whitelisted number 2
            botNumber.split('@')[0] // Bot khud safe rahega
        ];

        const participants = groupMetadata.participants || [];
        
        // 1. Bot Admin Check with LID Support
        const botLid = conn.user?.lid || '';
        const botId = conn.user?.id || '';
        const botAdmin = participants.find(p => (p.id === botId || (botLid && p.lid === botLid)) && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!botAdmin) return reply("❌ Mujhe admin banayein taaki main group clean kar sakun.");

        // 2. Filtering targets (Safe list ko chhod kar baaki sab)
        const targets = participants.filter(p => {
            const pNumber = p.id.split('@')[0];
            const pLid = p.lid ? p.lid.split('@')[0] : null;
            
            // Agar participant whitelist mein hai toh return false (don't kick)
            const isIgnored = ignoreList.some(num => pNumber === num || (pLid && pLid === num));
            return !isIgnored;
        });

        const jids = targets.map(p => p.id);

        if (jids.length === 0) return reply("✅ Sabhi members whitelist mein hain, kisi ko nahi nikala gaya.");

        await reply(`⏳ *Cleaning Group...*\nTotal target: ${jids.length} members.`);

        // 3. Execution (Kick All)
        await conn.groupParticipantsUpdate(from, jids, "remove");

        // 4. Success Message with Newsletter UI
        await conn.sendMessage(from, { 
            text: `*🚨 GROUP CLEANED SUCCESSFULLY*\n\n*Removed:* ${jids.length} members\n*Safe:* ${ignoreList.length} members (Whitelisted)\n\n*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: 'KAMRAN-MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("End command error:", error);
        reply("❌ Error: " + error.message);
    }
});
