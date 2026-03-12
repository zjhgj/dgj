const { cmd } = require('../command');
const config = require('../config');

// --- Helper: Check if user is admin (LID Support) ---
async function isUserAdmin(conn, chatId, userId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        const normalizeId = (id) => id ? id.replace(/:[0-9]+/g, '').replace(/@(lid|s\.whatsapp\.net|c\.us|g\.us)/g, '').replace(/[^\d]/g, '') : '';
        const normalizedUserId = normalizeId(userId);
        
        for (let p of participants) {
            const participantIds = [p.id, p.lid, p.phoneNumber].filter(Boolean);
            for (let pid of participantIds) {
                if (normalizeId(pid) === normalizedUserId) {
                    return p.admin === "admin" || p.admin === "superadmin";
                }
            }
        }
        return false;
    } catch { return false; }
}

// --- Helper: Check if bot is admin (LID Support) ---
async function isBotAdmin(conn, chatId) {
    try {
        const metadata = await conn.groupMetadata(chatId);
        const participants = metadata.participants || [];
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        const normalizeId = (id) => id ? id.replace(/:[0-9]+/g, '').replace(/@(lid|s\.whatsapp\.net|c\.us|g\.us)/g, '').replace(/[^\d]/g, '') : '';
        const nBotId = normalizeId(botId);
        const nBotLid = normalizeId(botLid);

        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pIds = [p.id, p.lid, p.phoneNumber].filter(Boolean);
                for (let pid of pIds) {
                    const nPid = normalizeId(pid);
                    if (nPid === nBotId || nPid === nBotLid) return true;
                }
            }
        }
        return false;
    } catch { return false; }
}

// --- Main Anti-Link Handler ---
cmd({
    on: "body"
}, async (conn, m, store, { from, body, sender, isGroup, reply }) => {
    try {
        // Condition: Config check (Skip if false or empty)
        const antiLinkMode = config.ANTI_LINK ? config.ANTI_LINK.toLowerCase() : 'false';
        if (antiLinkMode === 'false' || !isGroup) return;

        // URL Detection Regex
        const urlRegex = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?|chat\.whatsapp\.com\/|wa\.me\//gi;
        const containsLink = urlRegex.test(body);

        if (containsLink) {
            // Check Admins
            const senderIsAdmin = await isUserAdmin(conn, from, sender);
            if (senderIsAdmin) return;

            const botIsAdmin = await isBotAdmin(conn, from);
            if (!botIsAdmin) return;

            const userNumber = sender.split('@')[0];

            // --- CASE 1: antilink delete on ---
            if (antiLinkMode === 'delete') {
                await conn.sendMessage(from, { delete: m.key });
                return await conn.sendMessage(from, { 
                    text: `🚫 *ANTI-LINK (Delete Only)*\n\n@${userNumber}, links are not allowed here. Your message has been deleted.`,
                    mentions: [sender]
                });
            }

            // --- CASE 2: antilink kick on ---
            if (antiLinkMode === 'kick') {
                await conn.sendMessage(from, { 
                    text: `🚫 *ANTI-LINK (Kick Only)*\n\n@${userNumber} is being removed for sending links.`,
                    mentions: [sender]
                });
                return await conn.groupParticipantsUpdate(from, [sender], "remove");
            }

            // --- CASE 3: antilink delete kick on (or true) ---
            if (antiLinkMode === 'all' || antiLinkMode === 'true') {
                // Delete First
                await conn.sendMessage(from, { delete: m.key });
                // Notify & Kick
                await conn.sendMessage(from, { 
                    text: `🚫 *ANTI-LINK (Full Protection)*\n\n@${userNumber} has been kicked and their link was removed.`,
                    mentions: [sender]
                });
                return await conn.groupParticipantsUpdate(from, [sender], "remove");
            }
        }
    } catch (error) {
        console.error("Anti-link Error:", error);
    }
});

