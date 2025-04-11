// --- Globals ---
let products = []; // Array to hold product objects
let invoiceItems = []; // Array to hold invoice line items
let editingProductId = null; // Track which product ID is being edited
let appSettings = null; // Application settings
let currentInvoiceDetails = null; // Current invoice details for modal

// Filter and pagination state
let currentFilters = {
    search: '',
    customer: '',
    product: '',
    startDate: '',
    endDate: ''
};

let invoicePagination = {
    currentPage: 1,
    totalPages: 1,
    limit: 10
};

let productPagination = {
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    search: ''
};

// --- DOM Elements ---
const productForm = document.getElementById('product-form');
const productNameInput = document.getElementById('product-name');
const productPriceInput = document.getElementById('product-price');
const productListTbody = document.getElementById('product-list');
const productSelect = document.getElementById('product-select');
const quantityInput = document.getElementById('quantity');
const invoiceItemsTbody = document.getElementById('invoice-items');
const subtotalSpan = document.getElementById('subtotal');
const taxRateInput = document.getElementById('tax-rate');
const taxRateDisplay = document.getElementById('tax-rate-display');
const taxAmountSpan = document.getElementById('tax-amount');
const grandTotalSpan = document.getElementById('grand-total');
const editProductIdInput = document.getElementById('edit-product-id');
const addUpdateProductBtn = document.getElementById('add-update-product-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const customerNameInput = document.getElementById('customer-name');
const displayCustomerName = document.getElementById('display-customer-name');
const displayInvoiceDate = document.getElementById('display-invoice-date');
const displayInvoiceNumber = document.getElementById('display-invoice-number');
const addInvoiceItemBtn = document.getElementById('add-invoice-item');
const printButton = document.getElementById('print-button');
const clearInvoiceBtn = document.getElementById('clear-invoice');
const saveInvoiceBtn = document.getElementById('save-invoice');

// Product image elements
const productImageInput = document.getElementById('product-image');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const productImageContainer = document.getElementById('product-image-container');
// Company info elements
const companyNameElement = document.getElementById('company-name');
const companyAddressElement = document.getElementById('company-address');
const companyPhoneElement = document.getElementById('company-phone');
const companyEmailElement = document.getElementById('company-email');
// Home page company elements
const homeCompanyNameElement = document.getElementById('home-company-name');
const homeCompanyDetailsElement = document.getElementById('home-company-details');
// Invoice history elements
const yearlyHistoryTbody = document.getElementById('yearly-history');
const monthlyHistoryTbody = document.getElementById('monthly-history');
const weeklyHistoryTbody = document.getElementById('weekly-history');
const dailyHistoryTbody = document.getElementById('daily-history');
const allInvoicesListTbody = document.getElementById('all-invoices-list');
const mostOrderedListTbody = document.getElementById('most-ordered-list');
// Invoice detail modal elements
const invoiceDetailModal = document.getElementById('invoiceDetailModal');
const invoiceDetailContent = document.getElementById('invoice-detail-content');
const printModalInvoiceBtn = document.getElementById('print-modal-invoice');

// Search and filter elements
const invoiceSearchInput = document.getElementById('invoice-search');
const searchButton = document.getElementById('search-button');
const filterCustomerInput = document.getElementById('filter-customer');
const filterProductInput = document.getElementById('filter-product');
const filterStartDateInput = document.getElementById('filter-start-date');
const filterEndDateInput = document.getElementById('filter-end-date');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');
// Export buttons
const exportCsvBtn = document.getElementById('export-csv');
const exportExcelBtn = document.getElementById('export-excel');
// Pagination elements
const invoicePaginationInfo = document.getElementById('invoice-pagination-info');
const invoicePaginationElement = document.getElementById('invoice-pagination');
const productPaginationInfo = document.getElementById('product-pagination-info');
const productPaginationElement = document.getElementById('product-pagination');
// Product search
const productSearchInput = document.getElementById('product-search');
const productSearchButton = document.getElementById('product-search-button');

// --- API Functions ---

// Fetch application settings
function fetchSettings() {
    fetch('/settings/api')
        .then(response => response.json())
        .then(data => {
            appSettings = data;

            try {
                // Update tax rate input with default from settings
                if (taxRateInput && appSettings) {
                    taxRateInput.value = appSettings.tax_rate;
                    taxRateInput.dispatchEvent(new Event('input')); // Trigger update
                }

                // Update all currency symbols on the page
                updateCurrencySymbols();

                // Refresh product dropdown to show correct currency
                if (productSelect && products && products.length > 0) {
                    populateProductDropdown();
                }

                // Update invoice details to use new settings
                updateInvoiceDetails();

                // Update company information for printing
                updateCompanyInfo();

                // Toggle product image container based on settings
                if (productImageContainer) {
                    if (appSettings.product_images_enabled) {
                        productImageContainer.classList.remove('d-none');
                    } else {
                        productImageContainer.classList.add('d-none');
                    }
                }

                // Refresh product list to show/hide image column
                if (products && products.length > 0) {
                    renderProductList();
                }
            } catch (err) {
                console.error('Error processing settings:', err);
            }
        })
        .catch(error => console.error('Error fetching settings:', error));
}

// Fetch all products from the server
function fetchProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            products = data;
            try {
                renderProductList();
            } catch (err) {
                console.error('Error rendering product list:', err);
            }
        })
        .catch(error => console.error('Error fetching products:', error));
}

// Create a new product
function createProduct(formData) {
    // Show loading state
    const btnTextElement = document.getElementById('product-form-btn-text');
    const spinner = document.getElementById('product-form-spinner');
    const feedbackElement = document.getElementById('product-form-feedback');

    // Store original button text if element exists
    let originalButtonText = 'Add Product'; // Default fallback text
    if (btnTextElement) {
        originalButtonText = btnTextElement.textContent;
        btnTextElement.textContent = 'Adding...';
    }

    // Disable button and show spinner if elements exist
    if (addUpdateProductBtn) {
        addUpdateProductBtn.disabled = true;
    }

    if (spinner) {
        spinner.classList.remove('d-none');
    }

    // Clear previous feedback if element exists
    if (feedbackElement) {
        feedbackElement.innerHTML = '';
    }

    console.log('Sending product creation request with FormData');

    fetch('/api/products', {
        method: 'POST',
        // Don't set Content-Type header when sending FormData
        // The browser will set it automatically with the correct boundary
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            // If the response is not OK, parse the JSON error message
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Error creating product');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Product created successfully:', data);

        // Show success message in the feedback element
        const feedbackElement = document.getElementById('product-form-feedback');
        feedbackElement.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show">
                <strong>Success!</strong> Product "${data.name}" added successfully.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            const alert = feedbackElement.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => {
                    feedbackElement.innerHTML = '';
                }, 150);
            }
        }, 3000);

        fetchProducts(); // Refresh the product list
        productForm.reset(); // Clear form fields

        // Hide image preview
        if (imagePreviewContainer) {
            imagePreviewContainer.classList.add('d-none');
        }
    })
    .catch(error => {
        console.error('Error creating product:', error);

        // Show error message in the feedback element
        const feedbackElement = document.getElementById('product-form-feedback');
        feedbackElement.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show">
                <strong>Error!</strong> ${error.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = feedbackElement.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => {
                    feedbackElement.innerHTML = '';
                }, 150);
            }
        }, 5000);
    })
    .finally(() => {
        // Reset button state
        const btnTextElement = document.getElementById('product-form-btn-text');
        const spinner = document.getElementById('product-form-spinner');

        // Reset text if element exists
        if (btnTextElement) {
            btnTextElement.textContent = originalButtonText;
        }

        // Enable button if it exists
        if (addUpdateProductBtn) {
            addUpdateProductBtn.disabled = false;
        }

        // Hide spinner if it exists
        if (spinner) {
            spinner.classList.add('d-none');
        }
    });
}

