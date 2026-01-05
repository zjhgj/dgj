const config = require('../config')
const { cmd } = require('../command')

async function getGroupAdmins(participants = []) {
    const admins = []
    for (let p of participants) {
        if (p.admin === "admin" || p.admin === "superadmin") {
            admins.push(p.id) // p.id can be LID or PN
        }
    }
    return admins
}

cmd({
  pattern: "mute",
  alias: ["groupmute"],
  react: "🔇",
  desc: "Mute the group",
  category: "group",
  filename: __filename
},
async (conn, mek, m, { from, isGroup, reply }) => {
  if (!isGroup) return reply("❌ Group only")

  const senderId = mek.key.participant || mek.participant || mek.sender
  if (!senderId) return reply("❌ Sender not found")

  const { isBotAdmin, isSenderAdmin } =
    await checkAdminStatus(conn, from, senderId)

  if (!isSenderAdmin)
    return reply("❌ Only admins can use this command")

  if (!isBotAdmin)
    return reply("❌ Bot must be admin")

  await conn.groupSettingUpdate(from, "announcement")
  reply("✅ Group muted")
})
