const axios = require('axios');
const cheerio = require('cheerio');
const { cmd } = require('../command');

// --- Helper Functions from your code ---

function dxzExtractThumbnail($, element) {
    const context = $(element).closest('li, div, article, .cb-lst-itm, .cb-nws-itm, .cb-nws-lst-itm, section');
    const dxzCricbuzzSelectors = ['.cb-nws-thumb img', '.cb-lst-itm-thumb img', '.cb-nws-itm-thumb img', '.cb-thumb img', '[class*="thumb"] img'];
    for (const selector of dxzCricbuzzSelectors) {
        const imgEl = context.find(selector).first();
        if (imgEl.length) {
            let src = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-original');
            if (src) return src.includes('http') ? src : `https:${src}`;
        }
    }
    return '';
}

function dxzExtractCategory(context) {
    const allText = context.text().toLowerCase();
    if (allText.includes('report')) return 'Match Report';
    if (allText.includes('preview')) return 'Preview';
    if (allText.includes('analysis')) return 'Analysis';
    if (allText.includes('live')) return 'Live Updates';
    return 'Cricket News';
}

// --- Bot Command ---

cmd({
    pattern: "cricnews",
    alias: ["cricketnews", "cricbuzz"],
    react: "🏏",
    desc: "Get latest cricket news from Cricbuzz with thumbnails.",
    category: "news",
    filename: __filename
},           
async (conn, mek, m, { from, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const response = await axios.get('https://www.cricbuzz.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const dxzNews = [];
        
        // Using main list selectors
        $('.cb-nws-lst li, .cb-lst-itm, .cb-nws-itm').each((index, element) => {
            if (dxzNews.length >= 10) return; // Limit to top 10 for WhatsApp

            const linkEl = $(element).find('a').first();
            const title = linkEl.text().trim();
            let link = linkEl.attr('href') || '';
            
            if (title.length > 15 && link) {
                const fullLink = link.startsWith('http') ? link : `https://www.cricbuzz.com${link}`;
                const thumbnail = dxzExtractThumbnail($, element);
                const category = dxzExtractCategory($(element));
                
                dxzNews.push({ title, link: fullLink, thumbnail, category });
            }
        });

        if (dxzNews.length === 0) return reply("😞 No cricket news found at the moment.");

        // Sending each news as a separate message with AdReply (Thumbnail)
        for (let news of dxzNews) {
            let newsCaption = `*【 ${news.category.toUpperCase()} 】*\n\n` +
                              `📢 *${news.title}*\n\n` +
                              `🔗 *Link:* ${news.link}\n\n` +
                              `*© ᴘᴏᴡᴇʀᴇᴅ ʙʏ DR KAMRAN*`;

            await conn.sendMessage(from, {
                text: newsCaption,
                contextInfo: {
                    externalAdReply: {
                        title: "CRICBUZZ LATEST NEWS",
                        body: news.title,
                        thumbnailUrl: news.thumbnail || "https://static.cricbuzz.com/images/cricbuzz-logo.png",
                        sourceUrl: news.link,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: mek });
        }

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error(error);
        reply("❌ *Scraper Error:* " + error.message);
    }
});
    
