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
    desc: "Get active numbers from multiple APIs by country code",
    category: "tools",
    use: ".numbers 92",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    try {
        const code = args[0];
        if (!code) return reply("❌ Please provide a country code.\nExample: *.numbers 92*");

        reply(`⏳ *Fetching active numbers from 3 sources for code ${code}...*\n_Please wait, this may take a few seconds._`);

        // Axios request configuration with Timeout and Headers
        const fetchAPI = async (url) => {
            try {
                const res = await axios.get(url, { 
                    timeout: 20000, // 20 seconds wait karega
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                return res.data && Array.isArray(res.data.result) ? res.data.result : [];
            } catch (e) {
                console.log(`⚠️ API Error (${url.split('/').pop()}):`, e.message);
                return []; // Agar API fail ho toh empty array return karega
            }
        };

        // Saari APIs ko parallel mein fetch karein
        const results = await Promise.all(API_URLS.map(url => fetchAPI(url)));

        // Saare results ko merge karein
        let allNumbers = [].concat(...results);

        // Duplicates khatam karein
        const uniqueNumbers = [...new Set(allNumbers)];

        // User ke country code se filter karein
        const filteredNumbers = uniqueNumbers.filter(num => {
            const cleanNum = num.replace(/\D/g, ''); // Sirf digits rakhein
            return cleanNum.startsWith(code);
        });

        if (filteredNumbers.length === 0) {
            return reply(`❌ Code *${code}* ke liye koi active numbers nahi mile ya APIs response nahi de rahi hain.`);
        }

        const fileName = `Active_Numbers_${code}.txt`;
        const txtContent = filteredNumbers.map(v => "+" + v.replace(/\D/g, '')).join("\n");
        
        fs.writeFileSync(fileName, txtContent);

        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(fileName),
            mimetype: "text/plain",
            fileName: fileName,
            caption: `✅ *Numbers Found Success*\n\n🌍 *Country Code:* ${code}\n📊 *Total Unique Numbers:* ${filteredNumbers.length}\n📡 *Sources:* 3 APIs Checked\n\n*DR KAMRAN-MD UTILS*`
        }, { quoted: mek });

        fs.unlinkSync(fileName);

    } catch (e) {
        console.error("Main Numbers Error:", e);
        reply("❌ System Error! Please try again after some time.");
    }
});
