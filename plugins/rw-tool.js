const { cmd } = require('../command');
const baileys = require('@whiskeysockets/baileys'); // Standard Baileys library
const crypto = require('crypto');

/**
 * KAMRAN-MD: Group Status V2 Handler
 * Sends a status-style message directly to the group.
 */
async function sendGroupStatus(conn, jid, content) {
    const { backgroundColor } = content;
    const tempContent = { ...content };
    delete tempContent.backgroundColor;

    // Generating message content using Baileys internal functions
    const inside = await baileys.generateWAMessageContent(tempContent, {
        upload: conn.waUploadToServer,
        backgroundColor
    });

    const messageSecret = crypto.randomBytes(32);
    
    // Creating the specialized GroupStatusMessageV2 structure
    const m = baileys.generateWAMessageFromContent(jid, {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: {
            message: {
                ...inside,
                messageContextInfo: { messageSecret }
            }
        }
    }, {});

    // Relaying the message to the group JID
    await conn.relayMessage(jid, m.message, {
        messageId: m.key.id
    });

    return m;
}

cmd({
    pattern: "groupstatus",
    alias: ["gstatus", "gst"],
    react: "🪻",
    desc: "Send a status-style message to the current group.",
    category: "tools",
    use: ".groupstatus Your message here",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, isAdmins, isOwner }) => {
    try {
        // Permission Check: Sirf Admins ya Owner hi status bhej sakte hain
        if (!isAdmins && !isOwner) return reply("❌ *KAMRAN-MD:* This command is for Admins only.");

        if (!text) return reply("❌ Please provide text for the status.\nExample: `.groupstatus Hello Group!`");

        await reply("⏳ *KAMRAN-MD is sending group status...*");

        const content = {
            text: text,
            backgroundColor: '#075E54' // WhatsApp Green (Aap ise change kar sakte hain)
        };

        const sent = await sendGroupStatus(conn, from, content);
        
        if (sent) {
            return reply(`✅ *Group Status Sent Successfully!*\n🔑 *ID:* ${sent.key.id}`);
        }

    } catch (err) {
        console.error("Group Status Error:", err);
        reply(`❌ *Failed to send status:* ${err.message}`);
    }
});
            
