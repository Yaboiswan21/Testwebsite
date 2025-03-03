document.addEventListener("DOMContentLoaded", function () {
    console.log('DOM fully loaded and parsed');
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        console.log('Apple Pay Session available');
        document.getElementById("apple-pay-button").style.display = "flex";
    } else {
        console.log('Cannot make payments with Apple Pay');
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
        console.log('Validating merchant');
        const validationURL = event.validationURL;
        fetch('/validate-merchant', {
            method: 'POST',
            body: JSON.stringify({ validationURL }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            session.completeMerchantValidation(data);
        })
        .catch(error => {
            console.error('Merchant validation failed', error);
            session.abort();
        });
    };

    session.onpaymentauthorized = function (event) {
        console.log('Payment authorized');
        const payment = event.payment;
        fetch('/process-payment', {
            method: 'POST',
            body: JSON.stringify(payment),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            session.completePayment(data.success ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE);
        })
        .catch(error => {
            console.error('Payment processing failed', error);
            session.completePayment(ApplePaySession.STATUS_FAILURE);
        });
    };

    session.oncancel = function (event) {
        console.log('Payment cancelled', event);
    };

    session.onpaymentmethodselected = function (event) {
        console.log('Payment method selected', event.paymentMethod);
    };
    
    session.begin();
});
