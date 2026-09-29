require("dotenv").config();

const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

// Ubah endpoint untuk menerima parameter 'q'
app.get("/api/lokasi", async (req, res) => {
    // Ambil input lokasi dari query parameter. Jika kosong, default ke "Bandung"
    const kota = req.query.q || "Bandung"; 
    
    const apiKey = process.env.MAPTILER_API_KEY;
    const baseUrl = process.env.MAPTILER_BASE_URL;

    // encodeURIComponent penting agar spasi/karakter khusus aman dikirim lewat URL
    const url = `${baseUrl}/${encodeURIComponent(kota)}.json?key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        
        if (!data.features || data.features.length === 0) {
             return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        }

        const feature = data.features[0];
        const koordinat = feature.geometry.coordinates; // [longitude, latitude]
        
        // Ekstraksi data hierarki wilayah
        let negara = "-", provinsi = "-", kecamatan = "-";
        
        if (feature.context) {
            feature.context.forEach(ctx => {
                if (ctx.id.startsWith('country')) negara = ctx.text;
                if (ctx.id.startsWith('region') || ctx.id.startsWith('province')) provinsi = ctx.text;
                if (ctx.id.startsWith('subregion') || ctx.id.startsWith('county') || ctx.id.startsWith('city')) kecamatan = ctx.text;
            });
        }
        
        // Handle jika pencarian langsung ke negara/provinsi
        if (feature.place_type.includes('country')) negara = feature.text;
        if (feature.place_type.includes('region')) provinsi = feature.text;

        res.json({
            lokasiDicari: feature.text,
            negara: negara,
            provinsi: provinsi,
            kecamatan: kecamatan,
            longitude: koordinat[0],
            latitude: koordinat[1]
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: "Gagal mengambil data dari MapTiler" });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});