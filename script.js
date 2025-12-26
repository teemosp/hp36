// script.js - ĐÃ SỬA LỖI
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM đã sẵn sàng, bắt đầu khởi tạo...');
    
    // Các API endpoints - ĐÃ KIỂM TRA LẠI
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
            
            // Xóa active class từ tất cả
            document.querySelectorAll('.nav-menu a').forEach(item => {
                item.classList.remove('active');
            });
            
            // Thêm active class cho link được click
            this.classList.add('active');
            
            // Ẩn tất cả sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Hiển thị section tương ứng
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
            
            console.log('Chuyển tab sang:', sectionId);
        });
    });

    // Hàm fetch dữ liệu từ Google Sheets - PHIÊN BẢN CẢI TIẾN
    async function fetchGoogleSheetData(url, sheetName) {
        console.log(`Bắt đầu fetch ${sheetName} từ:`, url);
        
        try {
            // Thêm timestamp để tránh cache
            const urlWithTimestamp = url + '&t=' + Date.now();
            const response = await fetch(urlWithTimestamp, {
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log(`Response status cho ${sheetName}:`, response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log(`Raw text từ ${sheetName} (đầu tiên 500 ký tự):`, text.substring(0, 500));
            
            // Kiểm tra xem có phải là JSONP không
            if (text.includes('google.visualization.Query.setResponse')) {
                // Xử lý JSONP response
                const jsonStart = text.indexOf('{');
                const jsonEnd = text.lastIndexOf('}') + 1;
                
                if (jsonStart === -1 || jsonEnd === -1) {
                    throw new Error(`Không tìm thấy JSON trong response từ ${sheetName}`);
                }
                
                const jsonText = text.substring(jsonStart, jsonEnd);
                console.log(`JSON text từ ${sheetName}:`, jsonText.substring(0, 300));
                
                const data = JSON.parse(jsonText);
                console.log(`Parsed data từ ${sheetName}:`, data);
                
                // Trích xuất dữ liệu từ cấu trúc Google Sheets
                if (data.table && data.table.rows) {
                    const rows = data.table.rows;
                    console.log(`Tìm thấy ${rows.length} rows trong ${sheetName}`);
                    
                    // Hiển thị cấu trúc của row đầu tiên để debug
                    if (rows.length > 0 && rows[0].c) {
                        console.log(`Cấu trúc row đầu tiên trong ${sheetName}:`, rows[0].c.map((cell, idx) => 
                            `Cột ${idx}: ${cell ? cell.v : 'null'}`
                        ));
                    }
                    
                    return rows;
                } else {
                    console.warn(`Không tìm thấy cấu trúc table.rows trong ${sheetName}`, data);
                    return [];
                }
            } else {
                // Thử parse trực tiếp nếu không phải JSONP
                console.log('Thử parse trực tiếp như JSON thông thường...');
                const data = JSON.parse(text);
                return data.table ? data.table.rows : [];
            }
        } catch (error) {
            console.error(`Lỗi nghiêm trọng khi fetch ${sheetName}:`, error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            
            // Trả về mảng rỗng để không làm crash toàn bộ ứng dụng
            return [];
        }
    }

    // Xử lý dữ liệu giá vé - PHIÊN BẢN MẠNH MẼ HƠN
    function processGiaveData(rows) {
        console.log('Bắt đầu xử lý dữ liệu giá vé, số rows:', rows ? rows.length : 0);
        
        const data = [];
        
        if (!rows || !Array.isArray(rows)) {
            console.error('Dữ liệu giá vé không hợp lệ:', rows);
            return data;
        }
        
        // Xác định chỉ số cột dựa trên dữ liệu thực tế
        let colDiemDi = 0;
        let colDiemDen = 1;
        let colGiaVe = 2;
        
        rows.forEach((row, index) => {
            try {
                if (!row.c) {
                    console.warn(`Row ${index} không có thuộc tính c`);
                    return;
                }
                
                // Lấy giá trị từ các cell
                const diemDi = row.c[colDiemDi] ? (row.c[colDiemDi].v || '').toString().trim() : '';
                const diemDen = row.c[colDiemDen] ? (row.c[colDiemDen].v || '').toString().trim() : '';
                const giaVeRaw = row.c[colGiaVe] ? row.c[colGiaVe].v : '';
                
                // Debug row
                if (index < 3) { // Chỉ log 3 row đầu để debug
                    console.log(`Row ${index}:`, {
                        diemDi,
                        diemDen,
                        giaVeRaw,
                        rawRow: row.c.map(cell => cell ? cell.v : 'null')
                    });
                }
                
                // Bỏ qua hàng trống hoặc hàng tiêu đề
                if (!diemDi && !diemDen) {
                    return;
                }
                
                // Kiểm tra xem có phải là hàng tiêu đề không
                if (index === 0 && (diemDi === 'Điểm đi' || diemDi === 'diemdi' || diemDi === 'Điểm Đi')) {
                    console.log('Bỏ qua hàng tiêu đề');
                    return;
                }
                
                // Xử lý giá vé
                let giaVe = 0;
                if (giaVeRaw) {
                    if (typeof giaVeRaw === 'number') {
                        giaVe = giaVeRaw;
                    } else if (typeof giaVeRaw === 'string') {
                        // Loại bỏ ký tự không phải số, trừ dấu chấm cho số thập phân
                        const cleaned = giaVeRaw.replace(/[^\d.]/g, '');
                        if (cleaned) {
                            giaVe = parseFloat(cleaned);
                            if (isNaN(giaVe)) giaVe = 0;
                        }
                    }
                }
                
                // Thêm vào mảng nếu có dữ liệu
                if (diemDi || diemDen) {
                    data.push({
                        id: data.length + 1,
                        diemDi: diemDi || 'Chưa xác định',
                        diemDen: diemDen || 'Chưa xác định',
                        giaVe: giaVe
                    });
                }
            } catch (rowError) {
                console.error(`Lỗi khi xử lý row ${index} của giá vé:`, rowError);
            }
        });
        
        console.log(`Đã xử lý xong giá vé: ${data.length} mục`);
        return data;
    }

    // Xử lý dữ liệu giờ xuất bến
    function processGioxuatbenData(rows) {
        console.log('Bắt đầu xử lý dữ liệu giờ xuất bến, số rows:', rows ? rows.length : 0);
        
        const data = [];
        
        if (!rows || !Array.isArray(rows)) {
            console.error('Dữ liệu giờ xuất bến không hợp lệ:', rows);
            return data;
        }
        
        // Xác định chỉ số cột
        let colDiemDi = 0;
        let colDiemDen = 1;
        let colGioXuatBen = 2;
        let colSoDienThoai = 3;
        
        rows.forEach((row, index) => {
            try {
                if (!row.c) {
                    console.warn(`Row ${index} không có thuộc tính c (gioxuatben)`);
                    return;
                }
                
                const diemDi = row.c[colDiemDi] ? (row.c[colDiemDi].v || '').toString().trim() : '';
                const diemDen = row.c[colDiemDen] ? (row.c[colDiemDen].v || '').toString().trim() : '';
                const gioXuatBen = row.c[colGioXuatBen] ? (row.c[colGioXuatBen].v || '').toString().trim() : '';
                const soDienThoai = row.c[colSoDienThoai] ? (row.c[colSoDienThoai].v || '').toString().trim() : '0948.531.333';
                
                // Bỏ qua hàng trống
                if (!diemDi && !diemDen && !gioXuatBen) {
                    return;
                }
                
                // Bỏ qua hàng tiêu đề
                if (index === 0 && (diemDi === 'Điểm đi' || diemDi === 'Tuyến' || diemDi.toLowerCase().includes('điểm'))) {
                    console.log('Bỏ qua hàng tiêu đề giờ xuất bến');
                    return;
                }
                
                // Thêm vào mảng
                if (diemDi || diemDen) {
                    data.push({
                        id: data.length + 1,
                        diemDi: diemDi || 'Chưa xác định',
                        diemDen: diemDen || 'Chưa xác định',
                        gioXuatBen: gioXuatBen || 'Chưa có lịch',
                        soDienThoai: soDienThoai || '0948.531.333'
                    });
                }
            } catch (rowError) {
                console.error(`Lỗi khi xử lý row ${index} của giờ xuất bến:`, rowError);
            }
        });
        
        console.log(`Đã xử lý xong giờ xuất bến: ${data.length} mục`);
        return data;
    }

    // Xử lý dữ liệu vị trí
    function processVitriData(rows) {
        console.log('Bắt đầu xử lý dữ liệu vị trí, số rows:', rows ? rows.length : 0);
        
        const data = [];
        
        if (!rows || !Array.isArray(rows)) {
            console.error('Dữ liệu vị trí không hợp lệ:', rows);
            return data;
        }
        
        rows.forEach((row, index) => {
            try {
                if (!row.c) {
                    console.warn(`Row ${index} không có thuộc tính c (vitri)`);
                    return;
                }
                
                const diemDi = row.c[0] ? (row.c[0].v || '').toString().trim() : '';
                const diemDen = row.c[1] ? (row.c[1].v || '').toString().trim() : '';
                const viTri = row.c[2] ? (row.c[2].v || '').toString().trim() : '';
                const ghiChu = row.c[3] ? (row.c[3].v || '').toString().trim() : '';
                
                // Bỏ qua hàng trống
                if (!diemDi && !diemDen && !viTri) {
                    return;
                }
                
                // Bỏ qua hàng tiêu đề
                if (index === 0 && (diemDi === 'Điểm đi' || diemDi === 'Tuyến' || diemDi.toLowerCase().includes('điểm'))) {
                    console.log('Bỏ qua hàng tiêu đề vị trí');
                    return;
                }
                
                // Thêm vào mảng
                if (diemDi || diemDen) {
                    data.push({
                        id: data.length + 1,
                        diemDi: diemDi || 'Chưa xác định',
                        diemDen: diemDen || 'Chưa xác định',
                        viTri: viTri || 'Chưa xác định',
                        ghiChu: ghiChu
                    });
                }
            } catch (rowError) {
                console.error(`Lỗi khi xử lý row ${index} của vị trí:`, rowError);
            }
        });
        
        console.log(`Đã xử lý xong vị trí: ${data.length} mục`);
        return data;
    }

    // Hiển thị bảng giá vé
    function displayGiaveData() {
        const tbody = document.getElementById('ticket-table-body');
        console.log('Hiển thị dữ liệu giá vé, số lượng:', giaveData.length);
        
        if (!giaveData || giaveData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 40px; color: #666; background: #f8f9fa; border-radius: 8px;">
                        <div style="margin-bottom: 15px;">
                            <i class="fas fa-database" style="font-size: 2rem; color: #6c757d;"></i>
                        </div>
                        <h4 style="color: #495057; margin-bottom: 10px;">Không có dữ liệu giá vé</h4>
                        <p>Vui lòng kiểm tra kết nối hoặc liên hệ hotline để biết giá vé hiện tại.</p>
                        <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 20px; background: #2c5aa0; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-redo"></i> Tải lại trang
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        giaveData.forEach((item, index) => {
            // Định dạng giá tiền
            let formattedPrice = 'Liên hệ';
            if (item.giaVe > 0) {
                formattedPrice = new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(item.giaVe);
            }
            
            // Thêm class xen kẽ cho các hàng
            const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
            
            html += `
                <tr class="${rowClass}">
                    <td><strong>${item.diemDi}</strong></td>
                    <td><strong>${item.diemDen}</strong></td>
                    <td class="price-cell">${formattedPrice}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Thêm CSS cho bảng
        const style = document.createElement('style');
        style.textContent = `
            .price-cell {
                color: #e74c3c;
                font-weight: bold;
                font-size: 1.1rem;
            }
            .even-row {
                background-color: #f8f9fa;
            }
            .odd-row {
                background-color: white;
            }
            .even-row:hover, .odd-row:hover {
                background-color: #e9ecef;
            }
        `;
        document.head.appendChild(style);
        
        // Cập nhật số lượng trong tab
        updateTabCount('ticket-prices', giaveData.length);
    }

    // Hiển thị giờ xuất bến & số điện thoại
    function displayGioxuatbenData() {
        const container = document.getElementById('phone-schedule-content');
        console.log('Hiển thị dữ liệu giờ xuất bến, số lượng:', gioxuatbenData.length);
        
        if (!gioxuatbenData || gioxuatbenData.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px;">
                    <div style="margin-bottom: 15px;">
                        <i class="fas fa-clock" style="font-size: 2rem; color: #6c757d;"></i>
                    </div>
                    <h4 style="color: #495057; margin-bottom: 10px;">Không có dữ liệu giờ xuất bến</h4>
                    <p>Vui lòng liên hệ hotline để biết lịch trình chính xác.</p>
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
        Object.values(groupedData).forEach((group, index) => {
            const cardClass = index % 2 === 0 ? 'schedule-card-even' : 'schedule-card-odd';
            
            html += `
                <div class="schedule-card ${cardClass}">
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
                            <span class="time-value">${schedule.gioXuatBen}</span>
                        </div>
                        <div class="phone">
                            <i class="fas fa-phone"></i>
                            <a href="tel:${schedule.soDienThoai.replace(/\s+/g, '')}" class="phone-link">
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
        
        // Thêm CSS cho schedule
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
            .schedule-card-even {
                border-left-color: #2c5aa0;
            }
            .schedule-card-odd {
                border-left-color: #e67e22;
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
                font-weight: 500;
            }
            .schedule-list {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 12px;
            }
            .schedule-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 15px;
                background: #f8f9fa;
                border-radius: 8px;
                transition: all 0.3s;
            }
            .schedule-item:hover {
                background: #e9ecef;
                transform: translateY(-2px);
                box-shadow: 0 3px 8px rgba(0,0,0,0.1);
            }
            .time, .phone {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .time-value {
                font-weight: 600;
                color: #2c5aa0;
            }
            .phone-link {
                color: #28a745;
                text-decoration: none;
                font-weight: 500;
            }
            .phone-link:hover {
                text-decoration: underline;
            }
            @media (max-width: 768px) {
                .schedule-list {
                    grid-template-columns: 1fr;
                }
                .route-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                }
                .schedule-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Cập nhật số lượng trong tab
        updateTabCount('phone-schedule', gioxuatbenData.length);
    }

    // Hàm tìm kiếm tuyến đường
    function searchRoute() {
        console.log('Thực hiện tìm kiếm...');
        const searchInput = document.getElementById('route-search-input');
        const searchTerm = searchInput.value.trim().toLowerCase();
        const resultsContainer = document.getElementById('route-results-container');
        const resultsCount = document.getElementById('search-results-count');
        
        console.log('Từ khóa tìm kiếm:', searchTerm);
        
        if (!searchTerm) {
            resultsContainer.innerHTML = `
                <div class="no-search">
                    <i class="fas fa-search"></i>
                    <h4>Tìm kiếm tuyến đường</h4>
                    <p>Vui lòng nhập điểm đi hoặc điểm đến để tìm kiếm</p>
                    <p class="hint">Ví dụ: Thái Nguyên, Hà Nội, Thanh Hóa, Yên Nghĩa</p>
                </div>
            `;
            resultsCount.style.display = 'none';
            return;
        }
        
        // Tìm kiếm trong tất cả dữ liệu
        const giaveResults = giaveData.filter(item => 
            item.diemDi.toLowerCase().includes(searchTerm) || 
            item.diemDen.toLowerCase().includes(searchTerm)
        );
        
        const gioxuatbenResults = gioxuatbenData.filter(item => 
            item.diemDi.toLowerCase().includes(searchTerm) || 
            item.diemDen.toLowerCase().includes(searchTerm)
        );
        
        const vitriResults = vitriData.filter(item => 
            item.diemDi.toLowerCase().includes(searchTerm) || 
            item.diemDen.toLowerCase().includes(searchTerm)
        );
        
        console.log('Kết quả tìm kiếm:', {
            giave: giaveResults.length,
            gioxuatben: gioxuatbenResults.length,
            vitri: vitriResults.length
        });
        
        // Tạo Set để lấy các tuyến độc nhất
        const uniqueRoutes = new Set();
        [...giaveResults, ...gioxuatbenResults, ...vitriResults].forEach(item => {
            uniqueRoutes.add(`${item.diemDi}-${item.diemDen}`);
        });
        
        if (uniqueRoutes.size === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>Không tìm thấy kết quả</h4>
                    <p>Không tìm thấy tuyến đường nào cho "<strong>${searchTerm}</strong>"</p>
                    <p>Vui lòng thử với từ khóa khác hoặc liên hệ hotline để được tư vấn.</p>
                    <div class="suggestions" style="margin-top: 20px; text-align: left;">
                        <p><strong>Gợi ý:</strong></p>
                        <ul style="list-style: none; padding: 0;">
                            <li><i class="fas fa-check"></i> Thử tìm với từ khóa ngắn hơn</li>
                            <li><i class="fas fa-check"></i> Kiểm tra chính tả</li>
                            <li><i class="fas fa-check"></i> Liên hệ hotline: <strong>0948.531.333</strong></li>
                        </ul>
                    </div>
                </div>
            `;
            resultsCount.style.display = 'none';
            return;
        }
        
        // Hiển thị số kết quả
        resultsCount.innerHTML = `
            <i class="fas fa-search"></i> 
            Tìm thấy <strong>${uniqueRoutes.size}</strong> tuyến đường cho "<strong>${searchTerm}</strong>"
        `;
        resultsCount.style.display = 'block';
        
        // Kết hợp dữ liệu từ các nguồn
        const combinedResults = {};
        
        // Thêm kết quả từ giá vé
        giaveResults.forEach(item => {
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
        });
        
        // Thêm kết quả từ giờ xuất bến
        gioxuatbenResults.forEach(item => {
            const key = `${item.diemDi}-${item.diemDen}`;
            if (!combinedResults[key]) {
                combinedResults[key] = {
                    diemDi: item.diemDi,
                    diemDen: item.diemDen,
                    giaVe: combinedResults[key] ? combinedResults[key].giaVe : 0,
                    schedules: [],
                    locations: []
                };
            }
            combinedResults[key].schedules.push({
                gioXuatBen: item.gioXuatBen,
                soDienThoai: item.soDienThoai
            });
        });
        
        // Thêm kết quả từ vị trí
        vitriResults.forEach(item => {
            const key = `${item.diemDi}-${item.diemDen}`;
            if (!combinedResults[key]) {
                combinedResults[key] = {
                    diemDi: item.diemDi,
                    diemDen: item.diemDen,
                    giaVe: combinedResults[key] ? combinedResults[key].giaVe : 0,
                    schedules: [],
                    locations: []
                };
            }
            combinedResults[key].locations.push({
                viTri: item.viTri,
                ghiChu: item.ghiChu
            });
        });
        
        // Hiển thị kết quả
        let html = '';
        Object.values(combinedResults).forEach((route, index) => {
            const formattedPrice = route.giaVe > 0 ? 
                new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(route.giaVe) : 
                '<span class="contact-price">Liên hệ</span>';
            
            const cardClass = index % 2 === 0 ? 'result-card-even' : 'result-card-odd';
            
            html += `
                <div class="route-result-card ${cardClass}">
                    <div class="route-info">
                        <h3><i class="fas fa-bus"></i> ${route.diemDi} → ${route.diemDen}</h3>
                        <div class="route-price">
                            <i class="fas fa-tag"></i> Giá vé: <strong>${formattedPrice}</strong>
                        </div>
                    </div>
            `;
            
            // Hiển thị giờ xuất bến
            if (route.schedules.length > 0) {
                html += `
                    <div class="route-schedules">
                        <h4><i class="far fa-clock"></i> Giờ xuất bến (${route.schedules.length} chuyến):</h4>
                        <div class="schedule-list">
                `;
                
                route.schedules.forEach(schedule => {
                    html += `
                        <div class="schedule-item">
                            <span class="time">${schedule.gioXuatBen}</span>
                            <a href="tel:${schedule.soDienThoai.replace(/\s+/g, '')}" class="phone-link">
                                <i class="fas fa-phone"></i> ${schedule.soDienThoai}
                            </a>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            // Hiển thị vị trí
            if (route.locations.length > 0) {
                html += `
                    <div class="route-locations">
                        <h4><i class="fas fa-map-marker-alt"></i> Vị trí đón/trả:</h4>
                        <ul>
                `;
                
                route.locations.forEach(location => {
                    html += `
                        <li>
                            <i class="fas fa-map-pin"></i> ${location.viTri}
                            ${location.ghiChu ? `<span class="note">(${location.ghiChu})</span>` : ''}
                        </li>
                    `;
                });
                
                html += `
                        </ul>
                    </div>
                `;
            }
            
            html += `
                    <div class="route-actions">
                        <button class="btn-call" onclick="window.location.href='tel:0948531333'">
                            <i class="fas fa-phone"></i> Gọi đặt vé: 0948.531.333
                        </button>
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        
        // Thêm CSS cho kết quả tìm kiếm
        const style = document.createElement('style');
        style.textContent = `
            .route-result-card {
                background: white;
                border-radius: 10px;
                padding: 25px;
                margin-bottom: 25px;
                box-shadow: 0 3px 15px rgba(0,0,0,0.08);
            }
            .result-card-even {
                border-top: 4px solid #2c5aa0;
            }
            .result-card-odd {
                border-top: 4px solid #e67e22;
            }
            .no-search, .no-results {
                text-align: center;
                padding: 50px 20px;
                background: #f8f9fa;
                border-radius: 10px;
                margin: 20px 0;
            }
            .no-search i, .no-results i {
                font-size: 3rem;
                color: #adb5bd;
                margin-bottom: 15px;
            }
            .search-results-count {
                background: #e3f2fd;
                padding: 15px 20px;
                border-radius: 8px;
                margin: 20px 0;
                color: #2c5aa0;
                font-size: 1.1rem;
                border-left: 4px solid #2c5aa0;
            }
            .contact-price {
                color: #e67e22;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

    // Cập nhật số lượng trong tab
    function updateTabCount(tabId, count) {
        const tabLink = document.querySelector(`[data-section="${tabId}"]`);
        if (tabLink) {
            // Xóa badge cũ nếu có
            const oldBadge = tabLink.querySelector('.tab-badge');
            if (oldBadge) {
                oldBadge.remove();
            }
            
            // Thêm badge mới
            if (count > 0) {
                const badge = document.createElement('span');
                badge.className = 'tab-badge';
                badge.textContent = count;
                badge.style.cssText = `
                    background: #e74c3c;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    margin-left: 8px;
                    vertical-align: middle;
                `;
                tabLink.appendChild(badge);
            }
        }
    }

    // Tải tất cả dữ liệu - PHIÊN BẢN MỚI VỚI FALLBACK
    async function loadAllData() {
        console.log('=== BẮT ĐẦU TẢI DỮ LIỆU ===');
        
        try {
            // Hiển thị loading state
            showLoadingState();
            
            console.log('Đang tải dữ liệu từ Google Sheets...');
            
            // Thử tải dữ liệu với timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const [giaveRows, gioxuatbenRows, vitriRows] = await Promise.all([
                fetchGoogleSheetData(API_URLS.giave, 'giave').catch(error => {
                    console.error('Lỗi khi tải giave:', error);
                    return [];
                }),
                fetchGoogleSheetData(API_URLS.gioxuatben, 'gioxuatben').catch(error => {
                    console.error('Lỗi khi tải gioxuatben:', error);
                    return [];
                }),
                fetchGoogleSheetData(API_URLS.vitri, 'vitri').catch(error => {
                    console.error('Lỗi khi tải vitri:', error);
                    return [];
                })
            ]);
            
            clearTimeout(timeoutId);
            
            console.log('Dữ liệu đã tải về:', {
                giaveRows: giaveRows ? giaveRows.length : 0,
                gioxuatbenRows: gioxuatbenRows ? gioxuatbenRows.length : 0,
                vitriRows: vitriRows ? vitriRows.length : 0
            });
            
            // Xử lý dữ liệu
            giaveData = processGiaveData(giaveRows);
            gioxuatbenData = processGioxuatbenData(gioxuatbenRows);
            vitriData = processVitriData(vitriRows);
            
            console.log('Dữ liệu đã xử lý:', {
                giaveData: giaveData.length,
                gioxuatbenData: gioxuatbenData.length,
                vitriData: vitriData.length
            });
            
            // Nếu không có dữ liệu, sử dụng dữ liệu mẫu
            if (giaveData.length === 0 && gioxuatbenData.length === 0) {
                console.log('Không có dữ liệu từ API, sử dụng dữ liệu mẫu...');
                loadSampleData();
            }
            
            // Hiển thị dữ liệu
            displayGiaveData();
            displayGioxuatbenData();
            
            console.log('=== DỮ LIỆU ĐÃ TẢI THÀNH CÔNG ===');
            
            // Hiển thị thông báo thành công
            showNotification('Đã tải dữ liệu thành công!', 'success');
            
        } catch (error) {
            console.error('Lỗi nghiêm trọng khi tải dữ liệu:', error);
            
            // Sử dụng dữ liệu mẫu
            console.log('Sử dụng dữ liệu mẫu do lỗi...');
            loadSampleData();
            
            // Hiển thị thông báo lỗi
            showNotification('Không thể tải dữ liệu từ Google Sheets. Đang sử dụng dữ liệu mẫu.', 'error');
        }
    }

    // Hiển thị trạng thái loading
    function showLoadingState() {
        const tbody = document.getElementById('ticket-table-body');
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px;">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin fa-2x" style="color: #2c5aa0;"></i>
                        <p style="margin-top: 15px; color: #666;">Đang tải dữ liệu giá vé từ Google Sheets...</p>
                    </div>
                </td>
            </tr>
        `;
        
        const scheduleContainer = document.getElementById('phone-schedule-content');
        scheduleContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin fa-2x" style="color: #2c5aa0;"></i>
                <p style="margin-top: 15px; color: #666;">Đang tải dữ liệu giờ xuất bến...</p>
            </div>
        `;
        
        // Thêm CSS cho loading
        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                text-align: center;
                padding: 40px;
            }
            @keyframes fa-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Load dữ liệu mẫu
    function loadSampleData() {
        console.log('Đang tải dữ liệu mẫu...');
        
        // Dữ liệu mẫu giá vé
        giaveData = [
            { id: 1, diemDi: "Thanh Hóa", diemDen: "Hà Nội", giaVe: 200000 },
            { id: 2, diemDi: "Hà Nội", diemDen: "Thanh Hóa", giaVe: 200000 },
            { id: 3, diemDi: "Thanh Hóa", diemDen: "Thái Nguyên", giaVe: 250000 },
            { id: 4, diemDi: "Thái Nguyên", diemDen: "Thanh Hóa", giaVe: 250000 },
            { id: 5, diemDi: "Thanh Hóa", diemDen: "Hải Phòng", giaVe: 220000 },
            { id: 6, diemDi: "Hải Phòng", diemDen: "Thanh Hóa", giaVe: 220000 },
            { id: 7, diemDi: "Thanh Hóa", diemDen: "Bắc Giang", giaVe: 230000 },
            { id: 8, diemDi: "Bắc Giang", diemDen: "Thanh Hóa", giaVe: 230000 }
        ];
        
        // Dữ liệu mẫu giờ xuất bến
        gioxuatbenData = [
            { id: 1, diemDi: "Thanh Hóa", diemDen: "Hà Nội", gioXuatBen: "05:00", soDienThoai: "0948.531.333" },
            { id: 2, diemDi: "Thanh Hóa", diemDen: "Hà Nội", gioXuatBen: "07:00", soDienThoai: "0948.531.333" },
            { id: 3, diemDi: "Thanh Hóa", diemDen: "Hà Nội", gioXuatBen: "09:00", soDienThoai: "0986.757.575" },
            { id: 4, diemDi: "Hà Nội", diemDen: "Thanh Hóa", gioXuatBen: "13:00", soDienThoai: "0986.757.575" },
            { id: 5, diemDi: "Hà Nội", diemDen: "Thanh Hóa", gioXuatBen: "15:00", soDienThoai: "0948.531.333" },
            { id: 6, diemDi: "Hà Nội", diemDen: "Thanh Hóa", gioXuatBen: "17:00", soDienThoai: "0986.757.575" },
            { id: 7, diemDi: "Thanh Hóa", diemDen: "Thái Nguyên", gioXuatBen: "06:30", soDienThoai: "0948.531.333" },
            { id: 8, diemDi: "Thái Nguyên", diemDen: "Thanh Hóa", gioXuatBen: "14:00", soDienThoai: "0986.757.575" }
        ];
        
        // Dữ liệu mẫu vị trí
        vitriData = [
            { id: 1, diemDi: "Thanh Hóa", diemDen: "Hà Nội", viTri: "Bến xe phía Nam (Giáp Bát)", ghiChu: "Điểm đón chính" },
            { id: 2, diemDi: "Hà Nội", diemDen: "Thanh Hóa", viTri: "Bến xe Thanh Hóa", ghiChu: "Điểm trả chính" },
            { id: 3, diemDi: "Thanh Hóa", diemDen: "Thái Nguyên", viTri: "Ngã tư An Dương Vương", ghiChu: "Đón khách lẻ" },
            { id: 4, diemDi: "Thái Nguyên", diemDen: "Thanh Hóa", viTri: "Bến xe Thái Nguyên", ghiChu: "Điểm đón chính" }
        ];
        
        console.log('Dữ liệu mẫu đã tải:', {
            giave: giaveData.length,
            gioxuatben: gioxuatbenData.length,
            vitri: vitriData.length
        });
    }

    // Hiển thị thông báo
    function showNotification(message, type = 'info') {
        console.log(`Thông báo [${type}]:`, message);
        
        // Tạo notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        
        // Thêm vào body
        document.body.appendChild(notification);
        
        // Thêm CSS cho notification
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 12px;
                z-index: 1000;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                max-width: 400px;
                border-left: 4px solid;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification.success {
                border-left-color: #28a745;
            }
            .notification.error {
                border-left-color: #dc3545;
            }
            .notification.info {
                border-left-color: #2c5aa0;
            }
            .notification i {
                font-size: 1.2rem;
            }
            .notification.success i {
                color: #28a745;
            }
            .notification.error i {
                color: #dc3545;
            }
            .notification.info i {
                color: #2c5aa0;
            }
            .close-notification {
                background: none;
                border: none;
                color: #6c757d;
                cursor: pointer;
                padding: 0;
            }
            .close-notification:hover {
                color: #343a40;
            }
            @media (max-width: 768px) {
                .notification {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Hiển thị
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Tự động ẩn
        const autoHide = setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        // Nút đóng
        notification.querySelector('.close-notification').addEventListener('click', () => {
            clearTimeout(autoHide);
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }

    // Khởi tạo sự kiện
    function initializeEvents() {
        console.log('Khởi tạo sự kiện...');
        
        // Nút tìm kiếm
        const searchBtn = document.getElementById('search-route-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchRoute);
            console.log('Đã gắn sự kiện cho nút tìm kiếm');
        } else {
            console.error('Không tìm thấy nút tìm kiếm với ID search-route-btn');
        }
        
        // Input tìm kiếm
        const searchInput = document.getElementById('route-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    console.log('Enter pressed, searching...');
                    searchRoute();
                }
            });
            console.log('Đã gắn sự kiện cho input tìm kiếm');
        } else {
            console.error('Không tìm thấy input tìm kiếm với ID route-search-input');
        }
        
        // Log các element để debug
        console.log('Các element quan trọng:', {
            ticketTableBody: document.getElementById('ticket-table-body'),
            phoneScheduleContent: document.getElementById('phone-schedule-content'),
            routeResultsContainer: document.getElementById('route-results-container'),
            searchResultsCount: document.getElementById('search-results-count')
        });
    }

    // Khởi động ứng dụng
    function startApp() {
        console.log('Bắt đầu ứng dụng...');
        initializeEvents();
        loadAllData();
    }

    // Bắt đầu ứng dụng khi DOM ready
    startApp();
});
