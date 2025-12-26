const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "gclink",
    alias: ["link", "linkgc", "grouplink"],
    desc: "Get group invite link.",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        // Contact-style quote (Jawad Style)
        let jawad = {
            key: {
                fromMe: false,
                participant: `0@s.whatsapp.net`,
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: `𝙆𝘼𝙈𝙍𝘼𝙉-𝙈𝘿`,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:'jawadED'\nitem1.TEL;waid=${m.sender.split("@")[0]}:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                }
            }
        };

        if (!isGroup) {
            return await conn.sendMessage(from, { 
                text: "❌ This command is only for groups!" 
            }, { quoted: jawad });
        }

        // --- LID & PN Support for Bot Admin Check ---
        const metadata = await conn.groupMetadata(from);
        const participants = metadata.participants || [];
        
        const botId = conn.user?.id || '';
        const botLid = conn.user?.lid || '';
        
        const botNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
        const botIdWithoutSuffix = botId.includes('@') ? botId.split('@')[0] : botId;
        const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);
        const botLidWithoutSuffix = botLid.includes('@') ? botLid.split('@')[0] : botLid;

        let isBotAdmin = false;
        for (let p of participants) {
            if (p.admin === "admin" || p.admin === "superadmin") {
                const pPhoneNumber = p.phoneNumber ? p.phoneNumber.split('@')[0] : '';
                const pId = p.id ? p.id.split('@')[0] : '';
                const pLid = p.lid ? p.lid.split('@')[0] : '';
                const pFullId = p.id || '';
                const pFullLid = p.lid || '';
                const pLidNumeric = pLid.includes(':') ? pLid.split(':')[0] : pLid;

                const botMatches = (
                    botId === pFullId ||
                    botId === pFullLid ||
                    botLid === pFullLid ||
                    botLidNumeric === pLidNumeric ||
                    botLidWithoutSuffix === pLid ||
                    botNumber === pPhoneNumber ||
                    botNumber === pId ||
                    botIdWithoutSuffix === pPhoneNumber ||
                    botIdWithoutSuffix === pId ||
                    (botLid && botLid.split('@')[0].split(':')[0] === pLid)
                );

                if (botMatches) {
                    isBotAdmin = true;
                    break;
                }
            }
        }

        if (!isBotAdmin) {
            return await conn.sendMessage(from, { 
                text: "⚠️ Please promote me as *Admin* to fetch the group link!" 
            }, { quoted: jawad });
        }

        const inviteCode = await conn.groupInviteCode(from);
        if (!inviteCode) {
            return await conn.sendMessage(from, { 
                text: "❌ Failed to retrieve the group invite code!" 
            }, { quoted: jawad });
        }

        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        let msg = `
👥 *Group:* ${metadata.subject}
🔗 *Invite Link:* ${inviteLink}

✨ Powered by 𝙆𝘼𝙈𝙍𝘼𝙉-𝙈𝘿
        `;

        return await conn.sendMessage(from, { 
            text: msg,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363418144382782@newsletter',
                    newsletterName: 'KAMRAN-MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: jawad });

    } catch (error) {
        console.error("Error in invite command:", error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message || "Unknown error"}`
        }, { quoted: jawad });
    }
});
