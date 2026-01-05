//---------------------------------------------------------------------------
//           KAMRAN-MD - KUSONIME ANIME SEARCH & DOWNLOAD
//---------------------------------------------------------------------------
//  🚀 SEARCH ANIME BATCHES AND GET DOWNLOAD LINKS FROM KUSONIME
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Core Scraper Logic for Kusonime
 */
const kusonime = {
    search: async (q, page = 1) => {
        try {
            const html = (await axios.get(`https://kusonime.com/page/${page}/?s=${encodeURIComponent(q)}`)).data;
            const $ = cheerio.load(html);
            const result = [];

            $(".venz > ul > .kover").each((i, el) => {
                const item = $(el);
                result.push({
                    title: item.find(".content h2 a").text().trim(),
                    url: item.find(".content h2 a").attr("href"),
                    thumb: item.find(".thumb img").attr("src") || item.find(".thumb img").attr("data-src"),
                    released: item.find('.content p:has(i.fa-clock-o)').text().replace("Released on", "").trim(),
                    genre: item.find('.content p:has(i.fa-tag) a').map((_, g) => $(g).text().trim()).get()
                });
            });
            return result;
        } catch (e) { throw e; }
    },
    detail: async (url) => {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            const met = {};
            met.title = $('h1.jdlz').text().trim();
            met.poster_url = $('.post-thumb img.wp-post-image').attr('src') || '';
            
            const info = {};
            $('.info p').each((i, el) => {
                const text = $(el).text().trim();
                if (text.includes(':')) {
                    let [key, ...valueParts] = text.split(':');
                    key = key.trim().toLowerCase().replace(/\s+/g, '_');
                    let value = valueParts.join(':').trim();
                    info[key] = value;
                }
            });
            met.info = info;

            const sinopsisParts = [];
            $('.venutama > p').each((i, el) => {
                const text = $(el).text().trim();
                if (text && !text.toLowerCase().includes('download') && !text.toLowerCase().includes('credit')) {
                    sinopsisParts.push(text);
                }
            });
            met.sinopsis = sinopsisParts.join('\n\n');

            const results = [];
            $('.smokeddlrh').each((i, batchEl) => {
                const $batch = $(batchEl);
                const title = $batch.find('.smokettlrh').text().trim();
                if (!title) return;

                const batch = { title, resolutions: {} };
                $batch.find('.smokeurlrh').each((j, resEl) => {
                    const $res = $(resEl);
                    const resolution = $res.find('strong').text().trim();
                    if (!resolution) return;

                    const links = [];
                    $res.find('a').each((k, a) => {
                        links.push({ provider: $(a).text().trim(), url: $(a).attr('href') });
                    });
                    if (links.length > 0) batch.resolutions[resolution] = links;
                });
                if (Object.keys(batch.resolutions).length > 0) results.push(batch);
            });

            return { metadata: met, download: results };
        } catch (e) { throw e; }
    }
};

// --- COMMAND: KUSONIME ---

cmd({
    pattern: "kusonime",
    alias: ["kuso", "animebatch"],
    desc: "Search anime batches on Kusonime.",
    category: "search",
    use: ".kusonime <title>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`🔍 *Kusonime Search*\n\nUsage: \`${prefix + command} Naruto\`\nReply to a result to get details.`);

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        const results = await kusonime.search(q);
        if (results.length === 0) return reply("❌ No anime found with that title.");

        let text = `🎬 *KUSONIME SEARCH RESULTS*\n\nQuery: _${q}_\n\n`;
        results.forEach((item, index) => {
            text += `*${index + 1}.* ${item.title}\n`;
            text += `📅 Released: ${item.released}\n`;
            text += `🔗 Link: ${item.url}\n\n`;
        });
        text += `*Reply with the link of the anime to get download details.*`;

        await conn.sendMessage(from, {
            image: { url: results[0].thumb },
            caption: text
        }, { quoted: mek });

    } catch (e) {
        console.error(e);
        reply("❌ Error occurred while searching.");
    }
});

// --- COMMAND: KUSONIME DETAIL ---

cmd({
    pattern: "kusodetail",
    alias: ["kd"],
    desc: "Get Kusonime download details via URL.",
    category: "search",
    use: ".kusodetail <url>",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q || !q.includes("kusonime.com")) return reply("❌ Please provide a valid Kusonime URL.");

        await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });

        const data = await kusonime.detail(q);
        const { metadata, download } = data;

        let caption = `📺 *${metadata.title}*\n\n`;
        caption += `📝 *Info:* \n`;
        for (let key in metadata.info) {
            caption += `• ${key.replace(/_/g, ' ')}: ${metadata.info[key]}\n`;
        }
        
        caption += `\n📖 *Synopsis:* \n${metadata.sinopsis.substring(0, 400)}...\n\n`;
        caption += `⬇️ *DOWNLOAD LINKS:* \n`;

        download.forEach(batch => {
            caption += `\n📦 *${batch.title}*\n`;
            for (let res in batch.resolutions) {
                caption += `  *${res}*: `;
                const links = batch.resolutions[res].map(l => `[${l.provider}](${l.url})`).join(' | ');
                caption += `${links}\n`;
            }
        });

        caption += `\n*🚀 Powered by KAMRAN-MD*`;

        await conn.sendMessage(from, {
            image: { url: metadata.poster_url },
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: metadata.title,
                    body: "Kusonime Anime Batch",
                    mediaType: 1,
                    sourceUrl: q,
                    thumbnailUrl: metadata.poster_url,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ Error fetching anime details.");
    }
});
