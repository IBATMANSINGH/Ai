const fetch = require('node-fetch');

// Create a test invoice
const testInvoice = {
    customer_name: "Test Customer via Script",
    invoice_date: "11/04/2025",
    invoice_number: "BAT-1003",
    tax_rate: 18,
    subtotal: 100,
    tax_amount: 18,
    grand_total: 118,
    currency_symbol: "₹",
    items: [
        {
            product_id: 1,
            product_name: "Test Product",
            price: 100,
            quantity: 1,
            total: 100
        }
    ]
};

// Send the invoice to the API
fetch('http://localhost:3000/api/invoices', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(testInvoice),
})
.then(response => {
    console.log('Response status:', response.status);
    return response.json();
})
.then(data => {
    console.log('Invoice created successfully:', data);
})
.catch(error => {
    console.error('Error creating invoice:', error);
});
