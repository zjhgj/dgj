//---------------------------------------------------------------------------
//           KAMRAN-MD - LINK BYPASS (SKIP LINK)
//---------------------------------------------------------------------------
//  🚀 BYPASS OUO.IO, SFL.GL, AND SUBS4UNLOCK.ID
//  Credit: ©AlfiXD
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

/**
 * Core Logic: Skip Link Bypass
 */
async function skipLink(url) {
    // Note: API Key is required for https://fgsi.dpdns.org
    // If the API is public or you have a key, add it to 'apiKey' below.
    const apiKey = ''; 
    
    let endpoint = '';
    if (url.includes('ouo.io')) {
        endpoint = 'ouo.io';
    } else if (url.includes('sfl.gl') || url.includes('safelinkblogger')) {
        endpoint = 'tutwuri';
    } else if (url.includes('subs4unlock.id')) {
        endpoint = 'sub4unlock';
    } else {
        throw new Error('URL tidak didukung. Hanya support: ouo.io, sfl.gl, subs4unlock.id');
    }
    
    try {
        const { data } = await axios.get(
            `https://fgsi.dpdns.org/api/tools/skip/${endpoint}?apikey=${apiKey}&url=${encodeURIComponent(url)}`,
            { timeout: 30000 }
        );
        
        if (!data.status) {
            throw new Error(data.message || 'Gagal bypass link');
        }
        
        return {
            success: true,
            type: endpoint,
            data: data.data
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message);
    }
}

cmd({
    pattern: "skiplink",
    alias: ["skip", "bypass"],
    desc: "Bypass shortlinks like ouo.io, sfl.gl, and subs4unlock.",
    category: "tools",
    use: ".skiplink <url>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❌ Masukkan URL shortlink!\n\nContoh:\n${prefix + command} https://ouo.io/ZH2ie7\n\nSupport:\n• ouo.io\n• sfl.gl\n• subs4unlock.id`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        const waitMsg = await reply("⏳ *Bypassing link...* Mohon tunggu sebentar.");

        const result = await skipLink(q);
        
        let responseText = `✅ *Link Berhasil Di-Bypass!*\n\n`;
        responseText += `🔗 *Tipe:* ${result.type}\n\n`;
        
        if (result.type === 'ouo.io') {
            responseText += `📥 *Direct Link:*\n${result.data}`;
            
        } else if (result.type === 'tutwuri') {
            responseText += `📥 *Final URL:*\n${result.data.url}\n\n`;
            if (result.data.message) {
                responseText += `💬 *Message:* ${result.data.message}`;
            }
            
        } else if (result.type === 'sub4unlock') {
            const info = result.data;
            responseText += `📝 *Info:*\n`;
            responseText += `∘ ID: ${info.id}\n`;
            responseText += `∘ Deskripsi: ${info.description}\n`;
            responseText += `∘ Dibuat: ${info.created_at}\n\n`;
            
            if (info.original) {
                const orig = info.original;
                if (orig['?ttl']) responseText += `∘ Title: ${orig['?ttl']}\n`;
                if (orig.sttl) responseText += `∘ Subtitle: ${orig.sttl}\n`;
                if (orig.yt) responseText += `∘ YouTube: ${orig.yt}\n`;
                if (orig.wa) responseText += `∘ WhatsApp: ${orig.wa}\n`;
                if (orig.ig) responseText += `∘ Instagram: ${orig.ig}\n`;
                responseText += `\n`;
            }
            
            responseText += `📥 *Direct Link:*\n${info.linkGo}`;
        }

        responseText += `\n\n> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`;

        await conn.sendMessage(from, { text: responseText }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Bypass Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Terjadi kesalahan*\n\n${e.message}\n\n_Pastikan URL valid atau API key sudah terpasang._`);
    }
});
