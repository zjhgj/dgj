const { cmd } = require('../command');
const axios = require('axios');

/**
 * Function to fetch PUBG Mobile Nickname from Codashop
 */
async function getPUBGNickname(id) {
    // PUBG Mobile Global/UC logic for Codashop
    const body = `voucherPricePoint.id=33587` + // Specific ID for PUBG Mobile
                 `&voucherPricePoint.price=10000` +
                 `&voucherPricePoint.variablePrice=0` +
                 `&user.userId=${id}` +
                 `&voucherTypeName=PUBGM` + 
                 `&shopLang=en_US`;

    try {
        const res = await axios.post('https://order-sg.codashop.com/initPayment.action', body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://www.codashop.com',
                'Referer': 'https://www.codashop.com/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10) Chrome/139 Mobile'
            }
        });

        let data = res.data;
        // Text parsing logic to extract clean JSON
        if (typeof data === 'string') {
            const start = data.indexOf('{');
            const end = data.lastIndexOf('}') + 1;
            if (start !== -1 && end !== -1) {
                data = JSON.parse(data.slice(start, end));
            }
        }

        // PUBG usually returns nickname in roles or confirmation fields
        const nickname = data?.confirmationFields?.roles?.[0]?.role || 
                         data?.confirmationFields?.username || 
                         data?.confirmationFields?.nickname;

        return nickname || null;
    } catch (err) {
        console.error("Codashop PUBG API Error:", err.message);
        return null;
    }
}

// --- COMMAND DEFINITION ---
cmd({
    pattern: "pubg",
    alias: ["pubgcheck", "pubgid"],
    react: "🔫",
    desc: "Check PUBG Mobile Player Nickname from ID.",
    category: "tools",
    filename: __filename
},           
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) return reply("❌ Please provide a PUBG Player ID.\n\nExample: .pubg 5123456789");

        // Show loading reaction
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const nickname = await getPUBGNickname(q.trim());

        if (nickname) {
            const resultText = `*🔫 PUBG MOBILE PLAYER INFO* 🔫\n\n` +
                               `👤 *Nickname:* ${nickname}\n` +
                               `🆔 *Player ID:* ${q.trim()}\n\n` +
                               `> POWERED BY KAMRAN-MD`;
            
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
            return reply(resultText);
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return reply("❌ Invalid PUBG ID or server error. Please make sure the ID is correct.");
        }

    } catch (e) {
        console.error("PUBG Command Error:", e);
        reply("❌ An error occurred while fetching PUBG player info.");
    }
})
