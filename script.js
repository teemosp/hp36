// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Các API endpoints ĐÃ ĐƯỢC SỬA LỖI
    const API_URLS = {
        giave: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=giave',
        gioxuatben: 'https://docs.google.com/spreadsheets/d/17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY/gviz/tq?tqx=out:json&sheet=gioxuatben',
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

    // Hàm fetch dữ liệu từ Google Sheets với xử lý lỗi tốt hơn
    async function fetchGoogleSheetData(url, sheetName) {
        try {
            console.log(`Đang tải dữ liệu từ ${sheetName}...`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Lỗi HTTP ${response.status} khi tải ${sheetName}`);
            }
            
            const text = await response.text();
            console.log(`Dữ liệu thô từ ${sheetName}:`, text.substring(0, 200) + '...');
            
            // Xử lý JSONP response từ Google Sheets
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}') + 1;
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error(`Định dạng dữ liệu không hợp lệ từ ${sheetName}`);
            }
            
            const jsonText = text.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonText);
            
            console.log(`Dữ liệu đã parse từ ${sheetName}:`, data);
            
            // Kiểm tra cấu trúc dữ liệu
            if (!data.table || !data.table.rows) {
                console.warn(`Không có dữ liệu hoặc cấu trúc không đúng trong ${sheetName}`, data);
                return [];
            }
            
            return data.table.rows;
        } catch (error) {
            console.error(`Lỗi khi fetch ${sheetName}:`, error);
            // Trả về mảng rỗng thay vì throw error để các sheet khác vẫn hoạt động
            return [];
        }
    }

    // Xử lý dữ liệu giá vé với kiểm tra kỹ hơn
    function processGiaveData(rows) {
        const data = [];
        
        if (!rows || rows.length === 0) {
            console.log('Không có dữ liệu giá vé');
            return data;
        }
        
        rows.forEach((row, index) => {
            // Bỏ qua hàng đầu tiên nếu là tiêu đề
            if (index === 0 && row.c && row.c[0] && 
                (row.c[0].v === 'Điểm đi' || row.c[0].v === 'Điểm Đi' || row.c[0].v === 'diemdi')) {
                console.log('Bỏ qua hàng tiêu đề giá vé');
                return;
            }
            
            if (row.c && row.c.length >= 3) {
                const diemDi = row.c[0] ? (row.c[0].v || '').trim() : '';
                const diemDen = row.c[1] ? (row.c[1].v || '').trim() : '';
                const giaVeRaw = row.c[2] ? row.c[2].v : '';
                
                // Chuyển đổi giá vé sang số
                let giaVe = 0;
                if (giaVeRaw) {
                    if (typeof giaVeRaw === 'string') {
                        // Loại bỏ ký tự không phải số
                        const cleaned = giaVeRaw.replace(/[^\d]/g, '');
                        giaVe = parseInt(cleaned) || 0;
                    } else if (typeof giaVeRaw === 'number') {
                        giaVe = giaVeRaw;
                    }
                }
                
                // Chỉ thêm nếu có dữ liệu
                if (diemDi && diemDen) {
                    data.push({
                        id: data.length + 1,
                        diemDi: diemDi,
                        diemDen: diemDen,
                        giaVe: giaVe
                    });
                }
            }
        });
        
        console.log(`Đã xử lý ${data.length} dòng dữ liệu giá vé`);
        return data;
    }

    // Xử lý dữ liệu giờ xuất bến
    function processGioxuatbenData(rows) {
        const data = [];
        
        if (!rows || rows.length === 0) {
            console.log('Không có dữ liệu giờ xuất bến');
            return data;
        }
        
        rows.forEach((row, index) => {
            // Bỏ qua hàng đầu tiên nếu là tiêu đề
            if (index === 0 && row.c && row.c[0] && 
                (row.c[0].v === 'Điểm đi' || row.c[0].v === 'Tuyến' || row.c[0].v === 'diemdi')) {
                console.log('Bỏ qua hàng tiêu đề giờ xuất bến');
                return;
            }
            
            if (row.c && row.c.length >= 4) {
                const diemDi = row.c[0] ? (row.c[0].v || '').trim() : '';
                const diemDen = row.c[1] ? (row.c[1].v || '').trim() : '';
                const gioXuatBen = row.c[2] ? (row.c[2].v || '').trim() : '';
                const soDienThoai = row.c[3] ? (row.c[3].v || '').trim() : '';
                
                // Chỉ thêm nếu có dữ liệu
                if (diemDi && diemDen && gioXuatBen) {
                    data.push({
                        id: data.length + 1,
                        diemDi: diemDi,
                        diemDen: diemDen,
                        gioXuatBen: gioXuatBen,
                        soDienThoai: soDienThoai || '0948.531.333' // Số mặc định nếu không có
                    });
                }
            }
        });
        
        console.log(`Đã xử lý ${data.length} dòng dữ liệu giờ xuất bến`);
        return data;
    }

    // Xử lý dữ liệu vị trí
    function processVitriData(rows) {
        const data = [];
        
        if (!rows || rows.length === 0) {
            console.log('Không có dữ liệu vị trí');
            return data;
        }
        
        rows.forEach((row, index) => {
            // Bỏ qua hàng đầu tiên nếu là tiêu đề
            if (index === 0 && row.c && row.c[0] && 
                (row.c[0].v === 'Điểm đi' || row.c[0].v === 'Tuyến' || row.c[0].v === 'diemdi')) {
                console.log('Bỏ qua hàng tiêu đề vị trí');
                return;
            }
            
            if (row.c && row.c.length >= 4) {
                const diemDi = row.c[0] ? (row.c[0].v || '').trim() : '';
                const diemDen = row.c[1] ? (row.c[1].v || '').trim() : '';
                const viTri = row.c[2] ? (row.c[2].v || '').trim() : '';
                const ghiChu = row.c[3] ? (row.c[3].v || '').trim() : '';
                
                // Chỉ thêm nếu có dữ liệu
                if (diemDi && diemDen && viTri) {
                    data.push({
                        id: data.length + 1,
                        diemDi: diemDi,
                        diemDen: diemDen,
                        viTri: viTri,
                        ghiChu: ghiChu || ''
                    });
                }
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
                    <td colspan="3" style="text-align: center; padding: 30px; color: #666;">
                        <i class="fas fa-exclamation-circle"></i> Không có dữ liệu giá vé. Vui lòng kiểm tra kết nối hoặc liên hệ hotline.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        giaveData.forEach(item => {
            // Định dạng giá tiền đẹp hơn
            let formattedPrice = 'Liên hệ';
            if (item.giaVe > 0) {
                formattedPrice = new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                }).format(item.giaVe);
            }
            
            html += `
                <tr>
                    <td><strong>${item.diemDi}</strong></td>
                    <td><strong>${item.diemDen}</strong></td>
                    <td class="price">${formattedPrice}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Thêm thông báo số lượng
        const sectionHeader = document.querySelector('#ticket-prices .section-header');
        if (sectionHeader) {
            const countBadge = document.createElement('span');
            countBadge.className = 'data-count-badge';
            countBadge.innerHTML = ` (${giaveData.length} tuyến)`;
            countBadge.style.cssText = 'background: #2c5aa0; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; margin-left: 10px;';
            
            // Kiểm tra nếu đã có badge thì thay thế, nếu không thì thêm mới
            const existingBadge = sectionHeader.querySelector('.data-count-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            sectionHeader.appendChild(countBadge);
        }
    }

    // Hiển thị giờ xuất bến & số điện thoại
    function displayGioxuatbenData() {
        const container = document.getElementById('phone-schedule-content');
        
        if (!gioxuatbenData || gioxuatbenData.length === 0) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Không có dữ liệu giờ xuất bến. Vui lòng kiểm tra kết nối hoặc liên hệ hotline.</p>
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
                        <span class="schedule-count">${group.schedules.length} chuyến</span>
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
        
        // Thêm thông báo số lượng
        const sectionHeader = document.querySelector('#phone-schedule .section-header');
        if (sectionHeader) {
            const countBadge = document.createElement('span');
            countBadge.className = 'data-count-badge';
            countBadge.innerHTML = ` (${Object.keys(groupedData).length} tuyến)`;
            countBadge.style.cssText = 'background: #2c5aa0; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; margin-left: 10px;';
            
            const existingBadge = sectionHeader.querySelector('.data-count-badge');
            if (existingBadge) {
                existingBadge.remove();
            }
            sectionHeader.appendChild(countBadge);
        }
    }

    // Hàm tìm kiếm tuyến đường (đã sửa)
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
                    <p class="hint">Ví dụ: Thái Nguyên, Yên Nghĩa, Quan Hóa, Cẩm Thủy, Hà Nội, Thanh Hóa</p>
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
        
        if (totalResults.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Không tìm thấy kết quả cho "<strong>${searchTerm}</strong>"</p>
                    <p>Vui lòng thử với từ khóa khác hoặc liên hệ hotline để được tư vấn</p>
                    <p class="suggestion">Gợi ý: Thử tìm với tên đầy đủ hơn hoặc từ khóa ngắn hơn</p>
                </div>
            `;
            resultsCount.style.display = 'none';
            return;
        }
        
        // Tính số tuyến độc nhất
        const uniqueRoutes = new Set();
        totalResults.forEach(item => {
            uniqueRoutes.add(`${item.diemDi}-${item.diemDen}`);
        });
        
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
        let html = '';
        Object.values(combinedResults).forEach(route => {
            const formattedPrice = route.giaVe > 0 ? 
                new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(route.giaVe) : 
                '<span class="contact-price">Liên hệ</span>';
            
            html += `
                <div class="route-result-card">
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
                            <i class="fas fa-phone"></i> Gọi đặt vé ngay: 0948.531.333
                        </button>
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
    }

    // Tải tất cả dữ liệu với xử lý lỗi tốt hơn
    async function loadAllData() {
        try {
            console.log('Bắt đầu tải dữ liệu từ Google Sheets...');
            
            // Hiển thị trạng thái loading
            document.getElementById('ticket-table-body').innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 30px;">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Đang tải dữ liệu giá vé...</p>
                        </div>
                    </td>
                </tr>
            `;
            
            document.getElementById('phone-schedule-content').innerHTML = `
                <div class="loading-message">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Đang tải dữ liệu giờ xuất bến...</p>
                    </div>
                </div>
            `;
            
            // Tải dữ liệu đồng thời với timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout khi tải dữ liệu')), 10000)
            );
            
            const fetchPromise = Promise.all([
                fetchGoogleSheetData(API_URLS.giave, 'giave'),
                fetchGoogleSheetData(API_URLS.gioxuatben, 'gioxuatben'),
                fetchGoogleSheetData(API_URLS.vitri, 'vitri')
            ]);
            
            const [giaveRows, gioxuatbenRows, vitriRows] = await Promise.race([fetchPromise, timeoutPromise]);
            
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
            
            // Hiển thị thông báo thành công
            showNotification('Đã tải dữ liệu thành công!', 'success');
            
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu:', error);
            
            // Hiển thị thông báo lỗi
            showNotification('Không thể tải dữ liệu. Vui lòng thử lại sau.', 'error');
            
            // Hiển thị thông báo lỗi trong các section
            document.getElementById('ticket-table-body').innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 30px; color: #dc3545;">
                        <div class="error-display">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>Không thể tải dữ liệu giá vé</h4>
                            <p>${error.message}</p>
                            <button onclick="loadAllData()" class="retry-btn">
                                <i class="fas fa-redo"></i> Thử lại
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            document.getElementById('phone-schedule-content').innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Không thể tải dữ liệu giờ xuất bến</h4>
                    <p>${error.message}</p>
                    <button onclick="loadAllData()" class="retry-btn">
                        <i class="fas fa-redo"></i> Thử lại
                    </button>
                </div>
            `;
            
            // Load dữ liệu mẫu nếu API fail
            loadSampleData();
        }
    }

    // Load dữ liệu mẫu khi API không hoạt động
    function loadSampleData() {
        console.log('Đang tải dữ liệu mẫu...');
        
        // Dữ liệu mẫu giá vé
        giaveData = [
            { id: 1, diemDi: "Thanh Hóa", diemDen: "Hà Nội", giaVe: 200000 },
            { id: 2, diemDi: "Hà Nội", diemDen: "Thanh Hóa", giaVe: 200000 },
            { id: 3, diemDi: "Thanh Hóa", diemDen: "Thái Nguyên", giaVe: 250000 },
            { id: 4, diemDi: "Thái Nguyên", diemDen: "Thanh Hóa", giaVe: 250000 },
            { id: 5, diemDi: "Thanh Hóa", diemDen: "Hải Phòng", giaVe: 220000 }
        ];
        
        // Dữ liệu mẫu giờ xuất bến
        gioxuatbenData = [
            { id: 1, diemDi: "Thanh Hóa", diemDen: "Hà Nội", gioXuatBen: "05:00", soDienThoai: "0948.531.333" },
            { id: 2, diemDi: "Thanh Hóa", diemDen: "Hà Nội", gioXuatBen: "07:00", soDienThoai: "0948.531.333" },
            { id: 3, diemDi: "Hà Nội", diemDen: "Thanh Hóa", gioXuatBen: "13:00", soDienThoai: "0986.757.575" },
            { id: 4, diemDi: "Thanh Hóa", diemDen: "Thái Nguyên", gioXuatBen: "06:30", soDienThoai: "0948.531.333" },
            { id: 5, diemDi: "Thái Nguyên", diemDen: "Thanh Hóa", gioXuatBen: "14:00", soDienThoai: "0986.757.575" }
        ];
        
        // Dữ liệu mẫu vị trí
        vitriData = [
            { id: 1, diemDi: "Thanh Hóa", diemDen: "Hà Nội", viTri: "Bến xe phía Nam (Giáp Bát)", ghiChu: "Điểm đón chính" },
            { id: 2, diemDi: "Hà Nội", diemDen: "Thanh Hóa", viTri: "Bến xe Thanh Hóa", ghiChu: "Điểm trả chính" },
            { id: 3, diemDi: "Thanh Hóa", diemDen: "Thái Nguyên", viTri: "Ngã tư An Dương Vương", ghiChu: "Đón khách lẻ" }
        ];
        
        // Hiển thị dữ liệu mẫu
        displayGiaveData();
        displayGioxuatbenData();
        
        showNotification('Đang sử dụng dữ liệu mẫu. Vui lòng kiểm tra kết nối API.', 'warning');
    }

    // Hiển thị thông báo
    function showNotification(message, type = 'info') {
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
        
        // Hiển thị
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Tự động ẩn sau 5 giây
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

    // Thêm CSS động với cải tiến
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            text-align: center;
            padding: 20px;
        }
        
        .fa-spin {
            animation: fa-spin 1s linear infinite;
            font-size: 2rem;
            color: #2c5aa0;
            margin-bottom: 10px;
        }
        
        @keyframes fa-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-message, .error-message {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .error-display {
            text-align: center;
            padding: 20px;
        }
        
        .error-display i, .error-message i {
            font-size: 3rem;
            color: #dc3545;
            margin-bottom: 15px;
        }
        
        .retry-btn {
            background: #2c5aa0;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 15px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .retry-btn:hover {
            background: #1a3a6d;
        }
        
        .schedule-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.08);
            border-left: 4px solid #2c5aa0;
        }
        
        .route-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .route-header h3 {
            margin: 0;
            color: #2c5aa0;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .schedule-count {
            background: #e3f2fd;
            color: #2c5aa0;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .schedule-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 15px;
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
        
        .phone a {
            color: #28a745;
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
            box-shadow: 0 3px 20px rgba(0,0,0,0.1);
            border-top: 4px solid #2c5aa0;
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
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .route-price {
            color: #28a745;
            font-size: 1.1rem;
            font-weight: 600;
        }
        
        .contact-price {
            color: #e67e22;
            font-style: italic;
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
            font-size: 1.1rem;
        }
        
        .phone-link {
            color: #28a745;
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
            padding: 10px 0;
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
            font-style: italic;
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
            font-size: 1rem;
        }
        
        .btn-call:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
        }
        
        .no-search, .no-results {
            text-align: center;
            padding: 50px 20px;
            color: #6c757d;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .no-search i, .no-results i {
            font-size: 3rem;
            color: #adb5bd;
            margin-bottom: 15px;
        }
        
        .hint, .suggestion {
            color: #6c757d;
            font-size: 0.9rem;
            margin-top: 10px;
            font-style: italic;
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
        
        .price {
            color: #e74c3c;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        /* Notification styles */
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
            max-width: 350px;
            border-left: 4px solid #2c5aa0;
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
        
        .notification.warning {
            border-left-color: #ffc107;
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
        
        .notification.warning i {
            color: #ffc107;
        }
        
        .notification span {
            flex: 1;
        }
        
        .close-notification {
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 0;
            font-size: 0.9rem;
        }
        
        .close-notification:hover {
            color: #343a40;
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
            
            .notification {
                left: 20px;
                right: 20px;
                max-width: none;
            }
            
            .route-header {
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
    
    // Thêm sự kiện retry cho các nút retry (được thêm động)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.retry-btn')) {
            e.preventDefault();
            loadAllData();
        }
    });
    
    // Log để debug
    console.log('Script.js đã được tải và khởi tạo');
});
