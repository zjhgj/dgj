const { cmd } = require('../command');
const config = require('../config');

cmd({
    on: "body"
}, async (conn, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins }) => {
    try {
        // 1. Basic checks (Config check)
        if (!isGroup || config.ANTI_LINK === 'false' || !body) return;

        // 2. Filter: Only WhatsApp Group & Channel Links
        const waLinkRegex = /(chat\.whatsapp\.com\/[a-zA-Z0-9]{20,}|whatsapp\.com\/channel\/[a-zA-Z0-9]{20,})/gi;
        if (!waLinkRegex.test(body)) return;

        // 3. Permission logic
        // Admin link bhej sakta hai
        if (isAdmins) return;

        // Bot admin hona zaroori hai action lene ke liye
        if (!isBotAdmins) return;

        // 4. Action: Delete and Kick
        try {
            // Pehle message delete karo
            await conn.sendMessage(from, { delete: m.key });

            // Phir user ko remove karo
            await conn.groupParticipantsUpdate(from, [sender], "remove");

            // Notification send karo
            await conn.sendMessage(from, { 
                text: `🚫 *Anti-Link Action* \n\n@${sender.split('@')[0]} was kicked for sending prohibited links.`, 
                mentions: [sender] 
            });
        } catch (actionError) {
            console.error("Action Error (Kick/Delete):", actionError.message);
        }

    } catch (err) {
        console.error("Anti-Link Global Error:", err.message);
    }
});
