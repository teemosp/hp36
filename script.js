/* ================================
   BIẾN DỮ LIỆU (LẤY TỪ data.js)
================================ */
// gioxuatbenData
// giaveData
// vitriXeData


/* ================================
   HÀM ÉP SAFARI iOS RENDER LẠI
================================ */
function iosForceReflow() {
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        document.body.style.display = 'none';
        document.body.offsetHeight;
        document.body.style.display = '';
    }
}


/* ================================
   GIỜ XUẤT BẾN – FIX MẤT SĐT iOS
================================ */
function displayGioxuatbenData() {
    const tableBody = document.getElementById('gioxuatben-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    gioxuatbenData.forEach(row => {
        const tr = document.createElement('tr');

        // Bến đi
        const td1 = document.createElement('td');
        td1.textContent = row[0] || '-';
        tr.appendChild(td1);

        // Giờ xuất bến
        const td2 = document.createElement('td');
        td2.textContent = row[1] || '-';
        td2.className = 'time-cell';
        tr.appendChild(td2);

        // Số điện thoại (FIX SAFARI)
        const td3 = document.createElement('td');

        if (row[2]) {
            const a = document.createElement('a');
            a.href = 'tel:' + row[2].replace(/[^\d]/g, '');
            a.textContent = row[2];
            a.style.whiteSpace = 'nowrap';
            td3.appendChild(a);
        } else {
            td3.textContent = '-';
        }

        tr.appendChild(td3);
        tableBody.appendChild(tr);
    });

    iosForceReflow();
}


/* ================================
   GIÁ VÉ – FIX MẤT GIÁ iOS
================================ */
function displayGiaVeData() {
    const tableBody = document.getElementById('giave-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    giaveData.forEach(row => {
        const tr = document.createElement('tr');

        const td1 = document.createElement('td');
        td1.textContent = row[0] || '-';
        tr.appendChild(td1);

        const td2 = document.createElement('td');
        td2.textContent = row[1] || '-';
        tr.appendChild(td2);

        const td3 = document.createElement('td');
        td3.className = 'price-cell';
        td3.textContent = row[2] ? row[2] : '-';
        tr.appendChild(td3);

        tableBody.appendChild(tr);
    });

    iosForceReflow();
}


/* ================================
   VỊ TRÍ XE – FIX MẤT SĐT iOS
================================ */
function displayViTriXeData() {
    const tableBody = document.getElementById('vitri-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    vitriXeData.forEach(v => {
        const tr = document.createElement('tr');

        // Xe
        const td1 = document.createElement('td');
        td1.textContent = v.xe || '-';
        tr.appendChild(td1);

        // Vị trí
        const td2 = document.createElement('td');
        td2.textContent = v.vitri || '-';
        tr.appendChild(td2);

        // Số điện thoại
        const td3 = document.createElement('td');
        if (v.phone) {
            const a = document.createElement('a');
            a.href = 'tel:' + v.phone.replace(/[^\d]/g, '');
            a.textContent = v.phone;
            a.style.whiteSpace = 'nowrap';
            td3.appendChild(a);
        } else {
            td3.textContent = '-';
        }
        tr.appendChild(td3);

        tableBody.appendChild(tr);
    });

    iosForceReflow();
}


/* ================================
   KHỞI TẠO BAN ĐẦU
================================ */
document.addEventListener('DOMContentLoaded', function () {
    if (typeof displayGioxuatbenData === 'function') displayGioxuatbenData();
    if (typeof displayGiaVeData === 'function') displayGiaVeData();
    if (typeof displayViTriXeData === 'function') displayViTriXeData();
});
