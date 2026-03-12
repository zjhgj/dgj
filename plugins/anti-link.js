const { cmd } = require('../command');
const config = require('../config');

cmd({
    on: "body"
}, async (conn, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins }) => {
    try {
        // 1. Sirf Group mein aur agar ANTI_LINK ON ho
        if (!isGroup || config.ANTI_LINK === 'false' || !body) return;

        // 2. Link Detection (WhatsApp Group & Channel)
        const waLinkRegex = /(chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/gi;
        if (!waLinkRegex.test(body)) return;

        // 3. Admin Check (IGNORE ADMINS)
        if (isAdmins) return;

        // 4. Bot Admin Check
        if (!isBotAdmins) return;

        // 5. ACTION: Delete and Remove
        try {
            await conn.sendMessage(from, { delete: m.key });
            await conn.groupParticipantsUpdate(from, [sender], "remove");
            await conn.sendMessage(from, { 
                text: `🚫 *Link detected!* @${sender.split('@')[0]} removed for sending a link.`, 
                mentions: [sender] 
            });
        } catch (e) {
            console.error("Action Failed:", e.message);
        }
    } catch (err) {
        console.error("Anti-link Error:", err.message);
    }
});

