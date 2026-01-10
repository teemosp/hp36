// ========== CORE FUNCTIONS ==========

// Hàm hiển thị tất cả bảng dữ liệu
function displayAllTables() {
    console.log("Bắt đầu hiển thị bảng...");
    
    // Hiển thị bảng giá vé
    const giaveTable = document.getElementById('giave-table-body');
    if (giaveTable) {
        console.log("Hiển thị bảng giá vé...");
        giaveTable.innerHTML = '';
        
        giaveData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row[0]}</td>
                <td>${row[1]}</td>
                <td class="price-cell">${row[2]} nghìn đồng</td>
            `;
            giaveTable.appendChild(tr);
        });
        console.log("✓ Bảng giá vé: " + giaveTable.children.length + " dòng");
    }
    
    // Hiển thị bảng giờ xuất bến
    const gioxuatbenTable = document.getElementById('gioxuatben-table-body');
    if (gioxuatbenTable) {
        console.log("Hiển thị bảng giờ xuất bến...");
        gioxuatbenTable.innerHTML = '';
        
        gioxuatbenData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row[0]}</td>
                <td class="time-cell">${row[1]}</td>
                <td>${row[2]}</td>
            `;
            gioxuatbenTable.appendChild(tr);
        });
        console.log("✓ Bảng giờ xuất bến: " + gioxuatbenTable.children.length + " dòng");
    }
    
    // Hiển thị bảng xe đi
    const vitriDiTable = document.getElementById('vitri-di-table-body');
    if (vitriDiTable) {
        console.log("Hiển thị bảng xe đi...");
        vitriDiTable.innerHTML = '';
        
        vitriDiData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row[0]}</td>
                <td class="time-cell">${row[1]}</td>
                <td>${row[2]}</td>
                <td>${row[3]}</td>
                <td style="color: ${row[4]?.toLowerCase() === 'nằm' ? '#2a5298' : '#e74c3c'}; font-weight: 600;">
                    ${row[4]?.toLowerCase() === 'nằm' ? 'Xe giường nằm' : 'Xe ghế ngồi'}
                </td>
            `;
            vitriDiTable.appendChild(tr);
        });
        console.log("✓ Bảng xe đi: " + vitriDiTable.children.length + " dòng");
    }
    
    // Hiển thị bảng xe về
    const vitriVeTable = document.getElementById('vitri-ve-table-body');
    if (vitriVeTable) {
        console.log("Hiển thị bảng xe về...");
        vitriVeTable.innerHTML = '';
        
        vitriVeData.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row[0]}</td>
                <td class="time-cell">${row[1]}</td>
                <td>${row[2]}</td>
                <td>${row[3]}</td>
                <td style="color: ${row[4]?.toLowerCase() === 'nằm' ? '#2a5298' : '#e74c3c'}; font-weight: 600;">
                    ${row[4]?.toLowerCase() === 'nằm' ? 'Xe giường nằm' : 'Xe ghế ngồi'}
                </td>
            `;
            vitriVeTable.appendChild(tr);
        });
        console.log("✓ Bảng xe về: " + vitriVeTable.children.length + " dòng");
    }
    
    // Đảm bảo các bảng không bị ẩn
    setTimeout(fixTableDisplay, 100);
}

// Fix hiển thị bảng
function fixTableDisplay() {
    console.log("Đang fix hiển thị bảng...");
    
    const allTables = document.querySelectorAll('table');
    allTables.forEach(table => {
        // Đảm bảo bảng hiển thị
        table.style.display = 'table';
        table.style.visibility = 'visible';
        table.style.width = '100%';
        
        // Đảm bảo parent có đủ width
        const parent = table.parentElement;
        if (parent) {
            parent.style.overflow = 'visible';
            parent.style.width = '100%';
        }
    });
    
    // Đảm bảo table containers hiển thị
    const tableContainers = document.querySelectorAll('.table-container');
    tableContainers.forEach(container => {
        container.style.display = 'block';
        container.style.overflow = 'visible';
    });
    
    console.log("✓ Đã fix " + allTables.length + " bảng");
}

// ========== NAVIGATION ==========

function setupNavigation() {
    console.log("Thiết lập navigation...");
    
    // Click vào TOC cards
    document.querySelectorAll('.toc-card').forEach(card => {
        card.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            console.log("Mở section: " + sectionId);
            
            // Ẩn tất cả sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Hiện section được chọn
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                document.getElementById('main-toc').style.display = 'none';
                
                // Fix hiển thị bảng trong section này
                setTimeout(() => {
                    const tables = targetSection.querySelectorAll('table');
                    tables.forEach(table => {
                        table.style.display = 'table';
                        table.style.visibility = 'visible';
                    });
                }, 50);
            }
        });
    });
    
    // Nút quay lại
    document.querySelectorAll('.back-to-toc').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('main-toc').style.display = 'block';
        });
    });
    
    console.log("✓ Navigation đã thiết lập");
}

// ========== SEARCH FUNCTION ==========