// Update an existing product
function updateProduct(id, formData) {
    // Show loading state
    const btnTextElement = document.getElementById('product-form-btn-text');
    const spinner = document.getElementById('product-form-spinner');
    const feedbackElement = document.getElementById('product-form-feedback');

    // Store original button text if element exists
    let originalButtonText = 'Update Product'; // Default fallback text
    if (btnTextElement) {
        originalButtonText = btnTextElement.textContent;
        btnTextElement.textContent = 'Updating...';
    }

    // Disable button and show spinner if elements exist
    if (addUpdateProductBtn) {
        addUpdateProductBtn.disabled = true;
    }

    if (spinner) {
        spinner.classList.remove('d-none');
    }

    // Clear previous feedback if element exists
    if (feedbackElement) {
        feedbackElement.innerHTML = '';
    }

    console.log('Sending product update request with FormData for ID:', id);

    fetch(`/api/products/${id}`, {
        method: 'PUT',
        // Don't set Content-Type header when sending FormData
        // The browser will set it automatically with the correct boundary
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            // If the response is not OK, parse the JSON error message
            return response.json().then(errorData => {
                throw new Error(errorData.error || 'Error updating product');
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Product updated successfully:', data);

        // Show success message in the feedback element
        if (feedbackElement) {
            feedbackElement.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show">
                    <strong>Success!</strong> Product "${data.name}" updated successfully.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }

        fetchProducts(); // Refresh the product list

        if (productForm) {
            productForm.reset(); // Clear form fields
        }

        // Hide image preview
        if (imagePreviewContainer) {
            imagePreviewContainer.classList.add('d-none');
        }
    })
    .catch(error => {
        console.error('Error updating product:', error);

        // Show error message in the feedback element
        if (feedbackElement) {
            feedbackElement.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show">
                    <strong>Error!</strong> ${error.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    })
    .finally(() => {
        // Reset button state
        if (btnTextElement) {
            btnTextElement.textContent = originalButtonText;
        }

        if (addUpdateProductBtn) {
            addUpdateProductBtn.disabled = false;
        }

        if (spinner) {
            spinner.classList.add('d-none');
        }
    });
}

// Delete a product
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        fetch(`/api/products/${id}`, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => {
                fetchProducts(); // Refresh the product list
                if (editingProductId === id) {
                    cancelEdit();
                }
            })
            .catch(error => console.error('Error deleting product:', error));
    }
}

// Save an invoice
function saveInvoice(invoice) {
    fetch('/api/invoices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
    })
        .then(response => response.json())
        .then(data => {
            alert('Invoice saved successfully!');
            clearInvoice();

            // Refresh history tabs if we're on the history page
            if (window.location.pathname === '/history') {
                refreshAllHistoryTabs();
            }

            // If we're not on the history page, we should still refresh the data
            // so it's up-to-date when the user navigates to the history page
            else {
                // Make a background request to refresh the data
                fetch('/api/invoices/history/year').catch(err => console.log('Background refresh error:', err));
                fetch('/api/invoices/history/month').catch(err => console.log('Background refresh error:', err));
                fetch('/api/invoices/history/week').catch(err => console.log('Background refresh error:', err));
                fetch('/api/invoices/history/day').catch(err => console.log('Background refresh error:', err));
                fetch('/api/invoices/stats/most-ordered').catch(err => console.log('Background refresh error:', err));
            }
        })
        .catch(error => {
            console.error('Error saving invoice:', error);
            alert('Error saving invoice. Please try again.');
        });
}

// --- Product Management ---

function renderProductList() {
    // Check if required elements exist
    if (!productListTbody) {
        console.warn('Product list tbody element not found');
        return; // Exit if product list tbody is missing
    }

    console.log('Rendering product list with', products.length, 'products');
    productListTbody.innerHTML = ''; // Clear existing list

    // Only call populateProductDropdown if productSelect exists
    if (productSelect) {
        populateProductDropdown(); // Update dropdown whenever product list changes
    }

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings ? appSettings.currency_symbol : '₹';
    // Check if product images are enabled
    const imagesEnabled = appSettings && appSettings.product_images_enabled;

    // Show a message if no products exist
    if (products.length === 0) {
        const row = productListTbody.insertRow();
        const colSpan = imagesEnabled ? 4 : 3;
        row.innerHTML = `
            <td colspan="${colSpan}" class="text-center py-4">
                <div class="text-muted">
                    <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                    <p class="mt-2">No products added yet.</p>
                    <p>Add your first product using the form above.</p>
                </div>
            </td>
        `;
        return;
    }

    products.forEach(product => {
        const row = productListTbody.insertRow();

        // Build row HTML based on whether images are enabled
        let rowHTML = '';

        // Add image cell if enabled
        if (imagesEnabled) {
            const imageSrc = product.image_path ? product.image_path : '/img/no-image.svg';
            rowHTML += `
                <td>
                    <img src="${imageSrc}" alt="${product.name}" class="img-thumbnail"
                         style="max-height: 50px; max-width: 50px; object-fit: contain;"
                         onerror="this.onerror=null; this.src='/img/no-image.svg';">
                </td>
            `;
        }

        // Add name, price and action cells
        rowHTML += `
            <td>${product.name}</td>
            <td class="text-end">${currencySymbol}${parseFloat(product.price).toFixed(2)}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-product" data-id="${product.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-product" data-id="${product.id}">Delete</button>
            </td>
        `;

        row.innerHTML = rowHTML;
    });

    // Add event listeners to the new buttons
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', () => startEditProduct(button.dataset.id));
    });

    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', () => deleteProduct(button.dataset.id));
    });
}

function handleProductFormSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    try {
        // Remove any existing alert messages
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Check if required elements exist
        if (!productNameInput || !productPriceInput) {
            console.error('Required form elements not found');
            return;
        }

        const name = productNameInput.value.trim();
        const price = parseFloat(productPriceInput.value);
        const idToEdit = editProductIdInput ? editProductIdInput.value : '';

        // Validate inputs
        let errors = [];

        if (!name) {
            errors.push('Product name is required');
            productNameInput.classList.add('is-invalid');
        } else {
            productNameInput.classList.remove('is-invalid');
        }

        if (isNaN(price) || price < 0) {
            errors.push('Price must be a positive number');
            productPriceInput.classList.add('is-invalid');
        } else {
            productPriceInput.classList.remove('is-invalid');
        }

        // Check if there are validation errors
        if (errors.length > 0) {
            // Create error alert
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger mt-3';
            alertDiv.innerHTML = `
                <strong>Please fix the following errors:</strong>
                <ul class="mb-0 mt-1">
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            productForm.insertAdjacentElement('afterend', alertDiv);
            return;
        }

        console.log('Submitting product form with name:', name, 'price:', price);

        // Check if we have an image file
        let hasImageFile = false;
        if (productImageInput && productImageInput.files && productImageInput.files.length > 0) {
            const file = productImageInput.files[0];
            console.log('Image file selected:', file.name, 'size:', file.size, 'type:', file.type);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                console.error('Invalid file type:', file.type);

                // Create error alert if productForm exists
                if (productForm) {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-danger mt-3';
                    alertDiv.textContent = 'Please select a valid image file (JPEG, PNG, GIF, etc.)';
                    productForm.insertAdjacentElement('afterend', alertDiv);
                }
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                console.error('File too large:', file.size);

                // Create error alert if productForm exists
                if (productForm) {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-danger mt-3';
                    alertDiv.textContent = 'Image file is too large. Maximum size is 5MB.';
                    productForm.insertAdjacentElement('afterend', alertDiv);
                }
                return;
            }

            hasImageFile = true;
        } else {
            console.log('No image file selected');
        }

        // Create FormData object for file upload
        const formData = new FormData();

        // Add form fields to FormData
        formData.append('name', name);
        formData.append('price', price);

        // Add file if one is selected
        if (hasImageFile) {
            formData.append('product_image', productImageInput.files[0]);
        }

        // Log all form data
        console.log('Form data:');
        for (let [key, value] of formData.entries()) {
            console.log(key + ':', value instanceof File ? `File: ${value.name}` : value);
        }

        if (idToEdit) {
            // Update existing product
            updateProduct(idToEdit, formData);
            cancelEdit(); // Reset form after update
        } else {
            // Add new product
            createProduct(formData);
        }
    } catch (error) {
        console.error('Error in form submission:', error);
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger mt-3';
        alertDiv.textContent = 'An unexpected error occurred: ' + error.message;
        productForm.insertAdjacentElement('afterend', alertDiv);
    }

    // Don't reset form here as it will be reset after the API call completes
}

function startEditProduct(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;

    editingProductId = id;
    editProductIdInput.value = id; // Store ID in hidden field
    productNameInput.value = product.name;
    productPriceInput.value = product.price;

    // Handle product image if enabled
    if (appSettings && appSettings.product_images_enabled) {
        // Clear any existing file input value (this doesn't work in all browsers)
        if (productImageInput) {
            productImageInput.value = '';
        }

        // Show image preview if product has an image
        if (imagePreviewContainer && imagePreview) {
            if (product.image_path) {
                imagePreview.src = product.image_path;
                imagePreviewContainer.classList.remove('d-none');
            } else {
                imagePreview.src = '/img/no-image.svg';
                imagePreviewContainer.classList.add('d-none');
            }
        }
    }

    addUpdateProductBtn.textContent = 'Update Product';
    addUpdateProductBtn.classList.remove('btn-success');
    addUpdateProductBtn.classList.add('btn-warning');
    cancelEditBtn.classList.remove('d-none'); // Show cancel button
    productNameInput.focus(); // Focus on name field
}

function cancelEdit() {
    editingProductId = null;
    editProductIdInput.value = '';
    productForm.reset();

    // Hide image preview
    if (imagePreviewContainer) {
        imagePreviewContainer.classList.add('d-none');
    }

    addUpdateProductBtn.textContent = 'Add Product';
    addUpdateProductBtn.classList.remove('btn-warning');
    addUpdateProductBtn.classList.add('btn-success');
    cancelEditBtn.classList.add('d-none');
}

function populateProductDropdown() {
    // Check if productSelect exists
    if (!productSelect) {
        return; // Exit if product select is missing
    }

    // Save current selection if possible
    const currentSelection = productSelect.value;
    productSelect.innerHTML = '<option value="">-- Select Product --</option>'; // Clear existing options

    // Sort products alphabetically
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings ? appSettings.currency_symbol : '₹';
    // Check if product images are enabled
    const imagesEnabled = appSettings && appSettings.product_images_enabled;

    sortedProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - ${currencySymbol}${parseFloat(product.price).toFixed(2)}`;

        // Add data attribute for image path if available and enabled
        if (imagesEnabled && product.image_path) {
            option.setAttribute('data-image', product.image_path);
        }

        productSelect.appendChild(option);
    });

    // Try to restore selection
    if (currentSelection && products.some(p => p.id == currentSelection)) {
        productSelect.value = currentSelection;
    }
}

