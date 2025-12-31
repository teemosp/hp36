// Hàm chuẩn hóa chuỗi tiếng Việt (bỏ dấu, chuyển về chữ thường)
function normalizeString(str) {
    if (!str) return '';
    
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();
}

// Hàm kiểm tra khớp địa điểm thông minh
function isLocationMatch(loc1, loc2) {
    const norm1 = normalizeString(loc1);
    const norm2 = normalizeString(loc2);
    
    // Khớp chính xác
    if (norm1 === norm2) return true;
    
    // Khớp một trong hai chứa nhau
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
    
    // Khớp từng từ
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    
    // Nếu có ít nhất một từ chung
    return words1.some(w1 => words2.some(w2 => 
        w1 === w2 || w1.includes(w2) || w2.includes(w1)
    ));
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

// Hàm tìm kiếm địa điểm nâng cao
function searchLocationsAdvanced(query, locationList) {
    if (!query || query.trim() === '') return [];
    
    const normalizedQuery = normalizeString(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    const results = new Map(); // Dùng Map để tránh trùng lặp
    
    locationList.forEach(location => {
        const normalizedLocation = normalizeString(location);
        
        // 1. Khớp chính xác (điểm cao nhất)
        if (normalizedLocation === normalizedQuery) {
            results.set(location, 100);
        }
        // 2. Khớp chứa nhau
        else if (normalizedLocation.includes(normalizedQuery)) {
            results.set(location, 80);
        }
        // 3. Query chứa location
        else if (normalizedQuery.includes(normalizedLocation)) {
            results.set(location, 60);
        }
        // 4. Khớp viết tắt (ví dụ: "ML" cho "Mường Lát")
        else if (query.length <= 3 && 
                 normalizedLocation.split(' ').some(word => 
                    word.startsWith(normalizedQuery))) {
            results.set(location, 70);
        }
        // 5. Khớp từng từ
        else {
            const locationWords = normalizedLocation.split(/\s+/);
            let matchScore = 0;
            let wordMatchCount = 0;
            
            queryWords.forEach(qWord => {
                locationWords.forEach(lWord => {
                    if (lWord === qWord) {
                        matchScore += 40;
                        wordMatchCount++;
                    }
                    else if (lWord.includes(qWord)) {
                        matchScore += 30;
                        wordMatchCount++;
                    }
                    else if (qWord.includes(lWord)) {
                        matchScore += 20;
                        wordMatchCount++;
                    }
                });
            });
            
            if (wordMatchCount > 0) {
                const avgScore = matchScore / (queryWords.length * locationWords.length);
                if (avgScore > 0.3) { // Ngưỡng tối thiểu
                    results.set(location, avgScore * 100);
                }
            }
        }
        
        // 6. Kiểm tra khớp một phần
        if (!results.has(location)) {
            const words = normalizedLocation.split(/\s+/);
            const hasPartialMatch = words.some(word => 
                normalizedQuery.split(/\s+/).some(qWord => 
                    word.includes(qWord) || qWord.includes(word)
                )
            );
            
            if (hasPartialMatch) {
                results.set(location, 30);
            }
        }
    });
    
    // Chuyển Map thành mảng và sắp xếp theo điểm
    const sortedResults = Array.from(results.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    // Ưu tiên kết quả có độ dài gần với query
    sortedResults.sort((a, b) => {
        const aDiff = Math.abs(a.length - query.length);
        const bDiff = Math.abs(b.length - query.length);
        return aDiff - bDiff;
    });
    
    return sortedResults.slice(0, 10);
}

// Hàm highlight từ khóa trong kết quả
function highlightMatch(text, query) {
    const normalizedText = normalizeString(text);
    const normalizedQuery = normalizeString(query);
    
    if (normalizedText.includes(normalizedQuery)) {
        const startIndex = normalizedText.indexOf(normalizedQuery);
        const originalStart = text.substring(startIndex, startIndex + query.length);
        
        return text.replace(
            new RegExp(originalStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
            `<strong>${originalStart}</strong>`
        );
    }
    
    const words = text.split(/(\s+)/);
    const queryWords = normalizedQuery.split(/\s+/);
    
    const highlightedWords = words.map(word => {
        const normalizedWord = normalizeString(word);
        const matchingQueryWord = queryWords.find(qWord => 
            normalizedWord.includes(qWord) || qWord.includes(normalizedWord)
        );
        
        if (matchingQueryWord && normalizedWord.length > 0) {
            return `<strong>${word}</strong>`;
        }
        return word;
    });
    
    return highlightedWords.join('');
}

// Hàm loại bỏ kết quả trùng lặp
function removeDuplicates(array, key1, key2) {
    const seen = new Set();
    return array.filter(item => {
        const identifier = `${item[key1]}-${item[key2]}`;
        if (seen.has(identifier)) {
            return false;
        }
        seen.add(identifier);
        return true;
    });
}

// Tìm kiếm lộ trình CHÍNH XÁC với tìm kiếm nâng cao - TÌM 2 CHIỀU
function searchRoute(fromQuery, toQuery) {
    const results = {
        fromMatches: [],
        toMatches: [],
        priceResults: [],
        scheduleResults: [],
        vehicleResults: [],
        connectedRoutes: []
    };
    
    const locationList = createLocationList();
    
    // Tìm địa điểm đi với thuật toán nâng cao
    if (fromQuery && fromQuery.trim() !== '') {
        results.fromMatches = searchLocationsAdvanced(fromQuery, locationList);
    }
    
    // Tìm địa điểm đến với thuật toán nâng cao
    if (toQuery && toQuery.trim() !== '') {
        results.toMatches = searchLocationsAdvanced(toQuery, locationList);
    }
    
    // Tìm kiếm trong bảng giá vé - TÌM CẢ 2 CHIỀU
    if ((results.fromMatches.length > 0 || results.toMatches.length > 0)) {
        giaveData.forEach(row => {
            const fromLocations = row[0].split(',').map(loc => loc.trim());
            const toLocations = row[1].split(',').map(loc => loc.trim());
            
            // TRƯỜNG HỢP 1: Cả điểm đi và điểm đến đều có
            if (fromQuery && toQuery && results.fromMatches.length > 0 && results.toMatches.length > 0) {
                // Kiểm tra khớp thông minh cho điểm đi (chiều xuôi)
                const fromMatch = fromLocations.some(fromLoc => {
                    return results.fromMatches.some(match => 
                        isLocationMatch(fromLoc, match)
                    );
                });
                
                // Kiểm tra khớp thông minh cho điểm đến (chiều xuôi)
                const toMatch = toLocations.some(toLoc => {
                    return results.toMatches.some(match => 
                        isLocationMatch(toLoc, match)
                    );
                });
                
                if (fromMatch && toMatch) {
                    results.priceResults.push({
                        from: row[0],
                        to: row[1],
                        price: row[2],
                        direction: 'forward'
                    });
                }
                
                // KIỂM TRA CHIỀU NGƯỢC (nếu Quễ Võ là điểm đến trong dữ liệu)
                const reverseFromMatch = toLocations.some(toLoc => {
                    return results.fromMatches.some(match => 
                        isLocationMatch(toLoc, match)
                    );
                });
                
                const reverseToMatch = fromLocations.some(fromLoc => {
                    return results.toMatches.some(match => 
                        isLocationMatch(fromLoc, match)
                    );
                });
                
                if (reverseFromMatch && reverseToMatch) {
                    results.priceResults.push({
                        from: row[1], // Đảo ngược (Quễ Võ → ...)
                        to: row[0],   // Đảo ngược
                        price: 'Liên hệ', // Không có giá ngược
                        direction: 'reverse',
                        note: 'Chiều ngược - Vui lòng liên hệ'
                    });
                }
            }
            
            // TRƯỜNG HỢP 2: Chỉ có điểm đi (tìm tất cả các điểm đến từ điểm đi này)
            else if (fromQuery && results.fromMatches.length > 0 && !toQuery) {
                // Kiểm tra điểm đi khớp với cột "từ" (chiều xuôi)
                const fromMatch = fromLocations.some(fromLoc => {
                    return results.fromMatches.some(match => 
                        isLocationMatch(fromLoc, match)
                    );
                });
                
                if (fromMatch) {
                    results.priceResults.push({
                        from: row[0],
                        to: row[1],
                        price: row[2],
                        direction: 'forward',
                        isFromSearch: true
                    });
                }
                
                // Kiểm tra điểm đi khớp với cột "đến" (chiều ngược - Quễ Võ là điểm đến)
                const reverseFromMatch = toLocations.some(toLoc => {
                    return results.fromMatches.some(match => 
                        isLocationMatch(toLoc, match)
                    );
                });
                
                if (reverseFromMatch) {
                    results.priceResults.push({
                        from: row[1], // Đảo ngược (Quễ Võ → ...)
                        to: row[0],   // Đảo ngược
                        price: 'Liên hệ',
                        direction: 'reverse',
                        isFromSearch: true,
                        note: 'Tuyến ngược - Vui lòng liên hệ'
                    });
                }
            }
            
            // TRƯỜNG HỢP 3: Chỉ có điểm đến (tìm tất cả các điểm đi đến điểm đến này)
            else if (toQuery && results.toMatches.length > 0 && !fromQuery) {
                // Kiểm tra điểm đến khớp với cột "đến" (chiều xuôi)
                const toMatch = toLocations.some(toLoc => {
                    return results.toMatches.some(match => 
                        isLocationMatch(toLoc, match)
                    );
                });
                
                if (toMatch) {
                    results.priceResults.push({
                        from: row[0],
                        to: row[1],
                        price: row[2],
                        direction: 'forward',
                        isToSearch: true
                    });
                }
                
                // Kiểm tra điểm đến khớp với cột "từ" (chiều ngược)
                const reverseToMatch = fromLocations.some(fromLoc => {
                    return results.toMatches.some(match => 
                        isLocationMatch(fromLoc, match)
                    );
                });
                
                if (reverseToMatch) {
                    results.priceResults.push({
                        from: row[1], // Đảo ngược
                        to: row[0],   // Đảo ngược
                        price: 'Liên hệ',
                        direction: 'reverse',
                        isToSearch: true,
                        note: 'Tuyến ngược - Vui lòng liên hệ'
                    });
                }
            }
        });
    }
    
    // Tìm kiếm lộ trình kết nối (nếu không có tuyến trực tiếp)
    if (results.priceResults.length === 0 && results.fromMatches.length > 0 && results.toMatches.length > 0) {
        results.connectedRoutes = findConnectedRoutes(results.fromMatches, results.toMatches);
    }
    
    // Tìm kiếm thông tin xe đi - tìm cả 2 chiều
    if (results.fromMatches.length > 0) {
        vitriDiData.forEach(row => {
            const location = row[0].trim();
            
            // Kiểm tra chính xác điểm đi
            const match = results.fromMatches.some(match => {
                return isLocationMatch(location, match);
            });
            
            if (match) {
                results.vehicleResults.push({
                    type: 'Đi',
                    location: row[0],
                    time: row[1],
                    license: row[2],
                    phone: row[3],
                    vehicleType: row[4],
                    direction: 'forward'
                });
            }
        });
        
        // Kiểm tra xe về có điểm về trùng với điểm đi người dùng nhập
        vitriVeData.forEach(row => {
            const location = row[0].trim();
            
            const match = results.fromMatches.some(match => {
                return isLocationMatch(location, match);
            });
            
            if (match) {
                results.vehicleResults.push({
                    type: 'Về tại điểm đi',
                    location: row[0],
                    time: row[1],
                    license: row[2],
                    phone: row[3],
                    vehicleType: row[4],
                    direction: 'reverse'
                });
            }
        });
    }
    
    // Tìm kiếm thông tin xe về - tìm cả 2 chiều
    if (results.toMatches.length > 0) {
        vitriVeData.forEach(row => {
            const location = row[0].trim();
            
            // Kiểm tra chính xác điểm đến
            const match = results.toMatches.some(match => {
                return isLocationMatch(location, match);
            });
            
            if (match) {
                results.vehicleResults.push({
                    type: 'Về',
                    location: row[0],
                    time: row[1],
                    license: row[2],
                    phone: row[3],
                    vehicleType: row[4],
                    direction: 'forward'
                });
            }
        });
        
        // Kiểm tra xe đi có điểm đi trùng với điểm đến người dùng nhập
        vitriDiData.forEach(row => {
            const location = row[0].trim();
            
            const match = results.toMatches.some(match => {
                return isLocationMatch(location, match);
            });
            
            if (match) {
                results.vehicleResults.push({
                    type: 'Đi từ điểm đến',
                    location: row[0],
                    time: row[1],
                    license: row[2],
                    phone: row[3],
                    vehicleType: row[4],
                    direction: 'reverse'
                });
            }
        });
    }
    
    // Loại bỏ kết quả trùng lặp
    results.priceResults = removeDuplicates(results.priceResults, 'from', 'to');
    results.vehicleResults = removeDuplicates(results.vehicleResults, 'location', 'time');
    
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
                isLocationMatch(fromLoc, match)
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
                        isLocationMatch(toLoc, secondFromLoc)
                    )
                );
                
                // Kiểm tra nếu điểm đến của tuyến thứ 2 khớp với toMatches
                const finalMatch = secondToLocations.some(secondToLoc => 
                    toMatches.some(match => 
                        isLocationMatch(secondToLoc, match)
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

// Hàm lấy điểm đến gợi ý
function getSuggestedDestinations(fromLocation) {
    const destinations = new Set();
    
    giaveData.forEach(row => {
        const fromLocations = row[0].split(',').map(loc => loc.trim());
        const toLocations = row[1].split(',').map(loc => loc.trim());
        
        if (fromLocations.some(loc => isLocationMatch(loc, fromLocation))) {
            toLocations.forEach(toLoc => destinations.add(toLoc));
        }
    });
    
    return Array.from(destinations).slice(0, 10);
}

// Hàm tìm kiếm từ gợi ý
function searchFromSuggestion(from, to) {
    document.getElementById('fromLocation').value = from;
    document.getElementById('toLocation').value = to;
    
    const results = searchRoute(from, to);
    displaySearchResults(results, from, to);
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
                    <li>Nhập tên đầy đủ của địa điểm (ví dụ: "Quễ Võ")</li>
                    <li>Thử viết tắt (ví dụ: "QV" cho "Quễ Võ")</li>
                    <li>Nhập không dấu (ví dụ: "Que Vo")</li>
                    <li>Chỉ nhập một phần của tên địa điểm</li>
                </ul>
            </div>
        `;
        resultCount.textContent = "Không tìm thấy kết quả nào";
    } else {
        // Hiển thị thông tin tìm kiếm
        let searchInfo = '';
        if (fromQuery && toQuery) {
            searchInfo = `Tìm kiếm từ <strong>${fromQuery}</strong> đến <strong>${toQuery}</strong>`;
        } else if (fromQuery) {
            searchInfo = `Tìm tất cả tuyến từ <strong>${fromQuery}</strong>`;
        } else if (toQuery) {
            searchInfo = `Tìm tất cả tuyến đến <strong>${toQuery}</strong>`;
        }
        
        // Địa điểm tìm thấy
        html += `<div class="info-card">`;
        html += `<h3><i class="fas fa-map-marker-alt"></i> Địa Điểm Tìm Thấy</h3>`;
        
        if (results.fromMatches.length > 0) {
            html += `<div class="info-item">`;
            html += `<div class="info-label">${fromQuery ? 'Nơi đi tìm thấy:' : 'Điểm tìm thấy:'}</div>`;
            html += `<div class="info-value">${results.fromMatches.join(', ')}</div>`;
            html += `</div>`;
        }
        
        if (results.toMatches.length > 0) {
            html += `<div class="info-item">`;
            html += `<div class="info-label">${toQuery ? 'Nơi đến tìm thấy:' : 'Điểm tìm thấy:'}</div>`;
            html += `<div class="info-value">${results.toMatches.join(', ')}</div>`;
            html += `</div>`;
        }
        html += `</div>`;
        
        // Phân loại kết quả giá vé
        const forwardResults = results.priceResults.filter(r => r.direction === 'forward');
        const reverseResults = results.priceResults.filter(r => r.direction === 'reverse');
        
        // Kết quả giá vé CHIỀU XUÔI
        if (forwardResults.length > 0) {
            html += `<div class="info-card">`;
            if (fromQuery && toQuery) {
                html += `<h3><i class="fas fa-money-bill-wave"></i> Giá Vé Chiều Xuôi (${forwardResults.length} kết quả)</h3>`;
            } else if (fromQuery) {
                html += `<h3><i class="fas fa-money-bill-wave"></i> Các Tuyến Xuất Phát Từ ${fromQuery} (${forwardResults.length} kết quả)</h3>`;
            } else if (toQuery) {
                html += `<h3><i class="fas fa-money-bill-wave"></i> Các Tuyến Đến ${toQuery} (${forwardResults.length} kết quả)</h3>`;
            }
            
            html += `<table>`;
            html += `<thead><tr><th>Từ</th><th>Đến</th><th>Giá vé (nghìn đồng)</th></tr></thead>`;
            html += `<tbody>`;
            forwardResults.forEach(result => {
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
        
        // Kết quả giá vé CHIỀU NGƯỢC (nếu có)
        if (reverseResults.length > 0) {
            html += `<div class="info-card">`;
            html += `<h3><i class="fas fa-exchange-alt"></i> Tuyến Ngược Chiều (${reverseResults.length} kết quả)</h3>`;
            html += `<p><i class="fas fa-info-circle"></i> Đây là các tuyến ngược chiều. Vui lòng liên hệ hotline để biết giá chính xác.</p>`;
            html += `<table>`;
            html += `<thead><tr><th>Từ</th><th>Đến</th><th>Giá vé</th><th>Ghi chú</th></tr></thead>`;
            html += `<tbody>`;
            reverseResults.forEach(result => {
                html += `<tr>`;
                html += `<td>${result.from}</td>`;
                html += `<td>${result.to}</td>`;
                html += `<td class="price-cell">${result.price}</td>`;
                html += `<td>${result.note || 'Chiều ngược'}</td>`;
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
        
        // Thông báo nếu không có kết quả
        if (forwardResults.length === 0 && reverseResults.length === 0 && results.connectedRoutes.length === 0) {
            if (fromQuery && !toQuery) {
                html += `<div class="search-message warning">`;
                html += `<h4><i class="fas fa-info-circle"></i> Không tìm thấy tuyến từ ${fromQuery}</h4>`;
                html += `<p>Không tìm thấy tuyến đường nào xuất phát từ <strong>${fromQuery}</strong> trong cơ sở dữ liệu.</p>`;
                html += `<p>Thử tìm kiếm:</p>`;
                html += `<ul class="suggestion-list">`;
                html += `<li><button onclick="document.getElementById('toLocation').value = '${fromQuery}'; document.getElementById('searchForm').submit();">Tìm các tuyến đến ${fromQuery}</button></li>`;
                html += `<li>Liên hệ hotline <strong>0948 531 333</strong> để được tư vấn</li>`;
                html += `</ul>`;
                html += `</div>`;
            } else if (!fromQuery && toQuery) {
                html += `<div class="search-message warning">`;
                html += `<h4><i class="fas fa-info-circle"></i> Không tìm thấy tuyến đến ${toQuery}</h4>`;
                html += `<p>Không tìm thấy tuyến đường nào đến <strong>${toQuery}</strong> trong cơ sở dữ liệu.</p>`;
                html += `<p>Thử tìm kiếm:</p>`;
                html += `<ul class="suggestion-list">`;
                html += `<li><button onclick="document.getElementById('fromLocation').value = '${toQuery}'; document.getElementById('searchForm').submit();">Tìm các tuyến từ ${toQuery}</button></li>`;
                html += `<li>Liên hệ hotline <strong>0948 531 333</strong> để được tư vấn</li>`;
                html += `</ul>`;
                html += `</div>`;
            }
        }
        
        // Kết quả xe đi và xe về
        const diResults = results.vehicleResults.filter(r => r.type === 'Đi');
        const veResults = results.vehicleResults.filter(r => r.type === 'Về');
        const diFromTo = results.vehicleResults.filter(r => r.type === 'Đi từ điểm đến');
        const veAtFrom = results.vehicleResults.filter(r => r.type === 'Về tại điểm đi');
        
        if (diResults.length > 0) {
            html += `<div class="info-card">`;
            html += `<h3><i class="fas fa-bus"></i> Xe Đi Từ ${fromQuery || 'các điểm'} (${diResults.length} kết quả)</h3>`;
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
            html += `<h3><i class="fas fa-bus"></i> Xe Về Đến ${toQuery || 'các điểm'} (${veResults.length} kết quả)</h3>`;
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
        
        // Các kết quả đặc biệt
        if (diFromTo.length > 0) {
            html += `<div class="info-card">`;
            html += `<h3><i class="fas fa-bus"></i> Xe Đi Từ ${toQuery} (${diFromTo.length} kết quả)</h3>`;
            html += `<p><i class="fas fa-info-circle"></i> Các xe này đi từ điểm đến bạn đã nhập:</p>`;
            html += `<table>`;
            html += `<thead><tr><th>Bến đi</th><th>Giờ đi</th><th>Biển số</th><th>Số điện thoại</th><th>Loại xe</th></tr></thead>`;
            html += `<tbody>`;
            diFromTo.forEach(result => {
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
        
        if (veAtFrom.length > 0) {
            html += `<div class="info-card">`;
            html += `<h3><i class="fas fa-bus"></i> Xe Về Tại ${fromQuery} (${veAtFrom.length} kết quả)</h3>`;
            html += `<p><i class="fas fa-info-circle"></i> Các xe này về tại điểm đi bạn đã nhập:</p>`;
            html += `<table>`;
            html += `<thead><tr><th>Bến về</th><th>Giờ về</th><th>Biển số</th><th>Số điện thoại</th><th>Loại xe</th></tr></thead>`;
            html += `<tbody>`;
            veAtFrom.forEach(result => {
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
        const totalResults = forwardResults.length + reverseResults.length + 
                            results.connectedRoutes.length + 
                            diResults.length + veResults.length + 
                            diFromTo.length + veAtFrom.length;
        
        if (totalResults === 0) {
            resultCount.textContent = `Không tìm thấy thông tin cho ${searchInfo}`;
        } else {
            resultCount.textContent = `Tìm thấy ${totalResults} kết quả cho ${searchInfo}`;
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

// Tự động gợi ý nâng cao
function setupAutocomplete(inputElement, autocompleteElement) {
    const locationList = createLocationList();
    
    inputElement.addEventListener('input', function() {
        const query = this.value;
        if (query.length < 1) {
            autocompleteElement.style.display = 'none';
            return;
        }
        
        // Sử dụng hàm tìm kiếm nâng cao
        const matches = searchLocationsAdvanced(query, locationList);
        
        if (matches.length > 0) {
            autocompleteElement.innerHTML = '';
            matches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                
                // Highlight từ khóa tìm kiếm trong kết quả
                const displayText = highlightMatch(match, query);
                item.innerHTML = displayText;
                
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
    
    // Xử lý phím tắt
    inputElement.addEventListener('keydown', function(e) {
        const items = autocompleteElement.querySelectorAll('.autocomplete-item');
        const activeItem = autocompleteElement.querySelector('.autocomplete-item.active');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!activeItem) {
                items[0]?.classList.add('active');
            } else {
                activeItem.classList.remove('active');
                const nextItem = activeItem.nextElementSibling || items[0];
                nextItem.classList.add('active');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (!activeItem) {
                items[items.length - 1]?.classList.add('active');
            } else {
                activeItem.classList.remove('active');
                const prevItem = activeItem.previousElementSibling || items[items.length - 1];
                prevItem.classList.add('active');
            }
        } else if (e.key === 'Enter' && activeItem) {
            e.preventDefault();
            activeItem.click();
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
    
    // Xử lý form tìm kiếm với xử lý viết tắt
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        let fromQuery = document.getElementById('fromLocation').value.trim();
        let toQuery = document.getElementById('toLocation').value.trim();
        
        if (!fromQuery && !toQuery) {
            alert('Vui lòng nhập ít nhất một địa điểm để tìm kiếm');
            return;
        }
        
        // Xử lý viết tắt phổ biến
        const abbreviationMap = {
            'ml': 'Mường Lát',
            'tn': 'Thái Nguyên',
            'hp': 'Hải Phòng',
            'hn': 'Hà Nội',
            'th': 'Thanh Hóa',
            'qv': 'Quễ Võ',
            'tt': 'Tén Tằn',
            'na': 'Na mèo',
            'ct': 'Cẩm Thủy',
            'qh': 'Quan Hóa',
            'qs': 'Quan Sơn',
            'bg': 'Bắc Giang',
            'bn': 'Bắc Ninh',
            'hd': 'Hải Dương',
            'hy': 'Hưng Yên',
            'xb': 'Xuân Bái',
            'xm': 'Xuân Mai',
            'cn': 'Chi Nê',
            'yc': 'Yên Châu',
            'yt': 'Yên Thủy'
        };
        
        // Kiểm tra viết tắt cho điểm đi
        const normalizedFrom = normalizeString(fromQuery);
        if (abbreviationMap[normalizedFrom]) {
            fromQuery = abbreviationMap[normalizedFrom];
            document.getElementById('fromLocation').value = fromQuery;
        }
        
        // Kiểm tra viết tắt cho điểm đến
        const normalizedTo = normalizeString(toQuery);
        if (abbreviationMap[normalizedTo]) {
            toQuery = abbreviationMap[normalizedTo];
            document.getElementById('toLocation').value = toQuery;
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