function setupSearch() {
    console.log("Thiết lập tìm kiếm...");
    
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const from = document.getElementById('fromLocation').value.trim();
            const to = document.getElementById('toLocation').value.trim();
            
            if (!from && !to) {
                alert('Vui lòng nhập địa điểm để tìm kiếm');
                return;
            }
            
            console.log("Tìm kiếm: " + from + " → " + to);
            // Tạm thời hiển thị thông báo
            alert('Chức năng tìm kiếm đang được cập nhật. Vui lòng xem bảng giá bên dưới.');
            
            // Hiển thị bảng giá vé
            document.getElementById('giave-section').classList.add('active');
            document.getElementById('main-toc').style.display = 'none';
        });
    }
    
    console.log("✓ Search đã thiết lập");
}

// ========== MOBILE FIXES ==========

function applyMobileFixes() {
    console.log("Áp dụng mobile fixes...");
    
    // Kiểm tra iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isiPhoneX = /iPhone X/.test(navigator.userAgent) || 
                     (window.innerWidth === 375 && window.innerHeight === 812 && window.devicePixelRatio === 3);
    
    if (isIOS) {
        console.log("Đang chạy trên iOS");
        document.body.classList.add('ios-device');
        
        // Thêm safe area cho iPhone X
        if (isiPhoneX) {
            console.log("Đang chạy trên iPhone X");
            document.body.classList.add('iphone-x');
            
            const style = document.createElement('style');
            style.textContent = `
                body.iphone-x {
                    padding-top: env(safe-area-inset-top) !important;
                    padding-bottom: env(safe-area-inset-bottom) !important;
                }
                
                body.iphone-x .container {
                    padding-left: max(15px, env(safe-area-inset-left)) !important;
                    padding-right: max(15px, env(safe-area-inset-right)) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Đảm bảo font size không bị zoom
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.style.fontSize = '16px';
    });
    
    console.log("✓ Mobile fixes đã áp dụng");
}

// ========== INITIALIZATION ==========

function initializePage() {
    console.log("========== KHỞI TẠO TRANG ==========");
    console.log("User Agent:", navigator.userAgent);
    console.log("Screen:", window.innerWidth + "x" + window.innerHeight);
    
    // Áp dụng mobile fixes trước
    applyMobileFixes();
    
    // Hiển thị tất cả bảng
    displayAllTables();
    
    // Thiết lập navigation
    setupNavigation();
    
    // Thiết lập tìm kiếm
    setupSearch();
    
    // Thêm nút debug cho testing
    addDebugButton();
    
    // Force display tables after everything is loaded
    setTimeout(() => {
        console.log("Kiểm tra final...");
        checkTablesDisplay();
    }, 500);
    
    console.log("✓ Khởi tạo hoàn tất");
}

// Kiểm tra bảng hiển thị
function checkTablesDisplay() {
    const tableIds = ['giave-table-body', 'gioxuatben-table-body', 'vitri-di-table-body', 'vitri-ve-table-body'];
    
    tableIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log(id + ": " + element.children.length + " rows");
            
            // Nếu không có rows, thử load lại
            if (element.children.length === 0) {
                console.warn(id + " trống, đang thử load lại...");
                displayAllTables();
            }
        }
    });
    
    // Đảm bảo các bảng hiển thị
    fixTableDisplay();
}

// Thêm nút debug
function addDebugButton() {
    if (window.innerWidth <= 768) {
        const debugBtn = document.createElement('button');
        debugBtn.innerHTML = '🔧 Debug';
        debugBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2a5298;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 9999;
            cursor: pointer;
        `;
        
        debugBtn.addEventListener('click', function() {
            alert(
                'DEBUG INFO:\n' +
                'Width: ' + window.innerWidth + 'px\n' +
                'Height: ' + window.innerHeight + 'px\n' +
                'Tables found: ' + document.querySelectorAll('table').length + '\n' +
                'iOS: ' + /iPhone|iPad|iPod/.test(navigator.userAgent)
            );
            
            checkTablesDisplay();
        });
        
        document.body.appendChild(debugBtn);
    }
}

// ========== EVENT LISTENERS ==========

// Chờ DOM sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM sẵn sàng, khởi tạo...");
    
    // Hiển thị loading
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.className = 'loading';
    loading.innerHTML = '<div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #2a5298;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 10px;"></div><p>Đang tải...</p>';
    document.body.appendChild(loading);
    
    // Khởi tạo sau 100ms
    setTimeout(() => {
        try {
            initializePage();
            loading.style.display = 'none';
        } catch (error) {
            console.error("Lỗi khởi tạo:", error);
            loading.innerHTML = '<p style="color:red;">Lỗi tải trang. Vui lòng refresh.</p>';
        }
    }, 100);
});

// Thêm animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Xử lý resize
window.addEventListener('resize', function() {
    console.log("Resize: " + window.innerWidth + "x" + window.innerHeight);
    
    // Fix lại bảng khi resize
    setTimeout(fixTableDisplay, 100);
});
