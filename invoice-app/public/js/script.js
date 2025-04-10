// --- Globals ---
let products = []; // Array to hold product objects
let invoiceItems = []; // Array to hold invoice line items
let editingProductId = null; // Track which product ID is being edited
let appSettings = null; // Application settings

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
        })
        .catch(error => console.error('Error saving invoice:', error));
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

    // Generate invoice number using settings
    if (appSettings) {
        // Use prefix and starting number from settings
        const prefix = appSettings.invoice_prefix || 'INV-';
        const startingNumber = appSettings.invoice_starting_number || 1000;

        // Generate a sequential number (for demo purposes, we'll use the current timestamp)
        // In a real app, this would be a sequential number from the database
        const uniqueId = Math.floor((Date.now() - 1600000000000) / 1000); // Smaller number for display
        const sequentialNumber = startingNumber + (uniqueId % 10000); // Keep it reasonable size

        displayInvoiceNumber.textContent = `${prefix}${sequentialNumber}`;
    } else {
        // Fallback to the original format
        displayInvoiceNumber.textContent = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    }
}

function clearInvoice() {
    if (invoiceItems.length === 0 || confirm('Are you sure you want to clear the current invoice?')) {
        invoiceItems = [];
        customerNameInput.value = '';
        renderInvoiceItems(); // This will also update totals and details
    }
}

function printInvoice() {
    // Ensure details are up-to-date before printing
    updateInvoiceDetails();
    updateCompanyInfo();

    // Make sure company info is visible when printing
    const companyInfoDiv = document.getElementById('company-info');
    if (companyInfoDiv) {
        companyInfoDiv.classList.remove('d-none');
    }

    window.print();

    // Hide company info again after printing
    setTimeout(() => {
        if (companyInfoDiv) {
            companyInfoDiv.classList.add('d-none');
        }
    }, 500); // Small delay to ensure print dialog has opened
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

        if (saveInvoiceBtn) {
            saveInvoiceBtn.addEventListener('click', handleSaveInvoice);
        }

        if (customerNameInput) {
            customerNameInput.addEventListener('input', updateInvoiceDetails);
        }

        if (taxRateInput) {
            taxRateInput.addEventListener('input', updateTotals);
        }

        // Initialize image preview functionality
        handleImagePreview();
    }

    console.log("Invoice App Initialized.");
});