// --- Invoice Management ---

function addInvoiceItem() {
    const productId = productSelect.value;
    const quantity = parseInt(quantityInput.value);

    if (!productId || isNaN(quantity) || quantity <= 0) {
        alert('Please select a product and enter a valid quantity.');
        return;
    }

    const product = products.find(p => p.id == productId);
    if (!product) {
        alert('Selected product not found.');
        return;
    }

    // Check if item already exists, if so, update quantity
    const existingItemIndex = invoiceItems.findIndex(item => item.product_id == productId);
    if (existingItemIndex > -1) {
        invoiceItems[existingItemIndex].quantity += quantity;
        invoiceItems[existingItemIndex].total = invoiceItems[existingItemIndex].quantity * invoiceItems[existingItemIndex].price;
    } else {
        const newItem = {
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            quantity: quantity,
            total: product.price * quantity
        };
        invoiceItems.push(newItem);
    }

    renderInvoiceItems();
    // Reset selection after adding
    productSelect.value = '';
    quantityInput.value = 1;
}

function removeInvoiceItem(index) {
    invoiceItems.splice(index, 1);
    renderInvoiceItems();
}

function renderInvoiceItems() {
    invoiceItemsTbody.innerHTML = ''; // Clear existing items

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings ? appSettings.currency_symbol : '₹';

    invoiceItems.forEach((item, index) => {
        const row = invoiceItemsTbody.insertRow();
        row.innerHTML = `
            <td>${item.product_name}</td>
            <td class="text-end">${currencySymbol}${parseFloat(item.price).toFixed(2)}</td>
            <td class="text-end">${item.quantity}</td>
            <td class="text-end">${currencySymbol}${parseFloat(item.total).toFixed(2)}</td>
            <td class="action-buttons">
                <button class="btn btn-danger btn-sm remove-item" data-index="${index}">Remove</button>
            </td>
        `;
    });

    // Add event listeners to the new buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', () => removeInvoiceItem(button.dataset.index));
    });

    updateTotals();
    updateInvoiceDetails(); // Update header info too
}

// Update all currency symbols on the page
function updateCurrencySymbols() {
    // Check if appSettings exists
    if (!appSettings) {
        return; // Exit if settings are not loaded yet
    }

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings.currency_symbol || '₹';

    // Update all currency symbols in the UI
    const currencyElements = document.querySelectorAll('.currency-symbol');
    if (currencyElements.length > 0) {
        currencyElements.forEach(el => {
            el.textContent = currencySymbol;
        });
    }
}

// Update company information for printing and home page
function updateCompanyInfo() {
    // Check if appSettings exists
    if (!appSettings) {
        return; // Exit if settings are not loaded yet
    }

    // Default values
    const defaultCompanyName = 'Your Company Name';
    const defaultAddress = 'Your Company Address';
    const defaultPhone = 'N/A';
    const defaultEmail = 'N/A';

    // Company name and details for printing
    const companyName = appSettings.company_name || defaultCompanyName;
    const companyAddress = appSettings.company_address || defaultAddress;
    const companyPhone = appSettings.company_phone || defaultPhone;
    const companyEmail = appSettings.company_email || defaultEmail;

    // Update company information elements for printing if they exist
    if (companyNameElement) companyNameElement.textContent = companyName;
    if (companyAddressElement) companyAddressElement.textContent = companyAddress;
    if (companyPhoneElement) companyPhoneElement.textContent = companyPhone;
    if (companyEmailElement) companyEmailElement.textContent = companyEmail;

    // Update home page title and details if elements exist
    if (homeCompanyNameElement) {
        // If company name is set, use it as the main title
        if (appSettings.company_name && appSettings.company_name.trim() !== '') {
            homeCompanyNameElement.textContent = companyName;

            // Create a formatted details string with address, phone, and email
            let detailsText = '';

            if (appSettings.company_address && appSettings.company_address.trim() !== '') {
                detailsText += companyAddress;
            }

            if (appSettings.company_phone && appSettings.company_phone.trim() !== '') {
                if (detailsText) detailsText += ' | ';
                detailsText += 'Phone: ' + companyPhone;
            }

            if (appSettings.company_email && appSettings.company_email.trim() !== '') {
                if (detailsText) detailsText += ' | ';
                detailsText += 'Email: ' + companyEmail;
            }

            // If no details are available, show a default message
            if (!detailsText) {
                detailsText = 'Create and manage invoices with ease';
            }

            // Only update if the element exists
            if (homeCompanyDetailsElement) {
                homeCompanyDetailsElement.textContent = detailsText;
            }
        } else {
            // If no company name is set, use default title and subtitle
            homeCompanyNameElement.textContent = 'Billing & Invoicing Application';

            // Only update if the element exists
            if (homeCompanyDetailsElement) {
                homeCompanyDetailsElement.textContent = 'Create and manage invoices with ease';
            }
        }
    }
}

function updateTotals() {
    // Check if required elements exist
    if (!subtotalSpan || !taxRateInput || !taxAmountSpan || !grandTotalSpan || !taxRateDisplay) {
        return; // Exit if any required element is missing
    }

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(taxRateInput.value) || 0; // Get tax rate from input, default to 0
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    subtotalSpan.textContent = subtotal.toFixed(2);
    taxRateDisplay.textContent = taxRate.toFixed(1); // Display entered tax rate
    taxAmountSpan.textContent = taxAmount.toFixed(2);
    grandTotalSpan.textContent = grandTotal.toFixed(2);

    // Update currency symbols
    updateCurrencySymbols();
}

