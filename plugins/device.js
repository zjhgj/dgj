const { cmd } = require('../command'); // Aapke bot ka standard path

cmd({
    pattern: "device",
    alias: ["checkdevice", "idinfo"],
    category: "tools",
    react: "📱",
    desc: "Detect the sender's device using Message ID"
}, async (conn, mek, m, { reply, botFooter }) => {
    try {
        // Quote kiye gaye message ka data uthana, warna current message
        const targetMsg = m.quoted ? m.quoted : m;
        const id = targetMsg.id;

        if (!id) {
            return reply("❌ Message ID nahi mil saki.");
        }

        // --- ID-Based Detection Logic ---
        // 1. Android IDs aam taur par lambi hoti hain (> 21 chars)
        // 2. iPhone IDs aksar '3A' se shuru hoti hain
        // 3. WhatsApp Web ki IDs choti aur different format mein hoti hain
        
        let deviceType = "";
        if (id.length > 21) {
            deviceType = "Android 🤖";
        } else if (id.substring(0, 2) === '3A') {
            deviceType = "iPhone 🍎";
        } else {
            deviceType = "WhatsApp Web / Desktop 💻";
        }

        const msgInfo = `
*📱 DEVICE DETECTOR*

🔑 *Message ID:* \`${id}\`
📏 *ID Length:* ${id.length}
📍 *Prefix:* ${id.substring(0, 4)}
📱 *Detected Device:* *${deviceType}*

> *${botFooter || 'DR KAMRAN-MD'}*`.trim();

        return await reply(msgInfo);

    } catch (e) {
        console.error("Device Detector Error:", e);
        reply("❌ Error: " + e.message);
    }
});
