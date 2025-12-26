// script.js - SỬA LỖI CẤU TRÚC CỘT
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM đã sẵn sàng, bắt đầu khởi tạo...');
    
    // Các API endpoints
    const API_URLS = {
        giave: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=giave',
        gioxuatben: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=gioxuatben',
        vitri: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=vitri'
    };

    // Biến lưu trữ dữ liệu
    let giaveData = [];
    let gioxuatbenData = [];
    let vitriData = [];

    console.log('URLs API:', API_URLS);

    // Chuyển đổi navigation
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-menu a').forEach(item => {
                item.classList.remove('active');
            });
            
            this.classList.add('active');
            
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Hàm fetch dữ liệu từ Google Sheets
    async function fetchGoogleSheetData(url, sheetName) {
        console.log(`Bắt đầu fetch ${sheetName}...`);
        
        try {
            const urlWithTimestamp = url + '&t=' + Date.now();
            const response = await fetch(urlWithTimestamp);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const text = await response.text();
            
            // Xử lý JSONP response
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error(`Không tìm thấy JSON trong response`);
            }
            
            const jsonText = text.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonText);
            
            // Trích xuất dữ liệu
            if (data.table && data.table.rows) {
                return data.table.rows;
            }
            
            return [];
        } catch (error) {
            console.error(`Lỗi khi fetch ${sheetName}:`, error);
            return [];
        }
    }

    // Xử lý dữ liệu giá vé (sheet giave)
    function processGiaveData(rows) {
        console.log('Xử lý dữ liệu giá vé, số rows:', rows ? rows.length : 0);
        
        const data = [];
        
        if (!rows || !Array.isArray(rows)) {
            console.error('Dữ liệu giá vé không hợp lệ');
            return data;
        }
        
        rows.forEach((row, index) => {
            if (!row.c) return;
            
            // Dựa vào log: sheet "giave" có cột A: "Thanh Hóa", B: "Miền bắc"
            // Giả sử cấu trúc: Cột A = điểm đi, Cột B = điểm đến, Cột C = giá
            const diemDi = row.c[0] ? (row.c[0].v || '').toString().trim() : '';
            const diemDen = row.c[1] ? (row.c[1].v || '').toString().trim() : '';
            const giaVeRaw = row.c[2] ? row.c[2].v : '';
            
            // Bỏ qua hàng tiêu đề
            if (index === 0 && (diemDi === 'Điểm đi' || diemDi === 'Thanh Hóa' || diemDi === 'Bến đi')) {
                console.log('Bỏ qua hàng tiêu đề giá vé');
                return;
            }
            
            // Bỏ qua hàng trống
            if (!diemDi && !diemDen) return;
            
            // Xử lý giá vé
            let giaVe = 0;
            if (giaVeRaw) {
                if (typeof giaVeRaw === 'number') {
                    giaVe = giaVeRaw;
                } else if (typeof giaVeRaw === 'string') {
                    const cleaned = giaVeRaw.replace(/[^\d]/g, '');
                    giaVe = parseInt(cleaned) || 0;
                }
            }
            
            // Thêm vào mảng
            data.push({
                id: data.length + 1,
                diemDi: diemDi || 'Chưa xác định',
                diemDen: diemDen || 'Chưa xác định',
                giaVe: giaVe
            });
        });
        
        console.log(`Đã xử lý ${data.length} dòng dữ liệu giá vé`);
        return data;
    }

    // Xử lý dữ liệu giờ xuất bến (sheet gioxuatben)
    function processGioxuatbenData(rows) {
        console.log('Xử lý dữ liệu giờ xuất bến, số rows:', rows ? rows.length : 0);
        
        const data = [];
        
        if (!rows || !Array.isArray(rows)) {
            console.error('Dữ liệu giờ xuất bến không hợp lệ');
            return data;
        }
        
        // DEBUG: Hiển thị cấu trúc của vài dòng đầu
        if (rows.length > 0) {
            console.log('Cấu trúc dữ liệu gioxuatben (3 dòng đầu):');
            for (let i = 0; i < Math.min(3, rows.length); i++) {
                if (rows[i].c) {
                    console.log(`Dòng ${i}:`, rows[i].c.map((cell, idx) => 
                        `Cột ${idx}: "${cell ? cell.v : 'null'}"`
                    ));
                }
            }
        }
        
        rows.forEach((row, index) => {
            if (!row.c) return;
            
            // Dựa vào log: sheet "gioxuatben" có cột A: "Bến đi", B: "giờ"
            // Cần xác định đúng cấu trúc từ dữ liệu thực tế
            const cell0 = row.c[0] ? (row.c[0].v || '').toString().trim() : '';
            const cell1 = row.c[1] ? (row.c[1].v || '').toString().trim() : '';
            const cell2 = row.c[2] ? (row.c[2].v || '').toString().trim() : '';
            const cell3 = row.c[3] ? (row.c[3].v || '').toString().trim() : '';
            const cell4 = row.c[4] ? (row.c[4].v || '').toString().trim() : '';
            
            // Bỏ qua hàng tiêu đề
            if (index === 0 && (cell0 === 'Bến đi' || cell0 === 'Điểm đi' || cell0 === 'Tuyến')) {
                console.log('Bỏ qua hàng tiêu đề giờ xuất bến');
                return;
            }
            
            // Bỏ qua hàng trống
            if (!cell0 && !cell1 && !cell2) return;
            
            // PHÂN TÍCH CẤU TRÚC DỮ LIỆU:
            // Dựa vào tên cột từ log, có thể có các trường hợp:
            // 1. cell0 = điểm đi, cell1 = giờ, cell2 = điểm đến, cell3 = số điện thoại
            // 2. cell0 = điểm đi, cell1 = điểm đến, cell2 = giờ, cell3 = số điện thoại
            // 3. cell0 = tuyến (điểm đi - điểm đến), cell1 = giờ, cell2 = số điện thoại
            
            // Thử phân tích tự động dựa trên nội dung
            let diemDi = '';
            let diemDen = '';
            let gioXuatBen = '';
            let soDienThoai = '';
            
            // TRƯỜNG HỢP 1: Nếu cell1 chứa dấu ":" (giờ) hoặc là số giờ
            if (cell1.includes(':') || /^\d{1,2}[h:]\d{0,2}/.test(cell1)) {
                diemDi = cell0;
                gioXuatBen = cell1;
                diemDen = cell2 || 'Chưa xác định';
                soDienThoai = cell3 || '0948.531.333';
            }
            // TRƯỜNG HỢP 2: Nếu cell2 chứa dấu ":" (giờ)
            else if (cell2.includes(':') || /^\d{1,2}[h:]\d{0,2}/.test(cell2)) {
                diemDi = cell0;
                diemDen = cell1 || 'Chưa xác định';
                gioXuatBen = cell2;
                soDienThoai = cell3 || '0948.531.333';
            }
            // TRƯỜNG HỢP 3: Nếu cell0 chứa "->" hoặc "→" (tuyến đường)
            else if (cell0.includes('->') || cell0.includes('→') || cell0.includes('-')) {
                const parts = cell0.split(/->|→|-/).map(p => p.trim());
                if (parts.length >= 2) {
                    diemDi = parts[0];
                    diemDen = parts[1];
                    gioXuatBen = cell1 || '';
                    soDienThoai = cell2 || '0948.531.333';
                }
            }
            // TRƯỜNG HỢP MẶC ĐỊNH: Giả sử cột 0,1,2,3
            else {
                diemDi = cell0;
                diemDen = cell1 || 'Chưa xác định';
                gioXuatBen = cell2 || '';
                soDienThoai = cell3 || '0948.531.333';
            }
            
            // Chỉ thêm nếu có thông tin cơ bản
            if (diemDi || diemDen) {
                data.push({
                    id: data.length + 1,
                    diemDi: diemDi || 'Chưa xác định',
                    diemDen: diemDen || 'Chưa xác định',
                    gioXuatBen: gioXuatBen || 'Chưa có lịch',
                    soDienThoai: soDienThoai || '0948.531.333'
                });
            }
        });
        
        console.log(`Đã xử lý ${data.length} dòng dữ liệu giờ xuất bến`);
        return data;
    }

    // Xử lý dữ liệu vị trí (sheet vitri)
    function processVitriData(rows) {
        console.log('Xử lý dữ liệu vị trí, số rows:', rows ? rows.length : 0);
        
        const data = [];
        
        if (!rows || !Array.isArray(rows)) {
            console.error('Dữ liệu vị trí không hợp lệ');
            return data;
        }
        
        // DEBUG: Hiển thị cấu trúc của vài dòng đầu
        if (rows.length > 0) {
            console.log('Cấu trúc dữ liệu vitri (3 dòng đầu):');
            for (let i = 0; i < Math.min(3, rows.length); i++) {
                if (rows[i].c) {
                    console.log(`Dòng ${i}:`, rows[i].c.map((cell, idx) => 
                        `Cột ${idx}: "${cell ? cell.v : 'null'}"`
                    ));
                }
            }
        }
        
        rows.forEach((row, index) => {
            if (!row.c) return;
            
            // Dựa vào log: sheet "vitri" có cột A: "Bến đi", B: "giờ đi"
            const cell0 = row.c[0] ? (row.c[0].v || '').toString().trim() : '';
            const cell1 = row.c[1] ? (row.c[1].v || '').toString().trim() : '';
            const cell2 = row.c[2] ? (row.c[2].v || '').toString().trim() : '';
            const cell3 = row.c[3] ? (row.c[3].v || '').toString().trim() : '';
            const cell4 = row.c[4] ? (row.c[4].v || '').toString().trim() : '';
            
            // Bỏ qua hàng tiêu đề
            if (index === 0 && (cell0 === 'Bến đi' || cell0 === 'Điểm đi' || cell0 === 'Tuyến')) {
                console.log('Bỏ qua hàng tiêu đề vị trí');
                return;
            }
            
            // Bỏ qua hàng trống
            if (!cell0 && !cell1 && !cell2) return;
            
            // PHÂN TÍCH CẤU TRÚC DỮ LIỆU VỊ TRÍ:
            // Có thể có các trường hợp:
            // 1. cell0 = điểm đi, cell1 = điểm đến, cell2 = vị trí, cell3 = ghi chú
            // 2. cell0 = tuyến, cell1 = vị trí, cell2 = ghi chú
            // 3. cell0 = điểm đi, cell1 = vị trí, cell2 = điểm đến, cell3 = ghi chú
            
            let diemDi = '';
            let diemDen = '';
            let viTri = '';
            let ghiChu = '';
            
            // TRƯỜNG HỢP 1: Nếu cell0 chứa "->" hoặc "→" (tuyến đường)
            if (cell0.includes('->') || cell0.includes('→') || cell0.includes('-')) {
                const parts = cell0.split(/->|→|-/).map(p => p.trim());
                if (parts.length >= 2) {
                    diemDi = parts[0];
                    diemDen = parts[1];
                    viTri = cell1 || '';
                    ghiChu = cell2 || '';
                }
            }
            // TRƯỜNG HỢP 2: Nếu cell1 chứa dấu hiệu là vị trí (có từ "điểm", "bến", "ngã", "số")
            else if (cell1.includes('điểm') || cell1.includes('bến') || cell1.includes('ngã') || cell1.includes('số')) {
                diemDi = cell0;
                viTri = cell1;
                diemDen = cell2 || 'Chưa xác định';
                ghiChu = cell3 || '';
            }
            // TRƯỜNG HỢP 3: Mặc định giả sử cột 0,1,2,3
            else {
                diemDi = cell0;
                diemDen = cell1 || 'Chưa xác định';
                viTri = cell2 || '';
                ghiChu = cell3 || '';
            }
            
            // Chỉ thêm nếu có thông tin
            if ((diemDi || diemDen) && viTri) {
                data.push({
                    id: data.length + 1,
                    diemDi: diemDi || 'Chưa xác định',
                    diemDen: diemDen || 'Chưa xác định',
                    viTri: viTri,
                    ghiChu: ghiChu
                });
            }
        });
        
        console.log(`Đã xử lý ${data.length} dòng dữ liệu vị trí`);
        return data;
    }

    // Hiển thị bảng giá vé
    function displayGiaveData() {
        const tbody = document.getElementById('ticket-table-body');
        
        if (!giaveData || giaveData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-exclamation-circle"></i> Không có dữ liệu giá vé.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        giaveData.forEach((item, index) => {
            const formattedPrice = item.giaVe > 0 ? 
                new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(item.giaVe) : 
                'Liên hệ';
            
            const rowClass = index % 2 === 0 ? 'even' : 'odd';
            
            html += `
                <tr class="${rowClass}">
                    <td><strong>${item.diemDi}</strong></td>
                    <td><strong>${item.diemDen}</strong></td>
                    <td class="price">${formattedPrice}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Thêm CSS
        const style = document.createElement('style');
        style.textContent = `
            .price {
                color: #e74c3c;
                font-weight: bold;
                font-size: 1.1rem;
            }
            tr.even {
                background-color: #f8f9fa;
            }
            tr:hover {
                background-color: #e9ecef;
            }
        `;
        document.head.appendChild(style);
        
        console.log(`Đã hiển thị ${giaveData.length} dòng giá vé`);
    }

    // Hiển thị giờ xuất bến
    function displayGioxuatbenData() {
        const container = document.getElementById('phone-schedule-content');
        
        if (!gioxuatbenData || gioxuatbenData.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-clock" style="font-size: 2rem; margin-bottom: 15px;"></i>
                    <h4>Không có dữ liệu giờ xuất bến</h4>
                    <p>Vui lòng liên hệ hotline để biết lịch trình.</p>
                    <div style="margin-top: 20px;">
                        <button onclick="loadAllData()" style="padding: 8px 20px; background: #2c5aa0; color: white; border: none; border-radius: 5px;">
                            <i class="fas fa-redo"></i> Tải lại
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // Nhóm theo tuyến đường
        const groupedData = {};
        gioxuatbenData.forEach(item => {
            const key = `${item.diemDi} → ${item.diemDen}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    diemDi: item.diemDi,
                    diemDen: item.diemDen,
                    schedules: []
                };
            }
            groupedData[key].schedules.push({
                gioXuatBen: item.gioXuatBen,
                soDienThoai: item.soDienThoai
            });
        });
        
        let html = '';
        Object.values(groupedData).forEach(group => {
            html += `
                <div class="schedule-card">
                    <div class="route-header">
                        <h3><i class="fas fa-route"></i> ${group.diemDi} → ${group.diemDen}</h3>
                        <span class="badge">${group.schedules.length} chuyến</span>
                    </div>
                    <div class="schedule-list">
            `;
            
            group.schedules.forEach(schedule => {
                html += `
                    <div class="schedule-item">
                        <div class="time">
                            <i class="far fa-clock"></i>
                            <span>${schedule.gioXuatBen}</span>
                        </div>
                        <div class="phone">
                            <i class="fas fa-phone"></i>
                            <a href="tel:${schedule.soDienThoai.replace(/\s+/g, '')}">
                                ${schedule.soDienThoai}
                            </a>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Thêm CSS
        const style = document.createElement('style');
        style.textContent = `
            .schedule-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.08);
                border-left: 4px solid #2c5aa0;
            }
            .route-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .route-header h3 {
                margin: 0;
                color: #2c5aa0;
                font-size: 1.2rem;
            }
            .badge {
                background: #2c5aa0;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.9rem;
            }
            .schedule-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 10px;
            }
            .schedule-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .time, .phone {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .phone a {
                color: #28a745;
                text-decoration: none;
                font-weight: 500;
            }
            .phone a:hover {
                text-decoration: underline;
            }
            @media (max-width: 768px) {
                .schedule-list {
                    grid-template-columns: 1fr;
                }
                .schedule-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }
            }
        `;
        document.head.appendChild(style);
        
        console.log(`Đã hiển thị ${Object.keys(groupedData).length} tuyến giờ xuất bến`);
    }

    // Hàm tìm kiếm
    function searchRoute() {
        const searchInput = document.getElementById('route-search-input');
        const searchTerm = searchInput.value.trim().toLowerCase();
        const resultsContainer = document.getElementById('route-results-container');
        const resultsCount = document.getElementById('search-results-count');
        
        if (!searchTerm) {
            resultsContainer.innerHTML = `
                <div class="no-search">
                    <i class="fas fa-search"></i>
                    <p>Vui lòng nhập điểm đi/đến để tìm kiếm</p>
                </div>
            `;
            resultsCount.style.display = 'none';
            return;
        }
        
        // Tìm kiếm
        const allData = [...giaveData, ...gioxuatbenData, ...vitriData];
        const filtered = allData.filter(item => 
            item.diemDi.toLowerCase().includes(searchTerm) || 
            item.diemDen.toLowerCase().includes(searchTerm)
        );
        
        const uniqueRoutes = [...new Set(filtered.map(item => `${item.diemDi}-${item.diemDen}`))];
        
        if (uniqueRoutes.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không tìm thấy kết quả cho "${searchTerm}"</p>
                </div>
            `;
            resultsCount.style.display = 'none';
            return;
        }
        
        resultsCount.innerHTML = `Tìm thấy ${uniqueRoutes.length} kết quả`;
        resultsCount.style.display = 'block';
        
        // Hiển thị kết quả (đơn giản)
        let html = '';
        uniqueRoutes.forEach((route, index) => {
            const [diemDi, diemDen] = route.split('-');
            html += `
                <div class="route-item">
                    <h4>${diemDi} → ${diemDen}</h4>
                    <p>Tuyến đường có sẵn, vui lòng liên hệ hotline để biết chi tiết.</p>
                    <button onclick="window.location.href='tel:0948531333'" class="call-btn">
                        <i class="fas fa-phone"></i> Gọi đặt vé
                    </button>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
    }

    // Tải tất cả dữ liệu
    async function loadAllData() {
        console.log('=== BẮT ĐẦU TẢI DỮ LIỆU ===');
        
        try {
            // Hiển thị loading
            showLoading();
            
            // Tải dữ liệu
            const [giaveRows, gioxuatbenRows, vitriRows] = await Promise.all([
                fetchGoogleSheetData(API_URLS.giave, 'giave'),
                fetchGoogleSheetData(API_URLS.gioxuatben, 'gioxuatben'),
                fetchGoogleSheetData(API_URLS.vitri, 'vitri')
            ]);
            
            // Xử lý dữ liệu
            giaveData = processGiaveData(giaveRows);
            gioxuatbenData = processGioxuatbenData(gioxuatbenRows);
            vitriData = processVitriData(vitriRows);
            
            console.log('Kết quả xử lý:', {
                giave: giaveData.length,
                gioxuatben: gioxuatbenData.length,
                vitri: vitriData.length
            });
            
            // Hiển thị dữ liệu
            displayGiaveData();
            displayGioxuatbenData();
            
            // Log thông tin chi tiết
            if (gioxuatbenData.length > 0) {
                console.log('Mẫu dữ liệu giờ xuất bến (3 dòng đầu):', 
                    gioxuatbenData.slice(0, 3).map(d => ({
                        diemDi: d.diemDi,
                        diemDen: d.diemDen,
                        gio: d.gioXuatBen,
                        phone: d.soDienThoai
                    }))
                );
            }
            
            if (vitriData.length > 0) {
                console.log('Mẫu dữ liệu vị trí (3 dòng đầu):',
                    vitriData.slice(0, 3).map(d => ({
                        diemDi: d.diemDi,
                        diemDen: d.diemDen,
                        viTri: d.viTri,
                        ghiChu: d.ghiChu
                    }))
                );
            }
            
            console.log('=== HOÀN TẤT TẢI DỮ LIỆU ===');
            
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            alert('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
        }
    }

    // Hiển thị loading
    function showLoading() {
        const tbody = document.getElementById('ticket-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p>Đang tải dữ liệu...</p>
                </td>
            </tr>
        `;
        
        const container = document.getElementById('phone-schedule-content');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Đang tải dữ liệu...</p>
            </div>
        `;
    }

    // Khởi tạo sự kiện
    function initializeEvents() {
        // Nút tìm kiếm
        const searchBtn = document.getElementById('search-route-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchRoute);
        }
        
        // Enter để tìm kiếm
        const searchInput = document.getElementById('route-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchRoute();
                }
            });
        }
    }

    // Bắt đầu ứng dụng
    initializeEvents();
    loadAllData();
});