function updateInvoiceDetails() {
    // Check if required elements exist
    if (!customerNameInput || !displayCustomerName || !displayInvoiceDate || !displayInvoiceNumber) {
        return; // Exit if any required element is missing
    }

    const customerName = customerNameInput.value.trim();
    displayCustomerName.textContent = customerName ? customerName : 'N/A';

    // Simple Date and Invoice Number
    const now = new Date();

    // Format date based on settings if available
    if (appSettings && appSettings.date_format) {
        // Simple date formatting based on the selected format
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();

        let formattedDate = '';
        switch(appSettings.date_format) {
            case 'DD/MM/YYYY':
                formattedDate = `${day}/${month}/${year}`;
                break;
            case 'MM/DD/YYYY':
                formattedDate = `${month}/${day}/${year}`;
                break;
            case 'YYYY-MM-DD':
                formattedDate = `${year}-${month}-${day}`;
                break;
            default:
                formattedDate = now.toLocaleDateString();
        }
        displayInvoiceDate.textContent = formattedDate;
    } else {
        displayInvoiceDate.textContent = now.toLocaleDateString();
    }

    // Add time to the invoice
    const displayInvoiceTime = document.getElementById('display-invoice-time');
    if (displayInvoiceTime) {
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        displayInvoiceTime.textContent = `${hours}:${minutes}`;
    }

    // Get the next invoice number from the API
    fetch('/api/invoices/next-number')
        .then(response => response.json())
        .then(data => {
            if (data && data.nextInvoiceNumber) {
                displayInvoiceNumber.textContent = data.nextInvoiceNumber;
            } else {
                // Fallback to the original format if API fails
                const prefix = appSettings ? appSettings.invoice_prefix || 'INV-' : 'INV-';
                const startingNumber = appSettings ? appSettings.invoice_starting_number || 1000 : 1000;
                displayInvoiceNumber.textContent = `${prefix}${startingNumber}`;
            }
        })
        .catch(error => {
            console.error('Error fetching next invoice number:', error);
            // Fallback to the original format
            displayInvoiceNumber.textContent = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        });
}

function clearInvoice() {
    if (invoiceItems.length === 0 || confirm('Are you sure you want to clear the current invoice?')) {
        invoiceItems = [];
        customerNameInput.value = '';
        renderInvoiceItems(); // This will also update totals and details
    }
}

