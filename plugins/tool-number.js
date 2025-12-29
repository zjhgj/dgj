const { cmd } = require('../command');
const axios = require('axios');

// Global cache for pagination
if (!global.chaceotp) global.chaceotp = {};

cmd({
    pattern: "otpapk",
    alias: ["otpservice"],
    desc: "List available OTP services from RumahOTP.",
    category: "tools",
    react: "📱",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, pushname, prefix, command }) => {
    try {
        const skrng = Date.now();
        const exp = 25 * 60 * 1000; // 25 min expiry

        // Cleanup expired cache
        for (const id in global.chaceotp) {
            if (skrng - global.chaceotp[id].timestamp > exp) delete global.chaceotp[id];
        }

        const h = { 'x-apikey': 'apikey-mu', 'Accept': 'application/json' };

        // Handle Pagination (-next)
        if (text && text.startsWith('-next ')) {
            const cid = text.split(' ')[1];
            if (!cid || !global.chaceotp[cid] || global.chaceotp[cid].type !== 'service') {
                return reply("❌ Cache ID invalid or expired!");
            }

            const cdata = global.chaceotp[cid];
            const srvice = cdata.data;
            const npage = (cdata.page || 1) + 1;
            const itempage = 20;
            const tpage = Math.ceil(srvice.length / itempage);

            if (npage > tpage) return reply("❌ No more pages!");

            const sidx = (npage - 1) * itempage;
            const edix = Math.min(sidx + itempage, srvice.length);
            const pservice = srvice.slice(sidx, edix);

            let psn = `╰╼ ┈─ ◌ ˚ OTP SERVICES ⠹\n\n• Total: *${srvice.length}*\n• Page: ${npage}/${tpage}\n\n`;
            pservice.forEach((service, i) => {
                psn += `${sidx + i + 1}. *${service.service_name}*\n   ╰ Code: ${service.service_code}\n\n`;
            });

            psn += `*Next:* ${prefix + command} -next ${cid}\n*Request by:* ${pushname}`;
            
            global.chaceotp[cid].page = npage;
            global.chaceotp[cid].timestamp = skrng;
            return reply(psn);
        }

        // Fetch New Data
        const res = await axios.get('https://www.rumahotp.com/api/v2/services', { headers: h });
        if (!res.data?.success) return reply("❌ Gagal mengambil data!");

        const srvices = res.data.data;
        const cid = Math.random().toString(36).substring(2, 10);

        global.chaceotp[cid] = { type: 'service', data: srvices, page: 1, timestamp: skrng };

        const pservice = srvices.slice(0, 20);
        const tpage = Math.ceil(srvices.length / 20);

        let psn = `╰╼ ┈─ ◌ ˚ OTP SERVICES ⠹\n\n• Total: *${srvices.length}*\n• Page: 1/${tpage}\n• Cache ID: ${cid}\n\n`;
        pservice.forEach((service, i) => {
            psn += `${i + 1}. *${service.service_name}*\n   ╰ Code: ${service.service_code}\n\n`;
        });

        psn += `*Next:* ${prefix + command} -next ${cid}\n*Request by:* ${pushname}`;
        reply(psn);

    } catch (e) {
        console.error(e);
        reply("❌ Error API RumahOTP");
    }
});
