const { cmd } = require('../command');
const baileys = require('@whiskeysockets/baileys');
const crypto = require('crypto');

/**
 * KAMRAN-MD: Advanced Group Status V2 Handler
 * Supports Text and Video status relay.
 */
async function sendGroupStatus(conn, jid, content, type = 'text') {
    const messageSecret = crypto.randomBytes(32);
    let messageStructure;

    if (type === 'video') {
        // Video status generation logic
        const videoContent = await baileys.generateWAMessageContent(
            { video: content.video, caption: content.caption },
            { upload: conn.waUploadToServer }
        );
        messageStructure = {
            groupStatusMessageV2: {
                message: {
                    ...videoContent,
                    messageContextInfo: { messageSecret }
                }
            }
        };
    } else {
        // Text status generation logic
        const textContent = await baileys.generateWAMessageContent(
            { text: content.text },
            { upload: conn.waUploadToServer, backgroundColor: content.backgroundColor }
        );
        messageStructure = {
            groupStatusMessageV2: {
                message: {
                    ...textContent,
                    messageContextInfo: { messageSecret }
                }
            }
        };
    }

    const m = baileys.generateWAMessageFromContent(jid, messageStructure, {
        userJid: conn.user.id
    });

    await conn.relayMessage(jid, m.message, { messageId: m.key.id });
    return m;
}

cmd({
    pattern: "gcstatus",
    alias: ["gst", "videostatus"],
    react: "🎬",
    desc: "Send text or video status to group.",
    category: "tools",
    use: ".groupstatus (reply video or type text)",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, quoted, isAdmins, isOwner, mime }) => {
    try {
        if (!isAdmins && !isOwner) return reply("❌ *KAMRAN-MD:* Admins only.");

        const q = m.quoted ? m.quoted : m;
        const contentType = (q.msg || q).mimetype || '';

        // --- VIDEO STATUS LOGIC ---
        if (/video/.test(contentType)) {
            await reply("⏳ *KAMRAN-MD is uploading video status...*");
            const videoBuffer = await q.download();
            await sendGroupStatus(conn, from, { video: videoBuffer, caption: text || '' }, 'video');
            return reply("✅ *Video Status sent successfully!*");
        } 

        // --- TEXT STATUS LOGIC ---
        if (!text) return reply("❌ Please provide text or reply to a video.");
        
        await reply("⏳ *Sending text status...*");
        await sendGroupStatus(conn, from, { text: text, backgroundColor: '#075E54' }, 'text');
        reply("✅ *Text Status sent!*");

    } catch (err) {
        console.error(err);
        reply(`❌ *Error:* ${err.message}`);
    }
});
                         