function printInvoice() {
    console.log('Print invoice button clicked');
    // Check if there are items in the invoice
    if (invoiceItems.length === 0) {
        alert('Cannot print an empty invoice. Please add items first.');
        return;
    }

    // Ensure details are up-to-date
    updateInvoiceDetails();

    // First save the invoice to history
    const subtotal = parseFloat(subtotalSpan.textContent);
    const taxRate = parseFloat(taxRateInput.value) || 0;
    const taxAmount = parseFloat(taxAmountSpan.textContent);
    const grandTotal = parseFloat(grandTotalSpan.textContent);
    const customerName = customerNameInput.value.trim();
    const invoiceDate = displayInvoiceDate.textContent;
    const invoiceNumber = displayInvoiceNumber.textContent;

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings ? appSettings.currency_symbol : '₹';

    const invoice = {
        customer_name: customerName || 'N/A',
        invoice_date: invoiceDate,
        invoice_number: invoiceNumber,
        tax_rate: taxRate,
        subtotal: subtotal,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        currency_symbol: currencySymbol,
        items: invoiceItems
    };

    console.log('Saving invoice:', invoice);

    // Save the invoice and then print it
    fetch('/api/invoices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Invoice saved successfully:', data);

        // Now create a new window for receipt-style printing
        const printWindow = window.open('', '_blank');
        console.log('Print window opened');

        // Get company info
        const companyName = appSettings && appSettings.company_name ? appSettings.company_name : 'Invoice App';
        const companyAddress = appSettings && appSettings.company_address ? appSettings.company_address : '';
        const companyPhone = appSettings && appSettings.company_phone ? appSettings.company_phone : '';

        // Get invoice time
        const invoiceTime = document.getElementById('display-invoice-time').textContent;

        // Get totals for display
        const subtotalDisplay = document.getElementById('subtotal').textContent;
        const taxRateDisplay = document.getElementById('tax-rate-display').textContent;
        const taxAmountDisplay = document.getElementById('tax-amount').textContent;
        const grandTotalDisplay = document.getElementById('grand-total').textContent;

        // Create receipt HTML
        let receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt ${invoiceNumber}</title>
            <style>
                @page {
                    size: 80mm 297mm; /* Standard thermal receipt width */
                    margin: 5mm;
                }
                body {
                    font-family: 'Courier New', monospace;
                    width: 70mm;
                    margin: 0 auto;
                    font-size: 9pt;
                    line-height: 1.2;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 8pt;
                }
                th, td {
                    padding: 2px;
                    text-align: left;
                    border-bottom: 1px dotted #ccc;
                }
                .header {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .header h2 {
                    font-size: 12pt;
                    margin: 0 0 5px 0;
                }
                .header p {
                    margin: 2px 0;
                    font-size: 8pt;
                }
                .details {
                    margin-bottom: 10px;
                    font-size: 8pt;
                }
                .totals {
                    margin-top: 10px;
                    text-align: right;
                    border-top: 1px solid #000;
                    padding-top: 5px;
                }
                .totals p {
                    margin: 2px 0;
                }
                .watermark {
                    margin-top: 10px;
                    text-align: center;
                    font-size: 7pt;
                    color: #888;
                }
                .qty { text-align: center; }
                .price, .total { text-align: right; }
            </style>
        </head>
        <body class="receipt-mode">
            <div class="header">
                <h2>${companyName}</h2>
                ${companyAddress ? `<p>${companyAddress}</p>` : ''}
                ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ''}
                <p>--------------------------------</p>
            </div>

            <div class="details">
                <p><strong>Receipt:</strong> ${invoiceNumber}</p>
                <p><strong>Date:</strong> ${invoiceDate} ${invoiceTime}</p>
                <p><strong>Customer:</strong> ${customerName || 'N/A'}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="qty">Qty</th>
                        <th class="price">Price</th>
                        <th class="total">Total</th>
                    </tr>
                </thead>
                <tbody>
    `;

        // Add invoice items
        invoiceItems.forEach(item => {
            receiptHtml += `
            <tr>
                <td>${item.product_name}</td>
                <td class="qty">${item.quantity}</td>
                <td class="price">${currencySymbol}${item.price.toFixed(2)}</td>
                <td class="total">${currencySymbol}${item.total.toFixed(2)}</td>
            </tr>
            `;
        });

        // Add totals and footer
        receiptHtml += `
                </tbody>
            </table>

            <div class="totals">
                <p>Subtotal: ${currencySymbol}${subtotalDisplay}</p>
                <p>Tax (${taxRateDisplay}%): ${currencySymbol}${taxAmountDisplay}</p>
                <p><strong>Grand Total: ${currencySymbol}${grandTotalDisplay}</strong></p>
            </div>

            <div class="watermark">
                Invoice App © 2023 | All Rights Reserved | Powered by Bat Inc
            </div>
        </body>
        </html>
    `;

        // Write to the new window and print
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.onload = function() {
            printWindow.print();
            printWindow.onafterprint = function() {
                printWindow.close();

                // Clear the invoice after printing and saving
                clearInvoice();

                // Refresh history tabs if we're on the history page
                if (window.location.pathname === '/history') {
                    refreshAllHistoryTabs();
                }
            };
        };
    })
    .catch(error => {
        console.error('Error saving invoice:', error);
        alert('Error saving invoice. Please try again.');
    });

    console.log('Print invoice function completed');
}

function handleSaveInvoice() {
    if (invoiceItems.length === 0) {
        alert('Cannot save an empty invoice. Please add items first.');
        return;
    }

    const subtotal = parseFloat(subtotalSpan.textContent);
    const taxRate = parseFloat(taxRateInput.value) || 0;
    const taxAmount = parseFloat(taxAmountSpan.textContent);
    const grandTotal = parseFloat(grandTotalSpan.textContent);
    const customerName = customerNameInput.value.trim();
    const invoiceDate = displayInvoiceDate.textContent;
    const invoiceNumber = displayInvoiceNumber.textContent;

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings ? appSettings.currency_symbol : '₹';

    const invoice = {
        customer_name: customerName || 'N/A',
        invoice_date: invoiceDate,
        invoice_number: invoiceNumber,
        tax_rate: taxRate,
        subtotal: subtotal,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        currency_symbol: currencySymbol,
        items: invoiceItems
    };

    saveInvoice(invoice);
}

// --- Image Preview Functions ---
function handleImagePreview() {
    if (!productImageInput || !imagePreviewContainer || !imagePreview) {
        console.warn('Image preview elements not found');
        return;
    }

    console.log('Initializing image preview functionality');

    // Show preview when a file is selected
    productImageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            console.log('File selected for preview:', file.name, 'size:', file.size, 'type:', file.type);

            // Validate file type
            if (!file.type.startsWith('image/')) {
                console.warn('Invalid file type selected:', file.type);
                alert('Please select a valid image file (JPEG, PNG, GIF, etc.)');
                this.value = ''; // Clear the file input
                imagePreviewContainer.classList.add('d-none');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                console.warn('File too large:', file.size, 'bytes');
                alert('Image file is too large. Maximum size is 5MB.');
                this.value = ''; // Clear the file input
                imagePreviewContainer.classList.add('d-none');
                return;
            }

            const reader = new FileReader();

            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove('d-none');
                console.log('Image preview displayed');
            };

            reader.onerror = function(e) {
                console.error('Error reading file:', e);
                alert('Error reading the image file. Please try another file.');
                imagePreviewContainer.classList.add('d-none');
            };

            reader.readAsDataURL(file);
        } else {
            imagePreviewContainer.classList.add('d-none');
            console.log('No file selected, hiding preview');
        }
    });

    // Handle remove image button
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            console.log('Remove image button clicked');
            productImageInput.value = ''; // Clear the file input
            imagePreviewContainer.classList.add('d-none');

            // If editing a product, set a flag to remove the image
            if (editingProductId) {
                console.log('Setting remove_image flag for product ID:', editingProductId);
                // Remove any existing remove_image flags first
                const existingFlags = productForm.querySelectorAll('input[name="remove_image"]');
                existingFlags.forEach(flag => flag.remove());

                // Add a hidden input to indicate image removal
                const removeImageFlag = document.createElement('input');
                removeImageFlag.type = 'hidden';
                removeImageFlag.name = 'remove_image';
                removeImageFlag.value = '1';
                productForm.appendChild(removeImageFlag);
            }
        });
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Fetch settings first
    fetchSettings();

    // Check if we're on the home page (invoice creation page)
    const isHomePage = document.getElementById('invoice-creation') !== null;
    // Check if we're on the history page
    const isHistoryPage = window.location.pathname === '/history';

    if (isHomePage) {
        // Only run these functions on the home page
        fetchProducts();

        // Only call updateInvoiceDetails if the required elements exist
        if (displayInvoiceDate && displayInvoiceNumber) {
            updateInvoiceDetails(); // Set initial date/invoice#
        }

        // Attach Event Listeners - only if elements exist
        if (productForm) {
            productForm.addEventListener('submit', handleProductFormSubmit);
        }

        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', cancelEdit);
        }

        if (addInvoiceItemBtn) {
            addInvoiceItemBtn.addEventListener('click', addInvoiceItem);
        }

        if (printButton) {
            printButton.addEventListener('click', printInvoice);
        }

        if (clearInvoiceBtn) {
            clearInvoiceBtn.addEventListener('click', clearInvoice);
        }

        // Save invoice button removed - now automatically saves when printing

        if (customerNameInput) {
            customerNameInput.addEventListener('input', updateInvoiceDetails);
        }

        if (taxRateInput) {
            taxRateInput.addEventListener('input', updateTotals);
        }

        // Initialize image preview functionality
        handleImagePreview();
    }

    // Initialize history page if we're on it
    if (isHistoryPage) {
        // Initialize invoice history and most ordered products
        initializeHistoryTabs();
        loadMostOrderedProducts();

        // Initialize search and filters
        initializeSearchAndFilters();

        // Initialize export buttons
        initializeExportButtons();

        // Initialize all invoices tab
        initializeAllInvoicesTab();

        // Initialize product search
        initializeProductSearch();
    }

    console.log("Invoice App Initialized.");
});

// --- Invoice History Functions ---

// Initialize history tabs
function initializeHistoryTabs() {
    // Load data for the active tab on page load
    loadYearlyHistory();

    // Add event listeners for tab changes
    document.getElementById('yearly-tab').addEventListener('click', loadYearlyHistory);
    document.getElementById('monthly-tab').addEventListener('click', loadMonthlyHistory);
    document.getElementById('weekly-tab').addEventListener('click', loadWeeklyHistory);
    document.getElementById('daily-tab').addEventListener('click', loadDailyHistory);
}

// Load yearly invoice history
function loadYearlyHistory() {
    if (!yearlyHistoryTbody) return;

    yearlyHistoryTbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    fetch('/api/invoices/history/year')
        .then(response => response.json())
        .then(data => {
            renderHistoryTable(yearlyHistoryTbody, data, 'year');
        })
        .catch(error => {
            console.error('Error loading yearly history:', error);
            yearlyHistoryTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
        });
}

// Load monthly invoice history
function loadMonthlyHistory() {
    if (!monthlyHistoryTbody) return;

    monthlyHistoryTbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    fetch('/api/invoices/history/month')
        .then(response => response.json())
        .then(data => {
            renderHistoryTable(monthlyHistoryTbody, data, 'month');
        })
        .catch(error => {
            console.error('Error loading monthly history:', error);
            monthlyHistoryTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
        });
}

// Load weekly invoice history
function loadWeeklyHistory() {
    if (!weeklyHistoryTbody) return;

    weeklyHistoryTbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    fetch('/api/invoices/history/week')
        .then(response => response.json())
        .then(data => {
            renderHistoryTable(weeklyHistoryTbody, data, 'week');
        })
        .catch(error => {
            console.error('Error loading weekly history:', error);
            weeklyHistoryTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
        });
}

// Load daily invoice history
function loadDailyHistory() {
    if (!dailyHistoryTbody) return;

    dailyHistoryTbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    fetch('/api/invoices/history/day')
        .then(response => response.json())
        .then(data => {
            renderHistoryTable(dailyHistoryTbody, data, 'day');
        })
        .catch(error => {
            console.error('Error loading daily history:', error);
            dailyHistoryTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
        });
}

// Render history table
function renderHistoryTable(tableBody, data, periodType) {
    if (!tableBody) return;

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings ? appSettings.currency_symbol : '₹';

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No invoices found</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';

    data.forEach(period => {
        const row = tableBody.insertRow();

        // Format the period label based on type
        let periodLabel = period[periodType];
        if (periodType === 'month') {
            // Format YYYY-MM to MMM YYYY
            const [year, month] = periodLabel.split('-');
            const date = new Date(year, parseInt(month) - 1, 1);
            periodLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (periodType === 'week') {
            // Format week with start date
            periodLabel = `Week ${period.week.split('-')[1]} (${formatDate(period.week_start)})`;
        } else if (periodType === 'day') {
            // Format date
            periodLabel = formatDate(period.day);
        }

        row.innerHTML = `
            <td>${periodLabel}</td>
            <td>${period.count}</td>
            <td>${currencySymbol}${parseFloat(period.total).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-primary view-period" data-period="${periodType}" data-value="${period[periodType]}">View</button>
            </td>
        `;
    });

    // Add event listeners to view buttons
    tableBody.querySelectorAll('.view-period').forEach(button => {
        button.addEventListener('click', () => {
            const period = button.dataset.period;
            const value = button.dataset.value;
            loadPeriodInvoices(period, value);
        });
    });
}

// Load invoices for a specific period
function loadPeriodInvoices(period, value) {
    fetch(`/api/invoices/history/${period}/${value}`)
        .then(response => response.json())
        .then(invoices => {
            showInvoiceListModal(invoices, period, value);
        })
        .catch(error => {
            console.error(`Error loading invoices for ${period} ${value}:`, error);
            alert('Error loading invoices. Please try again.');
        });
}

// Show modal with invoice list for a period
function showInvoiceListModal(invoices, period, value) {
    if (!invoiceDetailModal || !invoiceDetailContent) return;

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings ? appSettings.currency_symbol : '₹';

    // Format period title
    let periodTitle = value;
    if (period === 'month') {
        // Format YYYY-MM to MMM YYYY
        const [year, month] = value.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        periodTitle = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (period === 'week') {
        // Find the week in the data to get the start date
        periodTitle = `Week ${value.split('-')[1]}, ${value.split('-')[0]}`;
    } else if (period === 'day') {
        // Format date
        periodTitle = formatDate(value);
    }

    // Update modal title
    document.getElementById('invoiceDetailModalLabel').textContent = `Invoices for ${periodTitle}`;

    // Create invoice list HTML
    let html = '';

    if (invoices.length === 0) {
        html = '<div class="alert alert-info">No invoices found for this period.</div>';
    } else {
        html = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        invoices.forEach(invoice => {
            html += `
                <tr>
                    <td>${invoice.invoice_number}</td>
                    <td>${formatDate(invoice.invoice_date)}</td>
                    <td>${invoice.customer_name || 'N/A'}</td>
                    <td>${currencySymbol}${parseFloat(invoice.grand_total).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-info view-invoice" data-id="${invoice.id}">View</button>
                        <button class="btn btn-sm btn-danger delete-invoice" data-id="${invoice.id}">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
    }

    // Set modal content
    invoiceDetailContent.innerHTML = html;

    // Add event listeners to view and delete buttons
    invoiceDetailContent.querySelectorAll('.view-invoice').forEach(button => {
        button.addEventListener('click', () => {
            const invoiceId = button.dataset.id;
            loadInvoiceDetails(invoiceId);
        });
    });

    invoiceDetailContent.querySelectorAll('.delete-invoice').forEach(button => {
        button.addEventListener('click', () => {
            const invoiceId = button.dataset.id;
            if (confirm('Are you sure you want to delete this invoice?')) {
                deleteInvoice(invoiceId, () => {
                    // Reload the current view after deletion
                    loadPeriodInvoices(period, value);
                    // Also refresh the history tabs
                    refreshAllHistoryTabs();
                });
            }
        });
    });

    // Show the modal
    const modal = new bootstrap.Modal(invoiceDetailModal);
    modal.show();
}

// Load invoice details
function loadInvoiceDetails(invoiceId) {
    fetch(`/api/invoices/${invoiceId}`)
        .then(response => response.json())
        .then(invoice => {
            showInvoiceDetailModal(invoice);
        })
        .catch(error => {
            console.error(`Error loading invoice ${invoiceId}:`, error);
            alert('Error loading invoice details. Please try again.');
        });
}

// Show modal with invoice details
function showInvoiceDetailModal(invoice) {
    if (!invoiceDetailModal || !invoiceDetailContent) return;

    // Store current invoice for printing
    currentInvoiceDetails = invoice;

    // Get currency symbol from settings or use default
    const currencySymbol = invoice.currency_symbol || (appSettings ? appSettings.currency_symbol : '₹');

    // Update modal title
    document.getElementById('invoiceDetailModalLabel').textContent = `Invoice ${invoice.invoice_number}`;

    // Create invoice detail HTML
    let html = `
        <div class="row mb-3">
            <div class="col-md-4">
                <p><strong>Customer:</strong> ${invoice.customer_name || 'N/A'}</p>
            </div>
            <div class="col-md-4">
                <p><strong>Date:</strong> ${formatDate(invoice.invoice_date)}</p>
            </div>
            <div class="col-md-4">
                <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach(item => {
            html += `
                <tr>
                    <td>${item.product_name}</td>
                    <td>${currencySymbol}${parseFloat(item.price).toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>${currencySymbol}${parseFloat(item.total).toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        html += `<tr><td colspan="4" class="text-center">No items in this invoice</td></tr>`;
    }

    html += `
                </tbody>
            </table>
        </div>

        <div class="row">
            <div class="col-md-6"></div>
            <div class="col-md-6">
                <div class="text-end">
                    <p>Subtotal: ${currencySymbol}${parseFloat(invoice.subtotal).toFixed(2)}</p>
                    <p>Tax (${invoice.tax_rate}%): ${currencySymbol}${parseFloat(invoice.tax_amount).toFixed(2)}</p>
                    <p class="h5">Grand Total: ${currencySymbol}${parseFloat(invoice.grand_total).toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;

    // Set modal content
    invoiceDetailContent.innerHTML = html;

    // Add event listener to print button
    if (printModalInvoiceBtn) {
        printModalInvoiceBtn.onclick = printModalInvoice;
    }
}

// Print invoice from modal
function printModalInvoice() {
    if (!currentInvoiceDetails) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');

    // Get currency symbol
    const currencySymbol = currentInvoiceDetails.currency_symbol || (appSettings ? appSettings.currency_symbol : '₹');

    // Get company info
    const companyName = appSettings && appSettings.company_name ? appSettings.company_name : 'Invoice App';
    const companyAddress = appSettings && appSettings.company_address ? appSettings.company_address : '';
    const companyPhone = appSettings && appSettings.company_phone ? appSettings.company_phone : '';

    // Create receipt HTML
    let printHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt ${currentInvoiceDetails.invoice_number}</title>
            <style>
                @page {
                    size: 80mm 297mm; /* Standard thermal receipt width */
                    margin: 5mm;
                }
                body {
                    font-family: 'Courier New', monospace;
                    width: 70mm;
                    margin: 0 auto;
                    font-size: 9pt;
                    line-height: 1.2;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 8pt;
                }
                th, td {
                    padding: 2px;
                    text-align: left;
                    border-bottom: 1px dotted #ccc;
                }
                .header {
                    text-align: center;
                    margin-bottom: 10px;
                }
                .header h2 {
                    font-size: 12pt;
                    margin: 0 0 5px 0;
                }
                .header p {
                    margin: 2px 0;
                    font-size: 8pt;
                }
                .details {
                    margin-bottom: 10px;
                    font-size: 8pt;
                }
                .totals {
                    margin-top: 10px;
                    text-align: right;
                    border-top: 1px solid #000;
                    padding-top: 5px;
                }
                .totals p {
                    margin: 2px 0;
                }
                .watermark {
                    margin-top: 10px;
                    text-align: center;
                    font-size: 7pt;
                    color: #888;
                }
                .qty { text-align: center; }
                .price, .total { text-align: right; }
            </style>
        </head>
        <body class="receipt-mode">
            <div class="header">
                <h2>${companyName}</h2>
                ${companyAddress ? `<p>${companyAddress}</p>` : ''}
                ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ''}
                <p>--------------------------------</p>
            </div>

            <div class="details">
                <p><strong>Receipt:</strong> ${currentInvoiceDetails.invoice_number}</p>
                <p><strong>Date:</strong> ${formatDate(currentInvoiceDetails.invoice_date)}</p>
                <p><strong>Time:</strong> ${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}</p>
                <p><strong>Customer:</strong> ${currentInvoiceDetails.customer_name || 'N/A'}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="qty">Qty</th>
                        <th class="price">Price</th>
                        <th class="total">Total</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (currentInvoiceDetails.items && currentInvoiceDetails.items.length > 0) {
        currentInvoiceDetails.items.forEach(item => {
            printHtml += `
                <tr>
                    <td>${item.product_name}</td>
                    <td class="qty">${item.quantity}</td>
                    <td class="price">${currencySymbol}${parseFloat(item.price).toFixed(2)}</td>
                    <td class="total">${currencySymbol}${parseFloat(item.total).toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        printHtml += `<tr><td colspan="4" style="text-align: center;">No items</td></tr>`;
    }

    printHtml += `
                </tbody>
            </table>

            <div class="totals">
                <p>Subtotal: ${currencySymbol}${parseFloat(currentInvoiceDetails.subtotal).toFixed(2)}</p>
                <p>Tax (${currentInvoiceDetails.tax_rate}%): ${currencySymbol}${parseFloat(currentInvoiceDetails.tax_amount).toFixed(2)}</p>
                <p><strong>Total: ${currencySymbol}${parseFloat(currentInvoiceDetails.grand_total).toFixed(2)}</strong></p>
            </div>

            <div class="watermark">
                Invoice App © 2023 | All Rights Reserved | Powered by Bat Inc
            </div>
        </body>
        </html>
    `;

    // Write to the new window and print
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    };
}

// Delete an invoice
function deleteInvoice(id, callback) {
    fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
    })
        .then(response => response.json())
        .then(data => {
            if (callback) callback();
        })
        .catch(error => {
            console.error('Error deleting invoice:', error);
            alert('Error deleting invoice. Please try again.');
        });
}

