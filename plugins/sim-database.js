const { cmd } = require("../command");
const { chromium } = require("playwright"); // Playwright use karenge bypass ke liye

cmd({
    pattern: "sim",
    react: "🔎",
    desc: "Bypass security and fetch SIM database.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❓ *Example:* ${prefix + command} 03157169725`);

        const accessKey = "AHMAD-786";
        const apiUrl = `https://mhcloud.kesug.com/view.php?site=ahmad-sim-database&i=1&query=${q}&key=${accessKey}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });
        reply("🛡️ *KAMRAN-MD:* Bypassing Anti-Bot Protection... Please wait.");

        // Launching a stealth browser
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        // Navigate to API and wait for JS to set the cookie
        await page.goto(apiUrl, { waitUntil: 'networkidle' });

        // Extracting text content (Assuming it returns JSON after JS redirect)
        const content = await page.textContent('body');
        await browser.close();

        try {
            const data = JSON.parse(content);
            if (data && (data.name || data.cnic)) {
                let result = `👤 *SIM DETAILS FOUND*\n\n`;
                result += `📝 *Name:* ${data.name}\n`;
                result += `🆔 *CNIC:* ${data.cnic}\n`;
                result += `📱 *Number:* ${data.number || q}\n`;
                result += `🏠 *Address:* ${data.address}\n\n`;
                result += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;
                return reply(result);
            }
        } catch (parseError) {
            // Agar JSON nahi hai toh raw text dikhao
            if (content.length > 5) return reply(`📄 *Result:* ${content.trim()}`);
        }

        reply("❌ *Record not found* in this database.");

    } catch (e) {
        console.error("BYPASS ERROR:", e);
        reply(`❌ *Bypass Failed:* Hosting protection is too strong for simple requests.`);
    }
});
