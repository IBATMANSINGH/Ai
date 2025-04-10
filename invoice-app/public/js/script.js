// --- Globals ---
let products = []; // Array to hold product objects
let invoiceItems = []; // Array to hold invoice line items
let editingProductId = null; // Track which product ID is being edited

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

// --- API Functions ---

// Fetch all products from the server
function fetchProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            products = data;
            renderProductList();
        })
        .catch(error => console.error('Error fetching products:', error));
}

// Create a new product
function createProduct(product) {
    fetch('/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    })
        .then(response => response.json())
        .then(data => {
            fetchProducts(); // Refresh the product list
        })
        .catch(error => console.error('Error creating product:', error));
}

// Update an existing product
function updateProduct(id, product) {
    fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
    })
        .then(response => response.json())
        .then(data => {
            fetchProducts(); // Refresh the product list
        })
        .catch(error => console.error('Error updating product:', error));
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
    productListTbody.innerHTML = ''; // Clear existing list
    populateProductDropdown(); // Update dropdown whenever product list changes

    products.forEach(product => {
        const row = productListTbody.insertRow();
        row.innerHTML = `
            <td>${product.name}</td>
            <td class="text-end">${parseFloat(product.price).toFixed(2)}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-product" data-id="${product.id}">Edit</button>
                <button class="btn btn-danger btn-sm delete-product" data-id="${product.id}">Delete</button>
            </td>
        `;
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

    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const idToEdit = editProductIdInput.value;

    if (!name || isNaN(price) || price < 0) {
        alert('Please enter a valid product name and price.');
        return;
    }

    const product = {
        name: name,
        price: price
    };

    if (idToEdit) {
        // Update existing product
        updateProduct(idToEdit, product);
        cancelEdit(); // Reset form after update
    } else {
        // Add new product
        createProduct(product);
    }

    productForm.reset(); // Clear form fields
}

function startEditProduct(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;

    editingProductId = id;
    editProductIdInput.value = id; // Store ID in hidden field
    productNameInput.value = product.name;
    productPriceInput.value = product.price;
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
    addUpdateProductBtn.textContent = 'Add Product';
    addUpdateProductBtn.classList.remove('btn-warning');
    addUpdateProductBtn.classList.add('btn-success');
    cancelEditBtn.classList.add('d-none');
}

function populateProductDropdown() {
    // Save current selection if possible
    const currentSelection = productSelect.value;
    productSelect.innerHTML = '<option value="">-- Select Product --</option>'; // Clear existing options
    
    // Sort products alphabetically
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} - $${parseFloat(product.price).toFixed(2)}`;
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

    invoiceItems.forEach((item, index) => {
        const row = invoiceItemsTbody.insertRow();
        row.innerHTML = `
            <td>${item.product_name}</td>
            <td class="text-end">${parseFloat(item.price).toFixed(2)}</td>
            <td class="text-end">${item.quantity}</td>
            <td class="text-end">${parseFloat(item.total).toFixed(2)}</td>
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

function updateTotals() {
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(taxRateInput.value) || 0; // Get tax rate from input, default to 0
    const taxAmount = subtotal * (taxRate / 100);
    const grandTotal = subtotal + taxAmount;

    subtotalSpan.textContent = subtotal.toFixed(2);
    taxRateDisplay.textContent = taxRate.toFixed(1); // Display entered tax rate
    taxAmountSpan.textContent = taxAmount.toFixed(2);
    grandTotalSpan.textContent = grandTotal.toFixed(2);
}

function updateInvoiceDetails() {
    const customerName = customerNameInput.value.trim();
    displayCustomerName.textContent = customerName ? customerName : 'N/A';

    // Simple Date and Invoice Number
    const now = new Date();
    displayInvoiceDate.textContent = now.toLocaleDateString();
    // Generate a simple invoice number
    displayInvoiceNumber.textContent = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
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
    window.print();
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

    const invoice = {
        customer_name: customerName || 'N/A',
        invoice_date: invoiceDate,
        invoice_number: invoiceNumber,
        tax_rate: taxRate,
        subtotal: subtotal,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        items: invoiceItems
    };

    saveInvoice(invoice);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateInvoiceDetails(); // Set initial date/invoice#

    // Attach Event Listeners
    productForm.addEventListener('submit', handleProductFormSubmit);
    cancelEditBtn.addEventListener('click', cancelEdit);
    addInvoiceItemBtn.addEventListener('click', addInvoiceItem);
    printButton.addEventListener('click', printInvoice);
    clearInvoiceBtn.addEventListener('click', clearInvoice);
    saveInvoiceBtn.addEventListener('click', handleSaveInvoice);
    customerNameInput.addEventListener('input', updateInvoiceDetails);
    taxRateInput.addEventListener('input', updateTotals);

    console.log("Invoice App Initialized.");
});