// Refresh all history tabs
function refreshAllHistoryTabs() {
    loadYearlyHistory();
    loadMonthlyHistory();
    loadWeeklyHistory();
    loadDailyHistory();
    loadAllInvoices();
    loadMostOrderedProducts();

}

// --- Most Ordered Products Functions ---

// Load most ordered products
function loadMostOrderedProducts() {
    if (!mostOrderedListTbody) return;

    mostOrderedListTbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    fetch('/api/invoices/stats/most-ordered')
        .then(response => response.json())
        .then(data => {
            renderMostOrderedProducts(data);
        })
        .catch(error => {
            console.error('Error loading most ordered products:', error);
            mostOrderedListTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
        });
}

// Legacy function - now redirects to the new pagination-enabled version
function renderMostOrderedProducts(result) {
    // If result is an array (old format), convert to new format
    if (Array.isArray(result)) {
        result = {
            data: result,
            pagination: {
                total: result.length,
                totalPages: 1,
                currentPage: 1,
                limit: result.length
            }
        };
    }

    // Call the new function
    renderMostOrderedProductsWithPagination(result);
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    // If we have app settings with date format, use it
    if (appSettings && appSettings.date_format) {
        // This is a simple implementation - for a real app, use a proper date library like moment.js
        const date = new Date(dateString);
        const format = appSettings.date_format.toUpperCase();

        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        if (format === 'DD/MM/YYYY') {
            return `${day}/${month}/${year}`;
        } else if (format === 'MM/DD/YYYY') {
            return `${month}/${day}/${year}`;
        } else if (format === 'YYYY-MM-DD') {
            return `${year}-${month}-${day}`;
        }
    }

    // Default format
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// --- Search and Filter Functions ---

// Initialize search and filters
function initializeSearchAndFilters() {
    if (!searchButton || !applyFiltersBtn || !clearFiltersBtn) return;

    // Search button click event
    searchButton.addEventListener('click', () => {
        if (invoiceSearchInput) {
            currentFilters.search = invoiceSearchInput.value.trim();
            invoicePagination.currentPage = 1; // Reset to first page
            loadAllInvoices();
        }
    });

    // Enter key in search input
    if (invoiceSearchInput) {
        invoiceSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentFilters.search = invoiceSearchInput.value.trim();
                invoicePagination.currentPage = 1; // Reset to first page
                loadAllInvoices();
            }
        });
    }

    // Apply filters button click event
    applyFiltersBtn.addEventListener('click', () => {
        // Update filter values
        if (filterCustomerInput) currentFilters.customer = filterCustomerInput.value.trim();
        if (filterProductInput) currentFilters.product = filterProductInput.value.trim();
        if (filterStartDateInput) currentFilters.startDate = filterStartDateInput.value;
        if (filterEndDateInput) currentFilters.endDate = filterEndDateInput.value;

        invoicePagination.currentPage = 1; // Reset to first page
        loadAllInvoices();

        // Switch to All Invoices tab
        const allTab = document.getElementById('all-tab');
        if (allTab) {
            const tabInstance = new bootstrap.Tab(allTab);
            tabInstance.show();
        }
    });

    // Clear filters button click event
    clearFiltersBtn.addEventListener('click', () => {
        // Clear filter inputs
        if (filterCustomerInput) filterCustomerInput.value = '';
        if (filterProductInput) filterProductInput.value = '';
        if (filterStartDateInput) filterStartDateInput.value = '';
        if (filterEndDateInput) filterEndDateInput.value = '';
        if (invoiceSearchInput) invoiceSearchInput.value = '';

        // Reset filter values
        currentFilters = {
            search: '',
            customer: '',
            product: '',
            startDate: '',
            endDate: ''
        };

        invoicePagination.currentPage = 1; // Reset to first page
        loadAllInvoices();
    });
}

