// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Các API endpoints
    const API_URLS = {
        giave: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=giave',
        gioxuatben: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=gioxuatben',
        vitri: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=vitri'
    };

    // Biến lưu trữ dữ liệu
    let giaveData = [];
    let gioxuatbenData = [];
    let vitriData = [];

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
        });
    });

    // Hàm fetch dữ liệu từ Google Sheets
    async function fetchGoogleSheetData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const text = await response.text();
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            const jsonText = text.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonText);
            
            return data.table ? data.table.rows : [];
        } catch (error) {
            console.error('Lỗi khi fetch dữ liệu:', error);
            return [];
        }
    }

    // Xử lý dữ liệu giá vé
    function processGiaveData(rows) {
        const data = [];
        rows.forEach((row, index) => {
            if (row.c && row.c.length >= 3) {
                data.push({
                    id: index + 1,
                    diemDi: row.c[0] ? row.c[0].v : '',
                    diemDen: row.c[1] ? row.c[1].v : '',
                    giaVe: row.c[2] ? parseFloat(row.c[2].v) || 0 : 0
                });
            }
        });
        return data;
    }

    // Xử lý dữ liệu giờ xuất bến
    function processGioxuatbenData(rows) {
        const data = [];
        rows.forEach((row, index) => {
            if (row.c && row.c.length >= 4) {
                data.push({
                    id: index + 1,
                    diemDi: row.c[0] ? row.c[0].v : '',
                    diemDen: row.c[1] ? row.c[1].v : '',
                    gioXuatBen: row.c[2] ? row.c[2].v : '',
                    soDienThoai: row.c[3] ? row.c[3].v : ''
                });
            }
        });
        return data;
    }

    // Xử lý dữ liệu vị trí
    function processVitriData(rows) {
        const data = [];
        rows.forEach((row, index) => {
            if (row.c && row.c.length >= 4) {
                data.push({
                    id: index + 1,
                    diemDi: row.c[0] ? row.c[0].v : '',
                    diemDen: row.c[1] ? row.c[1].v : '',
                    viTri: row.c[2] ? row.c[2].v : '',
                    ghiChu: row.c[3] ? row.c[3].v : ''
                });
            }
        });
        return data;
    }

    // Hiển thị bảng giá vé
    function displayGiaveData() {
        const tbody = document.getElementById('ticket-table-body');
        
        if (giaveData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 20px;">
                        <i class="fas fa-info-circle"></i> Đang tải dữ liệu...
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        giaveData.forEach(item => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(item.giaVe);
            
            html += `
                <tr>
                    <td>${item.diemDi}</td>
                    <td>${item.diemDen}</td>
                    <td class="price">${formattedPrice}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }

    // Hiển thị giờ xuất bến & số điện thoại
    function displayGioxuatbenData() {
        const container = document.getElementById('phone-schedule-content');
        
        if (gioxuatbenData.length === 0) {
            container.innerHTML = `
                <div class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                </div>
            `;
            return;
        }
        
        // Nhóm theo tuyến đường
        const groupedData = {};
        gioxuatbenData.forEach(item => {
            const key = `${item.diemDi} - ${item.diemDen}`;
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
                        <h3>${group.diemDi} → ${group.diemDen}</h3>
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
                            <a href="tel:${schedule.soDienThoai.replace(/\s+/g, '')}">${schedule.soDienThoai}</a>
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
    }

    // Hàm tìm kiếm tuyến đường
    function searchRoute() {
        const searchInput = document.getElementById('route-search-input');
        const searchTerm = searchInput.value.trim().toLowerCase();
        const resultsContainer = document.getElementById('route-results-container');
        const resultsCount = document.getElementById('search-results-count');
        
        if (!searchTerm) {
            resultsContainer.innerHTML = `
                <div class="no-search">
                    <i class="fas fa-search"></i>
                    <p>Vui lòng nhập điểm đi hoặc điểm đến để tìm kiếm</p>
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
        
        const totalResults = [...giaveResults, ...gioxuatbenResults, ...vitriResults];
        const uniqueRoutes = new Set();
        
        if (totalResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không tìm thấy kết quả cho "${searchTerm}"</p>
                    <p>Vui lòng thử với từ khóa khác hoặc liên hệ hotline để được tư vấn</p>
                </div>
            `;
            resultsCount.style.display = 'none';
            return;
        }
        
        // Hiển thị số kết quả
        resultsCount.innerHTML = `
            <i class="fas fa-search"></i> 
            Tìm thấy <strong>${totalResults.length}</strong> kết quả cho "${searchTerm}"
        `;
        resultsCount.style.display = 'block';
        
        // Hiển thị kết quả
        let html = '';
        
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
                    giaVe: 0,
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
                    giaVe: 0,
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
        Object.values(combinedResults).forEach(route => {
            const formattedPrice = route.giaVe ? 
                new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(route.giaVe) : 
                'Liên hệ';
            
            html += `
                <div class="route-result-card">
                    <div class="route-info">
                        <h3>${route.diemDi} → ${route.diemDen}</h3>
                        <div class="route-price">
                            <i class="fas fa-tag"></i> Giá vé: <strong>${formattedPrice}</strong>
                        </div>
                    </div>
            `;
            
            // Hiển thị giờ xuất bến
            if (route.schedules.length > 0) {
                html += `
                    <div class="route-schedules">
                        <h4><i class="far fa-clock"></i> Giờ xuất bến:</h4>
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
                            <i class="fas fa-phone"></i> Gọi đặt vé ngay
                        </button>
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
    }

    // Tải tất cả dữ liệu
    async function loadAllData() {
        try {
            // Hiển thị trạng thái loading
            document.getElementById('ticket-table-body').innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 20px;">
                        <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu giá vé...
                    </td>
                </tr>
            `;
            
            document.getElementById('phone-schedule-content').innerHTML = `
                <div class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu giờ xuất bến...
                </div>
            `;
            
            // Tải dữ liệu đồng thời
            const [giaveRows, gioxuatbenRows, vitriRows] = await Promise.all([
                fetchGoogleSheetData(API_URLS.giave),
                fetchGoogleSheetData(API_URLS.gioxuatben),
                fetchGoogleSheetData(API_URLS.vitri)
            ]);
            
            // Xử lý dữ liệu
            giaveData = processGiaveData(giaveRows);
            gioxuatbenData = processGioxuatbenData(gioxuatbenRows);
            vitriData = processVitriData(vitriRows);
            
            // Hiển thị dữ liệu
            displayGiaveData();
            displayGioxuatbenData();
            
            console.log('Dữ liệu đã tải thành công:', {
                giave: giaveData.length,
                gioxuatben: gioxuatbenData.length,
                vitri: vitriData.length
            });
            
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            
            // Hiển thị thông báo lỗi
            document.getElementById('ticket-table-body').innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 20px; color: #dc3545;">
                        <i class="fas fa-exclamation-triangle"></i> Không thể tải dữ liệu. Vui lòng thử lại sau.
                    </td>
                </tr>
            `;
            
            document.getElementById('phone-schedule-content').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    }

    // Thêm CSS động
    const style = document.createElement('style');
    style.textContent = `
        .loading-message, .error-message {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .fa-spin {
            animation: fa-spin 1s linear infinite;
        }
        
        @keyframes fa-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .schedule-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .route-header h3 {
            margin: 0 0 15px 0;
            color: #2c5aa0;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        
        .schedule-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .schedule-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #2c5aa0;
        }
        
        .time, .phone {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .phone a {
            color: #2c5aa0;
            text-decoration: none;
            font-weight: 500;
        }
        
        .phone a:hover {
            text-decoration: underline;
        }
        
        .route-result-card {
            background: white;
            border-radius: 10px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 3px 15px rgba(0,0,0,0.1);
        }
        
        .route-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .route-info h3 {
            margin: 0;
            color: #2c5aa0;
            font-size: 1.3rem;
        }
        
        .route-price {
            color: #28a745;
            font-size: 1.1rem;
        }
        
        .route-schedules, .route-locations {
            margin-bottom: 20px;
        }
        
        .route-schedules h4, .route-locations h4 {
            color: #495057;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .phone-link {
            color: #2c5aa0;
            text-decoration: none;
            font-weight: 500;
        }
        
        .phone-link:hover {
            text-decoration: underline;
        }
        
        .route-locations ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .route-locations li {
            padding: 8px 0;
            border-bottom: 1px dashed #eee;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .route-locations li:last-child {
            border-bottom: none;
        }
        
        .note {
            color: #6c757d;
            font-size: 0.9rem;
            margin-left: 5px;
        }
        
        .route-actions {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        .btn-call {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
        }
        
        .btn-call:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
        }
        
        .no-search, .no-results {
            text-align: center;
            padding: 50px 20px;
            color: #6c757d;
        }
        
        .search-results-count {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #2c5aa0;
            font-size: 1.1rem;
        }
        
        .price {
            color: #e74c3c;
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .route-info {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
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

    // Khởi tạo sự kiện
    document.getElementById('search-route-btn').addEventListener('click', searchRoute);
    document.getElementById('route-search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchRoute();
        }
    });

    // Tải dữ liệu khi trang được tải
    loadAllData();
});
