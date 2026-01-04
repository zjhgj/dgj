//---------------------------------------------------------------------------
//           KAMRAN-MD - BING IMAGE SEARCH
//---------------------------------------------------------------------------
//  🚀 SCRAPE HIGH-QUALITY IMAGES DIRECTLY FROM BING
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const fetch = require('node-fetch');

// In-memory cache to save results and bookmarks
const TTL_MS = 3 * 60 * 1000; // 3 minutes cache
const CACHE = new Map();
const Bookmarks = new Map();

/**
 * Utility: Fetch raw HTML from Bing
 */
async function fetchText(url, headers = {}) {
    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            ...headers
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
}

/**
 * Utility: Clean HTML entities
 */
function htmlUnescape(str) {
    return str
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

/**
 * Utility: Extract attributes from tags
 */
function attrPick(tag, name) {
    const r = new RegExp(`${name}=["']([^"']+)["']`, "i");
    const m = r.exec(tag);
    return m ? m[1] : null;
}

/**
 * Scraper: Extract image data from Bing HTML
 */
async function scrapeBingPage(query, start) {
    const q = encodeURIComponent(query.trim());
    const url = `https://www.bing.com/images/search?q=${q}&FORM=HDRSC2${start ? `&first=${start}` : ""}`;
    const html = await fetchText(url);
    const out = [];
    const tagRe = /<a[^>]*class=["'][^"']*\biusc\b[^"']*["'][^>]*>/gi;
    
    for (const tag of html.match(tagRe) || []) {
        try {
            const mAttr = attrPick(tag, "m");
            if (!mAttr) continue;
            const m = JSON.parse(htmlUnescape(mAttr));
            const img = m.murl || m.imgurl;
            if (!img) continue;
            out.push({
                preview_url: m.turl || null,
                original_url: img
            });
        } catch {}
    }
    return out;
}

async function getBingImages(query, limit) {
    const results = [];
    let start = 0;
    // Attempt 3 pages if results are few
    for (let i = 0; i < 3 && results.length < limit; i++) {
        const chunk = await scrapeBingPage(query, start);
        for (const r of chunk) {
            const exists = results.some(existing => existing.original_url === r.original_url);
            if (!exists) {
                results.push(r);
                if (results.length >= limit) break;
            }
        }
        start += 35;
    }
    return results;
}

// --- COMMAND: BINGIMG ---

cmd({
    pattern: "bingimage",
    alias: ["bingimg", "searchimg"],
    desc: "Search for images using Bing.",
    category: "search",
    use: ".bingimage nature aesthetics",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, prefix, command }) => {
    try {
        if (!text) return reply(`🔍 *Image Search*\n\nUsage: \`${prefix + command} <query>\`\nExample: \`${prefix + command} cyberpunk 2077\``);

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

        const query = text.trim();
        const limit = 5; // Images per request
        const cacheKey = `bing:${query}`;
        const bookmarkKey = `${m.sender}:${query}`;
        const now = Date.now();

        let results;
        const cached = CACHE.get(cacheKey);

        // Check if query is cached
        if (cached && (now - cached.ts < TTL_MS)) {
            results = cached.data;
        } else {
            results = await getBingImages(query, 35);
            if (!results.length) return reply(`🍂 *No images found for "${text}".*`);
            CACHE.set(cacheKey, { ts: now, data: results });
        }

        // Bookmark logic: Get next batch of images
        const bookmarkIndex = Bookmarks.get(bookmarkKey) || 0;
        const startIndex = bookmarkIndex * limit;
        const endIndex = startIndex + limit;
        const images = results.slice(startIndex, endIndex);

        if (images.length === 0) {
            Bookmarks.set(bookmarkKey, 0); // Reset if end reached
            return reply("🍂 *No more new images found for this query.*");
        }

        // Send images one by one
        for (let i = 0; i < images.length; i++) {
            await conn.sendMessage(from, {
                image: { url: images[i].original_url || images[i].preview_url },
                caption: i === images.length - 1 ? `✅ *Search Results:* ${query}\n\n_Tip: Run the command again for more images._` : ''
            }, { quoted: mek });
        }

        // Update bookmark for next time
        Bookmarks.set(bookmarkKey, bookmarkIndex + 1);

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        console.error("BingImg Error:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply(`❌ *Failed to fetch images.*`);
    }
});