// Initialize product search
function initializeProductSearch() {
    if (!productSearchButton || !productSearchInput) return;

    // Search button click event
    productSearchButton.addEventListener('click', () => {
        productPagination.search = productSearchInput.value.trim();
        productPagination.currentPage = 1; // Reset to first page
        loadMostOrderedProducts();
    });

    // Enter key in search input
    productSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            productPagination.search = productSearchInput.value.trim();
            productPagination.currentPage = 1; // Reset to first page
            loadMostOrderedProducts();
        }
    });
}

// --- Export Functions ---

// Initialize export buttons
function initializeExportButtons() {
    if (!exportCsvBtn || !exportExcelBtn) return;

    // Export to CSV button click event
    exportCsvBtn.addEventListener('click', () => {
        exportInvoices('csv');
    });

    // Export to Excel button click event
    exportExcelBtn.addEventListener('click', () => {
        exportInvoices('excel');
    });
}

// Export invoices to CSV or Excel
function exportInvoices(format) {
    // Build query parameters based on current filters and active tab
    const params = new URLSearchParams();

    // Add format
    params.append('format', format);

    // Add filters if any
    if (currentFilters.search) params.append('search', currentFilters.search);
    if (currentFilters.customer) params.append('customer', currentFilters.customer);
    if (currentFilters.product) params.append('product', currentFilters.product);
    if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
    if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);

    // Check if we're in a specific period tab
    const activeTab = document.querySelector('#historyTabs .nav-link.active');
    if (activeTab) {
        const tabId = activeTab.id;

        if (tabId === 'yearly-tab') {
            // Get the selected year if any
            const selectedYear = document.querySelector('#yearly-history .view-period');
            if (selectedYear) {
                params.append('period', 'year');
                params.append('value', selectedYear.dataset.value);
            }
        } else if (tabId === 'monthly-tab') {
            // Get the selected month if any
            const selectedMonth = document.querySelector('#monthly-history .view-period');
            if (selectedMonth) {
                params.append('period', 'month');
                params.append('value', selectedMonth.dataset.value);
            }
        } else if (tabId === 'weekly-tab') {
            // Get the selected week if any
            const selectedWeek = document.querySelector('#weekly-history .view-period');
            if (selectedWeek) {
                params.append('period', 'week');
                params.append('value', selectedWeek.dataset.value);
            }
        } else if (tabId === 'daily-tab') {
            // Get the selected day if any
            const selectedDay = document.querySelector('#daily-history .view-period');
            if (selectedDay) {
                params.append('period', 'day');
                params.append('value', selectedDay.dataset.value);
            }
        }
    }

    if (format === 'csv') {
        // For CSV, directly download the file
        window.location.href = `/api/invoices/export?${params.toString()}`;
    } else {
        // For Excel, fetch the data and use SheetJS to create the file
        fetch(`/api/invoices/export?${params.toString()}`)
            .then(response => response.json())
            .then(result => {
                if (result.success && result.data) {
                    // Create Excel file using SheetJS
                    const worksheet = XLSX.utils.json_to_sheet(result.data);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

                    // Generate Excel file and trigger download
                    XLSX.writeFile(workbook, result.filename || 'invoices.xlsx');
                } else {
                    alert('No data available to export');
                }
            })
            .catch(error => {
                console.error('Error exporting to Excel:', error);
                alert('Error exporting data. Please try again.');
            });
    }
}

