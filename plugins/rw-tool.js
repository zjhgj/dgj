const { cmd } = require('../command');
const baileys = require('@whiskeysockets/baileys');
const converter = require('../data/converter'); // Ensure this path is correct
const crypto = require('crypto');
const fs = require('fs'); // Added for file handling if needed

/**
 * KAMRAN-MD: Universal Group Status V2 Relay
 */
async function relayStatus(conn, jid, content, type) {
    const messageSecret = crypto.randomBytes(32);
    let mediaObject = {};

    if (type === 'image') mediaObject = { image: content.buffer, caption: content.caption };
    else if (type === 'video') mediaObject = { video: content.buffer, caption: content.caption };
    else if (type === 'audio') {
        // WhatsApp Status requires audio/ogg; codecs=opus for voice status
        mediaObject = { 
            audio: content.buffer, 
            mimetype: 'audio/ogg; codecs=opus', 
            ptt: true 
        };
    } else {
        mediaObject = { text: content.text, backgroundColor: content.bgColor || '#075E54' };
    }

    const inside = await baileys.generateWAMessageContent(mediaObject, { upload: conn.waUploadToServer });
    
    const messageStructure = {
        groupStatusMessageV2: {
            message: {
                ...inside,
                messageContextInfo: { messageSecret }
            }
        }
    };

    const m = baileys.generateWAMessageFromContent(jid, messageStructure, { userJid: conn.user.id });
    await conn.relayMessage(jid, m.message, { messageId: m.key.id });
    return m;
}

cmd({
    pattern: "gcstatus",
    alias: ["groupstatus", "statusrelay"],
    react: "🌟",
    desc: "Relay Text/Photo/Video/Voice as Group Status.",
    category: "tools",
    use: ".gcstatus (reply to any media or type text)",
    filename: __filename
}, async (conn, mek, m, { from, reply, text, isAdmins, isOwner }) => {
    try {
        if (!isAdmins && !isOwner) return reply("❌ *KAMRAN-MD:* Admins only.");

        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        
        // --- 1. PHOTO STATUS ---
        if (/image/.test(mime)) {
            await reply("⏳ *Uploading Photo Status...*");
            const buffer = await q.download();
            await relayStatus(conn, from, { buffer, caption: text }, 'image');
            return reply("✅ *Photo Status Shared!*");
        }

        // --- 2. VIDEO STATUS ---
        if (/video/.test(mime)) {
            await reply("⏳ *Uploading Video Status...*");
            const buffer = await q.download();
            await relayStatus(conn, from, { buffer, caption: text }, 'video');
            return reply("✅ *Video Status Shared!*");
        }

        // --- 3. VOICE (AUDIO) STATUS ---
        if (/audio/.test(mime)) {
            await reply("⏳ *Converting & Uploading Voice Status...*");
            
            // Download the original audio
            const buffer = await q.download();
            
            // Get extension from mime type (e.g., 'audio/mp4' -> 'mp4')
            const ext = mime.split('/')[1] || 'mp3';
            
            // CONVERSION ADDED HERE:
            // Convert buffer to PTT (Ogg/Opus) using your converter
            const pttAudio = await converter.toPTT(buffer, ext);

            await relayStatus(conn, from, { buffer: pttAudio }, 'audio');
            return reply("✅ *Voice Status Shared!*");
        }

        // --- 4. TEXT STATUS ---
        if (!text) return reply("❌ Please reply to media or provide text for status.");
        
        await reply("⏳ *Sending Text Status...*");
        await relayStatus(conn, from, { text: text }, 'text');
        reply("✅ *Text Status Shared!*");

    } catch (err) {
        console.error(err);
        reply(`❌ *KAMRAN-MD Error:* ${err.message}`);
    }
});
