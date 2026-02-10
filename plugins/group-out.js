const { cmd } = require('../command');
const { jidDecode } = require('@whiskeysockets/baileys');

cmd({
    pattern: "byekick",
    desc: "Kick a member from group",
    category: "group",
    react: "👢",
    filename: __filename
},
async (conn, mek, m, { from, reply, isGroup, sender }) => {
    try {

        if (!isGroup) return reply("❌ This command works only in groups");

        const metadata = await conn.groupMetadata(from);
        const participants = metadata.participants;

        // --- Get Admins ---
        const groupAdmins = participants
            .filter(p => p.admin)
            .map(p => p.id);

        // --- Check bot admin ---
        const botId = jidDecode(conn.user.id).user + "@s.whatsapp.net";
        if (!groupAdmins.includes(botId))
            return reply("❌ Bot is not admin");

        // --- Check sender admin ---
        if (!groupAdmins.includes(sender))
            return reply("❌ You are not admin");

        // --- Get target user (mention / reply / text) ---
        let target;

        // 1. Mention
        if (m.mentionedJid && m.mentionedJid.length > 0) {
            target = m.mentionedJid[0];
        }
        // 2. Reply
        else if (m.quoted) {
            target = m.quoted.sender;
        }
        // 3. Number text
        else if (m.text) {
            const num = m.text.replace(/[^0-9]/g, '');
            if (num.length > 7)
                target = num + "@s.whatsapp.net";
        }

        if (!target)
            return reply("❌ Tag / Reply / Number required to kick");

        // --- Prevent kicking admins ---
        if (groupAdmins.includes(target))
            return reply("❌ Cannot kick an admin");

        // --- Kick user ---
        await conn.groupParticipantsUpdate(from, [target], "remove");

        reply("✅ User kicked successfully");

    } catch (e) {
        console.log(e);
        reply("❌ Error while kicking user");
    }
});
