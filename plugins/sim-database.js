const { cmd } = require("../command");
const axios = require("axios");

cmd({
    pattern: "sim",
    react: "🔎",
    desc: "Search SIM database with debug mode.",
    category: "tools",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix, command }) => {
    try {
        if (!q) return reply(`❓ *Example:* ${prefix + command} 03001234567`);

        const accessKey = "AHMAD-786";
        const apiUrl = `https://mhcloud.kesug.com/view.php?site=ahmad-sim-database&i=1&query=${q}&key=${accessKey}`;

        await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

        const response = await axios.get(apiUrl, { timeout: 15000 });
        const data = response.data;

        // Logging for you to check in terminal
        console.log("SIM API RAW DATA:", data);

        // Check if data is valid
        if (data && typeof data === 'object' && (data.name || data.cnic)) {
            let result = `👤 *SIM DETAILS FOUND*\n\n`;
            result += `📝 *Name:* ${data.name || 'N/A'}\n`;
            result += `🆔 *CNIC:* ${data.cnic || 'N/A'}\n`;
            result += `📱 *Number:* ${data.number || q}\n`;
            result += `🏠 *Address:* ${data.address || 'N/A'}\n\n`;
            result += `> © ᴋᴀᴍʀᴀɴ-ᴍᴅ ᴘʀᴏᴛᴇᴄᴛɪᴏɴ`;
            return reply(result);
        } 
        
        // If API returns string error or empty object
        const errorMsg = typeof data === 'string' ? data : "Record not found in database.";
        reply(`❌ *Database Error:* ${errorMsg}\n\n*Note:* Try another number or check if the API link is still active.`);

    } catch (e) {
        console.error("API ERROR:", e.message);
        reply(`❌ *Network Error:* API is unreachable or taking too long to respond.`);
    }
});

