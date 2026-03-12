Const { cmd } = require('../command');
const config = require('../config');

// Metadata Cache: Baar baar WhatsApp server par load na pare
const groupCache = new Map();

// Optimized Metadata Fetcher
async function getCachedMetadata(conn, chatId) {
    if (groupCache.has(chatId)) {
        const cached = groupCache.get(chatId);
        // 5 minute tak cache rakhen
        if (Date.now() - cached.time < 300000) return cached.data;
    }
    
    try {
        const metadata = await conn.groupMetadata(chatId);
        groupCache.set(chatId, { data: metadata, time: Date.now() });
        return metadata;
    } catch (e) {
        return null;
    }
}

// Helper: Admin Check
async function isUserAdmin(conn, chatId, userId) {
    const metadata = await getCachedMetadata(conn, chatId);
    if (!metadata) return false;
    
    const participant = metadata.participants.find(p => 
        (p.id === userId || p.lid === userId || p.jid === userId)
    );
    return participant ? (participant.admin === "admin" || participant.admin === "superadmin") : false;
}

// Main Logic
cmd({ 'on': "body" }, async (conn, m, store, { from, body, sender, isGroup }) => {
    try {
        if (!isGroup || config.ANTI_LINK === 'false') return;

        // URL Detection Regex
        const urlRegex = /(https?:\/\/[^\s]+|wa\.me\/[^\s]+|whatsapp\.com\/channel\/[^\s]+)/gi;
        if (!urlRegex.test(body)) return;

        // Admin check (Lazy evaluation: pehle link check, phir admin check)
        if (await isUserAdmin(conn, from, sender)) return;

        // Bot Admin check
        const metadata = await getCachedMetadata(conn, from);
        const botId = conn.user?.id?.split(':')[0];
        const isBotAdmin = metadata?.participants.find(p => p.id.includes(botId))?.admin;

        if (!isBotAdmin) return;

        // Action: Delete and Kick
        try {
            await conn.sendMessage(from, { delete: m.key });
            await conn.groupParticipantsUpdate(from, [sender], "remove");
            await conn.sendMessage(from, { 
                text: `🚫 *Link detected!* @${sender.split('@')[0]} kicked for sending links.`, 
                mentions: [sender] 
            });
        } catch (e) {
            console.error("Anti-link action failed:", e.message);
        }
    } catch (err) {
        // Silently fail to prevent crashes
    }
});

