const { cmd } = require('../command');

cmd(
  {
    pattern: "add",
    alias: ["invite", "addmember", "a", "summon"],
    desc: "Send group invite link to a number",
    category: "group",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, isGroup, isBotAdmins, isCreator, isAdmins, participants, reply }) => {
    try {
      // ✅ Allow creator OR group admins
      if (!isCreator && !isAdmins) {
        return await conn.sendMessage(from, {
          text: "📛 *This command can only be used by Group Admins or Bot Owner.*"
        }, { quoted: mek });
      }

      if (!isGroup) return reply("❌ *This command only works in groups.*");
      if (!isBotAdmins) return reply("⚠️ *I need to be Admin to fetch group link.*");
      if (!args[0]) return reply("📝 *Usage:* .invite <number>");

      // Clean number
      let number = args[0].replace(/[^0-9]/g, '');
      let jid = number + "@s.whatsapp.net";

      // Group metadata
      const metadata = await conn.groupMetadata(from);
      const groupAdmins = participants.filter(p => p.admin);
      const owner = metadata.owner || groupAdmins[0]?.id || "unknown";

      // Group DP (fallback if not available)
      const fallbackPpUrls = [
        'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
        'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
      ];
      let ppUrl;
      try {
        ppUrl = await conn.profilePictureUrl(from, 'image');
      } catch {
        ppUrl = fallbackPpUrls[Math.floor(Math.random() * fallbackPpUrls.length)];
      }

      // Invite code
      const inviteCode = await conn.groupInviteCode(from);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

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

      // Invite card
      let gdata = `
╭━━━〔 *📦 Group Invitation* 〕━━━╮
┃ 🔰 *Group:* ${metadata.subject}
┃ 👑 *Invited By:* wa.me/${m.sender.split("@")[0]}
┃ 👥 *Members:* ${metadata.participants.length}
╰━━━━━━━━━━━━━━━━━━━━━━╯

🔗 *Join Here:* ${inviteLink}

> Powered by 𝗞𝗔𝗠𝗥𝗔𝗡-𝗠𝗗
      `;

      // Send Invite in Target's Inbox with Group DP
      await conn.sendMessage(jid, {
        image: { url: ppUrl },
        caption: gdata,
        mentions: groupAdmins.map(v => v.id).concat([owner])
      }, { quoted: jawad });

      // Confirm in group
      await conn.sendMessage(from, {
        text: `> *User is invited To Group ✅*`,
        mentions: [jid]
      }, { quoted: jawad });

    } catch (e) {
      console.log("Error in add/invite:", e);
      reply(`❌ *Error:* ${e.message}`);
    }
  }
);
