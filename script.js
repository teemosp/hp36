// ========== CORE VARIABLES ==========
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const isiPhoneX = window.innerWidth === 375 && window.innerHeight === 812;

// ========== LOGGING ==========
console.log('=== APP INITIALIZATION ===');
console.log('User Agent:', navigator.userAgent);
console.log('Screen:', window.innerWidth + 'x' + window.innerHeight);
console.log('iOS:', isIOS, 'iPhone X:', isiPhoneX);

// ========== EMERGENCY iOS FIX ==========
if (isIOS) {
    console.log('🚨 APPLYING iOS EMERGENCY FIXES');
    document.body.classList.add('ios-device');
    
    // Force tables to be visible
    const forceTablesVisible = () => {
        const tables = document.querySelectorAll('table');
        console.log(`Found ${tables.length} tables, forcing visibility...`);
        
        tables.forEach((table, index) => {
            table.style.display = 'table';
            table.style.visibility = 'visible';
            table.style.opacity = '1';
            table.style.width = '100%';
            table.style.minWidth = '500px';
            table.style.position = 'relative';
            table.style.zIndex = '10';
            
            // Force parent containers
            let parent = table.parentElement;
            while (parent && parent !== document.body) {
                parent.style.display = 'block';
                parent.style.overflow = 'visible';
                parent.style.width = '100%';
                parent = parent.parentElement;
            }
        });
    };
    
    // Run immediately and multiple times
    forceTablesVisible();
    setTimeout(forceTablesVisible, 100);
    setTimeout(forceTablesVisible, 500);
    setTimeout(forceTablesVisible, 1000);
}

// ========== DATA DISPLAY FUNCTIONS ==========
function displayGiaveData() {
    const tableBody = document.getElementById('giave-table-body');
    if (!tableBody) {
        console.error('giave-table-body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    giaveData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[0]}</td>
            <td>${row[1]}</td>
            <td class="price-cell">${row[2]} nghìn đồng</td>
        `;
        tableBody.appendChild(tr);
    });
    
    console.log(`✓ Bảng giá vé: ${tableBody.children.length} dòng`);
}

function displayGioxuatbenData() {
    const tableBody = document.getElementById('gioxuatben-table-body');
    if (!tableBody) {
        console.error('gioxuatben-table-body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    gioxuatbenData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[0]}</td>
            <td class="time-cell">${row[1]}</td>
            <td>${row[2]}</td>
        `;
        tableBody.appendChild(tr);
    });
    
    console.log(`✓ Bảng giờ xuất bến: ${tableBody.children.length} dòng`);
}

function displayVitriDiData() {
    const tableBody = document.getElementById('vitri-di-table-body');
    if (!tableBody) {
        console.error('vitri-di-table-body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    vitriDiData.forEach(row => {
        const tr = document.createElement('tr');
        const vehicleType = row[4]?.toLowerCase() === 'nằm' ? 'Xe giường nằm' : 'Xe ghế ngồi';
        const vehicleColor = row[4]?.toLowerCase() === 'nằm' ? '#2a5298' : '#e74c3c';
        
        tr.innerHTML = `
            <td>${row[0]}</td>
            <td class="time-cell">${row[1]}</td>
            <td>${row[2] || ''}</td>
            <td>${row[3] || ''}</td>
            <td style="color: ${vehicleColor}; font-weight: 600;">${vehicleType}</td>
        `;
        tableBody.appendChild(tr);
    });
    
    console.log(`✓ Bảng xe đi: ${tableBody.children.length} dòng`);
}

