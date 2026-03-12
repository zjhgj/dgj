const { cmd } = require('../command');
const config = require('../config');

cmd({
    on: "body"
}, async (conn, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins }) => {
    try {
        // 1. Sirf Group mein hi check karein
        if (!isGroup) return;
        
        // 2. Anti-link enabled hona chahiye
        if (config.ANTI_LINK === 'false') return;

        // 3. Link Detection (WhatsApp Group & Channel)
        const waLinkRegex = /(chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/gi;
        if (!waLinkRegex.test(body)) return;

        // 4. Admin ignore karein
        if (isAdmins) return;

        // 5. Bot Admin hona zaroori hai
        if (!isBotAdmins) {
            console.log("Anti-link: Bot is not admin, cannot kick.");
            return;
        }

        // 6. Action
        await conn.sendMessage(from, { delete: m.key });
        await conn.groupParticipantsUpdate(from, [sender], "remove");
        await conn.sendMessage(from, { 
            text: `🚫 *Link Detected!* @${sender.split('@')[0]} has been removed.`, 
            mentions: [sender] 
        });

    } catch (err) {
        console.error("Anti-link Error:", err.message);
    }
});

