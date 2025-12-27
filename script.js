// Import dữ liệu từ data.js
// Dữ liệu sẽ được định nghĩa trong data.js

// Hàm chuẩn hóa chuỗi tiếng Việt (bỏ dấu, chuyển về chữ thường)
function normalizeString(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

// Tạo danh sách các điểm đi và đến từ dữ liệu
function createLocationList() {
    const locations = new Set();
    
    // Thêm các điểm từ dữ liệu giá vé
    giaveData.forEach(row => {
        const fromLocations = row[0].split(',').map(loc => loc.trim());
        const toLocations = row[1].split(',').map(loc => loc.trim());
        
        fromLocations.forEach(loc => locations.add(loc));
        toLocations.forEach(loc => locations.add(loc));
    });
    
    // Thêm các điểm từ dữ liệu giờ xuất bến
    gioxuatbenData.forEach(row => {
        locations.add(row[0].trim());
    });
    
    // Thêm các điểm từ dữ liệu vị trí xe đi
    vitriDiData.forEach(row => {
        locations.add(row[0].trim());
    });
    
    // Thêm các điểm từ dữ liệu vị trí xe về
    vitriVeData.forEach(row => {
        locations.add(row[0].trim());
    });
    
    return Array.from(locations).filter(loc => loc.length > 0);
}

// Tìm kiếm địa điểm phù hợp
function searchLocations(query, locationList) {
    if (!query || query.trim() === '') return [];
    
    const normalizedQuery = normalizeString(query);
    const results = [];
    
    locationList.forEach(location => {
        const normalizedLocation = normalizeString(location);
        
        // Kiểm tra trùng khớp trực tiếp
        if (normalizedLocation.includes(normalizedQuery) || 
            normalizedQuery.includes(normalizedLocation)) {
            results.push(location);
        }
        // Kiểm tra trùng khớp từng từ
        else {
            const queryWords = normalizedQuery.split(/\s+/);
            const locationWords = normalizedLocation.split(/\s+/);
            
            const matchCount = queryWords.filter(qWord => 
                locationWords.some(lWord => lWord.includes(qWord) || qWord.includes(lWord))
            ).length;
            
            if (matchCount > 0 && matchCount >= Math.min(2, queryWords.length)) {
                results.push(location);
            }
        }
    });
    
    return results;
}

// Tìm kiếm lộ trình CHÍNH XÁC
function searchRoute(fromQuery, toQuery) {
    const results = {
        fromMatches: [],
        toMatches: [],
        priceResults: [],
        scheduleResults: [],
        vehicleResults: [],
        connectedRoutes: [] // Thêm kết quả tuyến đường kết nối
    };
    
    const locationList = createLocationList();
    
    // Tìm địa điểm đi
    if (fromQuery && fromQuery.trim() !== '') {
        results.fromMatches = searchLocations(fromQuery, locationList);
    }
    
    // Tìm địa điểm đến
    if (toQuery && toQuery.trim() !== '') {
        results.toMatches = searchLocations(toQuery, locationList);
    }
    
    // Tìm kiếm trong bảng giá vé - tìm tuyến đường chính xác
    if (results.fromMatches.length > 0 && results.toMatches.length > 0) {
        giaveData.forEach(row => {
            const fromLocations = row[0].split(',').map(loc => loc.trim());
            const toLocations = row[1].split(',').map(loc => loc.trim());
            
            const fromMatch = fromLocations.some(fromLoc => 
                results.fromMatches.some(match => 
                    normalizeString(fromLoc) === normalizeString(match) ||
                    normalizeString(match).includes(normalizeString(fromLoc)) ||
                    normalizeString(fromLoc).includes(normalizeString(match))
                )
            );
            
            const toMatch = toLocations.some(toLoc => 
                results.toMatches.some(match => 
                    normalizeString(toLoc) === normalizeString(match) ||
                    normalizeString(match).includes(normalizeString(toLoc)) ||
                    normalizeString(toLoc).includes(normalizeString(match))
                )
            );
            
            if (fromMatch && toMatch) {
                results.priceResults.push({
                    from: row[0],
                    to: row[1],
                    price: row[2]
                });
            }
        });
    }
    
    // Tìm kiếm lộ trình kết nối (nếu không có tuyến trực tiếp)
    if (results.priceResults.length === 0 && results.fromMatches.length > 0 && results.toMatches.length > 0) {
        results.connectedRoutes = findConnectedRoutes(results.fromMatches, results.toMatches);
    }
    
    // Tìm kiếm thông tin xe đi - CHỈ tìm xe đi từ điểm đi CHÍNH XÁC
    if (results.fromMatches.length > 0) {
        vitriDiData.forEach(row => {
            const location = row[0].trim();
            
            // Kiểm tra chính xác điểm đi
            const match = results.fromMatches.some(match => {
                const normalizedLocation = normalizeString(location);
                const normalizedMatch = normalizeString(match);
                return normalizedLocation === normalizedMatch ||
                       normalizedLocation.includes(normalizedMatch) ||
                       normalizedMatch.includes(normalizedLocation);
            });
            
            if (match) {
                results.vehicleResults.push({
                    type: 'Đi',
                    location: row[0],
                    time: row[1],
                    license: row[2],
                    phone: row[3],
                    vehicleType: row[4]
                });
            }
        });
    }
    
    // Tìm kiếm thông tin xe về - CHỈ tìm xe về đến điểm đến CHÍNH XÁC
    if (results.toMatches.length > 0) {
        vitriVeData.forEach(row => {
            const location = row[0].trim();
            
            // Kiểm tra chính xác điểm đến
            const match = results.toMatches.some(match => {
                const normalizedLocation = normalizeString(location);
                const normalizedMatch = normalizeString(match);
                return normalizedLocation === normalizedMatch ||
                       normalizedLocation.includes(normalizedMatch) ||
                       normalizedMatch.includes(normalizedLocation);
            });
            
            if (match) {
                results.vehicleResults.push({
                    type: 'Về',
                    location: row[0],
                    time: row[1],
                    license: row[2],
                    phone: row[3],
                    vehicleType: row[4]
                });
            }
        });
    }
    
    return results;
}

// Tìm tuyến đường kết nối (nếu không có tuyến trực tiếp)
function findConnectedRoutes(fromMatches, toMatches) {
    const connectedRoutes = [];
    
    // Tìm các điểm trung gian từ dữ liệu giá vé
    giaveData.forEach(route => {
        const fromLocations = route[0].split(',').map(loc => loc.trim());
        const toLocations = route[1].split(',').map(loc => loc.trim());
        
        // Kiểm tra nếu điểm đi khớp với fromMatches
        const fromMatch = fromLocations.some(fromLoc => 
            fromMatches.some(match => 
                normalizeString(fromLoc) === normalizeString(match) ||
                normalizeString(match).includes(normalizeString(fromLoc)) ||
                normalizeString(fromLoc).includes(normalizeString(match))
            )
        );
        
        // Nếu khớp điểm đi, tìm điểm đến trung gian
        if (fromMatch) {
            // Tìm các tuyến từ điểm đến trung gian này đến điểm đến cuối cùng
            giaveData.forEach(secondRoute => {
                const secondFromLocations = secondRoute[0].split(',').map(loc => loc.trim());
                const secondToLocations = secondRoute[1].split(',').map(loc => loc.trim());
                
                // Kiểm tra nếu điểm đi của tuyến thứ 2 khớp với điểm đến của tuyến thứ 1
                const connectionMatch = toLocations.some(toLoc => 
                    secondFromLocations.some(secondFromLoc => 
                        normalizeString(toLoc) === normalizeString(secondFromLoc) ||
                        normalizeString(secondFromLoc).includes(normalizeString(toLoc)) ||
                        normalizeString(toLoc).includes(normalizeString(secondFromLoc))
                    )
                );
                
                // Kiểm tra nếu điểm đến của tuyến thứ 2 khớp với toMatches
                const finalMatch = secondToLocations.some(secondToLoc => 
                    toMatches.some(match => 
                        normalizeString(secondToLoc) === normalizeString(match) ||
                        normalizeString(match).includes(normalizeString(secondToLoc)) ||
                        normalizeString(secondToLoc).includes(normalizeString(match))
                    )
                );
                
                if (connectionMatch && finalMatch) {
                    connectedRoutes.push({
                        firstLeg: {
                            from: route[0],
                            to: route[1],
                            price: route[2]
                        },
                        secondLeg: {
                            from: secondRoute[0],
                            to: secondRoute[1],
                            price: secondRoute[2]
                        },
                        totalPrice: parseInt(route[2]) + parseInt(secondRoute[2])
                    });
                }
            });
        }
    });
    
    return connectedRoutes;
}

// Hiển thị kết quả tìm kiếm
function displaySearchResults(results, fromQuery, toQuery) {
    const resultsContent = document.getElementById('searchResultsContent');
    const resultCount = document.getElementById('resultCount');
    
    let html = '';
    
    if (results.fromMatches.length === 0 && results.toMatches.length === 0) {
        html = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>Không tìm thấy kết quả phù hợp</h3>
                <p>Không tìm thấy địa điểm nào phù hợp với từ khóa tìm kiếm của bạn.</p>
                <p>Vui lòng thử lại với từ khóa khác hoặc xem gợi ý bên dưới:</p>
                <ul class="suggestion-list">
                    <li>Nhập tên đầy đủ của địa điểm (ví dụ: "Mường Lát")</li>
                    <li>Thử viết tắt (ví dụ: "ML" cho "Mường Lát")</li>
                    <li>Nhập không dấu (ví dụ: "Muong Lat")</li>
                    <li>Chỉ nhập một phần của tên địa điểm</li>
                </ul>
            </div>
        `;
        resultCount.textContent = "Không tìm thấy kết quả nào";
    } else {
        // Hiển thị thông tin tìm kiếm
        let searchInfo = '';
        if (fromQuery && toQuery) {
            searchInfo = `Từ <strong>${fromQuery}</strong> đến <strong>${toQuery}</strong>`;
        } else if (fromQuery) {
            searchInfo = `Từ <strong>${fromQuery}</strong>`;
        } else if (toQuery) {
            searchInfo = `Đến <strong>${toQuery}</strong>`;
        }
        
        // Địa điểm tìm thấy
        html += `<div class="info-card">`;
        html += `<h3><i class="fas fa-map-marker-alt"></i> Địa Điểm Tìm Thấy</h3>`;
        
        if (results.fromMatches.length > 0) {
            html += `<div class="info-item">`;
            html += `<div class="info-label">Nơi đi:</div>`;
            html += `<div class="info-value">${results.fromMatches.join(', ')}</div>`;
            html += `</div>`;
        }
        
        if (results.toMatches.length > 0) {
            html += `<div class="info-item">`;
            html += `<div class="info-label">Nơi đến:</div>`;
            html += `<div class="info-value">${results.toMatches.join(', ')}</div>`;
            html += `</div>`;
        }
        html += `</div>`;
        
        // Kết quả giá vé (tuyến trực tiếp)
        if (results.priceResults.length > 0) {
            html += `<div class="info-card">`;
            html += `<h3><i class="fas fa-money-bill-wave"></i> Giá Vé Trực Tiếp (${results.priceResults.length} kết quả)</h3>`;
            html += `<table>`;
            html += `<thead><tr><th>Từ</th><th>Đến</th><th>Giá vé (nghìn đồng)</th></tr></thead>`;
            html += `<tbody>`;
            results.priceResults.forEach(result => {
                html += `<tr>`;
                html += `<td>${result.from}</td>`;
                html += `<td>${result.to}</td>`;
                html += `<td class="price-cell">${result.price}</td>`;
                html += `</tr>`;
            });
            html += `</tbody>`;
            html += `</table>`;
            html += `</div>`;
        }
        
        // Kết quả tuyến đường kết nối (nếu không có tuyến trực tiếp)
        if (results.connectedRoutes.length > 0) {
            html += `<div class="info-card">`;
            html += `<h3><i class="fas fa-route"></i> Tuyến Đường Kết Nối (${results.connectedRoutes.length} kết quả)</h3>`;
            html += `<p>Không có tuyến đường trực tiếp từ ${fromQuery} đến ${toQuery}. Dưới đây là các tuyến đường kết nối:</p>`;
            
            results.connectedRoutes.forEach((route, index) => {
                html += `<div class="connected-route">`;
                html += `<h5>Tuyến kết nối ${index + 1}</h5>`;
                html += `<div class="info-item">`;
                html += `<div class="info-label">Chặng 1:</div>`;
                html += `<div class="info-value">${route.firstLeg.from} → ${route.firstLeg.to} (${route.firstLeg.price} nghìn đồng)</div>`;
                html += `</div>`;
                html += `<div class="info-item">`;
                html += `<div class="info-label">Chặng 2:</div>`;
                html += `<div class="info-value">${route.secondLeg.from} → ${route.secondLeg.to} (${route.secondLeg.price} nghìn đồng)</div>`;
                html += `</div>`;
                html += `<div class="info-item">`;
                html += `<div class="info-label">Tổng giá:</div>`;
                html += `<div class="info-value"><strong>${route.totalPrice} nghìn đồng</strong></div>`;
                html += `</div>`;
                html += `</div>`;
            });
            html += `</div>`;
        }
        
        // Kết quả xe đi và xe về
        const diResults = results.vehicleResults.filter(r => r.type === 'Đi');
        const veResults = results.vehicleResults.filter(r => r.type === 'Về');
        
        if (diResults.length > 0) {
            html += `<div class="info-card">`;
            html += `<h3><i class="fas fa-bus"></i> Xe Đi Từ ${fromQuery} (${diResults.length} kết quả)</h3>`;
            html += `<table>`;
            html += `<thead><tr><th>Bến đi</th><th>Giờ đi</th><th>Biển số</th><th>Số điện thoại</th><th>Loại xe</th></tr></thead>`;
            html += `<tbody>`;
            diResults.forEach(result => {
                html += `<tr>`;
                html += `<td>${result.location}</td>`;
                html += `<td class="time-cell">${result.time}</td>`;
                html += `<td>${result.license}</td>`;
                html += `<td>${result.phone}</td>`;
                html += `<td style="color: ${result.vehicleType.toLowerCase() === 'nằm' ? '#2a5298' : '#e74c3c'}; font-weight: 600;">${result.vehicleType.toLowerCase() === 'nằm' ? 'Xe giường nằm' : 'Xe ghế ngồi'}</td>`;
                html += `</tr>`;
            });
            html += `</tbody>`;
            html += `</table>`;
            html += `</div>`;
        }
        
        if (veResults.length > 0) {
            html += `<div class="info-card">`;
            html += `<h3><i class="fas fa-bus"></i> Xe Về Đến ${toQuery} (${veResults.length} kết quả)</h3>`;
            html += `<table>`;
            html += `<thead><tr><th>Bến về</th><th>Giờ về</th><th>Biển số</th><th>Số điện thoại</th><th>Loại xe</th></tr></thead>`;
            html += `<tbody>`;
            veResults.forEach(result => {
                html += `<tr>`;
                html += `<td>${result.location}</td>`;
                html += `<td class="time-cell">${result.time}</td>`;
                html += `<td>${result.license}</td>`;
                html += `<td>${result.phone}</td>`;
                html += `<td style="color: ${result.vehicleType.toLowerCase() === 'nằm' ? '#2a5298' : '#e74c3c'}; font-weight: 600;">${result.vehicleType.toLowerCase() === 'nằm' ? 'Xe giường nằm' : 'Xe ghế ngồi'}</td>`;
                html += `</tr>`;
            });
            html += `</tbody>`;
            html += `</table>`;
            html += `</div>`;
        }
        
        // Tổng kết
        const totalResults = results.priceResults.length + results.connectedRoutes.length + diResults.length + veResults.length;
        
        if (totalResults === 0) {
            resultCount.textContent = `Không tìm thấy thông tin cho ${searchInfo}`;
            html += `<div class="no-results">`;
            html += `<i class="fas fa-info-circle"></i>`;
            html += `<h3>Không có thông tin lộ trình cụ thể</h3>`;
            html += `<p>Không tìm thấy thông tin lộ trình cụ thể cho tuyến đường này.</p>`;
            html += `<p>Vui lòng liên hệ hotline <strong>0948 955 999</strong> để được tư vấn chi tiết.</p>`;
            html += `</div>`;
        } else {
            resultCount.textContent = `Tìm thấy ${totalResults} kết quả cho ${searchInfo}`;
            
            // Nếu có cả xe đi và xe về nhưng không có giá vé trực tiếp
            if (results.priceResults.length === 0 && diResults.length > 0 && veResults.length > 0) {
                html += `<div class="route-connection">`;
                html += `<h4><i class="fas fa-lightbulb"></i> Gợi Ý</h4>`;
                html += `<p>Chúng tôi tìm thấy xe đi từ <strong>${fromQuery}</strong> và xe về đến <strong>${toQuery}</strong>, nhưng không có thông tin giá vé trực tiếp cho tuyến đường này.</p>`;
                html += `<p>Bạn có thể cần phải đổi xe tại một điểm trung gian hoặc liên hệ trực tiếp với nhà xe để biết thông tin chi tiết.</p>`;
                html += `</div>`;
            }
        }
    }
    
    resultsContent.innerHTML = html;
    
    // Hiển thị phần kết quả
    document.getElementById('searchResults').classList.add('active');
    document.getElementById('main-toc').style.display = 'none';
    
    // Ẩn các section khác
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Cuộn lên đầu trang
    window.scrollTo({top: 0, behavior: 'smooth'});
}

// Tự động gợi ý
function setupAutocomplete(inputElement, autocompleteElement) {
    const locationList = createLocationList();
    
    inputElement.addEventListener('input', function() {
        const query = this.value;
        if (query.length < 1) {
            autocompleteElement.style.display = 'none';
            return;
        }
        
        const matches = searchLocations(query, locationList).slice(0, 10);
        
        if (matches.length > 0) {
            autocompleteElement.innerHTML = '';
            matches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = match;
                item.addEventListener('click', function() {
                    inputElement.value = match;
                    autocompleteElement.style.display = 'none';
                });
                autocompleteElement.appendChild(item);
            });
            autocompleteElement.style.display = 'block';
        } else {
            autocompleteElement.style.display = 'none';
        }
    });
    
    // Ẩn autocomplete khi click ra ngoài
    document.addEventListener('click', function(e) {
        if (!autocompleteElement.contains(e.target) && e.target !== inputElement) {
            autocompleteElement.style.display = 'none';
        }
    });
}

// Hàm hiển thị dữ liệu bảng giá vé
function displayGiaveData() {
    const tableBody = document.getElementById('giave-table-body');
    tableBody.innerHTML = '';
    
    giaveData.forEach(row => {
        const tr = document.createElement('tr');
        
        // Xuất phát
        const td1 = document.createElement('td');
        td1.textContent = row[0];
        tr.appendChild(td1);
        
        // Điểm đến
        const td2 = document.createElement('td');
        td2.textContent = row[1];
        tr.appendChild(td2);
        
        // Giá vé
        const td3 = document.createElement('td');
        td3.textContent = row[2] + ' nghìn đồng';
        td3.className = 'price-cell';
        tr.appendChild(td3);
        
        tableBody.appendChild(tr);
    });
}

// Hàm hiển thị dữ liệu giờ xuất bến
function displayGioxuatbenData() {
    const tableBody = document.getElementById('gioxuatben-table-body');
    tableBody.innerHTML = '';
    
    gioxuatbenData.forEach(row => {
        const tr = document.createElement('tr');
        
        // Bến đi
        const td1 = document.createElement('td');
        td1.textContent = row[0];
        tr.appendChild(td1);
        
        // Giờ xuất bến
        const td2 = document.createElement('td');
        td2.textContent = row[1];
        td2.className = 'time-cell';
        tr.appendChild(td2);
        
        // Số điện thoại
        const td3 = document.createElement('td');
        td3.textContent = row[2];
        tr.appendChild(td3);
        
        tableBody.appendChild(tr);
    });
}

// Hàm hiển thị dữ liệu vị trí xe đi
function displayVitriDiData() {
    const tableBody = document.getElementById('vitri-di-table-body');
    tableBody.innerHTML = '';
    
    vitriDiData.forEach(row => {
        const tr = document.createElement('tr');
        
        // Bến đi
        const td1 = document.createElement('td');
        td1.textContent = row[0];
        tr.appendChild(td1);
        
        // Giờ đi
        const td2 = document.createElement('td');
        td2.textContent = row[1];
        td2.className = 'time-cell';
        tr.appendChild(td2);
        
        // Biển kiểm soát
        const td3 = document.createElement('td');
        td3.textContent = row[2];
        tr.appendChild(td3);
        
        // Số điện thoại
        const td4 = document.createElement('td');
        td4.textContent = row[3];
        tr.appendChild(td4);
        
        // Loại xe
        const td5 = document.createElement('td');
        const loaiXe = row[4].toLowerCase();
        td5.textContent = loaiXe === 'nằm' ? 'Xe giường nằm' : 'Xe ghế ngồi';
        td5.style.color = loaiXe === 'nằm' ? '#2a5298' : '#e74c3c';
        td5.style.fontWeight = '600';
        tr.appendChild(td5);
        
        tableBody.appendChild(tr);
    });
}

// Hàm hiển thị dữ liệu vị trí xe về
function displayVitriVeData() {
    const tableBody = document.getElementById('vitri-ve-table-body');
    tableBody.innerHTML = '';
    
    vitriVeData.forEach(row => {
        const tr = document.createElement('tr');
        
        // Bến về
        const td1 = document.createElement('td');
        td1.textContent = row[0];
        tr.appendChild(td1);
        
        // Giờ về
        const td2 = document.createElement('td');
        td2.textContent = row[1];
        td2.className = 'time-cell';
        tr.appendChild(td2);
        
        // Biển kiểm soát
        const td3 = document.createElement('td');
        td3.textContent = row[2];
        tr.appendChild(td3);
        
        // Số điện thoại
        const td4 = document.createElement('td');
        td4.textContent = row[3];
        tr.appendChild(td4);
        
        // Loại xe
        const td5 = document.createElement('td');
        const loaiXe = row[4].toLowerCase();
        td5.textContent = loaiXe === 'nằm' ? 'Xe giường nằm' : 'Xe ghế ngồi';
        td5.style.color = loaiXe === 'nằm' ? '#2a5298' : '#e74c3c';
        td5.style.fontWeight = '600';
        tr.appendChild(td5);
        
        tableBody.appendChild(tr);
    });
}

// Hàm điều hướng giữa các mục lục
function setupNavigation() {
    const tocCards = document.querySelectorAll('.toc-card');
    const backButtons = document.querySelectorAll('.back-to-toc');
    const contentSections = document.querySelectorAll('.content-section');
    const mainToc = document.getElementById('main-toc');
    const backFromResults = document.getElementById('backFromResults');
    const searchResults = document.getElementById('searchResults');
    
    // Xử lý click vào thẻ mục lục
    tocCards.forEach(card => {
        card.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Ẩn tất cả các section và hiện section được chọn
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Hiển thị section được chọn
            document.getElementById(sectionId).classList.add('active');
            
            // Ẩn kết quả tìm kiếm
            searchResults.classList.remove('active');
            
            // Cuộn lên đầu trang
            window.scrollTo({top: 0, behavior: 'smooth'});
            
            // Ẩn mục lục chính
            mainToc.style.display = 'none';
        });
    });
    
    // Xử lý click vào nút quay lại mục lục
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Ẩn tất cả các section
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Ẩn kết quả tìm kiếm
            searchResults.classList.remove('active');
            
            // Hiện mục lục chính
            mainToc.style.display = 'block';
            
            // Cuộn lên đầu trang
            window.scrollTo({top: 0, behavior: 'smooth'});
        });
    });
    
    // Xử lý click vào nút quay lại từ kết quả tìm kiếm
    backFromResults.addEventListener('click', function() {
        // Ẩn kết quả tìm kiếm
        searchResults.classList.remove('active');
        
        // Hiện mục lục chính
        mainToc.style.display = 'block';
        
        // Cuộn lên đầu trang
        window.scrollTo({top: 0, behavior: 'smooth'});
    });
}

// Khởi tạo trang web
function initializePage() {
    // Hiển thị dữ liệu
    displayGiaveData();
    displayGioxuatbenData();
    displayVitriDiData();
    displayVitriVeData();
    
    // Thiết lập điều hướng
    setupNavigation();
    
    // Thiết lập autocomplete
    setupAutocomplete(
        document.getElementById('fromLocation'),
        document.getElementById('fromAutocomplete')
    );
    
    setupAutocomplete(
        document.getElementById('toLocation'),
        document.getElementById('toAutocomplete')
    );
    
    // Xử lý form tìm kiếm
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fromQuery = document.getElementById('fromLocation').value.trim();
        const toQuery = document.getElementById('toLocation').value.trim();
        
        if (!fromQuery && !toQuery) {
            alert('Vui lòng nhập ít nhất một địa điểm để tìm kiếm');
            return;
        }
        
        // Thực hiện tìm kiếm
        const results = searchRoute(fromQuery, toQuery);
        displaySearchResults(results, fromQuery, toQuery);
    });
    
    // Hiển thị mục lục chính khi trang tải
    document.getElementById('main-toc').style.display = 'block';
}

// Khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', initializePage);
