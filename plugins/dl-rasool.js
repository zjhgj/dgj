//---------------------------------------------------------------------------
//           KAMRAN-MD - AUTO ADZAN & SHOLAT REMINDER
//---------------------------------------------------------------------------
//  🕌 AUTOMATIC ADZAN AUDIO AND PRAYER TIME NOTIFICATIONS
//---------------------------------------------------------------------------

const { cmd } = require('../command');
const axios = require('axios');

// Konfigurasi Audio Adzan
const AUDIO_ADZAN = {
    fajr: 'https://islamdownload.net/r/123801/fajr_128_44.mp3',
    default: 'https://islamdownload.net/r/123801/mecca_56_22.mp3',
    doa: 'https://islamdownload.net/r/123801/doa_sesudah_adzan.mp3'
};

// Penyimpanan status agar tidak spam
if (!global.autoshalat) global.autoshalat = {};

/**
 * Fungsi untuk mengambil jadwal sholat berdasarkan lokasi
 */
async function getJadwalSholat(city = "Jakarta") {
    try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const tanggal = `${dd}-${mm}-${yyyy}`;
        
        const api = `https://api.aladhan.com/timingsByAddress/${tanggal}?address=${city}&method=8`;
        const res = await axios.get(api);
        const t = res.data.data.timings;
        
        return {
            Subuh: t.Fajr,
            Dzuhur: t.Dhuhr,
            Ashar: t.Asr,
            Maghrib: t.Maghrib,
            Isya: t.Isha
        };
    } catch (e) {
        console.error("Gagal mengambil jadwal sholat:", e);
        return null;
    }
}

// --- LOGIC AUTO CHECKER (Setiap 1 Menit) ---

async function startAutoAdzan(conn) {
    setInterval(async () => {
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
        const timeNow = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        
        // Ambil jadwal sholat (Default Jakarta, bisa disesuaikan)
        const jadwal = await getJadwalSholat("Jakarta");
        if (!jadwal) return;

        for (let [sholat, waktu] of Object.entries(jadwal)) {
            if (timeNow === waktu) {
                // Cari semua grup tempat bot bergabung (atau tentukan ID chat spesifik)
                const groups = Object.keys(await conn.groupFetchAllParticipating());
                
                for (let chatId of groups) {
                    const idKey = `${chatId}-${sholat}-${timeNow}`;
                    if (global.autoshalat[idKey]) continue; // Sudah dikirim

                    global.autoshalat[idKey] = true;
                    const isSubuh = sholat.toLowerCase() === 'subuh';
                    
                    // 1. Kirim Pesan Adzan
                    await conn.sendMessage(chatId, {
                        audio: { url: isSubuh ? AUDIO_ADZAN.fajr : AUDIO_ADZAN.default },
                        mimetype: 'audio/mp4',
                        ptt: true,
                        contextInfo: {
                            externalAdReply: {
                                title: `🕌 WAKTU SHOLAT ${sholat.toUpperCase()}`,
                                body: `🕑 Pukul ${waktu} WIB untuk wilayah Jakarta dan sekitarnya.`,
                                mediaType: 1,
                                thumbnailUrl: 'https://files.catbox.moe/9p9m4p.jpg',
                                renderLargerThumbnail: true,
                                sourceUrl: 'https://github.com/Kamran-Amjad/KAMRAN-MD'
                            }
                        }
                    });

                    // 2. Kirim Doa Setelah Adzan (Delay 4 Menit - Estimasi durasi adzan)
                    setTimeout(async () => {
                        await conn.sendMessage(chatId, {
                            audio: { url: AUDIO_ADZAN.doa },
                            mimetype: 'audio/mp4',
                            ptt: true
                        });

                        await conn.sendMessage(chatId, {
                            text: `✨ *Doa Sesudah Adzan*\n\nاللَّهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ\n\n*Artinya:* "Ya Allah, Tuhan pemilik panggilan yang sempurna ini dan shalat yang didirikan, berilah Muhammad wasilah dan keutamaan, dan bangkitkanlah dia ke tempat yang terpuji yang telah Engkau janjikan."\n\n_Mari sejenak tinggalkan aktivitas dan tunaikan ibadah sholat ${sholat.toLowerCase()}._`
                        });
                        
                        // Hapus cache status setelah selesai
                        delete global.autoshalat[idKey];
                    }, 240000); 
                }
            }
        }
    }, 60000); // Check setiap 60 detik
}

// --- COMMAND: JADWAL SHOLAT ---

cmd({
    pattern: "jadwalsholat",
    alias: ["sholat", "adzan"],
    desc: "Menampilkan jadwal sholat untuk wilayah tertentu.",
    category: "islamic",
    use: ".jadwalsholat Jakarta",
    filename: __filename,
}, async (conn, mek, m, { text, reply }) => {
    const kota = text || "Jakarta";
    const jadwal = await getJadwalSholat(kota);
    
    if (!jadwal) return reply("❌ Gagal mengambil data. Pastikan nama kota benar.");

    let caption = `╭──〔 *🕌 JADWAL SHOLAT* 〕\n`;
    caption += `├─ 📍 *Wilayah:* ${kota}\n`;
    for (let [n, t] of Object.entries(jadwal)) {
        caption += `├─ 🕒 *${n}:* ${t}\n`;
    }
    caption += `╰───────────────────🚀\n\n_Bot akan otomatis mengirim Adzan di grup saat waktunya tiba._`;

    return reply(caption);
});

// Jalankan otomatis saat bot aktif
// Catatan: Pastikan 'conn' tersedia di konteks global atau panggil saat bot siap.
// module.exports = { startAutoAdzan }; 