function displayVitriVeData() {
    const tableBody = document.getElementById('vitri-ve-table-body');
    if (!tableBody) {
        console.error('vitri-ve-table-body not found');
        return;
    }
    
    tableBody.innerHTML = '';
    
    vitriVeData.forEach(row => {
        const tr = document.createElement('tr');
        const vehicleType = row[4]?.toLowerCase() === 'nằm' ? 'Xe giường nằm' : 'Xe ghế ngồi';
        const vehicleColor = row[4]?.toLowerCase() === 'nằm' ? '#2a5298' : '#e74c3c';
        
        tr.innerHTML = `
            <td>${row[0]}</td>
            <td class="time-cell">${row[1]}</td>
            <td>${row[2] || ''}</td>
            <td>${row[3] || ''}</td>
            <td style="color: ${vehicleColor}; font-weight: 600;">${vehicleType}</td>
        `;
        tableBody.appendChild(tr);
    });
    
    console.log(`✓ Bảng xe về: ${tableBody.children.length} dòng`);
}

// ========== DISPLAY ALL DATA ==========
function displayAllData() {
    console.log('Loading all data tables...');
    
    try {
        displayGiaveData();
        displayGioxuatbenData();
        displayVitriDiData();
        displayVitriVeData();
        
        console.log('✅ All data loaded successfully');
        
        // iOS: Force check after loading
        if (isIOS) {
            setTimeout(() => {
                const tables = document.querySelectorAll('tbody');
                console.log(`Table bodies: ${tables.length}`);
                tables.forEach((t, i) => {
                    console.log(`Table ${i+1}: ${t.children.length} rows`);
                });
            }, 300);
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
    }
}

// ========== NAVIGATION ==========
function setupNavigation() {
    console.log('Setting up navigation...');
    
    // TOC Cards
    document.querySelectorAll('.toc-card').forEach(card => {
        card.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            console.log(`Opening section: ${sectionId}`);
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
                document.getElementById('main-toc').style.display = 'none';
                
                // iOS: Force table visibility
                if (isIOS) {
                    setTimeout(() => {
                        const tables = targetSection.querySelectorAll('table');
                        tables.forEach(table => {
                            table.style.display = 'table';
                            table.style.visibility = 'visible';
                        });
                    }, 50);
                }
            }
        });
    });
    
    // Back buttons
    document.querySelectorAll('.back-to-toc').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById('main-toc').style.display = 'block';
        });
    });
    
    // Search results back button
    const backFromResults = document.getElementById('backFromResults');
    if (backFromResults) {
        backFromResults.addEventListener('click', function() {
            document.getElementById('searchResults').classList.remove('active');
            document.getElementById('main-toc').style.display = 'block';
        });
    }
    
    console.log('✅ Navigation setup complete');
}

