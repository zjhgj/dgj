const { cmd } = require('../command');
const axios = require('axios');
const crypto = require('crypto');

// Global Headers
const headers = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'origin': 'https://www.nanobana.net',
  'referer': 'https://www.nanobana.net/m/sora2'
};

let cookieStore = {};

function extract(res) {
  const setC = res.headers['set-cookie'];
  if (setC) {
    setC.forEach(c => {
      const parts = c.split(';')[0].split('=');
      if (parts.length > 1) cookieStore[parts[0]] = parts.slice(1).join('=');
    });
  }
}

function getkukis() { return Object.entries(cookieStore).map(([k, v]) => `${k}=${v}`).join('; '); }
const delay = ms => new Promise(r => setTimeout(r, ms));

cmd({
    pattern: "sora",
    alias: ["txt2video", "vidgen"],
    react: "🎥",
    desc: "Generate AI Video from text prompt using Sora",
    category: "ai",
    use: ".sora <prompt>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    
    // FIX 1: Ultimate Safe Key detection
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!q) return reply("📝 Please provide a prompt (e.g., .sora a cat running on the moon)");

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // FIX 2: Check if waitMsg returns a valid object before using .key
        let waitMsg = await conn.sendMessage(from, { text: "🎥 *SORA AI VIDEO GENERATION...*\n\nStep 1: Creating Temporary Account..." }, { quoted: m });

        // Helper function for safe editing
        const safeEdit = async (text) => {
            if (waitMsg && waitMsg.key) {
                await conn.sendMessage(from, { text: text, edit: waitMsg.key });
            } else {
                await conn.sendMessage(from, { text: text }, { quoted: m });
            }
        };

        // 1. Setup Auth
        const randomName = crypto.randomBytes(6).toString('hex');
        const email = `${randomName}@akunlama.com`;
        
        await axios.post('https://www.nanobana.net/api/auth/email/send', { email }, { headers: { ...headers, 'Content-Type': 'application/json' } }).then(extract);
        
        let code = null;
        for (let i = 0; i < 15; i++) {
            await delay(4000);
            const res = await axios.get(`https://akunlama.com/api/v1/mail/list?recipient=${randomName}`);
            if (res.data?.length > 0) {
                const match = res.data[0].message.headers.subject.match(/Code:\s*(\d{6})/i);
                if (match) { code = match[1]; break; }
            }
        }
        if (!code) throw new Error('OTP Code Timeout. Please try again.');

        await safeEdit("Step 2: Authenticating session...");

        const csrfRes = await axios.get('https://www.nanobana.net/api/auth/csrf', { headers: { ...headers, Cookie: getkukis() } });
        extract(csrfRes);
        const csrfToken = csrfRes.data.csrfToken;

        const loginData = `email=${encodeURIComponent(email)}&code=${code}&redirect=false&csrfToken=${csrfToken}&callbackUrl=${encodeURIComponent('https://www.nanobana.net/m/sora2')}`;
        await axios.post('https://www.nanobana.net/api/auth/callback/email-code', loginData, {
            headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded', 'x-auth-return-redirect': '1', Cookie: getkukis() }
        }).then(extract);

        // 2. Submit Task
        await safeEdit("Step 3: Prompting Sora & Generating Video...");
        const subRes = await axios.post('https://www.nanobana.net/api/sora2/text-to-video/generate', 
            { prompt: q, aspect_ratio: 'landscape', n_frames: '10', remove_watermark: true }, 
            { headers: { ...headers, 'Content-Type': 'application/json', Cookie: getkukis() } }
        );
        const taskId = subRes.data.taskId;

        // 3. Polling Result
        let result;
        for (let i = 0; i < 30; i++) {
            await delay(6000);
            const chk = await axios.get(`https://www.nanobana.net/api/sora2/text-to-video/task/${taskId}?save=1&prompt=${encodeURIComponent(q)}`, {
                headers: { ...headers, Cookie: getkukis() }
            });
            result = chk.data;
            if (result.status === 'success' || result.status === 'completed' || (result.resultUrls && result.resultUrls.length > 0)) break;
            if (result.status === 'failed') throw new Error('Generation failed by Sora filter.');
        }

        const videoUrl = result.resultUrls?.[0] || (result.saved && result.saved[0] ? result.saved[0].url : null);
        if (!videoUrl) throw new Error("Video URL not found in result.");

        // 4. Send Final Result
        await conn.sendMessage(from, { 
            video: { url: videoUrl },
            caption: `🎥 *SORA AI VIDEO COMPLETED*\n\n📝 *Prompt:* ${q}\n\n> © PROVA MD ❤️`
        }, { quoted: m });

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        // Using a direct reply for error to ensure visibility
        await conn.sendMessage(from, { text: `❌ *Sora Failed:* ${e.message}` }, { quoted: m });
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
                                                                                                                                          
