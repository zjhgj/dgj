const axios = require("axios");
const fs = require("fs");
const { cmd } = require("../command"); // Apne bot ka path check karein

// API URL
const NUMBERS_API = "https://arslan-api-site.vercel.app/more/activenumbers01";

cmd({
    pattern: "numbers",
    alias: ["getnum", "activenum"],
    react: "📱",
    desc: "Get active numbers by country code from API",
    category: "tools",
    use: ".numbers 92",
    filename: __filename
},
async (conn, mek, m, { args, reply }) => {
    try {
        const code = args[0];
        
        // Agar code nahi diya toh error message
        if (!code) {
            return reply("❌ Please provide a country code.\nExample: *.numbers 92*");
        }

        reply(`⏳ *Fetching active numbers for code ${code}...*`);

        // API se data mangwana
        const { data } = await axios.get(NUMBERS_API);

        // Check agar data sahi format mein hai
        if (!data || !data.result || !Array.isArray(data.result)) {
            return reply("❌ API response error. Try again later.");
        }

        // Sirf wahi numbers filter karna jo user ke code se shuru ho rahe hain
        const filteredNumbers = data.result.filter(num => num.startsWith(code));

        if (filteredNumbers.length === 0) {
            return reply(`❌ Code *${code}* ke liye koi active numbers nahi mile.`);
        }

        // Text file banana
        const fileName = `Active_Numbers_${code}.txt`;
        const txtContent = filteredNumbers.map(v => "+" + v).join("\n");
        
        fs.writeFileSync(fileName, txtContent);

        // WhatsApp par file send karna
        await conn.sendMessage(m.chat, {
            document: fs.readFileSync(fileName),
            mimetype: "text/plain",
            fileName: fileName,
            caption: `✅ *Numbers Found Success*\n\n🌍 *Country Code:* ${code}\n📊 *Total Numbers:* ${filteredNumbers.length}\n\n*DR KAMRAN-MD UTILS*`
        }, { quoted: mek });

        // File send karne ke baad storage se delete karna
        fs.unlinkSync(fileName);

    } catch (e) {
        console.error("Numbers Error:", e);
        reply("❌ Error fetching data. Make sure API is online.");
    }
});
