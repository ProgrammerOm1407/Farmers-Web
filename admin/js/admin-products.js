// Admin Products Management JavaScript
import { 
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    deleteProductImage,
    formatCurrency,
    formatDate,
    USER_ROLES
} from './admin-firebase-service.js';

// Global variables
let currentUserData = null;
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;
let selectedProducts = [];
let currentEditingProduct = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Products loaded');
    
    // Initialize mobile navigation
    initializeMobileNavigation();
    
    // Wait for auth to be ready
    setTimeout(() => {
        initializeProductsPage();
    }, 1000);
});

// Mobile Navigation
function initializeMobileNavigation() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    // Mobile sidebar toggle
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', function() {
            toggleSidebar();
        });
    }
    
    // Desktop sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            if (window.innerWidth > 992) {
                sidebar.classList.toggle('collapsed');
            } else {
                toggleSidebar();
            }
        });
    }
    
    // Sidebar overlay click
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            closeSidebar();
        });
    }
    
    // Close sidebar when clicking nav links on mobile
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 992) {
                closeSidebar();
            }
        });
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            closeSidebar();
            sidebar.classList.remove('collapsed');
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.toggle('active');
    if (sidebarOverlay) {
        sidebarOverlay.classList.toggle('active');
    }
    
    // Prevent body scroll when sidebar is open on mobile
    if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.remove('active');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
    
    document.body.style.overflow = '';
}

async function initializeProductsPage() {
    try {
        // Get current user data
        const storedUser = localStorage.getItem('adminUser');
        if (!storedUser) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUserData = JSON.parse(storedUser);
        
        // Load products
        await loadProducts();
        
        // Initialize UI components
        initializeFilters();
        initializeViewToggle();
        initializeProductModal();
        initializeBulkActions();
        initializeSearch();
        
        // Update UI
        updateProductsStats();
        renderProducts();
        
    } catch (error) {
        console.error('Error initializing products page:', error);
        window.adminAuth.showNotification('Failed to load products', 'error');
    }
}

async function loadProducts() {
    try {
        window.adminAuth.showLoadingOverlay('Loading products...');
        
        // Get products based on user role
        allProducts = await getProducts(currentUserData.uid);
        filteredProducts = [...allProducts];
        
        console.log('Products loaded:', allProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        throw error;
    } finally {
        window.adminAuth.hideLoadingOverlay();
    }
}

function updateProductsStats() {
    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter(p => p.status === 'active').length;
    const outOfStockProducts = allProducts.filter(p => p.status === 'out-of-stock' || p.stock === 0).length;
    const totalValue = allProducts.reduce((sum, p) => sum + (p.price * p.stock || 0), 0);
    
    // Update stats display
    document.getElementById('total-products-count').textContent = totalProducts.toLocaleString();
    document.getElementById('active-products-count').textContent = activeProducts.toLocaleString();
    document.getElementById('out-of-stock-count').textContent = outOfStockProducts.toLocaleString();
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
}

function initializeFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const sortFilter = document.getElementById('sort-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    // Add event listeners
    [categoryFilter, statusFilter, sortFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
        }
    });
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

function applyFilters() {
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;
    
    // Filter products
    filteredProducts = allProducts.filter(product => {
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesStatus = !statusFilter || product.status === statusFilter;
        
        return matchesCategory && matchesStatus;
    });
    
    // Sort products
    sortProducts(sortFilter);
    
    // Reset pagination
    currentPage = 1;
    
    // Re-render
    renderProducts();
}

function sortProducts(sortBy) {
    switch (sortBy) {
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.createdAt?.toDate?.() || b.createdAt) - new Date(a.createdAt?.toDate?.() || a.createdAt));
            break;
        case 'oldest':
            filteredProducts.sort((a, b) => new Date(a.createdAt?.toDate?.() || a.createdAt) - new Date(b.createdAt?.toDate?.() || b.createdAt));
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
        case 'sales':
            filteredProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
            break;
    }
}

function clearFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('sort-filter').value = 'newest';
    
    filteredProducts = [...allProducts];
    currentPage = 1;
    renderProducts();
}

function initializeViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const tableView = document.getElementById('table-view');
    const gridView = document.getElementById('grid-view');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Update active button
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Toggle views
            if (view === 'table') {
                tableView.style.display = 'block';
                gridView.style.display = 'none';
            } else {
                tableView.style.display = 'none';
                gridView.style.display = 'block';
            }
            
            // Re-render products
            renderProducts();
        });
    });
}

function renderProducts() {
    const activeView = document.querySelector('.view-btn.active').dataset.view;
    
    if (activeView === 'table') {
        renderTableView();
    } else {
        renderGridView();
    }
    
    renderPagination();
}

function renderTableView() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (pageProducts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="no-data">No products found</td></tr>';
        return;
    }
    
    const productsHTML = pageProducts.map(product => {
        const stockStatus = getStockStatus(product);
        const statusClass = getStatusClass(product.status);
        
        return `
            <tr>
                <td>
                    <input type="checkbox" class="product-checkbox" value="${product.id}">
                </td>
                <td>
                    <div class="product-info">
                        <img src="${product.imageUrl || 'images/placeholder-product.jpg'}" 
                             alt="${product.name}" class="product-image">
                        <div class="product-details">
                            <h4>${product.name}</h4>
                            <p>${product.category}</p>
                        </div>
                    </div>
                </td>
                <td>${product.category}</td>
                <td class="product-price">${formatCurrency(product.price)}</td>
                <td>
                    <div class="stock-info">
                        <span class="stock-quantity">${product.stock || 0}</span>
                        <span class="stock-status ${stockStatus.class}">${stockStatus.text}</span>
                    </div>
                </td>
                <td>${product.sales || 0}</td>
                <td><span class="status-badge ${statusClass}">${product.status}</span></td>
                <td>${formatDate(product.createdAt)}</td>
                <td>
                    <div class="product-actions">
                        <button class="action-btn view" onclick="viewProduct('${product.id}')" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editProduct('${product.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="confirmDeleteProduct('${product.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = productsHTML;
    
    // Initialize checkbox listeners
    initializeProductCheckboxes();
}

function renderGridView() {
    const gridContainer = document.getElementById('products-grid');
    if (!gridContainer) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    if (pageProducts.length === 0) {
        gridContainer.innerHTML = '<div class="no-data">No products found</div>';
        return;
    }
    
    const productsHTML = pageProducts.map(product => {
        const stockStatus = getStockStatus(product);
        const statusClass = getStatusClass(product.status);
        
        return `
            <div class="product-card">
                <img src="${product.imageUrl || 'images/placeholder-product.jpg'}" 
                     alt="${product.name}" class="product-card-image">
                <div class="product-card-content">
                    <div class="product-card-header">
                        <div>
                            <h3 class="product-card-title">${product.name}</h3>
                            <p class="product-card-category">${product.category}</p>
                        </div>
                        <div class="product-card-price">${formatCurrency(product.price)}</div>
                    </div>
                    <div class="product-card-meta">
                        <span>Stock: ${product.stock || 0}</span>
                        <span>Sales: ${product.sales || 0}</span>
                        <span class="status-badge ${statusClass}">${product.status}</span>
                    </div>
                    <div class="product-card-actions">
                        <button class="btn btn-sm btn-outline" onclick="viewProduct('${product.id}')">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="editProduct('${product.id}')">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDeleteProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    gridContainer.innerHTML = productsHTML;
}

function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginationContainer = document.getElementById('pagination');
    const showingStart = document.getElementById('showing-start');
    const showingEnd = document.getElementById('showing-end');
    const totalProductsSpan = document.getElementById('total-products');
    
    // Update showing info
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    
    if (showingStart) showingStart.textContent = filteredProducts.length > 0 ? startIndex : 0;
    if (showingEnd) showingEnd.textContent = endIndex;
    if (totalProductsSpan) totalProductsSpan.textContent = filteredProducts.length;
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    paginationContainer.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    renderProducts();
}

