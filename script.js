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
    showLoading(true);
    
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
    results.vehicleResults =
