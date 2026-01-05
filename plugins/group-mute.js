const config = require('../config')
const { cmd, commands } = require('../command')

// --- MUTE COMMAND ---
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

// --- UNMUTE COMMAND ---
cmd({
  pattern: "unmutee",
  alias: ["groupunmute"],
  react: "🔊",
  desc: "Unmute the group",
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

  await conn.groupSettingUpdate(from, "not_announcement")
  reply("✅ Group unmuted")
})
