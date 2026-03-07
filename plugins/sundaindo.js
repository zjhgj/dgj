const { cmd } = require("../command");
const axios = require('axios');
const cheerio = require('cheerio');

// Kamus Engine Logic
async function fetchKamus(teks, tipe) {
    try {
        const respon = await axios.get('https://www.kamussunda.net/kamus', {
            params: {
                teks: teks,
                bahasa: tipe,
                submit: 'LIHAT HASIL TERJEMAHAN'
            }
        });

        const $ = cheerio.load(respon.data);
        const daftarHasil = [];

        $('.panel.panel-default').each((_, el) => {
            const body = $(el).find('.panel-body');
            const labelMentah = body.find('strong').text().trim();
            const hasilMentah = body.find('i').text().trim();

            if (labelMentah && hasilMentah) {
                const labelBersih = labelMentah.replace(/Bahasa (sunda|indonesia)-nya kata:/gi, '').trim();
                daftarHasil.push({ kata: labelBersih, hasil: hasilMentah });
            }
        });

        return daftarHasil;
    } catch (error) {
        return null;
    }
}

// --- COMMANDS ---

cmd({
    pattern: "sunda",
    alias: ["tosunda", "sundanese"],
    react: "📜",
    desc: "Translate Indonesia to Sunda.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    if (!q) return reply(`❓ *Example:* ${prefix + command} Apa kabar?`);

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
    const hasil = await fetchKamus(q, 'indonesia');

    if (!hasil || hasil.length === 0) return reply("❌ *Error:* Word not found in Sundanese dictionary.");

    let response = `🏮 *INDONESIA ➜ SUNDA*\n\n`;
    response += `📝 *Input:* ${q}\n`;
    response += `✨ *Hasil:* ${hasil[0].hasil}\n\n`;
    if (hasil.length > 1) {
        response += `📚 *Lainnya:*\n${hasil.slice(1).map(h => `• ${h.kata}: ${h.hasil}`).join('\n')}\n\n`;
    }
    response += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;

    reply(response);
});

cmd({
    pattern: "indo",
    alias: ["toindo", "sundaindo"],
    react: "🇮🇩",
    desc: "Translate Sunda to Indonesia.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    if (!q) return reply(`❓ *Example:* ${prefix + command} Damang?`);

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
    const hasil = await fetchKamus(q, 'bahasa');

    if (!hasil || hasil.length === 0) return reply("❌ *Error:* Kata teu kapanggih dina kamus.");

    let response = `🏮 *SUNDA ➜ INDONESIA*\n\n`;
    response += `📝 *Input:* ${q}\n`;
    response += `✨ *Hasil:* ${hasil[0].hasil}\n\n`;
    response += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;

    reply(response);
});