// ========== SEARCH ==========
function setupSearch() {
    console.log('Setting up search...');
    
    const searchForm = document.getElementById('searchForm');
    if (!searchForm) {
        console.error('Search form not found');
        return;
    }
    
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const from = document.getElementById('fromLocation').value.trim();
        const to = document.getElementById('toLocation').value.trim();
        
        if (!from && !to) {
            alert('Vui lòng nhập ít nhất một địa điểm để tìm kiếm');
            return;
        }
        
        console.log(`Searching: ${from} → ${to}`);
        
        // Simple search implementation
        const resultsDiv = document.getElementById('searchResultsContent');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="info-card">
                    <h3><i class="fas fa-search"></i> Kết Quả Tìm Kiếm</h3>
                    <p>Tìm kiếm từ <strong>${from || '...'}</strong> đến <strong>${to || '...'}</strong></p>
                    <p>Chức năng tìm kiếm nâng cao đang được cập nhật. Vui lòng xem bảng giá vé bên dưới.</p>
                </div>
            `;
            
            document.getElementById('searchResults').classList.add('active');
            document.getElementById('main-toc').style.display = 'none';
        }
    });
    
    console.log('✅ Search setup complete');
}

// ========== AUTOCOMPLETE ==========
function setupAutocomplete(inputElement, autocompleteElement) {
    if (!inputElement || !autocompleteElement) return;
    
    const locationList = createLocationList();
    
    inputElement.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length < 1) {
            autocompleteElement.style.display = 'none';
            return;
        }
        
        const matches = searchLocationsAdvanced(query, locationList);
        
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
    
    // Hide when clicking outside
    document.addEventListener('click', function(e) {
        if (!autocompleteElement.contains(e.target) && e.target !== inputElement) {
            autocompleteElement.style.display = 'none';
        }
    });
}

// ========== HELPER FUNCTIONS ==========
function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .trim();
}

function createLocationList() {
    const locations = new Set();
    
    giaveData.forEach(row => {
        row[0].split(',').forEach(loc => locations.add(loc.trim()));
        row[1].split(',').forEach(loc => locations.add(loc.trim()));
    });
    
    gioxuatbenData.forEach(row => locations.add(row[0].trim()));
    vitriDiData.forEach(row => locations.add(row[0].trim()));
    vitriVeData.forEach(row => locations.add(row[0].trim()));
    
    return Array.from(locations).filter(loc => loc.length > 0);
}

function searchLocationsAdvanced(query, locationList) {
    if (!query) return [];
    
    const normalizedQuery = normalizeString(query);
    const results = [];
    
    locationList.forEach(location => {
        const normalizedLocation = normalizeString(location);
        
        if (normalizedLocation.includes(normalizedQuery) || 
            normalizedQuery.includes(normalizedLocation)) {
            results.push(location);
        }
    });
    
    return results.slice(0, 10);
}

// ========== INITIALIZATION ==========
function initializePage() {
    console.log('Initializing page...');
    
    // Show loading
    showLoading(true);
    
    // Display all data
    displayAllData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup search
    setupSearch();
    
    // Setup autocomplete
    const fromInput = document.getElementById('fromLocation');
    const toInput = document.getElementById('toLocation');
    const fromAutocomplete = document.getElementById('fromAutocomplete');
    const toAutocomplete = document.getElementById('toAutocomplete');
    
    if (fromInput && fromAutocomplete) {
        setupAutocomplete(fromInput, fromAutocomplete);
    }
    if (toInput && toAutocomplete) {
        setupAutocomplete(toInput, toAutocomplete);
    }
    
    // iOS specific fixes
    if (isIOS) {
        console.log('Applying iOS post-init fixes...');
        
        // Force show main TOC
        document.getElementById('main-toc').style.display = 'block';
        
        // Auto-click first TOC card after 1 second (for testing)
        setTimeout(() => {
            if (window.location.hash === '#autotest') {
                const firstCard = document.querySelector('.toc-card');
                if (firstCard) {
                    console.log('Auto-clicking first TOC card for testing');
                    firstCard.click();
                }
            }
        }, 1000);
    }
    
    // Hide loading
    setTimeout(() => {
        showLoading(false);
        console.log('✅ Page initialization complete');
    }, 500);
}

// ========== LOADING FUNCTIONS ==========
function showLoading(show) {
    let loading = document.getElementById('loading');
    
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading';
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
        `;
        document.body.appendChild(loading);
    }
    
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

// ========== DEBUG FUNCTIONS ==========
function addDebugOverlay() {
    if (!isIOS) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'debug-overlay';
    overlay.innerHTML = `
        <strong>iOS MODE</strong><br>
        Tables: ${document.querySelectorAll('table').length}<br>
        Width: ${window.innerWidth}px
    `;
    document.body.appendChild(overlay);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 10000);
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Add debug overlay for iOS
    if (isIOS) {
        addDebugOverlay();
    }
    
    // Initialize the page
    initializePage();
});

window.addEventListener('load', function() {
    console.log('Window Loaded');
    
    // Final iOS check
    if (isIOS) {
        setTimeout(() => {
            console.log('Final iOS table check:');
            const tables = document.querySelectorAll('table');
            tables.forEach((table, i) => {
                console.log(`Table ${i+1}: ${table.offsetWidth}px wide, ${table.rows.length} rows`);
            });
        }, 1500);
    }
});

// ========== GLOBAL EXPORTS ==========
// Make functions available globally if needed
window.displayAllData = displayAllData;
window.forceTablesVisible = isIOS ? forceTablesVisible : null;
