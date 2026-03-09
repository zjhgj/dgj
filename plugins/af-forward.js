const { cmd } = require('../command');

// --- Global Variable ---
if (typeof global.autoForward === 'undefined') {
    global.autoForward = false;
}

/**
 * Auto Forward Handler (Isse index.js ke message event mein call karein)
 */
async function handleAutoForward(conn, m) {
    // Agar Global OFF hai ya message bot ka apna hai to skip karein
    if (!global.autoForward || m.key.fromMe) return;

    try {
        // Target JIDs (Yahan wo IDs dalein jahan message forward karna hai)
        const targetJids = [
            '120363xxx@g.us', // Group ID
            '92300xxxxxxx@s.whatsapp.net' // Private ID
        ];

        const targetChat = conn.decodeJid(m.chat);
        
        // Forwarding Logic
        for (let jid of targetJids) {
            await conn.sendMessage(jid, { forward: m }, { quoted: m });
        }
    } catch (e) {
        console.error("AF Error:", e);
    }
}

// --- COMMAND: AF GLOBAL ON/OFF ---
cmd({
    pattern: "af",
    alias: ["autoforward"],
    desc: "Turn Auto-Forward Global ON or OFF.",
    category: "owner",
    use: ".af on/off",
    filename: __filename
},           
async (conn, mek, m, { q, reply, isOwner }) => {
    // Sirf Owner control kar sakta hai
    if (!isOwner) return reply("❌ This command is only for the Bot Owner.");

    if (q === 'on' || q === 'global on') {
        global.autoForward = true;
        await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
        return reply("🚀 *Auto-Forward:* Global Status is now *ON*.\nMessages will be forwarded to target JIDs.");
    } 
    else if (q === 'off' || q === 'global off') {
        global.autoForward = false;
        await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
        return reply("🛑 *Auto-Forward:* Global Status is now *OFF*.");
    } 
    else {
        return reply(`*Auto-Forward Status:* ${global.autoForward ? "ON ✅" : "OFF ❌"}\n\n*Usage:* \n.af on (Turn ON)\n.af off (Turn OFF)`);
    }
});

module.exports = { handleAutoForward };
