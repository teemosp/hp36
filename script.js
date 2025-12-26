// script.js - SỬA LỖI CẤU TRÚC VÀ THỜI GIAN
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM đã sẵn sàng, bắt đầu khởi tạo...');
    
    const API_URLS = {
        giave: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=giave',
        gioxuatben: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=gioxuatben',
        vitri: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=vitri'
    };

    let giaveData = [];
    let gioxuatbenData = [];
    let vitriData = [];

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

    // Hàm fetch dữ liệu
    async function fetchGoogleSheetData(url, sheetName) {
        try {
            const response = await fetch(url + '&t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const text = await response.text();
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const jsonText = text.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonText);
            
            return data.table ? data.table.rows : [];
        } catch (error) {
            console.error(`Lỗi khi fetch ${sheetName}:`, error);
            return [];
        }
    }

    // Hàm chuyển đổi thời gian Date(1899,11,30,6,30,0) → "06:30"
    function convertGoogleDate(dateStr) {
        if (!dateStr) return '';
        
        // Nếu đã là định dạng hh:mm
        if (typeof dateStr === 'string' && dateStr.includes(':')) {
            return dateStr;
        }
        
        // Nếu là định dạng Date(1899,11,30,6,30,0)
        if (typeof dateStr === 'string' && dateStr.startsWith('Date(')) {
            try {
                // Lấy các tham số: Date(year,month,day,hour,minute,second)
                const match = dateStr.match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
                if (match) {
                    const hour = parseInt(match[4]);
                    const minute = parseInt(match[5]);
                    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                }
            } catch (e) {
                console.error('Lỗi chuyển đổi thời gian:', e);
            }
        }
        
        return dateStr || '';
    }

    // Xử lý dữ liệu giá vé (đã hoạt động)
    function processGiaveData(rows) {
        const data = [];
        
        if (!rows || !Array.isArray(rows)) return data;
        
        rows.forEach((row, index) => {
            if (!row.c) return;
            
            const diemDi = row.c[0] ? (row.c[0].v || '').toString().trim() : '';
            const diemDen = row.c[1] ? (row.c[1].v || '').toString().trim() : '';
            const giaVeRaw = row.c[2] ? row.c[2].v : '';
            
            // Bỏ qua hàng tiêu đề
            if (index === 0 && (diemDi === 'Thanh Hóa' || diemDi === 'Điểm đi')) return;
            
            if (!diemDi && !diemDen) return;
            
            let giaVe = 0;
            if (giaVeRaw) {
                if (typeof giaVeRaw === 'number') {
                    giaVe = giaVeRaw;
                } else if (typeof giaVeRaw === 'string') {
                    const cleaned = giaVeRaw.replace(/[^\d]/g, '');
                    giaVe = parseInt(cleaned) || 0;
                }
            }
            
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

    // Xử lý dữ liệu giờ xuất bến - CẤU TRÚC MỚI: Bến đi | giờ | Số điện thoại
    function processGioxuatbenData(rows) {
        const data = [];
        
        if (!rows || !Array.isArray(rows)) return data;
        
        console.log('Cấu trúc dữ liệu gioxuatben (3 dòng đầu):');
        for (let i = 0; i < Math.min(3, rows.length); i++) {
            if (rows[i].c) {
                console.log(`Dòng ${i}:`, rows[i].c.map((cell, idx) => 
                    cell ? `Cột ${idx}: "${cell.v}" (${typeof cell.v})` : `Cột ${idx}: null`
                ));
            }
        }
        
        rows.forEach((row, index) => {
            if (!row.c) return;
            
            // CẤU TRÚC TỪ LOG: 
            // Cột 0: "Thái Nguyên" (Bến đi)
            // Cột 1: "Date(1899,11,30,6,30,0)" (giờ) - CẦN CHUYỂN ĐỔI
            // Cột 2: "0963529789" (Số điện thoại)
            
            const benDi = row.c[0] ? (row.c[0].v || '').toString().trim() : '';
            const gioRaw = row.c[1] ? row.c[1].v : '';
            const soDienThoai = row.c[2] ? (row.c[2].v || '').toString().trim() : '';
            
            // Bỏ qua hàng tiêu đề
            if (index === 0 && (benDi === 'Bến đi' || benDi === 'Điểm đi')) {
                console.log('Bỏ qua hàng tiêu đề giờ xuất bến');
                return;
            }
            
            // Bỏ qua hàng trống
            if (!benDi && !gioRaw) return;
            
            // Chuyển đổi thời gian
            const gioXuatBen = convertGoogleDate(gioRaw);
            
            // Sheet này chỉ có "Bến đi", không có "Bến đến"
            // Giả sử tất cả đều đi từ các tỉnh về Thanh Hóa hoặc ngược lại
            const diemDen = 'Thanh Hóa'; // Mặc định
            
            data.push({
                id: data.length + 1,
                diemDi: benDi || 'Chưa xác định',
                diemDen: diemDen,
                gioXuatBen: gioXuatBen || 'Chưa có lịch',
                soDienThoai: soDienThoai || '0948.531.333'
            });
        });
        
        console.log(`Đã xử lý ${data.length} dòng dữ liệu giờ xuất bến`);
        return data;
    }

    // Xử lý dữ liệu vị trí - CẤU TRÚC MỚI: Bến đi | giờ đi | biển kiểm soát | số điện thoại | Loại xe
    function processVitriData(rows) {
        const data = [];
        
        if (!rows || !Array.isArray(rows)) return data;
        
        console.log('Cấu trúc dữ liệu vitri (3 dòng đầu):');
        for (let i = 0; i < Math.min(3, rows.length); i++) {
            if (rows[i].c) {
                console.log(`Dòng ${i}:`, rows[i].c.map((cell, idx) => 
                    cell ? `Cột ${idx}: "${cell.v}"` : `Cột ${idx}: null`
                ));
            }
        }
        
        rows.forEach((row, index) => {
            if (!row.c) return;
            
            // CẤU TRÚC TỪ LOG:
            // Cột 0: "Bến đi" (string)
            // Cột 1: "giờ đi" (datetime - Date())
            // Cột 2: "biển kiểm soát" (string)
            // Cột 3: "số điện thoại" (string)
            // Cột 4: "Loại xe" (string)
            
            const benDi = row.c[0] ? (row.c[0].v || '').toString().trim() : '';
            const gioDiRaw = row.c[1] ? row.c[1].v : '';
            const bienKiemSoat = row.c[2] ? (row.c[2].v || '').toString().trim() : '';
            const soDienThoai = row.c[3] ? (row.c[3].v || '').toString().trim() : '';
            const loaiXe = row.c[4] ? (row.c[4].v || '').toString().trim() : '';
            
            // Bỏ qua hàng tiêu đề
            if (index === 0 && (benDi === 'Bến đi' || benDi === 'Điểm đi')) {
                console.log('Bỏ qua hàng tiêu đề vị trí');
                return;
            }
            
            // Bỏ qua hàng trống
            if (!benDi && !bienKiemSoat) return;
            
            // Chuyển đổi thời gian
            const gioDi = convertGoogleDate(gioDiRaw);
            
            // Tạo vị trí từ thông tin có sẵn
            let viTri = '';
            let ghiChu = '';
            
            if (bienKiemSoat) {
                viTri = `Xe biển số: ${bienKiemSoat}`;
                if (loaiXe) {
                    viTri += ` (${loaiXe})`;
                }
            } else if (benDi) {
                viTri = `Bến đi: ${benDi}`;
            }
            
            if (gioDi) {
                ghiChu = `Giờ đi: ${gioDi}`;
                if (soDienThoai) {
                    ghiChu += ` - SĐT: ${soDienThoai}`;
                }
            } else if (soDienThoai) {
                ghiChu = `SĐT: ${soDienThoai}`;
            }
            
            // Giả sử điểm đến là Thanh Hóa (hoặc ngược lại)
            const diemDen = 'Thanh Hóa';
            
            data.push({
                id: data.length + 1,
                diemDi: benDi || 'Chưa xác định',
                diemDen: diemDen,
                viTri: viTri || 'Chưa xác định',
                ghiChu: ghiChu
            });
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
                    <td colspan="3" style="text-align:center; padding:40px; color:#666;">
                        <i class="fas fa-info-circle"></i> Không có dữ liệu giá vé
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
            
            html += `
                <tr>
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
            }
            tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            tr:hover {
                background-color: #e9ecef;
            }
        `;
        document.head.appendChild(style);
        
        console.log(`Đã hiển thị ${giaveData.length} mục giá vé`);
    }

    // Hiển thị giờ xuất bến
    function displayGioxuatbenData() {
        const container = document.getElementById('phone-schedule-content');
        
        if (!gioxuatbenData || gioxuatbenData.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#666;">
                    <i class="fas fa-clock fa-2x"></i>
                    <p>Không có dữ liệu giờ xuất bến</p>
                </div>
            `;
            return;
        }
        
        // Nhóm theo điểm đi (vì tất cả đều đến Thanh Hóa)
        const groupedData = {};
        gioxuatbenData.forEach(item => {
            const key = item.diemDi;
            if (!groupedData[key]) {
                groupedData[key] = {
                    diemDi: item.diemDi,
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
                        <h3><i class="fas fa-bus"></i> ${group.diemDi} → Thanh Hóa</h3>
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
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
                <div style="text-align:center; padding:40px; color:#666;">
                    <i class="fas fa-search fa-2x"></i>
                    <p>Nhập điểm đi hoặc điểm đến để tìm kiếm</p>
                </div>
            `;
            resultsCount.style.display = 'none';
            return;
        }
        
        // Kết hợp dữ liệu từ 3 nguồn
        const combinedResults = {};
        
        // Thêm từ giá vé
        giaveData.forEach(item => {
            if (item.diemDi.toLowerCase().includes(searchTerm) || 
                item.diemDen.toLowerCase().includes(searchTerm)) {
                const key = `${item.diemDi}-${item.diemDen}`;
                if (!combinedResults[key]) {
                    combinedResults[key] = {
                        diemDi: item.diemDi,
                        diemDen: item.diemDen,
                        giaVe: item.giaVe,
                        schedules: [],
                        locations: []
                    };
                }
                combinedResults[key].giaVe = item.giaVe;
            }
        });
        
        // Thêm từ giờ xuất bến
        gioxuatbenData.forEach(item => {
            if (item.diemDi.toLowerCase().includes(searchTerm) || 
                item.diemDen.toLowerCase().includes(searchTerm)) {
                const key = `${item.diemDi}-${item.diemDen}`;
                if (!combinedResults[key]) {
                    combinedResults[key] = {
                        diemDi: item.diemDi,
                        diemDen: item.diemDen,
                        giaVe: 0,
                        schedules: [],
                        locations: []
                    };
                }
                combinedResults[key].schedules.push({
                    gioXuatBen: item.gioXuatBen,
                    soDienThoai: item.soDienThoai
                });
            }
        });
        
        // Thêm từ vị trí
        vitriData.forEach(item => {
            if (item.diemDi.toLowerCase().includes(searchTerm) || 
                item.diemDen.toLowerCase().includes(searchTerm)) {
                const key = `${item.diemDi}-${item.diemDen}`;
                if (!combinedResults[key]) {
                    combinedResults[key] = {
                        diemDi: item.diemDi,
                        diemDen: item.diemDen,
                        giaVe: 0,
                        schedules: [],
                        locations: []
                    };
                }
                combinedResults[key].locations.push({
                    viTri: item.viTri,
                    ghiChu: item.ghiChu
                });
            }
        });
        
        const uniqueRoutes = Object.keys(combinedResults);
        
        if (uniqueRoutes.length === 0) {
            resultsContainer.innerHTML = `
                <div style="text-align:center; padding:40px; color:#666;">
                    <i class="fas fa-exclamation-circle fa-2x"></i>
                    <p>Không tìm thấy kết quả cho "${searchTerm}"</p>
                </div>
            `;
            resultsCount.style.display = 'none';
            return;
        }
        
        resultsCount.innerHTML = `Tìm thấy ${uniqueRoutes.length} kết quả cho "${searchTerm}"`;
        resultsCount.style.display = 'block';
        
        let html = '';
        Object.values(combinedResults).forEach(route => {
            const formattedPrice = route.giaVe > 0 ? 
                new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(route.giaVe) : 
                'Liên hệ';
            
            html += `
                <div class="route-card">
                    <h3>${route.diemDi} → ${route.diemDen}</h3>
                    <p class="price">Giá vé: ${formattedPrice}</p>
                    
                    ${route.schedules.length > 0 ? `
                        <div class="schedules">
                            <h4>Giờ xuất bến:</h4>
                            ${route.schedules.map(s => `
                                <div class="schedule">
                                    <span>${s.gioXuatBen}</span>
                                    <a href="tel:${s.soDienThoai.replace(/\s+/g, '')}">${s.soDienThoai}</a>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${route.locations.length > 0 ? `
                        <div class="locations">
                            <h4>Thông tin xe:</h4>
                            ${route.locations.map(l => `
                                <div class="location">
                                    <p>${l.viTri}</p>
                                    ${l.ghiChu ? `<small>${l.ghiChu}</small>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <button class="call-btn" onclick="window.location.href='tel:0948531333'">
                        <i class="fas fa-phone"></i> Gọi đặt vé: 0948.531.333
                    </button>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        
        // Thêm CSS
        const style = document.createElement('style');
        style.textContent = `
            .route-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .route-card h3 {
                color: #2c5aa0;
                margin: 0 0 10px 0;
            }
            .price {
                color: #e74c3c;
                font-weight: bold;
                font-size: 1.1rem;
            }
            .schedules, .locations {
                margin: 15px 0;
            }
            .schedules h4, .locations h4 {
                color: #495057;
                margin-bottom: 8px;
            }
            .schedule, .location {
                padding: 8px 12px;
                background: #f8f9fa;
                border-radius: 6px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .call-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 15px;
            }
            .call-btn:hover {
                background: #218838;
            }
        `;
        document.head.appendChild(style);
    }

    // Tải tất cả dữ liệu
    async function loadAllData() {
        console.log('Bắt đầu tải dữ liệu...');
        
        try {
            // Hiển thị loading
            document.getElementById('ticket-table-body').innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center; padding:40px;">
                        <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                    </td>
                </tr>
            `;
            
            document.getElementById('phone-schedule-content').innerHTML = `
                <div style="text-align:center; padding:40px;">
                    <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                </div>
            `;
            
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
            
            // Hiển thị dữ liệu
            displayGiaveData();
            displayGioxuatbenData();
            
            console.log('Tải dữ liệu hoàn tất:', {
                giave: giaveData.length,
                gioxuatben: gioxuatbenData.length,
                vitri: vitriData.length
            });
            
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            
            document.getElementById('ticket-table-body').innerHTML = `
                <tr>
                    <td colspan="3" style="text-align:center; padding:40px; color:#dc3545;">
                        <i class="fas fa-exclamation-triangle"></i> Lỗi khi tải dữ liệu
                    </td>
                </tr>
            `;
            
            document.getElementById('phone-schedule-content').innerHTML = `
                <div style="text-align:center; padding:40px; color:#dc3545;">
                    <i class="fas fa-exclamation-triangle"></i> Lỗi khi tải dữ liệu
                </div>
            `;
        }
    }

    // Khởi tạo sự kiện
    function initializeEvents() {
        document.getElementById('search-route-btn').addEventListener('click', searchRoute);
        
        document.getElementById('route-search-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchRoute();
            }
        });
    }

    // Bắt đầu ứng dụng
    initializeEvents();
    loadAllData();
});
