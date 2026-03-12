const { cmd } = require('../command');
const config = require('../config');

// Metadata Cache (Memory load kam karne ke liye)
const groupCache = new Map();

cmd({ 'on': "body" }, async (conn, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins }) => {
    try {
        // 1. Basic Checks (Fastest Exit)
        if (!isGroup || config.ANTI_LINK !== 'true' || !body) return;

        // 2. URL Detection (Regex optimized for WhatsApp links)
        const urlRegex = /(https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/gi;
        if (!urlRegex.test(body)) return;

        // 3. Permission Checks
        // Agar sender admin hai toh ignore karein (Ye 'isAdmins' plugin ke default context se aata hai jo fast hai)
        if (isAdmins) return;

        // Agar Bot admin nahi hai toh action nahi le sakta
        if (!isBotAdmins) return;

        // 4. Instant Action (Delete first, then remove)
        // Pehle message delete karein taaki link gayab ho jaye
        await conn.sendMessage(from, { delete: m.key });

        // User ko remove karein
        await conn.groupParticipantsUpdate(from, [sender], "remove");

        // Confirmation message
        await conn.sendMessage(from, { 
            text: `🚫 *Anti-Link System*\n\n@${sender.split('@')[0]} ko link bhejne ki wajah se remove kar diya gaya hai.`, 
            mentions: [sender] 
        });

    } catch (err) {
        console.error("Anti-link Error:", err);
    }
});