function getStockStatus(product) {
    const stock = product.stock || 0;
    const minStock = product.minStock || 10;
    
    if (stock === 0) {
        return { class: 'out-of-stock', text: 'Out of Stock' };
    } else if (stock <= minStock) {
        return { class: 'low-stock', text: 'Low Stock' };
    } else {
        return { class: 'in-stock', text: 'In Stock' };
    }
}

function getStatusClass(status) {
    const statusClasses = {
        'active': 'active',
        'inactive': 'inactive',
        'out-of-stock': 'out-of-stock'
    };
    
    return statusClasses[status] || 'inactive';
}

function initializeProductModal() {
    const addProductBtn = document.getElementById('add-product-btn');
    const productModal = document.getElementById('product-modal-overlay');
    const closeModalBtn = document.getElementById('close-product-modal');
    const cancelBtn = document.getElementById('cancel-product');
    const productForm = document.getElementById('product-form');
    const imageUpload = document.getElementById('product-images');
    
    // Add product button
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            openProductModal();
        });
    }
    
    // Close modal buttons
    [closeModalBtn, cancelBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function() {
                closeProductModal();
            });
        }
    });
    
    // Close modal on overlay click
    if (productModal) {
        productModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeProductModal();
            }
        });
    }
    
    // Form submission
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
    
    // Image upload
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Drag and drop for images
    const uploadArea = document.getElementById('image-upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                imageUpload.files = files;
                handleImageUpload({ target: { files } });
            }
        });
    }
}

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal-overlay');
    const modalTitle = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');
    
    currentEditingProduct = product;
    
    if (product) {
        // Edit mode
        modalTitle.textContent = 'Edit Product';
        populateProductForm(product);
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Product';
        form.reset();
        clearImagePreview();
    }
    
    modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('product-modal-overlay');
    modal.classList.remove('active');
    currentEditingProduct = null;
}

function populateProductForm(product) {
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-unit').value = product.unit || 'kg';
    document.getElementById('product-stock').value = product.stock || '';
    document.getElementById('product-min-stock').value = product.minStock || '';
    document.getElementById('product-status').value = product.status || 'active';
    document.getElementById('product-featured').checked = product.featured || false;
    
    // Handle existing images
    if (product.imageUrl) {
        showExistingImage(product.imageUrl);
    }
}

function showExistingImage(imageUrl) {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `
        <div class="preview-item">
            <img src="${imageUrl}" alt="Product image">
            <button type="button" class="preview-remove" onclick="removeExistingImage()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

function removeExistingImage() {
    clearImagePreview();
}

function handleImageUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('image-preview');
    const uploadArea = document.getElementById('image-upload-area');
    
    // Validation
    const maxFiles = 5;
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (files.length > maxFiles) {
        window.adminAuth.showNotification(`Maximum ${maxFiles} images allowed`, 'error');
        return;
    }
    
    clearImagePreview();
    
    // Show upload area as active
    uploadArea.classList.add('uploading');
    
    let validFiles = 0;
    
    Array.from(files).forEach((file, index) => {
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
            window.adminAuth.showNotification(`${file.name} is not a valid image format`, 'error');
            return;
        }
        
        // Validate file size
        if (file.size > maxFileSize) {
            window.adminAuth.showNotification(`${file.name} is too large. Maximum size is 5MB`, 'error');
            return;
        }
        
        validFiles++;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.style.opacity = '0';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview" onload="this.parentElement.style.opacity='1'">
                <button type="button" class="preview-remove" onclick="removeImagePreview(${index})">
                    <i class="fas fa-times"></i>
                </button>
                <div class="image-info">
                    <small>${file.name}</small>
                    <small>${(file.size / 1024 / 1024).toFixed(2)} MB</small>
                </div>
            `;
            preview.appendChild(previewItem);
            
            // Animate in
            setTimeout(() => {
                previewItem.style.opacity = '1';
                previewItem.style.transform = 'scale(1)';
            }, 100);
        };
        
        reader.onerror = function() {
            window.adminAuth.showNotification(`Error reading ${file.name}`, 'error');
        };
        
        reader.readAsDataURL(file);
    });
    
    // Remove uploading state
    setTimeout(() => {
        uploadArea.classList.remove('uploading');
        if (validFiles > 0) {
            window.adminAuth.showNotification(`${validFiles} image(s) uploaded successfully`, 'success');
        }
    }, 500);
}

