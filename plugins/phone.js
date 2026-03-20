const { cmd } = require('../command'); // Aapke bot ka standard path
const axios = require('axios');

cmd({
    pattern: "wainfo",
    alias: ["searchwa", "profileinfo"],
    category: "tools",
    react: "👤",
    desc: "Get WhatsApp Name and Profile Picture using number"
}, async (conn, mek, m, { q, reply, react, botFooter }) => {
    
    if (!q) {
        await react("❌");
        return reply("Bhai, number toh dein! (With country code)\nExample: .wainfo 923325914867");
    }

    // Number clean karna (sirf digits)
    const number = q.replace(/[^0-9]/g, '');
    await react("⏳");

    try {
        const url = `https://api.whatsapp.com/send/?phone=${number}&text&type=phone_number&app_absent=0&wame_ctl=1`;
        
        // Axios use kar rahe hain fetch ki jagah jo Baileys bots mein common hai
        const { data: html } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        // Name Extract karna
        const nameMatch = html.match(/<meta property="og:title" content="(.*?)" \/>/);
        let waName = nameMatch ? nameMatch[1] : null;

        if (waName) {
            // HTML Entities decode karna
            waName = waName
                .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
                .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
                .replace(/&amp;/g, '&');
        }

        // Profile Picture Extract karna
        const ppMatch = html.match(/<meta property="og:image" content="(.*?)" \/>/);
        const ppUrl = ppMatch ? ppMatch[1].replace(/&amp;/g, '&') : null;
        
        // Check agar profile exist karti hai
        if (!waName || waName === "Bagikan di WhatsApp" || waName === "Share on WhatsApp") {
            await react("❌");
            return reply("❌ Is number par WhatsApp profile nahi mili.");
        }

        const info = `
👤 *WHATSAPP PROFILE INFO*

📝 *Name:* ${waName}
📱 *Number:* ${number}
🔗 *Link:* https://wa.me/${number}

> *${botFooter || 'DR KAMRAN-MD'}*`.trim();

        if (ppUrl && ppUrl.includes('pps.whatsapp.net')) {
            await conn.sendMessage(m.chat, { 
                image: { url: ppUrl }, 
                caption: info 
            }, { quoted: mek });
        } else {
            await reply(info + "\n🖼️ *DP:* Private ya nahi mili.");
        }

        await react("✅");

    } catch (e) {
        console.error("WA Info Error:", e.message);
        await react("❌");
        reply("❌ Error: Service temporarily unavailable.");
    }
});
