cmd({
    pattern: "unmute",
    alias: ["groupunmute", "open"],
    react: "🔓",
    desc: "Unmute the group (Everyone can send messages).",
    category: "group",
    filename: __filename
},           
async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command can only be used in groups.");
        
        // Sender ID extract karna (LID support ke saath)
        const senderId = mek.participant || mek.key.participant || mek.key.remoteJid;
        if (!senderId) return reply("❌ Could not identify sender.");
        
        // Admin status check (Aapke function ka use karke)
        const { isBotAdmin, isSenderAdmin } = await checkAdminStatus(conn, from, senderId);
        
        if (!isSenderAdmin) return reply("❌ Only group admins can use this command.");
        if (!isBotAdmin) return reply("❌ I need to be an admin to unmute the group.");
        
        // Group settings update: 'not_announcement' ka matlab group khul jayega
        await conn.groupSettingUpdate(from, "not_announcement");
        reply("✅ Group has been unmuted. Everyone can send messages now.");
        
    } catch (e) {
        console.error("Error unmuting group:", e);
        reply("❌ Failed to unmute the group.");
    }
})
                                      
