// Asset Tracker Pro - Main JavaScript

// Global state
const state = {
  locations: [],
  assets: [],
  shipments: [],
  categories: [],
  suppliers: [],
  statusOptions: [],
  selectedLocation: 'all',
  selectedAssets: new Set(),
  currentView: 'dashboard',
  isLoading: true
};

// DOM Elements
const elements = {
  // Navigation
  mainNav: document.getElementById('mainNav'),
  views: {
    dashboard: document.getElementById('dashboardView'),
    assets: document.getElementById('assetsView'),
    shipments: document.getElementById('shipmentsView'),
    locations: document.getElementById('locationsView')
  },
  
  // Location selector
  locationSelector: document.getElementById('locationSelector'),
  
  // Dashboard elements
  totalAssets: document.getElementById('totalAssets'),
  totalValue: document.getElementById('totalValue'),
  totalLocations: document.getElementById('totalLocations'),
  activeShipments: document.getElementById('activeShipments'),
  categoryChart: document.getElementById('categoryChart'),
  locationChart: document.getElementById('locationChart'),
  recentActivity: document.getElementById('recentActivity'),
  refreshData: document.getElementById('refreshData'),
  
  // Asset management
  assetSearch: document.getElementById('assetSearch'),
  categoryFilter: document.getElementById('categoryFilter'),
  statusFilter: document.getElementById('statusFilter'),
  locationFilter: document.getElementById('locationFilter'),
  assetsTable: document.getElementById('assetsTable'),
  assetsTableBody: document.getElementById('assetsTableBody'),
  selectAll: document.getElementById('selectAll'),
  bulkActions: document.getElementById('bulkActions'),
  selectedCount: document.getElementById('selectedCount'),
  fileUpload: document.getElementById('fileUpload'),
  csvFileInput: document.getElementById('csvFileInput'),
  exportAssets: document.getElementById('exportAssets'),
  addAsset: document.getElementById('addAsset'),
  
  // Bulk action buttons
  bulkMove: document.getElementById('bulkMove'),
  bulkEdit: document.getElementById('bulkEdit'),
  bulkDelete: document.getElementById('bulkDelete'),
  
  // Shipments
  shipmentsGrid: document.getElementById('shipmentsGrid'),
  createShipment: document.getElementById('createShipment'),
  
  // Locations
  locationsGrid: document.getElementById('locationsGrid'),
  
  // Modal
  assetModal: document.getElementById('assetModal'),
  modalTitle: document.getElementById('modalTitle'),
  assetForm: document.getElementById('assetForm'),
  closeModal: document.getElementById('closeModal'),
  cancelModal: document.getElementById('cancelModal'),
  saveAsset: document.getElementById('saveAsset'),
  
  // Form fields
  itemName: document.getElementById('itemName'),
  productCode: document.getElementById('productCode'),
  quantity: document.getElementById('quantity'),
  unitPrice: document.getElementById('unitPrice'),
  assetLocation: document.getElementById('assetLocation'),
  assetCategory: document.getElementById('assetCategory'),
  assetStatus: document.getElementById('assetStatus'),
  supplier: document.getElementById('supplier'),
  
  // Toast container
  toastContainer: document.getElementById('toastContainer'),
  
  // Loading overlay
  loadingOverlay: document.getElementById('loadingOverlay'),
  
  // Theme toggle
  themeToggle: document.getElementById('themeToggle')
};

// Initialize charts
let categoryChart;
let locationChart;

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

// View Management
const showView = (viewName) => {
  // Hide all views
  Object.values(elements.views).forEach(view => {
    view.classList.remove('view--active');
  });
  
  // Show the selected view
  elements.views[viewName].classList.add('view--active');
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('nav-item--active');
  });
  
  document.querySelector(`.nav-item[data-view="${viewName}"]`).classList.add('nav-item--active');
  
  // Update current view in state
  state.currentView = viewName;
  
  // If dashboard view, refresh charts
  if (viewName === 'dashboard') {
    updateDashboard();
  }
};

