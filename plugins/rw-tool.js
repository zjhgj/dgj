const { cmd } = require('../command');
const baileys = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const fs = require('fs');
const converter = require('../data/converter'); // Ensure your converter path is correct

/**
 * KAMRAN-MD: Universal Group Status V2 Relay
 */
async function relayStatus(conn, jid, content, type) {
    const messageSecret = crypto.randomBytes(32);
    let mediaObject = {};

    if (type === 'image') {
        mediaObject = { image: content.buffer, caption: content.caption };
    } else if (type === 'video') {
        mediaObject = { video: content.buffer, caption: content.caption };
    } else if (type === 'audio') {
        // Voice Status MUST be in Ogg/Opus format to be playable
        mediaObject = { 
            audio: content.buffer, 
            mimetype: 'audio/ogg; codecs=opus', 
            ptt: true 
        };
    } else {
        mediaObject = { 
            text: content.text, 
            backgroundColor: content.bgColor || '#075E54',
            font: 1 
        };
    }

    const inside = await baileys.generateWAMessageContent(mediaObject, { upload: conn.waUploadToServer });
    
    const messageStructure = {
        groupStatusMessageV2: {
            message: {
                ...inside,
                // Add context for voice/media status
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

        // --- 3. VOICE STATUS (FIXED) ---
        if (/audio/.test(mime)) {
            await reply("⏳ *Converting & Uploading Voice Status...*");
            const audioBuffer = await q.download();
            
            // Convert to Ogg/Opus using your bot's converter
            // If you don't have toAudio, use fluent-ffmpeg logic
            const statusAudio = await toAudio(audioBuffer, 'opus'); 
            
            await relayStatus(conn, from, { buffer: statusAudio.data }, 'audio');
            return reply("✅ *Voice Status Shared! (Playable)*");
        }

        // --- 4. TEXT STATUS ---
        if (text) {
            await reply("⏳ *Sending Text Status...*");
            await relayStatus(conn, from, { text: text }, 'text');
            return reply("✅ *Text Status Shared!*");
        }

        reply("❌ Please reply to media (Image/Video/Audio) or provide text.");

    } catch (err) {
        console.error(err);
        reply(`❌ *KAMRAN-MD Error:* ${err.message}`);
    }
});
        
