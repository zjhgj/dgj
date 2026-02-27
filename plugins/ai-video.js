const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

// Configuration
const delay = ms => new Promise(r => setTimeout(r, ms));
const headers = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'Accept-Language': 'id-ID,id;q=0.9,en-AU;q=0.8,en;q=0.7,en-US;q=0.6'
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

// --- BOT COMMAND ---
cmd({
    pattern: "sora",
    alias: ["sora2", "genvideo"],
    react: "🎬",
    desc: "Generate AI Video from prompt (Nanobanana ORG)",
    category: "ai",
    use: ".sora <prompt> | <ratio>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    
    // FIX: Safe Key Detection
    const msgKey = m?.key || mek?.key || null;

    try {
        if (!q) return reply("📝 Example: .sora a cat dancing | portrait");

        const [prompt, ratio] = q.split('|').map(v => v.trim());
        const aspect_ratio = ratio || 'landscape';

        if (msgKey) await conn.sendMessage(from, { react: { text: '⏳', key: msgKey } });
        
        // Step 1: Send Wait Message Safely
        let waitMsg = await conn.sendMessage(from, { text: "🎬 *SORA AI: STARTING...*\n\nStep 1: Registering temporary account..." }, { quoted: m });

        // Safe Edit Function
        const safeEdit = async (text) => {
            if (waitMsg && waitMsg.key) {
                await conn.sendMessage(from, { text: text, edit: waitMsg.key });
            } else {
                await conn.sendMessage(from, { text: text }, { quoted: m });
            }
        };

        const randomName = Math.random().toString(36).substring(2, 12);
        const email = `${randomName}@akunlama.com`;

        // 2. Auth Process
        await axios.post('https://nanobanana.org/api/auth/send-code', { email }, {
            headers: { ...headers, 'Content-Type': 'application/json', origin: 'https://nanobanana.org', referer: 'https://nanobanana.org/sora2' }
        }).then(extract);

        await safeEdit("🎬 *SORA AI: FETCHING OTP...*\n\nStep 2: Monitoring temporary mailbox for sign-in code...");

        let code = null;
        for (let i = 0; i < 15; i++) {
            await delay(4000);
            const mailRes = await axios.get(`https://akunlama.com/api/v1/mail/list?recipient=${randomName}`);
            if (mailRes.data?.length > 0) {
                const mail = mailRes.data[0];
                const htmlRes = await axios.get(`https://akunlama.com/api/v1/mail/getHtml?region=${mail.storage.region}&key=${mail.storage.key}`);
                const $ = cheerio.load(htmlRes.data);
                const text = $('body').text().replace(/\s+/g, ' ').trim();
                const match = text.match(/sign in:\s*(\d{6})/);
                if (match) { code = match[1]; break; }
            }
        }
        if (!code) throw new Error("OTP Timeout. Server might be busy.");

        // 3. Login
        await safeEdit("🎬 *SORA AI: LOGGING IN...*\n\nStep 3: Creating session and CSRF handshake...");
        const csrfToken = await axios.get('https://nanobanana.org/api/auth/csrf', {
            headers: { ...headers, referer: 'https://nanobanana.org/sora2', Cookie: getkukis() }
        }).then(res => { extract(res); return res.data.csrfToken; });

        const loginData = new URLSearchParams({ email, code, redirect: 'false', csrfToken, callbackUrl: 'https://nanobanana.org/sora2' });
        await axios.post('https://nanobanana.org/api/auth/callback/email-code', loginData.toString(), {
            headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded', 'x-auth-return-redirect': '1', origin: 'https://nanobanana.org', referer: 'https://nanobanana.org/sora2', Cookie: getkukis() }
        }).then(extract);
        await axios.get('https://nanobanana.org/api/auth/session', { headers: { ...headers, Cookie: getkukis() } }).then(extract);

        // 4. Submit & Wait
        await safeEdit(`🎬 *SORA AI: GENERATING...*\n\nStep 4: Sora is rendering your video (${aspect_ratio})...`);
        const subRes = await axios.post('https://nanobanana.org/api/sora2/submit', 
            { model: 'sora2', type: 'text-to-video', prompt, aspect_ratio, n_frames: '10', remove_watermark: true }, 
            { headers: { ...headers, 'Content-Type': 'application/json', origin: 'https://nanobanana.org', referer: 'https://nanobanana.org/sora2', Cookie: getkukis() } }
        ).then(res => res.data.task_id);

        let result;
        const pendingStatus = ['processing', 'pending', 'queue', 'in_queue', 'starting'];
        for (let i = 0; i < 30; i++) {
            await delay(10000);
            const chk = await axios.get(`https://nanobanana.org/api/sora2/status/${subRes}`, {
                headers: { ...headers, Cookie: getkukis() }
            });
            result = chk.data.task;
            if (!pendingStatus.includes(result.status.toLowerCase())) break;
        }

        if (result.status.toLowerCase() !== 'success' && !result.video_url) throw new Error("Generation failed or filtered.");

        // 5. Send Result
        await conn.sendMessage(from, { 
            video: { url: result.video_url || result.result },
            caption: `🎬 *SORA VIDEO GENERATED*\n\n📝 *Prompt:* ${prompt}\n📐 *Ratio:* ${aspect_ratio}\n\n> © PROVA MD ❤️`
        }, { quoted: m });

        if (msgKey) await conn.sendMessage(from, { react: { text: '✅', key: msgKey } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { text: `❌ *Sora Error:* ${e.message}` }, { quoted: m });
        if (msgKey) await conn.sendMessage(from, { react: { text: '❌', key: msgKey } });
    }
});
          
