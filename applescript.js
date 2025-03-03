document.addEventListener("DOMContentLoaded", function () {
    console.log('DOM fully loaded and parsed');
    if (window.ApplePaySession) {
        console.log('Apple Pay Session available');
        if (ApplePaySession.canMakePayments()) {
            console.log('Can make payments with Apple Pay');
            document.getElementById("apple-pay-button").style.display = "flex";
        } else {
            console.log('Cannot make payments with Apple Pay');
        }
    } else {
        console.log('Apple Pay Session not available');
    }
});

document.getElementById("apple-pay-button").addEventListener("click", function () {
    const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        total: {
            label: 'Secure Checkout',
            amount: '10.00'
        },
        supportedNetworks: ['visa', 'masterCard', 'amex'],
        merchantCapabilities: ['supports3DS']
    };

    const session = new ApplePaySession(3, paymentRequest);
    
    session.onvalidatemerchant = function (event) {
        // Call your validation server to validate the merchant
        const validationURL = event.validationURL;
        // Fetch merchant session from your server
        fetch('/validate-merchant', {
            method: 'POST',
            body: JSON.stringify({ validationURL })
        })
        .then(response => response.json())
        .then(data => {
            session.completeMerchantValidation(data);
        });
    };

    session.onpaymentauthorized = function (event) {
        // Process the payment
        const payment = event.payment;
        // Send payment to your server
        fetch('/process-payment', {
            method: 'POST',
            body: JSON.stringify(payment)
        })
        .then(response => response.json())
        .then(data => {
            session.completePayment(data.success ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE);
        });
    };

    session.begin();
});
