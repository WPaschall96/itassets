(function() {
'use strict';

class AssetTracker {
    constructor() {
        this.assets = [];
        this.shipments = [];
        this.auditData = [];
        this.locations = [];
        this.centralCsvFiles = [];
        this.syncHistory = [];
        this.currentLocation = 'global';
        this.currentEditingAsset = null;
        this.currentEditingLocation = null;
        this.csvData = null;
        this.csvHeaders = [];
        this.conflictResolutions = {};
        
        // Default field headers
        this.fieldHeaders = {
            itemName: 'Item Name',
            startingQuantity: 'Starting Quantity',
            currentQuantity: 'Current Quantity',
            unitPrice: 'Unit Price',
            totalValue: 'Total Value',
            location: 'Location',
            status: 'Status',
            syncStatus: 'Sync Status'
        };
        
        // System settings
        this.settings = {
            currencySymbol: '$',
            dateFormat: 'MM/DD/YYYY',
            exportPattern: 'assets_export_{location}_{date}',
            autoSyncSchedule: 'none',
            conflictStrategy: 'central'
        };
        
        this.initializeDefaultLocations();
        this.init();
    }
    
    initializeDefaultLocations() {
        this.locations = [
            {
                id: 'hq',
                name: 'Headquarters',
                currency: '$',
                dateFormat: 'MM/DD/YYYY',
                timezone: 'EST',
                users: ['admin@company.com']
            },
            {
                id: 'europe',
                name: 'Europe Office',
                currency: '€',
                dateFormat: 'DD/MM/YYYY',
                timezone: 'CET',
                users: ['europe@company.com']
            },
            {
                id: 'asia',
                name: 'Asia Pacific',
                currency: '¥',
                dateFormat: 'YYYY-MM-DD',
                timezone: 'JST',
                users: ['asia@company.com']
            }
        ];
    }
    
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.populateLocationSelector();
        this.updateDashboard();
        this.renderAssets();
        this.renderShipments();
        this.renderHeadersTable();
        this.renderLocationsTable();
        this.renderCentralCsvTable();
        this.renderSyncHistory();
        this.generateReports();
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav__tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Location selector
        document.getElementById('locationSelector').addEventListener('change', (e) => {
            this.switchLocation(e.target.value);
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Asset management
        document.getElementById('addAssetBtn').addEventListener('click', () => this.openAssetModal());
        document.getElementById('closeAssetModal').addEventListener('click', () => this.closeModal('assetModal'));
        document.getElementById('cancelAsset').addEventListener('click', () => this.closeModal('assetModal'));
        document.getElementById('assetForm').addEventListener('submit', (e) => this.saveAsset(e));
        
        // CSV Import
        document.getElementById('importCsvBtn').addEventListener('click', () => this.openCsvModal());
        document.getElementById('closeCsvModal').addEventListener('click', () => this.closeModal('csvModal'));
        document.getElementById('cancelCsv').addEventListener('click', () => this.closeModal('csvModal'));
        document.getElementById('csvFile').addEventListener('change', (e) => this.handleCsvFile(e));
        document.getElementById('nextCsvStep').addEventListener('click', () => this.nextCsvStep());
        document.getElementById('startImport').addEventListener('click', () => this.startCsvImport());
        document.getElementById('finishImport').addEventListener('click', () => this.closeModal('csvModal'));
        
        // Sync functionality
        document.getElementById('syncWithCentralBtn').addEventListener('click', () => this.syncWithCentral());
        
        // Shipment management
        document.getElementById('addShipmentBtn').addEventListener('click', () => this.openShipmentModal());
        document.getElementById('closeShipmentModal').addEventListener('click', () => this.closeModal('shipmentModal'));
        document.getElementById('cancelShipment').addEventListener('click', () => this.closeModal('shipmentModal'));
        document.getElementById('shipmentForm').addEventListener('submit', (e) => this.saveShipment(e));
        
        // Audit
        document.getElementById('startAuditBtn').addEventListener('click', () => this.startAudit());
        
        // Reports
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        
        // Central CSV Management
        document.getElementById('uploadCentralCsvBtn').addEventListener('click', () => this.openCentralCsvUploadModal());
        document.getElementById('closeCentralCsvUploadModal').addEventListener('click', () => this.closeModal('centralCsvUploadModal'));
        document.getElementById('cancelCentralCsvUpload').addEventListener('click', () => this.closeModal('centralCsvUploadModal'));
        document.getElementById('centralCsvFile').addEventListener('change', (e) => this.handleCentralCsvFile(e));
        document.getElementById('uploadCentralCsv').addEventListener('click', () => this.uploadCentralCsv());
        
        // Location Management
        document.getElementById('addLocationBtn').addEventListener('click', () => this.openLocationModal());
        document.getElementById('closeLocationModal').addEventListener('click', () => this.closeModal('locationModal'));
        document.getElementById('cancelLocation').addEventListener('click', () => this.closeModal('locationModal'));
        document.getElementById('locationForm').addEventListener('submit', (e) => this.saveLocation(e));
        
        // Conflict Resolution
        document.getElementById('closeConflictModal').addEventListener('click', () => this.closeModal('conflictModal'));
        document.getElementById('cancelConflictResolution').addEventListener('click', () => this.closeModal('conflictModal'));
        document.getElementById('resolveConflicts').addEventListener('click', () => this.applyConflictResolutions());
        
        // Admin panel
        document.getElementById('saveHeadersBtn').addEventListener('click', () => this.saveHeaders());
        document.getElementById('resetHeadersBtn').addEventListener('click', () => this.resetHeaders());
        document.getElementById('exportAllBtn').addEventListener('click', () => this.exportAllData());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearAllData());
        document.getElementById('saveAutoSyncBtn').addEventListener('click', () => this.saveAutoSyncSettings());
        
        // Settings
        document.getElementById('currencySymbol').addEventListener('input', (e) => {
            this.settings.currencySymbol = e.target.value;
            this.updateDashboard();
            this.renderAssets();
        });
        document.getElementById('dateFormat').addEventListener('change', (e) => {
            this.settings.dateFormat = e.target.value;
        });
        document.getElementById('exportPattern').addEventListener('input', (e) => {
            this.settings.exportPattern = e.target.value;
        });
    }
    
    setupTheme() {
        const theme = document.documentElement.getAttribute('data-color-scheme') || 'light';
        this.updateThemeIcon(theme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', newTheme);
        this.updateThemeIcon(newTheme);
    }
    
    updateThemeIcon(theme) {
        const icon = document.getElementById('themeIcon');
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
    
    populateLocationSelector() {
        const selector = document.getElementById('locationSelector');
        selector.innerHTML = '<option value="global">Global (Admin View)</option>';
        
        this.locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.name;
            selector.appendChild(option);
        });
    }
    
    switchLocation(locationId) {
        this.currentLocation = locationId;
        this.updateDashboard();
        this.renderAssets();
        this.renderShipments();
        this.generateReports();
        
        // Update currency symbol based on location
        if (locationId !== 'global') {
            const location = this.locations.find(l => l.id === locationId);
            if (location) {
                this.settings.currencySymbol = location.currency;
                this.settings.dateFormat = location.dateFormat;
                document.getElementById('currencySymbol').value = location.currency;
                document.getElementById('dateFormat').value = location.dateFormat;
            }
        }
        
        this.addActivity(`Switched to ${locationId === 'global' ? 'global view' : this.getLocationName(locationId)}`);
    }
    
    getLocationName(locationId) {
        const location = this.locations.find(l => l.id === locationId);
        return location ? location.name : locationId;
    }
    
    getFilteredAssets() {
        if (this.currentLocation === 'global') {
            return this.assets;
        }
        return this.assets.filter(asset => asset.locationId === this.currentLocation);
    }
    
    getFilteredShipments() {
        if (this.currentLocation === 'global') {
            return this.shipments;
        }
        return this.shipments.filter(shipment => 
            shipment.fromLocationId === this.currentLocation || 
            shipment.toLocationId === this.currentLocation
        );
    }
    
    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav__tab').forEach(tab => {
            tab.classList.remove('nav__tab--active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('nav__tab--active');
        
        // Show corresponding content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('tab-content--active');
        });
        document.getElementById(tabName).classList.add('tab-content--active');
        
        // Update content for specific tabs
        if (tabName === 'admin') {
            this.renderHeadersTable();
            this.renderLocationsTable();
        } else if (tabName === 'reports') {
            this.generateReports();
        } else if (tabName === 'centralCsv') {
            this.renderCentralCsvTable();
            this.renderSyncHistory();
        }
    }
    
    // Asset Management
    openAssetModal(asset = null) {
        this.currentEditingAsset = asset;
        const modal = document.getElementById('assetModal');
        const title = document.getElementById('assetModalTitle');
        const form = document.getElementById('assetForm');
        
        if (asset) {
            title.textContent = 'Edit Asset';
            this.populateAssetForm(asset);
        } else {
            title.textContent = 'Add Asset';
            form.reset();
            // Pre-fill location if not in global view
            if (this.currentLocation !== 'global') {
                document.getElementById('location').value = this.getLocationName(this.currentLocation);
            }
        }
        
        this.openModal('assetModal');
    }
    
    populateAssetForm(asset) {
        document.getElementById('itemName').value = asset.itemName;
        document.getElementById('startingQuantity').value = asset.startingQuantity;
        document.getElementById('currentQuantity').value = asset.currentQuantity;
        document.getElementById('unitPrice').value = asset.unitPrice;
        document.getElementById('location').value = asset.location;
        document.getElementById('status').value = asset.status;
    }
    
    saveAsset(e) {
        e.preventDefault();
        
        const formData = {
            itemName: document.getElementById('itemName').value,
            startingQuantity: parseInt(document.getElementById('startingQuantity').value),
            currentQuantity: parseInt(document.getElementById('currentQuantity').value),
            unitPrice: parseFloat(document.getElementById('unitPrice').value),
            location: document.getElementById('location').value,
            status: document.getElementById('status').value,
            totalValue: parseInt(document.getElementById('currentQuantity').value) * parseFloat(document.getElementById('unitPrice').value),
            dateAdded: new Date().toISOString(),
            locationId: this.currentLocation !== 'global' ? this.currentLocation : this.getLocationIdFromName(document.getElementById('location').value),
            syncStatus: 'pending',
            lastSyncDate: null
        };
        
        if (this.currentEditingAsset) {
            const index = this.assets.findIndex(a => a.id === this.currentEditingAsset.id);
            this.assets[index] = { ...this.currentEditingAsset, ...formData, syncStatus: 'pending' };
            this.showToast('success', 'Asset Updated', 'Asset has been successfully updated.');
        } else {
            formData.id = this.generateId();
            this.assets.push(formData);
            this.showToast('success', 'Asset Added', 'New asset has been successfully added.');
        }
        
        this.closeModal('assetModal');
        this.renderAssets();
        this.updateDashboard();
        this.addActivity(`Asset ${formData.itemName} ${this.currentEditingAsset ? 'updated' : 'added'}`);
    }
    
    getLocationIdFromName(locationName) {
        const location = this.locations.find(l => l.name === locationName);
        return location ? location.id : 'hq'; // Default to HQ
    }
    
    deleteAsset(id) {
        if (window.confirm && window.confirm('Are you sure you want to delete this asset?')) {
            const asset = this.assets.find(a => a.id === id);
            this.assets = this.assets.filter(a => a.id !== id);
            this.renderAssets();
            this.updateDashboard();
            this.showToast('success', 'Asset Deleted', 'Asset has been successfully deleted.');
            this.addActivity(`Asset ${asset.itemName} deleted`);
        }
    }
    
    renderAssets() {
        const tbody = document.getElementById('assetsTableBody');
        const filteredAssets = this.getFilteredAssets();
        
        if (filteredAssets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center text-secondary">No assets found</td></tr>';
            return;
        }
        
        tbody.innerHTML = filteredAssets.map(asset => `
            <tr>
                <td>${asset.itemName}</td>
                <td>${asset.startingQuantity}</td>
                <td>${asset.currentQuantity}</td>
                <td>${this.getCurrentCurrencySymbol()}${asset.unitPrice.toFixed(2)}</td>
                <td>${this.getCurrentCurrencySymbol()}${asset.totalValue.toFixed(2)}</td>
                <td>${asset.location}</td>
                <td><span class="status status--${this.getStatusClass(asset.status)}">${asset.status}</span></td>
                <td>${this.renderSyncStatus(asset.syncStatus)}</td>
                <td>
                    <button class="action-btn action-btn--edit" onclick="assetTracker.openAssetModal(${JSON.stringify(asset).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="action-btn action-btn--delete" onclick="assetTracker.deleteAsset('${asset.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
        
        // Update table headers with custom names
        this.updateTableHeaders();
    }
    
    renderSyncStatus(status) {
        const statusMap = {
            'synced': { class: 'synced', text: 'Synced' },
            'pending': { class: 'pending', text: 'Pending' },
            'conflict': { class: 'conflict', text: 'Conflict' },
            'never': { class: 'never', text: 'Never' }
        };
        
        const statusInfo = statusMap[status] || statusMap['never'];
        return `
            <div class="sync-status sync-status--${statusInfo.class}">
                <div class="sync-indicator sync-indicator--${statusInfo.class}"></div>
                ${statusInfo.text}
            </div>
        `;
    }
    
    getCurrentCurrencySymbol() {
        if (this.currentLocation !== 'global') {
            const location = this.locations.find(l => l.id === this.currentLocation);
            return location ? location.currency : this.settings.currencySymbol;
        }
        return this.settings.currencySymbol;
    }
    
    updateTableHeaders() {
        const headers = document.querySelectorAll('#assetsTable th[data-field]');
        headers.forEach(header => {
            const field = header.getAttribute('data-field');
            if (this.fieldHeaders[field]) {
                header.textContent = this.fieldHeaders[field];
            }
        });
    }
    
    getStatusClass(status) {
        const statusMap = {
            'active': 'success',
            'inactive': 'warning',
            'maintenance': 'warning',
            'retired': 'error'
        };
        return statusMap[status] || 'info';
    }
    
    // Central CSV Management
    openCentralCsvUploadModal() {
        this.openModal('centralCsvUploadModal');
    }
    
    handleCentralCsvFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvData = this.parseCSV(e.target.result);
                this.showCentralCsvPreview(csvData);
            } catch (error) {
                this.showToast('error', 'CSV Error', 'Failed to parse CSV file. Please check the format.');
            }
        };
        reader.readAsText(file);
    }
    
    showCentralCsvPreview(csvData) {
        const preview = document.getElementById('centralCsvPreview');
        const table = document.getElementById('centralCsvPreviewTable');
        
        if (csvData.length === 0) {
            preview.classList.add('hidden');
            return;
        }
        
        const previewData = csvData.slice(0, 5);
        const headers = Object.keys(csvData[0]);
        
        table.innerHTML = `
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${previewData.map(row => `
                    <tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        `;
        
        preview.classList.remove('hidden');
    }
    
    uploadCentralCsv() {
        const fileInput = document.getElementById('centralCsvFile');
        const versionLabel = document.getElementById('csvVersionLabel').value;
        const description = document.getElementById('csvDescription').value;
        
        if (!fileInput.files[0]) {
            this.showToast('error', 'No File', 'Please select a CSV file to upload.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvData = this.parseCSV(e.target.result);
                const centralFile = {
                    id: this.generateId(),
                    filename: fileInput.files[0].name,
                    version: versionLabel || `v${this.centralCsvFiles.length + 1}`,
                    uploadDate: new Date().toISOString(),
                    assetCount: csvData.length,
                    description: description,
                    data: csvData
                };
                
                this.centralCsvFiles.push(centralFile);
                this.renderCentralCsvTable();
                this.closeModal('centralCsvUploadModal');
                this.showToast('success', 'CSV Uploaded', 'Master CSV file has been uploaded successfully.');
                this.addActivity(`Master CSV "${centralFile.filename}" uploaded`);
            } catch (error) {
                this.showToast('error', 'Upload Failed', 'Failed to process CSV file.');
            }
        };
        reader.readAsText(fileInput.files[0]);
    }
    
    renderCentralCsvTable() {
        const tbody = document.getElementById('centralCsvTableBody');
        
        if (this.centralCsvFiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">No master CSV files found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.centralCsvFiles.map(file => `
            <tr>
                <td>${file.filename}</td>
                <td>${file.version}</td>
                <td>${this.formatDate(file.uploadDate)}</td>
                <td>${file.assetCount}</td>
                <td>
                    <button class="action-btn action-btn--edit" onclick="assetTracker.downloadCentralCsv('${file.id}')">Download</button>
                    <button class="action-btn action-btn--edit" onclick="assetTracker.syncFromCentral('${file.id}')">Sync</button>
                    <button class="action-btn action-btn--delete" onclick="assetTracker.deleteCentralCsv('${file.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    downloadCentralCsv(fileId) {
        const file = this.centralCsvFiles.find(f => f.id === fileId);
        if (!file) return;
        
        const csvContent = this.generateCSV(file.data);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    deleteCentralCsv(fileId) {
        if (confirm('Are you sure you want to delete this master CSV file?')) {
            this.centralCsvFiles = this.centralCsvFiles.filter(f => f.id !== fileId);
            this.renderCentralCsvTable();
            this.showToast('success', 'CSV Deleted', 'Master CSV file has been deleted.');
        }
    }
    
    // Sync Functionality
    syncWithCentral() {
        if (this.currentLocation === 'global') {
            this.showToast('warning', 'Select Location', 'Please select a specific location to sync.');
            return;
        }
        
        if (this.centralCsvFiles.length === 0) {
            this.showToast('warning', 'No Central CSV', 'No master CSV files available for sync.');
            return;
        }
        
        // Use the latest central CSV file
        const latestCentralFile = this.centralCsvFiles[this.centralCsvFiles.length - 1];
        this.syncFromCentral(latestCentralFile.id);
    }
    
    syncFromCentral(fileId) {
        const centralFile = this.centralCsvFiles.find(f => f.id === fileId);
        if (!centralFile) return;
        
        const conflicts = this.detectSyncConflicts(centralFile.data);
        
        if (conflicts.length > 0) {
            this.showConflictResolution(conflicts, centralFile);
        } else {
            this.applySyncData(centralFile.data);
            this.recordSyncHistory('pull', 'success', centralFile.data.length, 0);
        }
    }
    
    detectSyncConflicts(centralData) {
        const conflicts = [];
        const localAssets = this.getFilteredAssets();
        
        centralData.forEach(centralAsset => {
            const localAsset = localAssets.find(local => 
                local.itemName === centralAsset.itemName && 
                local.location === centralAsset.location
            );
            
            if (localAsset) {
                // Check for differences
                if (localAsset.currentQuantity !== parseInt(centralAsset.currentQuantity) ||
                    localAsset.unitPrice !== parseFloat(centralAsset.unitPrice) ||
                    localAsset.status !== centralAsset.status) {
                    
                    conflicts.push({
                        itemName: centralAsset.itemName,
                        central: centralAsset,
                        local: localAsset
                    });
                }
            }
        });
        
        return conflicts;
    }
    
    showConflictResolution(conflicts, centralFile) {
        const container = document.getElementById('conflictsContainer');
        
        container.innerHTML = conflicts.map((conflict, index) => `
            <div class="conflict-item">
                <div class="conflict-item__header">
                    ${conflict.itemName}
                </div>
                <div class="conflict-item__options">
                    <div class="conflict-option" data-resolution="central" data-index="${index}">
                        <div class="conflict-option__label">Central Version</div>
                        <div class="conflict-option__details">
                            Quantity: ${conflict.central.currentQuantity}<br>
                            Price: ${this.getCurrentCurrencySymbol()}${parseFloat(conflict.central.unitPrice).toFixed(2)}<br>
                            Status: ${conflict.central.status}
                        </div>
                    </div>
                    <div class="conflict-option" data-resolution="local" data-index="${index}">
                        <div class="conflict-option__label">Local Version</div>
                        <div class="conflict-option__details">
                            Quantity: ${conflict.local.currentQuantity}<br>
                            Price: ${this.getCurrentCurrencySymbol()}${conflict.local.unitPrice.toFixed(2)}<br>
                            Status: ${conflict.local.status}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers for conflict options
        container.querySelectorAll('.conflict-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const resolution = e.currentTarget.dataset.resolution;
                
                // Clear selections for this conflict
                container.querySelectorAll(`[data-index="${index}"]`).forEach(opt => {
                    opt.classList.remove('conflict-option--selected');
                });
                
                // Select this option
                e.currentTarget.classList.add('conflict-option--selected');
                
                // Store resolution
                this.conflictResolutions[index] = resolution;
            });
        });
        
        // Auto-select based on conflict strategy
        conflicts.forEach((conflict, index) => {
            const defaultResolution = this.settings.conflictStrategy === 'central' ? 'central' : 'local';
            this.conflictResolutions[index] = defaultResolution;
            container.querySelector(`[data-index="${index}"][data-resolution="${defaultResolution}"]`)
                .classList.add('conflict-option--selected');
        });
        
        this.currentSyncData = { conflicts, centralFile };
        this.openModal('conflictModal');
    }
    
    applyConflictResolutions() {
        const { conflicts, centralFile } = this.currentSyncData;
        let conflictCount = 0;
        
        conflicts.forEach((conflict, index) => {
            const resolution = this.conflictResolutions[index];
            if (resolution === 'central') {
                // Update local asset with central data
                const localAsset = this.assets.find(a => a.id === conflict.local.id);
                if (localAsset) {
                    localAsset.currentQuantity = parseInt(conflict.central.currentQuantity);
                    localAsset.unitPrice = parseFloat(conflict.central.unitPrice);
                    localAsset.status = conflict.central.status;
                    localAsset.totalValue = localAsset.currentQuantity * localAsset.unitPrice;
                    localAsset.syncStatus = 'synced';
                    localAsset.lastSyncDate = new Date().toISOString();
                }
            } else {
                conflictCount++;
            }
        });
        
        // Apply non-conflicting data
        this.applySyncData(centralFile.data, conflicts);
        
        this.closeModal('conflictModal');
        this.renderAssets();
        this.updateDashboard();
        this.recordSyncHistory('pull', 'success', centralFile.data.length, conflictCount);
        this.showToast('success', 'Sync Complete', `Synchronized with ${conflictCount} conflicts resolved.`);
    }
    
    applySyncData(centralData, conflicts = []) {
        const conflictItems = conflicts.map(c => c.itemName);
        const localAssets = this.getFilteredAssets();
        
        centralData.forEach(centralAsset => {
            // Skip items that had conflicts and were resolved as local
            if (conflictItems.includes(centralAsset.itemName)) {
                return;
            }
            
            const existingAsset = localAssets.find(local => 
                local.itemName === centralAsset.itemName && 
                local.location === centralAsset.location
            );
            
            if (existingAsset) {
                // Update existing asset
                existingAsset.currentQuantity = parseInt(centralAsset.currentQuantity);
                existingAsset.unitPrice = parseFloat(centralAsset.unitPrice);
                existingAsset.status = centralAsset.status;
                existingAsset.totalValue = existingAsset.currentQuantity * existingAsset.unitPrice;
                existingAsset.syncStatus = 'synced';
                existingAsset.lastSyncDate = new Date().toISOString();
            } else {
                // Add new asset
                const newAsset = {
                    id: this.generateId(),
                    itemName: centralAsset.itemName,
                    startingQuantity: parseInt(centralAsset.startingQuantity) || parseInt(centralAsset.currentQuantity),
                    currentQuantity: parseInt(centralAsset.currentQuantity),
                    unitPrice: parseFloat(centralAsset.unitPrice),
                    location: centralAsset.location,
                    status: centralAsset.status,
                    locationId: this.currentLocation,
                    syncStatus: 'synced',
                    lastSyncDate: new Date().toISOString(),
                    dateAdded: new Date().toISOString(),
                    totalValue: parseInt(centralAsset.currentQuantity) * parseFloat(centralAsset.unitPrice)
                };
                this.assets.push(newAsset);
            }
        });
    }
    
    recordSyncHistory(direction, status, itemsAffected, conflicts) {
        const syncRecord = {
            id: this.generateId(),
            date: new Date().toISOString(),
            location: this.getLocationName(this.currentLocation),
            direction: direction, // 'pull' or 'push'
            status: status, // 'success', 'failed', 'partial'
            itemsAffected: itemsAffected,
            conflicts: conflicts
        };
        
        this.syncHistory.push(syncRecord);
        this.renderSyncHistory();
        this.addActivity(`${direction === 'pull' ? 'Pulled from' : 'Pushed to'} central CSV: ${itemsAffected} items`);
    }
    
    renderSyncHistory() {
        const tbody = document.getElementById('syncHistoryTableBody');
        
        if (this.syncHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">No sync history found</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.syncHistory.slice(-20).reverse().map(record => `
            <tr>
                <td>${this.formatDate(record.date)}</td>
                <td>${record.location}</td>
                <td>${record.direction === 'pull' ? '⬇️ Pull' : '⬆️ Push'}</td>
                <td><span class="status status--${this.getSyncStatusClass(record.status)}">${record.status}</span></td>
                <td>${record.itemsAffected}</td>
                <td>${record.conflicts}</td>
            </tr>
        `).join('');
    }
    
    getSyncStatusClass(status) {
        const statusMap = {
            'success': 'success',
            'failed': 'error',
            'partial': 'warning'
        };
        return statusMap[status] || 'info';
    }
    
    saveAutoSyncSettings() {
        this.settings.autoSyncSchedule = document.getElementById('autoSyncSchedule').value;
        this.settings.conflictStrategy = document.getElementById('conflictStrategy').value;
        this.showToast('success', 'Settings Saved', 'Auto-sync settings have been saved.');
    }
    
    // Location Management
    openLocationModal(location = null) {
        this.currentEditingLocation = location;
        const modal = document.getElementById('locationModal');
        const title = document.getElementById('locationModalTitle');
        const form = document.getElementById('locationForm');
        
        if (location) {
            title.textContent = 'Edit Location';
            this.populateLocationForm(location);
        } else {
            title.textContent = 'Add Location';
            form.reset();
        }
        
        this.openModal('locationModal');
    }
    
    populateLocationForm(location) {
        document.getElementById('locationName').value = location.name;
        document.getElementById('locationCurrency').value = location.currency;
        document.getElementById('locationDateFormat').value = location.dateFormat;
        document.getElementById('locationTimezone').value = location.timezone;
    }
    
    saveLocation(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('locationName').value,
            currency: document.getElementById('locationCurrency').value,
            dateFormat: document.getElementById('locationDateFormat').value,
            timezone: document.getElementById('locationTimezone').value,
            users: []
        };
        
        if (this.currentEditingLocation) {
            const index = this.locations.findIndex(l => l.id === this.currentEditingLocation.id);
            this.locations[index] = { ...this.currentEditingLocation, ...formData };
            this.showToast('success', 'Location Updated', 'Location has been successfully updated.');
        } else {
            formData.id = this.generateId();
            this.locations.push(formData);
            this.showToast('success', 'Location Added', 'New location has been successfully added.');
        }
        
        this.closeModal('locationModal');
        this.renderLocationsTable();
        this.populateLocationSelector();
        this.addActivity(`Location ${formData.name} ${this.currentEditingLocation ? 'updated' : 'added'}`);
    }
    
    deleteLocation(id) {
        if (confirm('Are you sure you want to delete this location? All associated assets will be moved to HQ.')) {
            const location = this.locations.find(l => l.id === id);
            
            // Move assets to HQ
            this.assets.forEach(asset => {
                if (asset.locationId === id) {
                    asset.locationId = 'hq';
                    asset.location = 'Headquarters';
                }
            });
            
            this.locations = this.locations.filter(l => l.id !== id);
            this.renderLocationsTable();
            this.populateLocationSelector();
            this.showToast('success', 'Location Deleted', 'Location has been successfully deleted.');
            this.addActivity(`Location ${location.name} deleted`);
        }
    }
    
    renderLocationsTable() {
        const tbody = document.getElementById('locationsTableBody');
        
        if (this.locations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary">No locations configured</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.locations.map(location => `
            <tr>
                <td>${location.name}</td>
                <td>${location.currency}</td>
                <td>${location.dateFormat}</td>
                <td>${location.users.length}</td>
                <td>
                    <button class="action-btn action-btn--edit" onclick="assetTracker.openLocationModal(${JSON.stringify(location).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="action-btn action-btn--delete" onclick="assetTracker.deleteLocation('${location.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    
    // CSV Import Functionality (Enhanced)
    openCsvModal() {
        this.resetCsvModal();
        this.openModal('csvModal');
    }
    
    resetCsvModal() {
        document.getElementById('csvStep1').classList.remove('hidden');
        document.getElementById('csvStep2').classList.add('hidden');
        document.getElementById('csvPreview').classList.add('hidden');
        document.getElementById('importProgress').classList.add('hidden');
        document.getElementById('importResults').classList.add('hidden');
        document.getElementById('nextCsvStep').classList.remove('hidden');
        document.getElementById('startImport').classList.add('hidden');
        document.getElementById('finishImport').classList.add('hidden');
        document.getElementById('csvFile').value = '';
        this.csvData = null;
        this.csvHeaders = [];
    }
    
    handleCsvFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.csvData = this.parseCSV(e.target.result);
                this.csvHeaders = this.csvData.length > 0 ? Object.keys(this.csvData[0]) : [];
                this.showCsvPreview();
            } catch (error) {
                this.showToast('error', 'CSV Error', 'Failed to parse CSV file. Please check the format.');
            }
        };
        reader.readAsText(file);
    }
    
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error('CSV must have header and at least one data row');
        
        const headers = this.parseCSVLine(lines[0]);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index].trim();
                });
                data.push(row);
            }
        }
        
        return data;
    }
    
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
    
    showCsvPreview() {
        const preview = document.getElementById('csvPreview');
        const table = document.getElementById('csvPreviewTable');
        
        if (this.csvData.length === 0) {
            preview.classList.add('hidden');
            return;
        }
        
        const previewData = this.csvData.slice(0, 5);
        const headers = this.csvHeaders;
        
        table.innerHTML = `
            <thead>
                <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${previewData.map(row => `
                    <tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
                `).join('')}
            </tbody>
        `;
        
        preview.classList.remove('hidden');
    }
    
    nextCsvStep() {
        if (!this.csvData || this.csvData.length === 0) {
            this.showToast('error', 'No Data', 'Please select a valid CSV file first.');
            return;
        }
        
        document.getElementById('csvStep1').classList.add('hidden');
        document.getElementById('csvStep2').classList.remove('hidden');
        document.getElementById('nextCsvStep').classList.add('hidden');
        document.getElementById('startImport').classList.remove('hidden');
        
        this.renderColumnMapping();
    }
    
    renderColumnMapping() {
        const container = document.getElementById('columnMapping');
        const assetFields = Object.keys(this.fieldHeaders).filter(field => field !== 'syncStatus');
        
        container.innerHTML = assetFields.map(field => `
            <div class="column-mapping">
                <label>${this.fieldHeaders[field]}:</label>
                <select id="mapping_${field}" class="form-control">
                    <option value="">-- Skip Field --</option>
                    ${this.csvHeaders.map(header => `
                        <option value="${header}" ${this.autoMapField(field, header) ? 'selected' : ''}>${header}</option>
                    `).join('')}
                </select>
            </div>
        `).join('');
    }
    
    autoMapField(assetField, csvHeader) {
        const mappings = {
            itemName: ['name', 'item', 'product', 'asset'],
            startingQuantity: ['starting', 'initial', 'start'],
            currentQuantity: ['current', 'quantity', 'qty', 'stock'],
            unitPrice: ['price', 'cost', 'unit'],
            location: ['location', 'site', 'office'],
            status: ['status', 'state', 'condition']
        };
        
        const keywords = mappings[assetField] || [];
        const headerLower = csvHeader.toLowerCase();
        
        return keywords.some(keyword => headerLower.includes(keyword));
    }
    
    startCsvImport() {
        const mappings = {};
        Object.keys(this.fieldHeaders).forEach(field => {
            if (field !== 'syncStatus') {
                const select = document.getElementById(`mapping_${field}`);
                if (select && select.value) {
                    mappings[field] = select.value;
                }
            }
        });
        
        if (Object.keys(mappings).length === 0) {
            this.showToast('error', 'No Mapping', 'Please map at least one field to continue.');
            return;
        }
        
        document.getElementById('importProgress').classList.remove('hidden');
        document.getElementById('startImport').classList.add('hidden');
        
        this.processCsvImport(mappings);
    }
    
    async processCsvImport(mappings) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const results = { success: 0, failed: 0, errors: [] };
        
        progressText.textContent = 'Processing...';
        
        for (let i = 0; i < this.csvData.length; i++) {
            const row = this.csvData[i];
            const progress = ((i + 1) / this.csvData.length) * 100;
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Processing row ${i + 1} of ${this.csvData.length}`;
            
            try {
                const asset = this.mapRowToAsset(row, mappings);
                if (this.validateAsset(asset)) {
                    asset.id = this.generateId();
                    asset.dateAdded = new Date().toISOString();
                    asset.totalValue = asset.currentQuantity * asset.unitPrice;
                    asset.locationId = this.currentLocation !== 'global' ? this.currentLocation : this.getLocationIdFromName(asset.location);
                    asset.syncStatus = 'pending';
                    asset.lastSyncDate = null;
                    this.assets.push(asset);
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push(`Row ${i + 1}: Missing required fields`);
                }
            } catch (error) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${error.message}`);
            }
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        this.showImportResults(results);
        this.renderAssets();
        this.updateDashboard();
        this.addActivity(`Imported ${results.success} assets from CSV`);
    }
    
    mapRowToAsset(row, mappings) {
        const asset = {};
        
        Object.entries(mappings).forEach(([assetField, csvField]) => {
            let value = row[csvField];
            
            // Type conversion
            if (['startingQuantity', 'currentQuantity'].includes(assetField)) {
                value = parseInt(value) || 0;
            } else if (assetField === 'unitPrice') {
                value = parseFloat(value) || 0;
            } else if (assetField === 'status' && !['active', 'inactive', 'maintenance', 'retired'].includes(value)) {
                value = 'active'; // Default status
            }
            
            asset[assetField] = value;
        });
        
        return asset;
    }
    
    validateAsset(asset) {
        return asset.itemName && 
               typeof asset.currentQuantity === 'number' && 
               typeof asset.unitPrice === 'number' &&
               asset.location;
    }
    
    showImportResults(results) {
        document.getElementById('importProgress').classList.add('hidden');
        document.getElementById('importResults').classList.remove('hidden');
        document.getElementById('finishImport').classList.remove('hidden');
        
        const summary = document.getElementById('importSummary');
        summary.innerHTML = `
            <div class="card">
                <div class="card__body">
                    <p><strong>Successfully imported:</strong> ${results.success} assets</p>
                    <p><strong>Failed:</strong> ${results.failed} rows</p>
                    ${results.errors.length > 0 ? `
                        <details>
                            <summary>View Errors</summary>
                            <ul>
                                ${results.errors.map(error => `<li>${error}</li>`).join('')}
                            </ul>
                        </details>
                    ` : ''}
                </div>
            </div>
        `;
        
        this.showToast('success', 'Import Complete', `Successfully imported ${results.success} assets.`);
    }
    
    // Shipment Management (Enhanced)
    openShipmentModal() {
        this.populateShipmentAssets();
        this.openModal('shipmentModal');
    }
    
    populateShipmentAssets() {
        const select = document.getElementById('shipmentAsset');
        const filteredAssets = this.getFilteredAssets();
        select.innerHTML = '<option value="">Select Asset</option>' +
            filteredAssets.map(asset => `<option value="${asset.id}">${asset.itemName}</option>`).join('');
    }
    
    saveShipment(e) {
        e.preventDefault();
        
        const fromLocationId = this.currentLocation !== 'global' ? this.currentLocation : this.getLocationIdFromName(document.getElementById('fromLocation').value);
        const toLocationId = this.getLocationIdFromName(document.getElementById('toLocation').value);
        
        const formData = {
            id: this.generateId(),
            trackingNumber: document.getElementById('trackingNumber').value,
            assetId: document.getElementById('shipmentAsset').value,
            fromLocation: document.getElementById('fromLocation').value,
            toLocation: document.getElementById('toLocation').value,
            fromLocationId: fromLocationId,
            toLocationId: toLocationId,
            status: document.getElementById('shipmentStatus').value,
            date: new Date().toISOString()
        };
        
        this.shipments.push(formData);
        this.closeModal('shipmentModal');
        this.renderShipments();
        this.updateDashboard();
        this.showToast('success', 'Shipment Recorded', 'Shipment has been successfully recorded.');
        this.addActivity(`Shipment ${formData.trackingNumber} recorded`);
    }
    
    renderShipments() {
        const tbody = document.getElementById('shipmentsTableBody');
        const filteredShipments = this.getFilteredShipments();
        
        if (filteredShipments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">No shipments found</td></tr>';
            return;
        }
        
        tbody.innerHTML = filteredShipments.map(shipment => {
            const asset = this.assets.find(a => a.id === shipment.assetId);
            return `
                <tr>
                    <td>${shipment.trackingNumber}</td>
                    <td>${asset ? asset.itemName : 'Unknown'}</td>
                    <td>${shipment.fromLocation}</td>
                    <td>${shipment.toLocation}</td>
                    <td><span class="status status--${this.getShipmentStatusClass(shipment.status)}">${shipment.status}</span></td>
                    <td>${this.formatDate(shipment.date)}</td>
                    <td>
                        <button class="action-btn action-btn--delete" onclick="assetTracker.deleteShipment('${shipment.id}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    getShipmentStatusClass(status) {
        const statusMap = {
            'pending': 'warning',
            'in-transit': 'info',
            'delivered': 'success',
            'delayed': 'error'
        };
        return statusMap[status] || 'info';
    }
    
    deleteShipment(id) {
        if (window.confirm && window.confirm('Are you sure you want to delete this shipment?')) {
            this.shipments = this.shipments.filter(s => s.id !== id);
            this.renderShipments();
            this.updateDashboard();
            this.showToast('success', 'Shipment Deleted', 'Shipment has been successfully deleted.');
        }
    }
    
    // Admin Panel (Enhanced)
    renderHeadersTable() {
        const tbody = document.getElementById('headersTableBody');
        
        tbody.innerHTML = Object.entries(this.fieldHeaders).map(([field, displayName]) => `
            <tr>
                <td>${field}</td>
                <td>
                    <input type="text" class="header-edit-input" 
                           data-field="${field}" 
                           value="${displayName}">
                </td>
                <td>
                    <button class="action-btn action-btn--edit" onclick="assetTracker.resetSingleHeader('${field}')">Reset</button>
                </td>
            </tr>
        `).join('');
    }
    
    saveHeaders() {
        const inputs = document.querySelectorAll('.header-edit-input');
        inputs.forEach(input => {
            const field = input.dataset.field;
            const value = input.value.trim();
            if (value) {
                this.fieldHeaders[field] = value;
            }
        });
        
        this.updateTableHeaders();
        this.showToast('success', 'Headers Updated', 'Field headers have been successfully updated.');
    }
    
    resetHeaders() {
        if (confirm('Are you sure you want to reset all headers to defaults?')) {
            this.fieldHeaders = {
                itemName: 'Item Name',
                startingQuantity: 'Starting Quantity',
                currentQuantity: 'Current Quantity',
                unitPrice: 'Unit Price',
                totalValue: 'Total Value',
                location: 'Location',
                status: 'Status',
                syncStatus: 'Sync Status'
            };
            
            this.renderHeadersTable();
            this.updateTableHeaders();
            this.showToast('success', 'Headers Reset', 'Field headers have been reset to defaults.');
        }
    }
    
    resetSingleHeader(field) {
        const defaultHeaders = {
            itemName: 'Item Name',
            startingQuantity: 'Starting Quantity',
            currentQuantity: 'Current Quantity',
            unitPrice: 'Unit Price',
            totalValue: 'Total Value',
            location: 'Location',
            status: 'Status',
            syncStatus: 'Sync Status'
        };
        
        if (defaultHeaders[field]) {
            this.fieldHeaders[field] = defaultHeaders[field];
            document.querySelector(`input[data-field="${field}"]`).value = defaultHeaders[field];
            this.updateTableHeaders();
        }
    }
    
    exportAllData() {
        const data = {
            assets: this.assets,
            shipments: this.shipments,
            locations: this.locations,
            centralCsvFiles: this.centralCsvFiles,
            syncHistory: this.syncHistory,
            settings: this.settings,
            fieldHeaders: this.fieldHeaders,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generateFilename('complete_backup', 'json');
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('success', 'Data Exported', 'Complete data backup has been downloaded.');
    }
    
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            if (confirm('This will delete ALL assets, shipments, and audit data. Are you absolutely sure?')) {
                this.assets = [];
                this.shipments = [];
                this.auditData = [];
                this.centralCsvFiles = [];
                this.syncHistory = [];
                
                this.renderAssets();
                this.renderShipments();
                this.renderCentralCsvTable();
                this.renderSyncHistory();
                this.updateDashboard();
                this.generateReports();
                
                this.showToast('warning', 'Data Cleared', 'All data has been cleared from the system.');
                this.addActivity('All data cleared');
            }
        }
    }
    
    // Audit functionality (Enhanced)
    startAudit() {
        const content = document.getElementById('auditContent');
        const filteredAssets = this.getFilteredAssets();
        
        if (filteredAssets.length === 0) {
            content.innerHTML = '<p class="text-secondary">No assets available for audit</p>';
            return;
        }
        
        content.innerHTML = `
            <div class="card">
                <div class="card__body">
                    <h4>Asset Audit</h4>
                    <div class="form-group">
                        <label class="form-label">Select Asset to Audit</label>
                        <select id="auditAssetSelect" class="form-control">
                            <option value="">Select Asset</option>
                            ${filteredAssets.map(asset => `<option value="${asset.id}">${asset.itemName}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Physical Count</label>
                        <input type="number" id="physicalCount" class="form-control" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea id="auditNotes" class="form-control" rows="3"></textarea>
                    </div>
                    <button class="btn btn--primary" onclick="assetTracker.completeAudit()">Complete Audit</button>
                </div>
            </div>
        `;
    }
    
    completeAudit() {
        const assetId = document.getElementById('auditAssetSelect').value;
        const physicalCount = parseInt(document.getElementById('physicalCount').value);
        const notes = document.getElementById('auditNotes').value;
        
        if (!assetId || isNaN(physicalCount)) {
            this.showToast('error', 'Incomplete Data', 'Please select an asset and enter physical count.');
            return;
        }
        
        const asset = this.assets.find(a => a.id === assetId);
        const auditResult = {
            id: this.generateId(),
            assetId: assetId,
            assetName: asset.itemName,
            systemCount: asset.currentQuantity,
            physicalCount: physicalCount,
            discrepancy: physicalCount - asset.currentQuantity,
            notes: notes,
            date: new Date().toISOString(),
            auditor: 'System User',
            location: asset.location
        };
        
        this.auditData.push(auditResult);
        
        // Update asset quantity if there's a discrepancy
        if (auditResult.discrepancy !== 0) {
            asset.currentQuantity = physicalCount;
            asset.totalValue = asset.currentQuantity * asset.unitPrice;
            asset.syncStatus = 'pending'; // Mark for sync
            this.renderAssets();
        }
        
        this.updateDashboard();
        this.showToast('success', 'Audit Complete', 'Asset audit has been completed successfully.');
        this.addActivity(`Audit completed for ${asset.itemName}`);
        
        // Reset audit form
        this.startAudit();
    }
    
    // Reports and Export (Enhanced)
    exportData() {
        const filteredAssets = this.getFilteredAssets();
        
        if (filteredAssets.length === 0) {
            this.showToast('warning', 'No Data', 'No assets to export.');
            return;
        }
        
        const csvContent = this.generateCSV(filteredAssets);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generateFilename('assets', 'csv');
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('success', 'Export Complete', 'Assets have been exported to CSV.');
    }
    
    generateCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(this.fieldHeaders).filter(key => key !== 'syncStatus' && data[0].hasOwnProperty(key));
        const csvHeaders = headers.map(key => this.fieldHeaders[key]).join(',');
        
        const csvRows = data.map(item => 
            headers.map(key => {
                let value = item[key];
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );
        
        return csvHeaders + '\n' + csvRows.join('\n');
    }
    
    generateFilename(prefix, extension) {
        const pattern = this.settings.exportPattern;
        const date = this.formatDate(new Date().toISOString(), 'YYYY-MM-DD');
        const location = this.currentLocation !== 'global' ? this.getLocationName(this.currentLocation) : 'global';
        const filename = pattern.replace('{date}', date).replace('{location}', location);
        return `${filename}.${extension}`;
    }
    
    generateReports() {
        this.generateAssetSummary();
        this.generateLocationDistribution();
    }
    
    generateAssetSummary() {
        const container = document.getElementById('assetSummary');
        const filteredAssets = this.getFilteredAssets();
        
        if (filteredAssets.length === 0) {
            container.innerHTML = '<p class="text-secondary">No assets to analyze</p>';
            return;
        }
        
        const statusCounts = {};
        filteredAssets.forEach(asset => {
            statusCounts[asset.status] = (statusCounts[asset.status] || 0) + 1;
        });
        
        container.innerHTML = Object.entries(statusCounts)
            .map(([status, count]) => `
                <div class="flex justify-between items-center mb-8">
                    <span class="status status--${this.getStatusClass(status)}">${status}</span>
                    <strong>${count}</strong>
                </div>
            `).join('');
    }
    
    generateLocationDistribution() {
        const container = document.getElementById('locationDistribution');
        const assets = this.currentLocation === 'global' ? this.assets : this.getFilteredAssets();
        
        if (assets.length === 0) {
            container.innerHTML = '<p class="text-secondary">No assets to analyze</p>';
            return;
        }
        
        const locationCounts = {};
        assets.forEach(asset => {
            locationCounts[asset.location] = (locationCounts[asset.location] || 0) + 1;
        });
        
        container.innerHTML = Object.entries(locationCounts)
            .map(([location, count]) => `
                <div class="flex justify-between items-center mb-8">
                    <span>${location}</span>
                    <strong>${count}</strong>
                </div>
            `).join('');
    }
    
    // Dashboard (Enhanced)
    updateDashboard() {
        const filteredAssets = this.getFilteredAssets();
        const filteredShipments = this.getFilteredShipments();
        
        document.getElementById('totalAssets').textContent = filteredAssets.length;
        document.getElementById('activeShipments').textContent = filteredShipments.filter(s => s.status !== 'delivered').length;
        document.getElementById('pendingAudits').textContent = filteredAssets.filter(a => a.status === 'active').length;
        
        const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.totalValue, 0);
        document.getElementById('totalValue').textContent = `${this.getCurrentCurrencySymbol()}${totalValue.toFixed(2)}`;
    }
    
    addActivity(message) {
        const container = document.getElementById('recentActivity');
        const activity = {
            message,
            timestamp: new Date().toISOString(),
            location: this.currentLocation !== 'global' ? this.getLocationName(this.currentLocation) : 'Global'
        };
        
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <div class="flex justify-between items-center">
                <span>${activity.message}</span>
                <small class="text-secondary">${this.formatDate(activity.timestamp)}</small>
            </div>
        `;
        
        if (container.querySelector('.text-secondary')) {
            container.innerHTML = '';
        }
        
        container.insertBefore(activityElement, container.firstChild);
        
        // Keep only last 10 activities
        const activities = container.querySelectorAll('.activity-item');
        if (activities.length > 10) {
            activities[activities.length - 1].remove();
        }
    }
    
    // Utility functions
    openModal(modalId) {
        document.getElementById(modalId).classList.add('modal--active');
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('modal--active');
        
        if (modalId === 'csvModal') {
            this.resetCsvModal();
        }
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    formatDate(dateString, format = null) {
        const date = new Date(dateString);
        const formatToUse = format || this.getCurrentDateFormat();
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        switch (formatToUse) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            default:
                return `${month}/${day}/${year}`;
        }
    }
    
    getCurrentDateFormat() {
        if (this.currentLocation !== 'global') {
            const location = this.locations.find(l => l.id === this.currentLocation);
            return location ? location.dateFormat : this.settings.dateFormat;
        }
        return this.settings.dateFormat;
    }
    
    showToast(type, title, message) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        
        toast.innerHTML = `
            <div class="toast__content">
                <div class="toast__title">${title}</div>
                <p class="toast__message">${message}</p>
            </div>
            <button class="toast__close">&times;</button>
        `;
        
        container.appendChild(toast);
        
        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('toast--show');
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeToast(toast);
        }, 5000);
        
        // Close button
        toast.querySelector('.toast__close').addEventListener('click', () => {
            this.removeToast(toast);
        });
    }
    
    removeToast(toast) {
        toast.classList.remove('toast--show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize the application
const assetTracker = new AssetTracker();

// Initialize the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        window.assetTracker = new AssetTracker();
    });
} else {
    window.assetTracker = new AssetTracker();
}

})();