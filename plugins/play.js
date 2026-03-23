const axios = require("axios");
const fs = require("fs");
const { cmd } = require("../command");

const API_URLS = [
    "https://arslan-api-site.vercel.app/more/activenumbers01",
    "https://arslan-api-site.vercel.app/more/activenumbers02",
    "https://arslan-api-site.vercel.app/more/activenumbers03"
];

cmd({
    pattern: "numbers",
    alias: ["getnum", "activenum"],
    react: "📱",
    desc: "Get active numbers from all 3 APIs",
    category: "tools",
    use: ".numbers 92",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    try {
        const code = args[0];
        if (!code) return reply("❌ Please provide a country code.\nExample: *.numbers 92*");

        reply(`⏳ *Fetching active numbers from all 3 sources for code ${code}...*`);

        let allNumbers = [];
        let successCount = 0;

        // Har API ko bari bari check karein (For Loop behtar hai agar parallel fail ho raha ho)
        for (const url of API_URLS) {
            try {
                const { data } = await axios.get(url, { timeout: 15000 }); // 15 sec timeout
                if (data && data.result && Array.isArray(data.result)) {
                    allNumbers = allNumbers.concat(data.result);
                    successCount++;
                }
            } catch (err) {
                console.log(`⚠️ API Fail: ${url} | Error: ${err.message}`);
            }
        }

        // Duplicates khatam karein
        const uniqueNumbers = [...new Set(allNumbers)];

        // Filter numbers by country code
        const filteredNumbers = uniqueNumbers.filter(num => num.startsWith(code));

        if (filteredNumbers.length === 0) {
            return reply(`❌ Code *${code}* ke liye koi numbers nahi mile.\n📡 APIs Status: ${successCount}/3 Connected.`);
        }

        // Create File
        const fileName = `Active_Numbers_${code}.txt`;
        const txtContent = filteredNumbers.map(v => "+" + v).join("\n");
        fs.writeFileSync(fileName, txtContent);

        // Send Document
        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(fileName),
            mimetype: "text/plain",
            fileName: fileName,
            caption: `✅ *Numbers Fetch Success*\n\n🌍 *Country Code:* ${code}\n📊 *Unique Numbers:* ${filteredNumbers.length}\n📡 *Active Sources:* ${successCount}/3\n\n*DR KAMRAN-MD UTILS*`
        }, { quoted: mek });

        // Clean up
        fs.unlinkSync(fileName);

    } catch (e) {
        console.error("Critical Error:", e);
        reply("❌ System error occurred. Try again later.");
    }
});
