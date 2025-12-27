const config = require('../config')
const { cmd } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep } = require('../lib/functions')

cmd({
    pattern: "ginfo",
    react: "🥏",
    alias: ["groupinfo"],
    desc: "Get group information with LID support.",
    category: "group",
    use: '.ginfo',
    filename: __filename
},
async (conn, mek, m, {
    from, quoted, isCmd, isGroup, sender, isBotAdmins,
    isAdmins, isDev, reply, groupMetadata, participants
}) => {
    try {
        // Requirements
        if (!isGroup) return reply(`❌ This command only works in group chats.`);
        
        // Newsletter Context for professional look
        const newsletterContext = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363418144382782@newsletter',
                newsletterName: 'KAMRAN-MD',
                serverMessageId: 143
            }
        };

        const metadata = await conn.groupMetadata(from);
        
        // LID Fix: identify admins correctly even if phone numbers are hidden
        const groupAdmins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin");
        
        // Fallback Profile Picture
        const fallbackPpUrls = [
            'https://files.catbox.moe/ly6553.jpg',
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
        ];
        
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = fallbackPpUrls[Math.floor(Math.random() * fallbackPpUrls.length)];
        }

        // Mapping Admins (LID compatible mapping)
        const listAdmin = groupAdmins.map((v, i) => {
            const id = v.id.split('@')[0];
            return `${i + 1}. @${id}`;
        }).join('\n');

        const owner = metadata.owner || (groupAdmins.length > 0 ? groupAdmins[0].id : "unknown");
        const creationDate = new Date(metadata.creation * 1000).toLocaleString();

        const gdata = `╭──〔 *🏠 GROUP INFORMATION* 〕  
├─ 📝 *Name:* ${metadata.subject}
├─ 🆔 *ID:* ${metadata.id}
├─ 👑 *Creator:* @${owner.split('@')[0]}
├─ 📅 *Created:* ${creationDate}
├─ 👥 *Members:* ${participants.length}
├─ 🛡️ *Admins:* ${groupAdmins.length}
╰───────────────────🚀

*📝 Description:* ${metadata.desc?.toString() || 'No description available.'}

*🛡️ Admin List:*
${listAdmin}

*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: gdata,
            mentions: participants.map(p => p.id), // Mentioning everyone to ensure tags work
            contextInfo: newsletterContext
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ An error occurred while fetching group info.`);
    }
});
