//---------------------------------------------------------------------------
//           KAMRAN-MD - AUDIO TO TEXT (TRANSCRIBE)
//---------------------------------------------------------------------------
//  🚀 CONVERT AUDIO/VOICE NOTES TO TEXT USING ANY2TEXT
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const crypto = require('crypto');

/**
 * Core Logic: Any2Text Scraper
 */
async function any2text(file, { language = 'auto', interval = 3000 } = {}) {
    if (!fs.existsSync(file)) throw new Error('File not found');

    const get = await axios.get('https://any2text.com/audio-to-text');
    const cookie = get.headers['set-cookie']?.map(v => v.split(';')[0]).join('; ');
    if (!cookie) throw new Error('Failed to get cookies');

    const xsrf = decodeURIComponent(cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '');
    if (!xsrf) throw new Error('XSRF token not found');

    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c =>
        ((Math.random() * 16) | 0 & (c === 'x' ? 15 : 3) | (c === 'x' ? 0 : 8)).toString(16)
    );

    const stat = fs.statSync(file);
    const form = new FormData();
    Object.entries({
        dzuuid: uuid,
        dzchunkindex: '0',
        dztotalfilesize: stat.size.toString(),
        dzchunksize: '50000000',
        dztotalchunkcount: '1',
        dzchunkbyteoffset: '0'
    }).forEach(([k, v]) => form.append(k, v));
    form.append('file', fs.createReadStream(file));

    const upload = await axios.post('https://any2text.com/api/files/upload', form, {
        headers: {
            ...form.getHeaders(),
            'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
            'x-requested-with': 'XMLHttpRequest',
            origin: 'https://any2text.com',
            referer: 'https://any2text.com/audio-to-text',
            cookie
        }
    });

    const id = upload.data?.data?.[0]?.transcription_id;
    if (!id) throw new Error('Upload failed - No ID returned');

    await axios.post('https://any2text.com/api/files/transcribe',
        { files: [id], options: { language }, addToQueue: 1 },
        {
            headers: {
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                'x-requested-with': 'XMLHttpRequest',
                'x-xsrf-token': xsrf,
                origin: 'https://any2text.com',
                referer: 'https://any2text.com/audio-to-text',
                cookie
            }
        }
    );

    let status;
    let attempts = 0;
    do {
        await new Promise(r => setTimeout(r, interval));
        const s = await axios.post('https://any2text.com/api/files/status',
            { id: [id] },
            {
                headers: {
                    'content-type': 'application/json',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
                    'x-requested-with': 'XMLHttpRequest',
                    'x-xsrf-token': xsrf,
                    origin: 'https://any2text.com',
                    referer: `https://any2text.com/files/${id}`,
                    cookie
                }
            }
        );
        status = s.data?.data?.[0];
        attempts++;
        if (attempts > 20) throw new Error('Transcription timeout');
    } while (status && status.status !== 'completed');

    const page = await axios.get(`https://any2text.com/files/${id}`, {
        headers: {
            accept: 'text/html',
            referer: `https://any2text.com/files/${id}`,
            cookie
        }
    });

    const $ = cheerio.load(page.data);
    const text = $('#text_transcriber span').map((_, e) => $(e).text().trim()).get().join(' ');

    if (!text) throw new Error('Could not extract text from result page');

    return { id, text };
}

cmd({
    pattern: "transcribe",
    alias: ["totext", "stt"],
    desc: "Convert audio or voice note to text.",
    category: "tools",
    use: ".transcribe (reply to audio)",
    filename: __filename,
}, async (conn, mek, m, { from, reply, react }) => {
    let tempPath = null;
    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || q.mediaType || '';

        if (!/audio/.test(mime)) {
            return reply("❌ Silakan balas audio atau voice note (VN) dengan perintah ini.");
        }

        await react("⏳");
        const waitMsg = await reply("📝 *Processing...* Sedang merubah audio ke teks. Mohon tunggu.");

        // 1. Download Media manually (Bypasses FileType errors)
        const stream = await downloadContentFromMessage(q.msg || q, 'audio');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // 2. Save to temp file
        const fileName = `transcribe_${crypto.randomBytes(4).toString('hex')}.mp3`;
        tempPath = path.join(__dirname, '..', fileName);
        fs.writeFileSync(tempPath, buffer);

        // 3. Process via Any2Text
        const result = await any2text(tempPath);

        // 4. Send Response
        let responseMsg = `✅ *TRANSKRIPSI BERHASIL*\n\n`;
        responseMsg += `🎧 *Audio Text:* \n"${result.text}"\n\n`;
        responseMsg += `> © ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴋᴀᴍʀᴀɴ-ᴍᴅ`;

        await conn.sendMessage(from, { text: responseMsg }, { quoted: mek });
        await react("✅");

    } catch (e) {
        console.error("Transcribe Error:", e);
        await react("❌");
        reply(`❌ *Error:* ${e.message || "Failed to transcribe audio."}`);
    } finally {
        // Cleanup temp file
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
    }
});
