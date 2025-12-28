//---------------------------------------------------------------------------
//           KAMRAN-MD - PINTEREST IMAGE SEARCH
//---------------------------------------------------------------------------
//  🚀 MULTI-IMAGE SEARCH WITH BOOKMARK SUPPORT (LID & NEWSLETTER)
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

// Newsletter Context for professional look
const newsletterContext = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363418144382782@newsletter',
        newsletterName: 'KAMRAN-MD',
        serverMessageId: 143
    }
};

// Memory to store bookmarks for pagination (reset on restart)
const pinterestBookmarks = new Map();

cmd({
    pattern: "pinterest",
    alias: ["pinimg", "pint"],
    desc: "Search images on Pinterest.",
    category: "search",
    react: "📌",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply }) => {
    try {
        if (!text) return reply("📌 *Pinterest Search*\n\nUsage: `.pin <query>`\nExample: `.pin anime girl` ");

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const queryKey = text.toLowerCase();
        const bookmark = pinterestBookmarks.get(queryKey) || [];

        // Pinterest specific headers and URL
        const url = 'https://id.pinterest.com/resource/BaseSearchResource/get/';
        const headers = {
            'accept': 'application/json, text/javascript, */*, q=0.01',
            'accept-language': 'id-ID',
            'content-type': 'application/x-www-form-urlencoded',
            'user-agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/127.0.0.0 Mobile Safari/537.36',
            'x-requested-with': 'XMLHttpRequest'
        };

        const params = new URLSearchParams();
        params.append('source_url', `/search/pins/?q=${encodeURIComponent(text)}&rs=typed`);
        params.append('data', JSON.stringify({
            options: {
                query: text,
                scope: 'pins',
                rs: 'typed',
                redux_normalize_feed: true,
                bookmarks: bookmark
            },
            context: {}
        }));

        const res = await axios.post(url, params.toString(), { headers });
        const json = res.data;
        const results = json?.resource_response?.data?.results || [];
        const newBookmark = json?.resource_response?.bookmark;

        // Handle Pagination Bookmark
        if (newBookmark) {
            pinterestBookmarks.set(queryKey, [newBookmark]);
        } else {
            pinterestBookmarks.delete(queryKey);
        }

        if (results.length === 0) {
            pinterestBookmarks.delete(queryKey);
            return reply(`🍂 *No results found for:* ${text}`);
        }

        // Extract and Shuffle high-res images
        const images = [
            ...new Set(
                results
                    .map(v => v.images?.['736x']?.url || v.images?.['474x']?.url)
                    .filter(Boolean)
            )
        ].sort(() => Math.random() - 0.5);

        let sentCount = 0;
        const limit = 5; // Max 5 images per request

        for (const img of images) {
            if (sentCount >= limit) break;

            await conn.sendMessage(from, { 
                image: { url: img },
                caption: sentCount === 0 ? `*📌 Pinterest Results for:* ${text}\n\n*🚀 Powered by KAMRAN-MD*` : '',
                contextInfo: newsletterContext
            }, { quoted: mek });

            sentCount++;
            // Small delay to prevent spam/ban
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (sentCount === 0) {
            return reply(`🍂 *Failed to send images.*`);
        }

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("Pinterest Error:", e);
        reply(`🍂 *Something went wrong.*`);
    }
});
