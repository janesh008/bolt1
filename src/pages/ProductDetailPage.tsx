// Find the Buy Now button in the component and replace it with RazorpayPaymentButton
// Look for this code:
/*
<Button 
  onClick={handleBuyNow}
  isLoading={isProcessingPayment}
  disabled={!product.availability}
  size="lg" 
  className="w-full bg-gold-500 hover:bg-gold-600"
>
  Buy Now - ₹{((product.price || 0) * quantity).toLocaleString()}
</Button>
*/

// And replace it with:
<RazorpayPaymentButton
  productId={product.id}
  buttonText={`Buy Now - ₹${((product.price || 0) * quantity).toLocaleString()}`}
  className="w-full py-3 text-lg font-semibold bg-gold-500 hover:bg-gold-600"
  onSuccess={(data) => {
    toast.success('Payment successful! Your order has been confirmed.');
    navigate('/account?tab=orders');
  }}
  onError={(error) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again.');
  }}
/>