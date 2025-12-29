const { cmd } = require('../command');
const axios = require('axios');

if (!global.chaceotp) global.chaceotp = {};

cmd({
    pattern: "otpnegara",
    alias: ["otpcountry"],
    desc: "List countries for a specific service ID.",
    category: "tools",
    react: "🌍",
    filename: __filename,
}, async (conn, mek, m, { from, text, reply, pushname, prefix, command }) => {
    try {
        const skrng = Date.now();
        const exp = 25 * 60 * 1000;
        const h = { 'x-apikey': 'apikey-mu', 'Accept': 'application/json' };

        // Handle Pagination (-next)
        if (text && text.startsWith('-next ')) {
            const cid = text.split(' ')[1];
            if (!cid || !global.chaceotp[cid] || global.chaceotp[cid].type !== 'country') {
                return reply("❌ Cache ID invalid!");
            }

            const cdata = global.chaceotp[cid];
            const countries = cdata.data;
            const npage = (cdata.page || 1) + 1;
            const itempage = 15;
            const tpage = Math.ceil(countries.length / itempage);

            if (npage > tpage) return reply("❌ No more pages!");

            const sidx = (npage - 1) * itempage;
            const edix = Math.min(sidx + itempage, countries.length);
            const pCountries = countries.slice(sidx, edix);

            let psn = `╰╼ ┈─ ◌ ˚ OTP COUNTRIES ⠹\n\n• Total: *${countries.length}*\n• Page: ${npage}/${tpage}\n\n`;
            pCountries.forEach((c, i) => {
                psn += `${sidx + i + 1}. *${c.name}*\n   ╰ Code: ${c.iso_code} | Stock: ${c.stock_total}\n\n`;
            });

            psn += `*Next:* ${prefix + command} -next ${cid}`;
            
            global.chaceotp[cid].page = npage;
            global.chaceotp[cid].timestamp = skrng;
            return reply(psn);
        }

        if (!text) return reply(`Usage: ${prefix + command} <service_id>\nExample: ${prefix + command} 14`);

        // Fetch Data for Service ID
        const res = await axios.get(`https://www.rumahotp.com/api/v2/countries?service_id=${text}`, { headers: h });
        if (!res.data?.success) return reply("❌ Service ID invalid!");

        const countries = res.data.data;
        if (countries.length === 0) return reply("❌ No countries available for this service.");

        const cid = Math.random().toString(36).substring(2, 10);
        global.chaceotp[cid] = { type: 'country', data: countries, serviceId: text, page: 1, timestamp: skrng };

        const pCountries = countries.slice(0, 15);
        const tpage = Math.ceil(countries.length / 15);

        let psn = `╰╼ ┈─ ◌ ˚ OTP COUNTRIES ⠹\n\n• Service ID: *${text}*\n• Total: *${countries.length}*\n• Page: 1/${tpage}\n• Cache ID: ${cid}\n\n`;
        pCountries.forEach((c, i) => {
            psn += `${i + 1}. *${c.name}*\n   ╰ Code: ${c.iso_code} | Stock: ${c.stock_total}\n\n`;
        });

        psn += `*Next:* ${prefix + command} -next ${cid}`;
        reply(psn);

    } catch (e) {
        console.error(e);
        reply("❌ Error fetching countries!");
    }
});
