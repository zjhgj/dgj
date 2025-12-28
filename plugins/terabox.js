//---------------------------------------------------------------------------
//           KAMRAN-MD - TERABOX DIRECT DOWNLOADER
//---------------------------------------------------------------------------
//  🚀 BYPASS CF-TURNSTILE & EXTRACT DLINKS (LID & NEWSLETTER SUPPORT)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional branding
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

/**
 * Format bytes to readable size
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Cloudflare Turnstile Bypass
 */
async function getCfToken() {
    try {
        const response = await axios.post('https://api.nekolabs.web.id/tls/bypass/cf-turnstile', {
            url: 'https://teraboxdl.site',
            siteKey: '0x4AAAAAACG0B7jzIiua8JFj'
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data.result;
    } catch (error) {
        throw new Error(`CF Bypass Failed: ${error.message}`);
    }
}

/**
 * Terabox Scraper
 */
async function scrapeTerabox(targetUrl) {
    try {
        const token = await getCfToken();
        const response = await axios.post('https://teraboxdl.site/api/proxy', {
            url: targetUrl,
            cf_token: token
        }, {
            headers: {
                'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'Referer': 'https://teraboxdl.site/',
                'Origin': 'https://teraboxdl.site'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Terabox Error:", error.message);
        return null;
    }
}

// --- COMMAND: TERABOX ---

cmd({
    pattern: "terabox",
    alias: ["tdl", "tera"],
    desc: "Download files from Terabox links.",
    category: "download",
    react: "☁️",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    if (!text) return reply("☁️ *Terabox Downloader*\n\nUsage: `.terabox <link>`\nExample: `.terabox https://terabox.com/s/1S7...` ");

    try {
        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const data = await scrapeTerabox(text);

        if (!data || !data.list || data.list.length === 0) {
            return reply("❌ Failed to extract details. The link might be broken or private.");
        }

        const file = data.list[0];
        const fileSize = formatBytes(file.size);
        
        let caption = `╭──〔 *☁️ TERABOX DOWNLOAD* 〕  
├─ 📝 *File:* ${file.server_filename}
├─ ⚖️ *Size:* ${fileSize}
├─ 📂 *Path:* ${file.path}
╰───────────────────🚀

*📥 DIRECT DOWNLOAD LINKS:*
${file.direct_link ? `[Click to Download](${file.direct_link})` : 'No direct link found.'}

*🚀 Powered by KAMRAN-MD*`;

        // Sending info with thumbnail if available
        const thumb = file.thumbs?.url1 || 'https://files.catbox.moe/ly6553.jpg';

        await conn.sendMessage(from, { 
            image: { url: thumb }, 
            caption: caption,
            contextInfo: newsletterContext
        }, { quoted: mek });

        // Optionally send the file if it's small (uncomment if you want auto-sending for small files)
        /*
        if (file.size < 100 * 1024 * 1024) { // 100MB Limit
             await conn.sendMessage(from, { document: { url: file.direct_link }, fileName: file.server_filename, mimetype: 'application/octet-stream' }, { quoted: mek });
        }
        */

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Terabox Cmd Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
