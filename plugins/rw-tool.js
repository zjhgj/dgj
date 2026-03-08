const { cmd } = require('../command');
const baileys = require('@whiskeysockets/baileys');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const converter = require('../data/converter');

/**
 * INTERNAL AUDIO CONVERTER 
 * (Voice Status ke liye Opus format zaroori hai)
 */
function toAudio(buffer, ext) {
    return new Promise((resolve, reject) => {
        let tmp = path.join(__dirname, `../${Date.now()}.${ext}`);
        let out = path.join(__dirname, `../${Date.now()}.opus`);
        fs.writeFileSync(tmp, buffer);
        
        // Ffmpeg command for WhatsApp Status compatible Opus
        exec(`ffmpeg -i ${tmp} -c:a libopus -b:a 128k -vbr on ${out}`, (err) => {
            if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
            if (err) return reject(err);
            if (fs.existsSync(out)) {
                let data = fs.readFileSync(out);
                fs.unlinkSync(out);
                resolve({ data });
            } else {
                reject(new Error("Conversion failed"));
            }
        });
    });
}

/**
 * STATUS RELAY ENGINE
 */
async function relayStatus(conn, jid, content, type) {
    const messageSecret = crypto.randomBytes(32);
    let mediaObject = {};

    if (type === 'image') mediaObject = { image: content.buffer, caption: content.caption };
    else if (type === 'video') mediaObject = { video: content.buffer, caption: content.caption };
    else if (type === 'audio') {
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
            
            // Yahan humne toAudio function define kiya hai upar
        