function clearImagePreview() {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
}

function removeImagePreview(index) {
    const preview = document.getElementById('image-preview');
    const items = preview.children;
    if (items[index]) {
        items[index].remove();
    }
}

async function handleProductSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('name').trim(),
        category: formData.get('category'),
        description: formData.get('description').trim(),
        price: parseFloat(formData.get('price')),
        unit: formData.get('unit'),
        stock: parseInt(formData.get('stock')),
        minStock: parseInt(formData.get('minStock')) || 10,
        status: formData.get('status'),
        featured: formData.get('featured') === 'on'
    };
    
    // Validation
    if (!productData.name || !productData.category || !productData.price || productData.stock < 0) {
        window.adminAuth.showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('save-product');
    const originalText = submitBtn.innerHTML;
    
    try {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
        
        // Handle image upload
        const imageFiles = document.getElementById('product-images').files;
        if (imageFiles.length > 0) {
            const tempProductId = currentEditingProduct?.id || Date.now().toString();
            productData.imageUrl = await uploadProductImage(imageFiles[0], tempProductId);
        } else if (currentEditingProduct?.imageUrl) {
            productData.imageUrl = currentEditingProduct.imageUrl;
        }
        
        if (currentEditingProduct) {
            // Update existing product
            await updateProduct(currentEditingProduct.id, productData, currentUserData.uid);
            window.adminAuth.showNotification('Product updated successfully', 'success');
        } else {
            // Add new product
            await addProduct(productData, currentUserData.uid);
            window.adminAuth.showNotification('Product added successfully', 'success');
        }
        
        // Reload products and close modal
        await loadProducts();
        updateProductsStats();
        renderProducts();
        closeProductModal();
        
    } catch (error) {
        console.error('Error saving product:', error);
        window.adminAuth.showNotification('Failed to save product: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function initializeProductCheckboxes() {
    const selectAllCheckbox = document.getElementById('select-all-products');
    const productCheckboxes = document.querySelectorAll('.product-checkbox');
    
    // Select all functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            productCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            updateSelectedProducts();
        });
    }
    
    // Individual checkbox functionality
    productCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectedProducts();
            
            // Update select all checkbox
            const checkedCount = document.querySelectorAll('.product-checkbox:checked').length;
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = checkedCount === productCheckboxes.length;
                selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < productCheckboxes.length;
            }
        });
    });
}

function updateSelectedProducts() {
    const checkedBoxes = document.querySelectorAll('.product-checkbox:checked');
    selectedProducts = Array.from(checkedBoxes).map(cb => cb.value);
    
    // Update bulk actions button
    const bulkActionsBtn = document.getElementById('bulk-actions-btn');
    if (bulkActionsBtn) {
        bulkActionsBtn.textContent = selectedProducts.length > 0 ? 
            `Bulk Actions (${selectedProducts.length})` : 'Bulk Actions';
    }
}

function initializeBulkActions() {
    const bulkActionsBtn = document.getElementById('bulk-actions-btn');
    const bulkModal = document.getElementById('bulk-actions-modal');
    const closeBulkModal = document.getElementById('close-bulk-modal');
    const bulkActionBtns = document.querySelectorAll('.bulk-action-btn');
    
    if (bulkActionsBtn) {
        bulkActionsBtn.addEventListener('click', function() {
            if (selectedProducts.length === 0) {
                window.adminAuth.showNotification('Please select products first', 'warning');
                return;
            }
            
            document.getElementById('selected-count').textContent = selectedProducts.length;
            bulkModal.classList.add('active');
        });
    }
    
    if (closeBulkModal) {
        closeBulkModal.addEventListener('click', function() {
            bulkModal.classList.remove('active');
        });
    }
    
    bulkActionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            handleBulkAction(action);
            bulkModal.classList.remove('active');
        });
    });
}