// Toast Notifications
const showToast = (type, title, message, duration = 3000) => {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  
  let icon = '💬';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';
  if (type === 'info') icon = 'ℹ️';
  
  toast.innerHTML = `
    <div class="toast__icon">${icon}</div>
    <div class="toast__content">
      <div class="toast__title">${title}</div>
      <div class="toast__message">${message}</div>
    </div>
    <button class="toast__close">✕</button>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Auto dismiss
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (elements.toastContainer.contains(toast)) {
        elements.toastContainer.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  // Close button
  toast.querySelector('.toast__close').addEventListener('click', () => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (elements.toastContainer.contains(toast)) {
        elements.toastContainer.removeChild(toast);
      }
    }, 300);
  });
};

// Loading State
const setLoading = (isLoading) => {
  state.isLoading = isLoading;
  if (isLoading) {
    elements.loadingOverlay.classList.remove('hidden');
  } else {
    elements.loadingOverlay.classList.add('hidden');
  }
};

// Data Loading
const loadData = async () => {
  try {
    setLoading(true);
    
    // In a real app, this would be an API call
    // For demo purposes, we're using the provided data
    const response = await fetch('./2fe0df27.json');
    const data = await response.json();
    
    // Update state with fetched data
    state.locations = data.locations || [];
    state.assets = data.assets || [];
    state.shipments = data.shipments || [];
    state.categories = data.categories || [];
    state.suppliers = data.suppliers || [];
    state.statusOptions = data.statusOptions || [];
    
    // Initialize the application
    initializeApp();
    
    showToast('success', 'Data Loaded', 'Application data has been successfully loaded.');
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('error', 'Loading Error', 'Failed to load application data. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Initialize Application
const initializeApp = () => {
  // Populate location selector
  populateLocationSelector();
  
  // Populate category and status filters
  populateFilters();
  
  // Populate assets table
  renderAssets();
  
  // Populate shipments
  renderShipments();
  
  // Populate locations
  renderLocations();
  
  // Initialize dashboard
  updateDashboard();
  
  // Add recent activity (sample data)
  addRecentActivities();
};

// Populate Location Selector
const populateLocationSelector = () => {
  // Clear current options
  elements.locationSelector.innerHTML = '<option value="all">All Locations</option>';
  
  // Add all locations
  state.locations.forEach(location => {
    const option = document.createElement('option');
    option.value = location.id;
    option.textContent = location.name;
    elements.locationSelector.appendChild(option);
  });
  
  // Also populate location filter and asset location dropdown
  populateLocationDropdowns();
};

// Populate Location Dropdowns (filter and asset form)
const populateLocationDropdowns = () => {
  // Clear current options
  elements.locationFilter.innerHTML = '<option value="">All Locations</option>';
  elements.assetLocation.innerHTML = '';
  
  // Add all locations
  state.locations.forEach(location => {
    // For filter
    const filterOption = document.createElement('option');
    filterOption.value = location.id;
    filterOption.textContent = location.name;
    elements.locationFilter.appendChild(filterOption);
    
    // For asset form
    const formOption = document.createElement('option');
    formOption.value = location.id;
    formOption.textContent = location.name;
    elements.assetLocation.appendChild(formOption);
  });
};

// Populate Category and Status Filters
const populateFilters = () => {
  // Clear current options
  elements.categoryFilter.innerHTML = '<option value="">All Categories</option>';
  elements.statusFilter.innerHTML = '<option value="">All Status</option>';
  elements.assetCategory.innerHTML = '';
  elements.assetStatus.innerHTML = '';
  
  // Add categories
  state.categories.forEach(category => {
    // For filter
    const filterOption = document.createElement('option');
    filterOption.value = category;
    filterOption.textContent = category;
    elements.categoryFilter.appendChild(filterOption);
    
    // For asset form
    const formOption = document.createElement('option');
    formOption.value = category;
    formOption.textContent = category;
    elements.assetCategory.appendChild(formOption);
  });
  
  // Add status options
  state.statusOptions.forEach(status => {
    // For filter
    const filterOption = document.createElement('option');
    filterOption.value = status;
    filterOption.textContent = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    elements.statusFilter.appendChild(filterOption);
    
    // For asset form
    const formOption = document.createElement('option');
    formOption.value = status;
    formOption.textContent = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    elements.assetStatus.appendChild(formOption);
  });
};

// Dashboard Functions
const updateDashboard = () => {
  // Update KPI values
  updateKPIs();
  
  // Update charts
  updateCharts();
};

const updateKPIs = () => {
  // Filter assets by selected location if needed
  const filteredAssets = state.selectedLocation === 'all' 
    ? state.assets 
    : state.assets.filter(asset => asset.locationId === state.selectedLocation);
  
  // Calculate totals
  const totalAssets = filteredAssets.length;
  const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.totalValue, 0);
  const totalLocations = state.locations.length;
  const activeShipments = state.shipments.filter(s => s.status === 'in_transit').length;
  
  // Update DOM
  elements.totalAssets.textContent = totalAssets;
  elements.totalValue.textContent = formatCurrency(totalValue);
  elements.totalLocations.textContent = totalLocations;
  elements.activeShipments.textContent = activeShipments;
};

const updateCharts = () => {
  // Filter assets by selected location if needed
  const filteredAssets = state.selectedLocation === 'all' 
    ? state.assets 
    : state.assets.filter(asset => asset.locationId === state.selectedLocation);
  
  // Category distribution chart
  updateCategoryChart(filteredAssets);
  
  // Location distribution chart
  updateLocationChart();
};

const updateCategoryChart = (assets) => {
  // Group assets by category
  const categoryData = {};
  
  assets.forEach(asset => {
    if (!categoryData[asset.category]) {
      categoryData[asset.category] = 0;
    }
    categoryData[asset.category] += asset.currentQuantity;
  });
  
  // Prepare chart data
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  
  // Chart colors
  const colors = [
    '#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', 
    '#5D878F', '#DB4545', '#D2BA4C', '#964325'
  ];
  
  // Create or update chart
  if (categoryChart) {
    categoryChart.data.labels = labels;
    categoryChart.data.datasets[0].data = data;
    categoryChart.update();
  } else {
    const ctx = elements.categoryChart.getContext('2d');
    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: 'var(--font-family-base)',
                size: 12
              }
            }
          }
        }
      }
    });
  }
};

const updateLocationChart = () => {
  // Group assets by location
  const locationData = {};
  
  state.assets.forEach(asset => {
    const location = state.locations.find(loc => loc.id === asset.locationId);
    const locationName = location ? location.name : 'Unknown';
    
    if (!locationData[locationName]) {
      locationData[locationName] = 0;
    }
    locationData[locationName] += asset.totalValue;
  });
  
  // Prepare chart data
  const labels = Object.keys(locationData);
  const data = Object.values(locationData);
  
  // Chart colors
  const colors = [
    '#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', 
    '#5D878F', '#DB4545', '#D2BA4C', '#964325'
  ];
  
  // Create or update chart
  if (locationChart) {
    locationChart.data.labels = labels;
    locationChart.data.datasets[0].data = data;
    locationChart.update();
  } else {
    const ctx = elements.locationChart.getContext('2d');
    locationChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Asset Value ($)',
          data: data,
          backgroundColor: colors[0],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
};

// Add sample recent activities
const addRecentActivities = () => {
  const activities = [
    {
      icon: '📦',
      title: 'New asset added',
      description: 'HP Local Printer (3PZ35A) added to inventory',
      time: '10 minutes ago'
    },
    {
      icon: '🚚',
      title: 'Shipment created',
      description: 'Shipment TRK001234567 created from Lucky Strike to Pin Palace',
      time: '2 hours ago'
    },
    {
      icon: '✏️',
      title: 'Asset updated',
      description: 'Logitech Webcam quantity updated from 3 to 4',
      time: '3 hours ago'
    },
    {
      icon: '🔄',
      title: 'Inventory synced',
      description: 'Inventory successfully synced with cloud database',
      time: 'Yesterday at 4:30 PM'
    }
  ];
  
  elements.recentActivity.innerHTML = '';
  
  activities.forEach(activity => {
    const activityEl = document.createElement('div');
    activityEl.className = 'activity-item';
    activityEl.innerHTML = `
      <div class="activity-icon">${activity.icon}</div>
      <div class="activity-content">
        <div class="activity-title">${activity.title}</div>
        <div class="activity-description">${activity.description}</div>
        <div class="activity-time">${activity.time}</div>
      </div>
    `;
    
    elements.recentActivity.appendChild(activityEl);
  });
};

// Asset Management Functions
const renderAssets = () => {
  // Get filter values
  const searchTerm = elements.assetSearch.value.toLowerCase();
  const categoryFilter = elements.categoryFilter.value;
  const statusFilter = elements.statusFilter.value;
  const locationFilter = elements.locationFilter.value || state.selectedLocation;
  
  // Filter assets
  let filteredAssets = state.assets;
  
  // Apply location filter if not 'all'
  if (locationFilter && locationFilter !== 'all') {
    filteredAssets = filteredAssets.filter(asset => asset.locationId === locationFilter);
  }
  
  // Apply category filter if selected
  if (categoryFilter) {
    filteredAssets = filteredAssets.filter(asset => asset.category === categoryFilter);
  }
  
  // Apply status filter if selected
  if (statusFilter) {
    filteredAssets = filteredAssets.filter(asset => asset.status === statusFilter);
  }
  
  // Apply search term if entered
  if (searchTerm) {
    filteredAssets = filteredAssets.filter(asset => 
      asset.itemName.toLowerCase().includes(searchTerm) ||
      asset.productCode.toLowerCase().includes(searchTerm) ||
      (asset.supplier && asset.supplier.toLowerCase().includes(searchTerm))
    );
  }
  
  // Clear table body
  elements.assetsTableBody.innerHTML = '';
  
  // Add assets to table
  filteredAssets.forEach(asset => {
    const row = document.createElement('tr');
    row.dataset.assetId = asset.id;
    
    // Format status for display
    const statusText = asset.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Get location name
    const location = state.locations.find(loc => loc.id === asset.locationId);
    const locationName = location ? location.name : 'Unknown';
    
    // Check if asset is selected
    const isSelected = state.selectedAssets.has(asset.id);
    
    // Handle supplier display - use text instead of images
    const supplierDisplay = asset.supplier || 'N/A';
    
    row.innerHTML = `
      <td><input type="checkbox" class="asset-checkbox" ${isSelected ? 'checked' : ''}></td>
      <td>${asset.itemName}</td>
      <td>${asset.productCode}</td>
      <td>${asset.currentQuantity}</td>
      <td>${formatCurrency(asset.unitPrice)}</td>
      <td>${formatCurrency(asset.totalValue)}</td>
      <td>${locationName}</td>
      <td><span class="status-badge status-badge--${asset.status}">${statusText}</span></td>
      <td>${supplierDisplay}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit-asset">Edit</button>
          <button class="action-btn delete-asset">Delete</button>
        </div>
      </td>
    `;
    
    elements.assetsTableBody.appendChild(row);
  });
  
  // Add event listeners to checkboxes and buttons
  addAssetTableEventListeners();
};

const addAssetTableEventListeners = () => {
  // Checkbox event listeners
  document.querySelectorAll('.asset-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const row = e.target.closest('tr');
      const assetId = row.dataset.assetId;
      
      if (e.target.checked) {
        state.selectedAssets.add(assetId);
      } else {
        state.selectedAssets.delete(assetId);
      }
      
      updateBulkActions();
    });
  });
  
  // Select all checkbox
  elements.selectAll.checked = false;
  elements.selectAll.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.asset-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = e.target.checked;
      const row = checkbox.closest('tr');
      const assetId = row.dataset.assetId;
      
      if (e.target.checked) {
        state.selectedAssets.add(assetId);
      } else {
        state.selectedAssets.delete(assetId);
      }
    });
    
    updateBulkActions();
  });
  
  // Edit buttons
  document.querySelectorAll('.edit-asset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      const assetId = row.dataset.assetId;
      const asset = state.assets.find(a => a.id === assetId);
      
      if (asset) {
        openAssetModal('edit', asset);
      }
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.delete-asset').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      const assetId = row.dataset.assetId;
      
      if (confirm('Are you sure you want to delete this asset?')) {
        deleteAsset(assetId);
      }
    });
  });
};

const updateBulkActions = () => {
  const selectedCount = state.selectedAssets.size;
  
  if (selectedCount > 0) {
    elements.bulkActions.style.display = 'block';
    elements.selectedCount.textContent = `${selectedCount} selected`;
  } else {
    elements.bulkActions.style.display = 'none';
  }
};

// Asset CRUD operations
const openAssetModal = (mode, asset = null) => {
  // Set modal title
  elements.modalTitle.textContent = mode === 'add' ? 'Add Asset' : 'Edit Asset';
  
  // Reset form
  elements.assetForm.reset();
  
  // If editing, fill form with asset data
  if (mode === 'edit' && asset) {
    elements.itemName.value = asset.itemName;
    elements.productCode.value = asset.productCode;
    elements.quantity.value = asset.currentQuantity;
    elements.unitPrice.value = asset.unitPrice;
    elements.assetLocation.value = asset.locationId;
    elements.assetCategory.value = asset.category;
    elements.assetStatus.value = asset.status;
    elements.supplier.value = asset.supplier || '';
    
    // Store asset ID for updating
    elements.assetForm.dataset.assetId = asset.id;
  } else {
    // Clear asset ID for new asset
    delete elements.assetForm.dataset.assetId;
  }
  
  // Show modal
  elements.assetModal.classList.add('modal--active');
};

const closeAssetModal = () => {
  elements.assetModal.classList.remove('modal--active');
};

const saveAsset = (e) => {
  e.preventDefault();
  
  // Get form values
  const itemName = elements.itemName.value.trim();
  const productCode = elements.productCode.value.trim();
  const quantity = parseInt(elements.quantity.value, 10);
  const unitPrice = parseFloat(elements.unitPrice.value);
  const locationId = elements.assetLocation.value;
  const category = elements.assetCategory.value;
  const status = elements.assetStatus.value;
  const supplier = elements.supplier.value.trim();
  
  // Basic validation
  if (!itemName || !quantity || !unitPrice || !locationId || !category || !status) {
    showToast('error', 'Validation Error', 'Please fill in all required fields.');
    return;
  }
  
  if (quantity < 0 || unitPrice < 0) {
    showToast('error', 'Validation Error', 'Quantity and unit price must be positive numbers.');
    return;
  }
  
  // Get location name
  const location = state.locations.find(loc => loc.id === locationId);
  const locationName = location ? location.name : 'Unknown';
  
  // Check if editing or adding
  const isEditing = elements.assetForm.dataset.assetId;
  
  if (isEditing) {
    // Update existing asset
    const assetId = elements.assetForm.dataset.assetId;
    const assetIndex = state.assets.findIndex(a => a.id === assetId);
    
    if (assetIndex !== -1) {
      state.assets[assetIndex] = {
        ...state.assets[assetIndex],
        itemName,
        productCode,
        currentQuantity: quantity,
        unitPrice,
        totalValue: quantity * unitPrice,
        locationId,
        location: locationName,
        category,
        status,
        supplier,
        lastSyncDate: new Date().toISOString(),
        syncStatus: 'pending'
      };
      
      showToast('success', 'Asset Updated', `${itemName} has been successfully updated.`);
    }
  } else {
    // Add new asset
    const newAsset = {
      id: generateId('asset'),
      itemName,
      productCode,
      startingQuantity: quantity,
      currentQuantity: quantity,
      unitPrice,
      totalValue: quantity * unitPrice,
      locationId,
      location: locationName,
      category,
      status,
      supplier,
      dateAdded: new Date().toISOString(),
      lastSyncDate: new Date().toISOString(),
      syncStatus: 'pending'
    };
    
    state.assets.push(newAsset);
    showToast('success', 'Asset Added', `${itemName} has been successfully added.`);
  }
  
  // Close modal and refresh data
  closeAssetModal();
  renderAssets();
  updateDashboard();
  addRecentActivity(isEditing ? 'edit' : 'add', itemName);
};

const deleteAsset = (assetId) => {
  const assetIndex = state.assets.findIndex(a => a.id === assetId);
  
  if (assetIndex !== -1) {
    const assetName = state.assets[assetIndex].itemName;
    
    // Remove from state
    state.assets.splice(assetIndex, 1);
    
    // Remove from selected assets if present
    state.selectedAssets.delete(assetId);
    
    // Update UI
    renderAssets();
    updateDashboard();
    updateBulkActions();
    
    showToast('success', 'Asset Deleted', `${assetName} has been successfully deleted.`);
    addRecentActivity('delete', assetName);
  }
};

const addRecentActivity = (action, itemName) => {
  const now = new Date();
  const timeStr = 'Just now';
  
  let icon = '📦';
  let title = 'Asset added';
  let description = `${itemName} added to inventory`;
  
  if (action === 'edit') {
    icon = '✏️';
    title = 'Asset updated';
    description = `${itemName} details updated`;
  } else if (action === 'delete') {
    icon = '🗑️';
    title = 'Asset deleted';
    description = `${itemName} removed from inventory`;
  }
  
  const activityEl = document.createElement('div');
  activityEl.className = 'activity-item';
  activityEl.innerHTML = `
    <div class="activity-icon">${icon}</div>
    <div class="activity-content">
      <div class="activity-title">${title}</div>
      <div class="activity-description">${description}</div>
      <div class="activity-time">${timeStr}</div>
    </div>
  `;
  
  // Add to the top of the activity feed
  elements.recentActivity.insertBefore(activityEl, elements.recentActivity.firstChild);
};

// Shipment Management
const renderShipments = () => {
  elements.shipmentsGrid.innerHTML = '';
  
  state.shipments.forEach(shipment => {
    const card = document.createElement('div');
    card.className = 'shipment-card';
    
    // Format status
    const statusText = shipment.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Format dates
    const shippedDate = formatDate(shipment.dateShipped);
    const arrivalDate = formatDate(shipment.estimatedArrival);
    
    card.innerHTML = `
      <div class="shipment-header">
        <h3>${shipment.assetName}</h3>
        <span class="status-badge status-badge--${shipment.status}">${statusText}</span>
      </div>
      <div class="shipment-tracking">Tracking: ${shipment.trackingNumber}</div>
      <div class="shipment-route">
        <div class="shipment-from">
          <div class="shipment-location-name">${shipment.fromLocation}</div>
        </div>
        <div class="shipment-arrow">→</div>
        <div class="shipment-to">
          <div class="shipment-location-name">${shipment.toLocation}</div>
        </div>
      </div>
      <div class="shipment-details">
        <div>Quantity: ${shipment.quantity}</div>
        <div>Shipped: ${shippedDate}</div>
        <div>Estimated Arrival: ${arrivalDate}</div>
      </div>
    `;
    
    elements.shipmentsGrid.appendChild(card);
  });
};

// Location Management
const renderLocations = () => {
  elements.locationsGrid.innerHTML = '';
  
  state.locations.forEach(location => {
    const card = document.createElement('div');
    card.className = 'location-card';
    
    // Count assets at this location
    const locationAssets = state.assets.filter(asset => asset.locationId === location.id);
    const assetCount = locationAssets.length;
    const totalValue = locationAssets.reduce((sum, asset) => sum + asset.totalValue, 0);
    
    card.innerHTML = `
      <div class="location-header">
        <div>
          <h3 class="location-name">${location.name}</h3>
          <div class="location-region">${location.region} / ${location.district}</div>
        </div>
      </div>
      <div class="location-details">
        <div>${location.address.street}</div>
        <div>${location.address.city}, ${location.address.state} ${location.address.zip}</div>
        <div>Phone: ${location.phone}</div>
        <div>Manager: ${location.manager}</div>
        <div>Lanes: ${location.lanes}</div>
      </div>
      <div class="location-stats">
        <div class="location-stat">
          <div class="location-stat__value">${assetCount}</div>
          <div class="location-stat__label">Assets</div>
        </div>
        <div class="location-stat">
          <div class="location-stat__value">${formatCurrency(totalValue)}</div>
          <div class="location-stat__label">Value</div>
        </div>
      </div>
    `;
    
    elements.locationsGrid.appendChild(card);
  });
};

// File Upload Functionality
const handleFileUpload = (file) => {
  // In a real app, we would parse the CSV file
  // For demo purposes, we'll just show a success message
  
  showToast('success', 'File Uploaded', `${file.name} has been successfully uploaded.`);
  
  // Simulate adding new assets
  setTimeout(() => {
    // Create a few dummy assets
    const newAssets = [
      {
        id: generateId('asset'),
        itemName: 'Imported Keyboard',
        productCode: 'KB-123',
        startingQuantity: 5,
        currentQuantity: 5,
        unitPrice: 49.99,
        totalValue: 249.95,
        locationId: state.locations[0].id,
        location: state.locations[0].name,
        category: 'IT Equipment',
        status: 'active',
        supplier: 'Logitech',
        dateAdded: new Date().toISOString(),
        lastSyncDate: new Date().toISOString(),
        syncStatus: 'synced'
      },
      {
        id: generateId('asset'),
        itemName: 'Imported Mouse',
        productCode: 'MS-456',
        startingQuantity: 3,
        currentQuantity: 3,
        unitPrice: 29.99,
        totalValue: 89.97,
        locationId: state.locations[0].id,
        location: state.locations[0].name,
        category: 'IT Equipment',
        status: 'active',
        supplier: 'Logitech',
        dateAdded: new Date().toISOString(),
        lastSyncDate: new Date().toISOString(),
        syncStatus: 'synced'
      }
    ];
    
    // Add to state
    state.assets = [...state.assets, ...newAssets];
    
    // Update UI
    renderAssets();
    updateDashboard();
    
    showToast('success', 'Import Complete', `2 assets were imported from ${file.name}.`);
  }, 1500);
};

// Export functionality
const exportAssets = () => {
  // In a real app, we would generate a CSV file
  // For demo purposes, we'll just show a success message
  
  showToast('success', 'Export Started', 'Asset data export has started. Your file will be ready shortly.');
  
  // Simulate download
  setTimeout(() => {
    showToast('success', 'Export Complete', 'Asset data has been exported successfully.');
  }, 1500);
};

// Theme Toggle
const toggleTheme = () => {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-color-scheme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  html.setAttribute('data-color-scheme', newTheme);
  elements.themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
  
  showToast('info', 'Theme Changed', `Theme switched to ${newTheme} mode.`);
};

// Detect system preference and set initial theme
const setInitialTheme = () => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = prefersDark ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-color-scheme', initialTheme);
  elements.themeToggle.textContent = initialTheme === 'light' ? '🌙' : '☀️';
};

// Event Listeners
const setupEventListeners = () => {
  // Navigation
  elements.mainNav.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-item') || e.target.parentElement.classList.contains('nav-item')) {
      const navItem = e.target.classList.contains('nav-item') ? e.target : e.target.parentElement;
      const viewName = navItem.dataset.view;
      
      if (viewName) {
        showView(viewName);
      }
    }
  });
  
  // Location selector
  elements.locationSelector.addEventListener('change', (e) => {
    state.selectedLocation = e.target.value;
    updateDashboard();
    renderAssets();
  });
  
  // Dashboard refresh
  elements.refreshData.addEventListener('click', () => {
    updateDashboard();
    showToast('success', 'Data Refreshed', 'Dashboard data has been refreshed.');
  });
  
  // Asset search and filters
  elements.assetSearch.addEventListener('input', renderAssets);
  elements.categoryFilter.addEventListener('change', renderAssets);
  elements.statusFilter.addEventListener('change', renderAssets);
  elements.locationFilter.addEventListener('change', renderAssets);
  
  // Add asset button
  elements.addAsset.addEventListener('click', () => {
    openAssetModal('add');
  });
  
  // Export assets button
  elements.exportAssets.addEventListener('click', exportAssets);
  
  // Modal close buttons
  elements.closeModal.addEventListener('click', closeAssetModal);
  elements.cancelModal.addEventListener('click', closeAssetModal);
  
  // Modal backdrop click to close
  elements.assetModal.querySelector('.modal__backdrop').addEventListener('click', closeAssetModal);
  
  // Save asset form
  elements.assetForm.addEventListener('submit', saveAsset);
  
  // Bulk action buttons
  elements.bulkDelete.addEventListener('click', () => {
    if (confirm(`Are you sure you want to delete ${state.selectedAssets.size} assets?`)) {
      // Delete selected assets
      for (const assetId of state.selectedAssets) {
        deleteAsset(assetId);
      }
      
      // Clear selection
      state.selectedAssets.clear();
      updateBulkActions();
    }
  });
  
  // File upload
  elements.fileUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.fileUpload.classList.add('file-upload--dragover');
  });
  
  elements.fileUpload.addEventListener('dragleave', () => {
    elements.fileUpload.classList.remove('file-upload--dragover');
  });
  
  elements.fileUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.fileUpload.classList.remove('file-upload--dragover');
    
    if (e.dataTransfer.files.length) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });
  
  elements.csvFileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFileUpload(e.target.files[0]);
    }
  });
  
  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  setInitialTheme();
  setupEventListeners();
  loadData();
});
