// ============================================
// HÀM TẢI DỮ LIỆU TỪ GOOGLE SHEETS API
// ============================================

// Hàm chung để gọi API Google Sheets và chuyển đổi dữ liệu
async function fetchGoogleSheetData(sheetName) {
    const sheetId = '17ksYxJypnO4dEfZRG3NjO-b5zqdAaVcSGH3ZWf28erY';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        // API trả về dữ liệu có tiền tố "google.visualization.Query.setResponse(", cần cắt bỏ
        const jsonString = text.substring(47, text.length - 2);
        const data = JSON.parse(jsonString);
        
        // Chuyển đổi dữ liệu từ API thành mảng các đối tượng đơn giản
        const rows = data.table.rows;
        const columns = data.table.cols.map(col => col.label);
        
        return rows.map(row => {
            let obj = {};
            row.c.forEach((cell, index) => {
                obj[columns[index]] = cell ? cell.v : '';
            });
            return obj;
        });
    } catch (error) {
        console.error(`Lỗi khi tải dữ liệu từ sheet "${sheetName}":`, error);
        return []; // Trả về mảng rỗng nếu có lỗi
    }
}

// Hàm tải và xử lý dữ liệu GIÁ VÉ
async function loadTicketPrices() {
    const tableBody = document.getElementById('ticket-table-body');
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu giá vé...</td></tr>';
    
    const data = await fetchGoogleSheetData('giave');
    
    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#e74c3c; padding: 2rem;">Không thể tải dữ liệu giá vé. Vui lòng thử lại sau.</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    // Nhóm dữ liệu theo điểm đi
    const groupedByFrom = {};
    data.forEach(ticket => {
        if (ticket['Điểm đi'] && ticket['Điểm đến'] && ticket['Giá (VNĐ)']) {
            const from = ticket['Điểm đi'];
            if (!groupedByFrom[from]) {
                groupedByFrom[from] = [];
            }
            // Định dạng giá tiền: thêm dấu phân cách hàng nghìn
            const formattedPrice = parseInt(ticket['Giá (VNĐ)']).toLocaleString('vi-VN');
            groupedByFrom[from].push({
                from: from,
                to: ticket['Điểm đến'],
                price: `${formattedPrice} VNĐ`
            });
        }
    });
    
    // Hiển thị dữ liệu đã nhóm
    for (const fromLocation in groupedByFrom) {
        const tickets = groupedByFrom[fromLocation];
        
        // Thêm hàng tiêu đề cho nhóm
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <td colspan="3" class="from-cell" style="background-color: #ecf0f1; font-size: 1.1rem; padding: 15px;">
                <i class="fas fa-map-marker-alt"></i> ${fromLocation}
            </td>
        `;
        tableBody.appendChild(headerRow);
        
        // Thêm các hàng giá vé
        tickets.forEach(ticket => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td></td>
                <td>${ticket.to}</td>
                <td class="price-cell">${ticket.price}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Hàm tải và xử lý dữ liệu GIỜ XUẤT BẾN & SĐT
async function loadPhoneSchedules() {
    const container = document.getElementById('phone-schedule-content');
    container.innerHTML = '<div class="phone-card" style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải lịch trình...</div>';
    
    const data = await fetchGoogleSheetData('gioxuatben');
    
    if (data.length === 0) {
        container.innerHTML = '<div class="phone-card" style="text-align:center; color:#e74c3c; padding: 2rem;">Không thể tải lịch trình. Vui lòng thử lại sau.</div>';
        return;
    }
    
    container.innerHTML = '';
    
    // Nhóm dữ liệu theo địa điểm
    const groupedByLocation = {};
    data.forEach(schedule => {
        if (schedule['Địa điểm'] && schedule['Giờ'] && schedule['Số điện thoại']) {
            const location = schedule['Địa điểm'];
            if (!groupedByLocation[location]) {
                groupedByLocation[location] = [];
            }
            groupedByLocation[location].push({
                time: schedule['Giờ'],
                phone: schedule['Số điện thoại']
            });
        }
    });
    
    // Hiển thị dữ liệu đã nhóm
    for (const location in groupedByLocation) {
        const schedules = groupedByLocation[location];
        
        const card = document.createElement('div');
        card.className = 'phone-card';
        
        let scheduleHTML = '';
        schedules.forEach(schedule => {
            scheduleHTML += `
                <div class="schedule-item">
                    <div class="schedule-time">${schedule.time}</div>
                    <div class="schedule-phone">${schedule.phone}</div>
                </div>
            `;
        });
        
        card.innerHTML = `
            <h3><i class="fas fa-map-pin"></i> ${location}</h3>
            ${scheduleHTML}
        `;
        
        container.appendChild(card);
    }
}

// Hàm tải và xử lý dữ liệu VỊ TRÍ (Tra cứu)
async function loadRoutes() {
    const container = document.getElementById('route-results-container');
    const resultsCount = document.getElementById('search-results-count');
    
    container.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu vị trí...</div>';
    resultsCount.style.display = 'none';
    
    const data = await fetchGoogleSheetData('vitri');
    
    if (data.length === 0) {
        container.innerHTML = '<div class="no-results"><i class="fas fa-exclamation-triangle"></i><h3>Không thể tải dữ liệu vị trí</h3><p>Vui lòng thử lại sau.</p></div>';
        return;
    }
    
    // Nhóm dữ liệu theo địa điểm
    const routesByLocation = {};
    data.forEach(route => {
        if (route['Địa điểm'] && route['Thời gian'] && route['Biển số'] && route['Số điện thoại']) {
            const location = route['Địa điểm'];
            if (!routesByLocation[location]) {
                routesByLocation[location] = [];
            }
            routesByLocation[location].push({
                time: route['Thời gian'],
                plate: route['Biển số'],
                phone: route['Số điện thoại']
            });
        }
    });
    
    // Lưu dữ liệu toàn cục để tìm kiếm
    window.allRoutesData = routesByLocation;
    
    // Hiển thị tất cả dữ liệu ban đầu
    displayRoutes(routesByLocation);
}

// Hàm hiển thị dữ liệu vị trí
function displayRoutes(routesData) {
    const container = document.getElementById('route-results-container');
    const resultsCount = document.getElementById('search-results-count');
    
    container.innerHTML = '';
    
    let totalRoutes = 0;
    let locationCount = 0;
    
    for (const location in routesData) {
        const routes = routesData[location];
        totalRoutes += routes.length;
        locationCount++;
        
        const locationGroup = document.createElement('div');
        locationGroup.className = 'location-group';
        
        let routesHTML = '';
        routes.forEach(route => {
            routesHTML += `
                <tr>
                    <td>${route.time}</td>
                    <td>${route.plate}</td>
                    <td>${route.phone}</td>
                </tr>
            `;
        });
        
        locationGroup.innerHTML = `
            <div class="location-header">
                <i class="fas fa-map-marker-alt"></i> ${location} (${routes.length} chuyến)
            </div>
            <div class="route-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Biển số</th>
                            <th>Số điện thoại</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${routesHTML}
                    </tbody>
                </table>
            </div>
        `;
        
        container.appendChild(locationGroup);
    }
    
    // Hiển thị tổng số chuyến
    if (locationCount > 0) {
        resultsCount.textContent = `Tìm thấy ${totalRoutes} chuyến xe tại ${locationCount} địa điểm`;
        resultsCount.style.display = 'block';
    } else {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Không có dữ liệu vị trí</h3>
                <p>Chưa có dữ liệu vị trí nào được nhập.</p>
            </div>
        `;
        resultsCount.style.display = 'none';
    }
}