async function handleBulkAction(action) {
    if (selectedProducts.length === 0) return;
    
    try {
        window.adminAuth.showLoadingOverlay(`Performing bulk ${action}...`);
        
        switch (action) {
            case 'activate':
                await Promise.all(selectedProducts.map(id => 
                    updateProduct(id, { status: 'active' }, currentUserData.uid)
                ));
                window.adminAuth.showNotification(`${selectedProducts.length} products activated`, 'success');
                break;
                
            case 'deactivate':
                await Promise.all(selectedProducts.map(id => 
                    updateProduct(id, { status: 'inactive' }, currentUserData.uid)
                ));
                window.adminAuth.showNotification(`${selectedProducts.length} products deactivated`, 'success');
                break;
                
            case 'delete':
                if (confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) {
                    await Promise.all(selectedProducts.map(id => 
                        deleteProduct(id, currentUserData.uid)
                    ));
                    window.adminAuth.showNotification(`${selectedProducts.length} products deleted`, 'success');
                }
                break;
                
            case 'export':
                exportSelectedProducts();
                return; // Don't reload products for export
        }
        
        // Reload products
        await loadProducts();
        updateProductsStats();
        renderProducts();
        selectedProducts = [];
        
    } catch (error) {
        console.error('Error performing bulk action:', error);
        window.adminAuth.showNotification('Failed to perform bulk action: ' + error.message, 'error');
    } finally {
        window.adminAuth.hideLoadingOverlay();
    }
}

function exportSelectedProducts() {
    const productsToExport = allProducts.filter(p => selectedProducts.includes(p.id));
    
    const csvContent = [
        ['Name', 'Category', 'Price', 'Stock', 'Status', 'Created'],
        ...productsToExport.map(p => [
            p.name,
            p.category,
            p.price,
            p.stock,
            p.status,
            formatDate(p.createdAt)
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    window.adminAuth.showNotification('Products exported successfully', 'success');
}

function initializeSearch() {
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value.trim());
            }, 300);
        });
    }
}

function performSearch(searchTerm) {
    if (!searchTerm) {
        filteredProducts = [...allProducts];
    } else {
        const term = searchTerm.toLowerCase();
        filteredProducts = allProducts.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term)
        );
    }
    
    currentPage = 1;
    renderProducts();
}

// Global functions for onclick handlers
window.viewProduct = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        // You can implement a view modal or redirect to a detail page
        console.log('View product:', product);
        window.adminAuth.showNotification('Product view functionality to be implemented', 'info');
    }
};

window.editProduct = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        openProductModal(product);
    }
};

window.confirmDeleteProduct = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        const deleteModal = document.getElementById('delete-modal');
        const confirmBtn = document.getElementById('confirm-delete');
        const cancelBtn = document.getElementById('cancel-delete');
        const closeBtn = document.getElementById('close-delete-modal');
        
        // Show modal
        deleteModal.classList.add('active');
        
        // Handle confirm
        confirmBtn.onclick = async function() {
            try {
                await deleteProduct(productId, currentUserData.uid);
                window.adminAuth.showNotification('Product deleted successfully', 'success');
                
                // Reload products
                await loadProducts();
                updateProductsStats();
                renderProducts();
                
                deleteModal.classList.remove('active');
            } catch (error) {
                console.error('Error deleting product:', error);
                window.adminAuth.showNotification('Failed to delete product: ' + error.message, 'error');
            }
        };
        
        // Handle cancel/close
        [cancelBtn, closeBtn].forEach(btn => {
            if (btn) {
                btn.onclick = function() {
                    deleteModal.classList.remove('active');
                };
            }
        });
        
        // Close on overlay click
        deleteModal.onclick = function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        };
    }
};

window.changePage = changePage;
window.removeImagePreview = removeImagePreview;
window.removeExistingImage = removeExistingImage;