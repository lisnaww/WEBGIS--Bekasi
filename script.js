console.log("script.js loaded.");

// Inisialisasi peta
const map = L.map('map').setView([-6.3, 107.1], 11);

// Basemap OpenStreetMap
const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Titik uji manual dengan deskripsi
L.marker([-6.233043, 107.143539])
  .addTo(map)
  .bindPopup("<b>Rumah Elis</b><br>6°13'58.95\" LS, 107°8'36.74\" BT");


// Layer kelompok
const layerIndustri = L.layerGroup().addTo(map);
const layerBekasi = L.layerGroup().addTo(map);

// Tombol Home (reset view)
L.easyButton('<i class="fas fa-home"></i>', function (btn, map) {
    map.setView([-6.3, 107.1], 11);
}, 'Kembali ke Home').addTo(map);

// Muat GeoJSON batas kabupaten
$.getJSON("asset/data-spasial/SHP_Kab_Bekasi.geojson", function (data) {
    const layer = L.geoJSON(data, {
        style: {
            color: "#00cc44",
            weight: 2,
            fillOpacity: 0.1
        },
        onEachFeature: function (feature, layer) {
            layer.bindPopup('<b>Kecamatan:</b> ' + (feature.properties.WADMKC || '-'));
        }
    }).addTo(layerBekasi);

    const searchControl = new L.Control.Search({
        layer: layer,
        propertyName: 'WADMKC',
        marker: false,
        moveToLocation: function (latlng, map) {
            map.setView(latlng, 13);
        }
    });
    map.addControl(searchControl);
});

// Fungsi memuat titik industri berdasarkan filter sektor
function loadIndustri(filterType = 'all') {
    layerIndustri.clearLayers();
    $.getJSON("asset/data-spasial/Titik_Industri.geojson", function (data) {
        L.geoJSON(data, {
            pointToLayer: function (feature, latlng) {
                const tipe = feature.properties.Tipe || '';
                if (filterType !== 'all' && tipe.toLowerCase() !== filterType.toLowerCase()) return;

                return L.circleMarker(latlng, {
                    radius: 6,
                    fillColor: "#ff6600",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            },
            onEachFeature: function (feature, layer) {
                const nama = feature.properties.Nama_Indus || 'Tidak diketahui';
                const tipe = feature.properties.Tipe || 'Tidak diketahui';
                const alamat = feature.properties.Alamat || 'Tidak diketahui';

                const popupContent = `
                    <div class="popup-content">
                        <div class="popup-title"><b>${nama}</b></div>
                        <div class="popup-line">🏭 <b>Tipe Industri:</b> ${tipe}</div>
                        <div class="popup-line">📍 <b>Alamat:</b> ${alamat}</div>
                    </div>
                `;
                layer.bindPopup(popupContent);
            }
        }).addTo(layerIndustri);
    });
}

// Tampilkan semua industri saat awal
loadIndustri();

// Isi dropdown dengan tipe industri unik
$.getJSON("asset/data-spasial/Titik_Industri.geojson", function (data) {
    const tipeSet = new Set();
    data.features.forEach(feature => {
        const tipe = feature.properties.Tipe;
        if (tipe) tipeSet.add(tipe);
    });

    const select = $('#filter-tipe');
    select.empty();
    select.append(`<option value="all">Semua Tipe Industri</option>`);
    Array.from(tipeSet).sort().forEach(tipe => {
        select.append(`<option value="${tipe}">${tipe}</option>`);
    });
});

// Event: filter berdasarkan tipe industri
$('#filter-tipe').on('change', function () {
    const selected = $(this).val();
    loadIndustri(selected);
});

// Layer Control
L.control.layers(
    { "OpenStreetMap": osm },
    {
        "Batas Wilayah": layerBekasi,
        "Titik Industri": layerIndustri
    }
).addTo(map);

// Legenda
const legend = L.control({ position: "topright" });
legend.onAdd = function () {
    const div = L.DomUtil.create("div", "info legend");
    div.innerHTML = `
        <h4>Legenda</h4>
        <p><span style="display:inline-block;width:20px;height:10px;background:#00cc44;"></span> Batas Bekasi</p>
        <p><span style="display:inline-block;width:14px;height:14px;background:#ff6600;border-radius:50%;border:1px solid #000;"></span> Titik Industri</p>
    `;
    return div;
};
legend.addTo(map);

// Tombol dark mode
$('#toggle-mode').on('click', function () {
    $('body').toggleClass('dark-mode');
    $(this).text($('body').hasClass('dark-mode') ? '🌙 Light Mode' : '🌞 Dark Mode');
});
