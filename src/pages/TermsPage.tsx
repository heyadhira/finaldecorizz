import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="custom-heading mb-6"><span className="text-[#3b2f27]">Terms</span> <span style={{ color: '#14b8a6' }}>&amp; Conditions</span></h1>
        <div className="soft-card p-6 space-y-6">
          <p>Welcome to Decorizz. By accessing or purchasing from our website (www.decorizz.com), you agree to the following Terms &amp; Conditions. Please read them carefully before using our services.</p>
          <h2 className="text-xl font-semibold">General</h2>
          <p>At Decorizz we provide home décor and wall art products. By placing an order, you confirm that you are at least 18 years old, the information you provide is accurate, and you agree to all policies mentioned on our website. We reserve the right to modify, update, or change these terms at any time.</p>
          <h2 className="text-xl font-semibold">Products &amp; Descriptions</h2>
          <p>We try our best to present accurate product details, colors, and images. However, variations may occur due to different lighting, monitor/screen settings, and handmade/printed product differences. These natural variations do not qualify as defects.</p>
          <h2 className="text-xl font-semibold">Pricing &amp; Availability</h2>
          <p>All prices on our website are inclusive of applicable taxes (unless stated otherwise). Prices may change without prior notice. If a product is unavailable after placing an order, we will notify you and issue a refund.</p>
          <h2 className="text-xl font-semibold">Orders &amp; Payments</h2>
          <p>When you place an order you agree to provide complete and correct information. Payments must be made through our secure payment partners. Orders may be canceled by us if fraudulent or suspicious activity is detected.</p>
          <h2 className="text-xl font-semibold">Shipping &amp; Delivery</h2>
          <p>Delivery timelines vary based on location. You will receive tracking updates once your order is shipped. For detailed shipping information, refer to our Shipping Policy.</p>
          <h2 className="text-xl font-semibold">Returns, Refunds &amp; Cancellations</h2>
          <p>Returns and cancellations are subject to our Return &amp; Refund Policy.</p>
          <h2 className="text-xl font-semibold">Intellectual Property</h2>
          <p>All content on Decorizz—including product images, branding, text, and graphics—is owned by us. You may not copy, reuse, or distribute our content without written permission.</p>
          <h2 className="text-xl font-semibold">Limitation of Liability</h2>
          <p>Decorizz will not be responsible for delays caused by courier partners, damage due to incorrect handling by the customer, or unauthorized use of your login or payment credentials.</p>
          <h2 className="text-xl font-semibold">Contact Information</h2>
          <p>For questions regarding these terms: contact@decorizz.com · +91 9705180483</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