// --- All Invoices Tab Functions ---

// Initialize all invoices tab
function initializeAllInvoicesTab() {
    // Add event listener for tab change
    document.getElementById('all-tab').addEventListener('click', loadAllInvoices);
}

// Load all invoices with pagination and filtering
function loadAllInvoices() {
    if (!allInvoicesListTbody) return;

    allInvoicesListTbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', invoicePagination.currentPage);
    params.append('limit', invoicePagination.limit);

    // Add filters if any
    if (currentFilters.search) params.append('search', currentFilters.search);
    if (currentFilters.customer) params.append('customer', currentFilters.customer);
    if (currentFilters.product) params.append('product', currentFilters.product);
    if (currentFilters.startDate) params.append('startDate', currentFilters.startDate);
    if (currentFilters.endDate) params.append('endDate', currentFilters.endDate);

    fetch(`/api/invoices?${params.toString()}`)
        .then(response => response.json())
        .then(result => {
            renderAllInvoices(result);
        })
        .catch(error => {
            console.error('Error loading invoices:', error);
            allInvoicesListTbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading data</td></tr>';
        });
}

// Render all invoices
function renderAllInvoices(result) {
    if (!allInvoicesListTbody || !invoicePaginationInfo || !invoicePaginationElement) return;

    const invoices = result.data || [];
    const pagination = result.pagination || { total: 0, totalPages: 0, currentPage: 1, limit: 10 };

    // Update pagination state
    invoicePagination.currentPage = pagination.currentPage;
    invoicePagination.totalPages = pagination.totalPages;
    invoicePagination.limit = pagination.limit;

    // Get currency symbol from settings or use default
    const currencySymbol = appSettings ? appSettings.currency_symbol : '₹';

    if (invoices.length === 0) {
        allInvoicesListTbody.innerHTML = `<tr><td colspan="5" class="text-center">No invoices found</td></tr>`;
        invoicePaginationInfo.textContent = 'Showing 0 of 0 invoices';
        invoicePaginationElement.innerHTML = '';
        return;
    }

    allInvoicesListTbody.innerHTML = '';

    invoices.forEach(invoice => {
        const row = allInvoicesListTbody.insertRow();
        row.innerHTML = `
            <td>${invoice.invoice_number}</td>
            <td>${formatDate(invoice.invoice_date)}</td>
            <td>${invoice.customer_name || 'N/A'}</td>
            <td>${currencySymbol}${parseFloat(invoice.grand_total).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-info view-invoice" data-id="${invoice.id}">View</button>
                <button class="btn btn-sm btn-danger delete-invoice" data-id="${invoice.id}">Delete</button>
            </td>
        `;
    });

    // Add event listeners to view and delete buttons
    allInvoicesListTbody.querySelectorAll('.view-invoice').forEach(button => {
        button.addEventListener('click', () => {
            const invoiceId = button.dataset.id;
            loadInvoiceDetails(invoiceId);
        });
    });

    allInvoicesListTbody.querySelectorAll('.delete-invoice').forEach(button => {
        button.addEventListener('click', () => {
            const invoiceId = button.dataset.id;
            if (confirm('Are you sure you want to delete this invoice?')) {
                deleteInvoice(invoiceId, () => {
                    // Reload the current view after deletion
                    loadAllInvoices();
                    // Also refresh the history tabs
                    refreshAllHistoryTabs();

                });
            }
        });
    });

    // Update pagination info
    const start = (pagination.currentPage - 1) * pagination.limit + 1;
    const end = Math.min(start + invoices.length - 1, pagination.total);
    invoicePaginationInfo.textContent = `Showing ${start}-${end} of ${pagination.total} invoices`;

    // Render pagination controls
    renderPagination(invoicePaginationElement, pagination, loadAllInvoices);
}

// --- Updated Most Ordered Products Functions ---

// Load most ordered products with pagination and search
function loadMostOrderedProducts() {
    if (!mostOrderedListTbody) return;

    mostOrderedListTbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', productPagination.currentPage);
    params.append('limit', productPagination.limit);
    if (productPagination.search) params.append('search', productPagination.search);

    fetch(`/api/invoices/stats/most-ordered?${params.toString()}`)
        .then(response => response.json())
        .then(result => {
            renderMostOrderedProductsWithPagination(result);
        })
        .catch(error => {
            console.error('Error loading most ordered products:', error);
            mostOrderedListTbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data</td></tr>';
        });
}

// Render most ordered products with pagination
function renderMostOrderedProductsWithPagination(result) {
    if (!mostOrderedListTbody || !productPaginationInfo || !productPaginationElement) return;

    const products = result.data || [];
    const pagination = result.pagination || { total: 0, totalPages: 0, currentPage: 1, limit: 10 };

    // Update pagination state
    productPagination.currentPage = pagination.currentPage;
    productPagination.totalPages = pagination.totalPages;
    productPagination.limit = pagination.limit;

    if (products.length === 0) {
        mostOrderedListTbody.innerHTML = `<tr><td colspan="4" class="text-center">No products ordered yet</td></tr>`;
        productPaginationInfo.textContent = 'Showing 0 of 0 products';
        productPaginationElement.innerHTML = '';
        return;
    }

    mostOrderedListTbody.innerHTML = '';

    products.forEach(product => {
        const row = mostOrderedListTbody.insertRow();
        row.innerHTML = `
            <td>${product.product_name}</td>
            <td>${product.total_quantity}</td>
            <td>${product.invoice_count}</td>
            <td>${formatDate(product.last_ordered)}</td>
        `;
    });

    // Update pagination info
    const start = (pagination.currentPage - 1) * pagination.limit + 1;
    const end = Math.min(start + products.length - 1, pagination.total);
    productPaginationInfo.textContent = `Showing ${start}-${end} of ${pagination.total} products`;

    // Render pagination controls
    renderPagination(productPaginationElement, pagination, loadMostOrderedProducts);
}

// --- Pagination Helper Functions ---

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return '';

    // Try to parse the date string
    let date;
    try {
        // Handle different date formats
        if (dateStr.includes('/')) {
            // Format: DD/MM/YYYY
            const parts = dateStr.split('/');
            date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else if (dateStr.includes('-')) {
            // Format: YYYY-MM-DD
            date = new Date(dateStr);
        } else {
            // Try default parsing
            date = new Date(dateStr);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateStr; // Return original string if parsing failed
        }

        // Format the date based on locale
        return date.toLocaleDateString();
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateStr; // Return original string if any error occurs
    }
}

// Render pagination controls
function renderPagination(element, pagination, callback) {
    if (!element) return;

    element.innerHTML = '';

    // Don't show pagination if there's only one page
    if (pagination.totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.innerHTML = '&laquo;';
    prevLink.setAttribute('aria-label', 'Previous');
    if (pagination.currentPage > 1) {
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (element === invoicePaginationElement) {
                invoicePagination.currentPage--;
                callback();
            } else if (element === productPaginationElement) {
                productPagination.currentPage--;
                callback();
            }
        });
    }
    prevLi.appendChild(prevLink);
    element.appendChild(prevLi);

    // Page numbers
    let startPage = Math.max(1, pagination.currentPage - 2);
    let endPage = Math.min(pagination.totalPages, startPage + 4);

    // Adjust start page if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === pagination.currentPage ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        if (i !== pagination.currentPage) {
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (element === invoicePaginationElement) {
                    invoicePagination.currentPage = i;
                    callback();
                } else if (element === productPaginationElement) {
                    productPagination.currentPage = i;
                    callback();
                }
            });
        }
        pageLi.appendChild(pageLink);
        element.appendChild(pageLi);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.innerHTML = '&raquo;';
    nextLink.setAttribute('aria-label', 'Next');
    if (pagination.currentPage < pagination.totalPages) {
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (element === invoicePaginationElement) {
                invoicePagination.currentPage++;
                callback();
            } else if (element === productPaginationElement) {
                productPagination.currentPage++;
                callback();
            }
        });
    }
    nextLi.appendChild(nextLink);
    element.appendChild(nextLi);
}
