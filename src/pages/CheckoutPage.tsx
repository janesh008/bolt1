// Find the RazorpayCheckout component in the file and replace it with RazorpayPaymentButton
// Look for this section in the payment step:
/*
{shippingData && (
  <RazorpayCheckout
    orderData={{
      amount: totalPrice,
      currency: 'INR',
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity
      })),
      shipping_address: {
        name: `${shippingData.firstName} ${shippingData.lastName}`,
        phone: shippingData.phone,
        address_line1: shippingData.address,
        address_line2: shippingData.address2,
        city: shippingData.city,
        state: shippingData.state,
        country: shippingData.country,
        pincode: shippingData.pincode
      }
    }}
    onSuccess={handlePaymentSuccess}
    onError={handlePaymentError}
  />
)}
*/

// Replace with:
{shippingData && items.length > 0 && (
  <div className="space-y-6">
    {/* Payment Summary */}
    <div className="bg-gradient-to-r from-gold-50 to-cream-100 rounded-lg p-6 border border-gold-200">
      <h3 className="text-lg font-semibold text-charcoal-800 mb-4 flex items-center">
        <CreditCard className="h-5 w-5 mr-2 text-gold-500" />
        Payment Summary
      </h3>
      
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-charcoal-600">
          <span>Subtotal</span>
          <span>₹{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-charcoal-600">
          <span>Shipping</span>
          <span className="text-green-600">Free</span>
        </div>
        <div className="flex justify-between text-charcoal-600">
          <span>Taxes</span>
          <span>Included</span>
        </div>
        <div className="border-t border-gold-200 pt-3">
          <div className="flex justify-between font-medium text-charcoal-800">
            <span>Total</span>
            <span className="text-gold-600">₹{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Security Features */}
    <div className="bg-white rounded-lg p-6 border border-cream-200">
      <h4 className="font-medium text-charcoal-800 mb-4 flex items-center">
        <Shield className="h-5 w-5 mr-2 text-green-600" />
        Secure Payment
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-charcoal-600">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          256-bit SSL Encryption
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          PCI DSS Compliant
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Razorpay Secured
        </div>
      </div>
    </div>

    {/* Payment Button */}
    <RazorpayPaymentButton
      productId={items[0].product_id} // Using first item for now
      buttonText={`Pay ₹${totalPrice.toLocaleString()} Securely`}
      className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600"
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
    />

    {/* Terms */}
    <p className="text-xs text-charcoal-500 text-center">
      By proceeding with payment, you agree to our{' '}
      <a href="/terms" className="text-gold-500 hover:text-gold-600 underline">
        Terms & Conditions
      </a>{' '}
      and{' '}
      <a href="/privacy" className="text-gold-500 hover:text-gold-600 underline">
        Privacy Policy
      </a>
    </p>
  </div>
)}