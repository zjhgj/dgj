const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "gclink",
    alias: ["link", "linkgc", "grouplink"],
    desc: "Get group invite link.",
    category: "group",
    filename: __filename,
}, async (conn, mek, m, { from, isGroup }) => {
    try {
        // Contact-style quote
        let jawad = {
            key: {
                fromMe: false,
                participant: `0@s.whatsapp.net`,
                remoteJid: "status@broadcast"
            },
            message: {
                contactMessage: {
                    displayName: `𝗞𝗔𝗠𝗥𝗔𝗡-𝗠𝗗`,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN:'jawadED'\nitem1.TEL;waid=${m.sender.split("@")[0]}:${m.sender.split("@")[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`
                }
            }
        };

        if (!isGroup) {
            return await conn.sendMessage(from, { 
                text: "❌ This command is only for groups!" 
            }, { quoted: jawad });
        }

        const botNumber = conn.user.id.split(':')[0] + "@s.whatsapp.net";
        const groupMetadata = await conn.groupMetadata(from);
        const groupAdmins = groupMetadata.participants.filter(member => member.admin);
        const isBotAdmins = groupAdmins.some(admin => admin.id === botNumber);

        if (!isBotAdmins) {
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
👥 *Group:* ${groupMetadata.subject}
🔗 *Invite Link:* ${inviteLink}
✨ Powered by 𝗞𝗔𝗠𝗥𝗔𝗡-𝗠𝗗
        `;

        return await conn.sendMessage(from, { text: msg }, { quoted: jawad });

    } catch (error) {
        console.error("Error in invite command:", error);
        await conn.sendMessage(from, {
            text: `❌ Error: ${error.message || "Unknown error"}`
        }, { quoted: jawad });
    }
});
