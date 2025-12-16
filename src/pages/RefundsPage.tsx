import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function RefundsPage() {
  return (
    <div className="min-h-screen about-theme content-offset">
      <Navbar />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="custom-heading mb-6"><span className="text-[#3b2f27]">Refund</span> <span style={{ color: '#14b8a6' }}>&amp; Returns Policy</span></h1>
        <div className="soft-card p-6 space-y-6">
          <p>We want you to love your purchase, but if something isn’t right, we’re here to help.</p>
          <h2 className="text-xl font-semibold">Return Eligibility</h2>
          <p>You can request a return only if you received a damaged or defective product, received the wrong item, or the product is not what you ordered. Returns for reasons like “change of mind” or “didn’t like the design” are not accepted.</p>
          <h2 className="text-xl font-semibold">Return Window</h2>
          <p>Return requests must be made within 48 hours of delivery. Unboxing video required for proof.</p>
          <h2 className="text-xl font-semibold">Refund Process</h2>
          <p>After approval, refunds are processed within 6–10 business days to the original payment method. COD refunds are processed via bank transfer/UPI.</p>
          <h2 className="text-xl font-semibold">Non-Returnable Items</h2>
          <p>Customized products, digital downloads, items damaged by the customer, and products without full packaging.</p>
          <h2 className="text-xl font-semibold">Cancellation Policy</h2>
          <p>Orders can be canceled only before they are shipped. Once shipped, cancellation is not possible.</p>
          <h2 className="text-xl font-semibold">How to Request a Return</h2>
          <p>Email: contact@decorizz.com · Subject: Return Request – Order #XXXX. Include order number, unboxing video, and images of damage. We respond within 24–48 hours.</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}

