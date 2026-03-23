const axios = require("axios");
const fs = require("fs");
const { cmd } = require("../command");

// API URLs List
const API_URLS = [
    "https://arslan-api-site.vercel.app/more/activenumbers01",
    "https://arslan-api-site.vercel.app/more/activenumbers02",
    "https://arslan-api-site.vercel.app/more/activenumbers03"
];

cmd({
    pattern: "numbers",
    alias: ["getnum", "activenum"],
    react: "📱",
    desc: "Get active numbers from multiple APIs by country code",
    category: "tools",
    use: ".numbers 92",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    try {
        const code = args[0];
        
        if (!code) {
            return reply("❌ Please provide a country code.\nExample: *.numbers 92*");
        }

        reply(`⏳ *Fetching active numbers from 3 sources for code ${code}...*`);

        // Teeno APIs se data ek saath mangwana
        const requests = API_URLS.map(url => axios.get(url).catch(e => ({ data: { result: [] } })));
        const responses = await Promise.all(requests);

        // Saare results ko ek single array mein jama (combine) karna
        let allNumbers = [];
        responses.forEach(res => {
            if (res.data && Array.isArray(res.data.result)) {
                allNumbers = allNumbers.concat(res.data.result);
            }
        });

        // Duplicates khatam karna aur user ke code se filter karna
        const uniqueNumbers = [...new Set(allNumbers)];
        const filteredNumbers = uniqueNumbers.filter(num => num.startsWith(code));

        if (filteredNumbers.length === 0) {
            return reply(`❌ Code *${code}* ke liye koi active numbers nahi mile.`);
        }

        // Text file create karna
        const fileName = `Active_Numbers_${code}.txt`;
        const txtContent = filteredNumbers.map(v => "+" + v).join("\n");
        
        fs.writeFileSync(fileName, txtContent);

        // WhatsApp par file send karna
        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(fileName),
            mimetype: "text/plain",
            fileName: fileName,
            caption: `✅ *Numbers Found Success*\n\n🌍 *Country Code:* ${code}\n📊 *Total Unique Numbers:* ${filteredNumbers.length}\n📡 *Sources:* 3 APIs Checked\n\n*DR KAMRAN-MD UTILS*`
        }, { quoted: mek });

        // File delete karna
        fs.unlinkSync(fileName);

    } catch (e) {
        console.error("Numbers Error:", e);
        reply("❌ Error fetching data. APIs might be offline or slow.");
    }
});