// Hàm tìm kiếm lộ trình
function searchRoutes() {
    const searchInput = document.getElementById('route-search-input').value.trim().toLowerCase();
    const resultsCount = document.getElementById('search-results-count');
    
    if (!window.allRoutesData) {
        return;
    }
    
    if (searchInput === '') {
        displayRoutes(window.allRoutesData);
        return;
    }
    
    const filteredRoutes = {};
    let totalRoutes = 0;
    let matchedLocations = 0;
    
    for (const location in window.allRoutesData) {
        if (location.toLowerCase().includes(searchInput)) {
            filteredRoutes[location] = window.allRoutesData[location];
            totalRoutes += window.allRoutesData[location].length;
            matchedLocations++;
        }
    }
    
    if (matchedLocations > 0) {
        displayRoutes(filteredRoutes);
        resultsCount.textContent = `Tìm thấy ${totalRoutes} chuyến xe tại ${matchedLocations} địa điểm phù hợp với "${searchInput}"`;
        resultsCount.style.display = 'block';
    } else {
        const container = document.getElementById('route-results-container');
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Không tìm thấy địa điểm phù hợp</h3>
                <p>Không có địa điểm nào khớp với từ khóa "${searchInput}". Vui lòng thử lại với từ khóa khác.</p>
            </div>
        `;
        resultsCount.style.display = 'none';
    }
}

// ============================================
// KHỞI TẠO TRANG WEB
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Xử lý điều hướng menu
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Tải dữ liệu khi vào các trang tương ứng
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Tải dữ liệu khi chuyển tab
            if (sectionId === 'ticket-prices') {
                loadTicketPrices();
            } else if (sectionId === 'phone-schedule') {
                loadPhoneSchedules();
            } else if (sectionId === 'route-search') {
                loadRoutes();
            }
        });
    });
    
    // Tải dữ liệu ban đầu cho trang đang mở
    if (document.getElementById('ticket-prices').classList.contains('active')) {
        loadTicketPrices();
    } else if (document.getElementById('phone-schedule').classList.contains('active')) {
        loadPhoneSchedules();
    } else if (document.getElementById('route-search').classList.contains('active')) {
        loadRoutes();
    }
    
    // Xử lý tìm kiếm lộ trình
    document.getElementById('search-route-btn').addEventListener('click', searchRoutes);
    document.getElementById('route-search-input').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchRoutes();
        }
    });
});
