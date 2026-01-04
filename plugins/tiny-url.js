//---------------------------------------------------------------------------
//           KAMRAN-MD - EPHOTO360 TEXT EFFECTS
//---------------------------------------------------------------------------
//  🚀 CREATE AMAZING LOGOS AND TEXT EFFECTS USING EPHOTO360
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const qs = require('qs');
const cheerio = require('cheerio');

const CONFIG = {
    BASE_URL: 'https://en.ephoto360.com',
    API_CREATE: 'https://en.ephoto360.com/effect/create-image',
    HEADERS: {
        NAVIGATE: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin'
        },
        AJAX: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        }
    }
};

/**
 * Core Ephoto360 Scraper Engine
 */
const ephoto360 = {
    updateCookies: (oldCookie, newCookiesHeader) => {
        if (!newCookiesHeader) return oldCookie;
        const newCookieStr = newCookiesHeader.map(c => c.split(';')[0]).join('; ');
        return oldCookie ? `${oldCookie}; ${newCookieStr}` : newCookieStr;
    },

    getSession: async (url, textArray) => {
        try {
            const resInit = await axios.get(url, { headers: CONFIG.HEADERS.NAVIGATE });
            let cookies = ephoto360.updateCookies('', resInit.headers['set-cookie']);
            
            const $ = cheerio.load(resInit.data);
            const tokenShort = $('input[name="token"]').val();
            const buildServer = $('input[name="build_server"]').val();
            const buildServerId = $('input[name="build_server_id"]').val();

            if (!tokenShort) throw new Error('Token not found.');

            const formData = {
                'text': textArray,
                'submit': 'GO',
                'token': tokenShort,
                'build_server': buildServer,
                'build_server_id': buildServerId
            };

            const resMeta = await axios.post(url, qs.stringify(formData, { arrayFormat: 'brackets' }), {
                headers: {
                    ...CONFIG.HEADERS.NAVIGATE,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': url,
                    'Cookie': cookies
                }
            });

            cookies = ephoto360.updateCookies(cookies, resMeta.headers['set-cookie']);

            const $meta = cheerio.load(resMeta.data);
            const rawJson = $meta('#form_value_input').val();
            
            if (!rawJson) throw new Error('Generation failed (IP limit or invalid inputs).');
            
            const sessionData = JSON.parse(rawJson);

            return {
                ...sessionData,
                cookies,
                referer: url
            };

        } catch (error) {
            throw new Error(`Session Error: ${error.message}`);
        }
    },

    create: async (effectUrl, texts) => {        
        try {
            const session = await ephoto360.getSession(effectUrl, texts);

            const payload = {
                ...session,
                autocomplete: '',
                text: texts
            };

            const response = await axios.post(CONFIG.API_CREATE, qs.stringify(payload, { arrayFormat: 'brackets' }), {
                headers: {
                    ...CONFIG.HEADERS.AJAX,
                    'Referer': session.referer,
                    'Origin': CONFIG.BASE_URL,
                    'Cookie': session.cookies
                }
            });

            const data = response.data;

            if (data.success) {
                const fullUrl = session.build_server + data.image;
                return { status: true, image_url: fullUrl };
            } else {
                return { status: false, message: 'Server denied request.' };
            }

        } catch (error) {
            return { status: false, message: error.message };
        }
    }
};

// --- LIST OF EFFECTS ---
const EFFECTS = {
    'ph': { url: 'https://en.ephoto360.com/create-pornhub-style-logos-online-free-549.html', name: 'Pornhub Logo', inputs: 2 },
    'glitch': { url: 'https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html', name: 'Glitch Text', inputs: 1 },
    'neon': { url: 'https://en.ephoto360.com/neon-text-effect-online-8.html', name: 'Neon Text', inputs: 1 },
    'blackpink': { url: 'https://en.ephoto360.com/online-blackpink-style-logo-generator-free-711.html', name: 'Blackpink Logo', inputs: 1 },
    'thunder': { url: 'https://en.ephoto360.com/online-thunder-text-effect-generator-free-753.html', name: 'Thunder Text', inputs: 1 }
};

// --- COMMAND: EPHOTO ---

cmd({
    pattern: "ephoto",
    alias: ["maker", "textlogo"],
    desc: "Create amazing logos with Ephoto360.",
    category: "logo",
    use: ".ephoto ph | KAMRAN | MD",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix, command }) => {
    try {
        if (!text || !text.includes('|')) {
            let menu = `🎨 *EPHOTO360 LOGO MAKER*\n\n*Usage:* \`${prefix + command} <style> | <text1> | <text2>\`\n\n*Styles:* \n`;
            Object.keys(EFFECTS).forEach(k => menu += `- \`${k}\` (${EFFECTS[k].name})\n`);
            menu += `\n*Example:* \`${prefix + command} ph | Kamran | MD\``;
            return reply(menu);
        }

        const args = text.split('|').map(v => v.trim());
        const style = args[0].toLowerCase();
        
        if (!EFFECTS[style]) return reply("❌ Style not found. Use `.ephoto` to see the list.");

        const texts = args.slice(1);
        if (texts.length < EFFECTS[style].inputs) return reply(`❌ This style requires ${EFFECTS[style].inputs} text inputs.`);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });
        reply(`_🎨 Creating your ${EFFECTS[style].name}, please wait..._`);

        const result = await ephoto360.create(EFFECTS[style].url, texts);

        if (result.status) {
            await conn.sendMessage(from, {
                image: { url: result.image_url },
                caption: `✅ *Style:* ${EFFECTS[style].name}\n📝 *Text:* ${texts.join(' | ')}\n\n*🚀 Powered by KAMRAN-MD*`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363418144382782@newsletter',
                        newsletterName: 'KAMRAN-MD',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else {
            throw new Error(result.message);
        }

    } catch (e) {
        console.error("Ephoto Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Error:* ${e.message}`);
    }
});
