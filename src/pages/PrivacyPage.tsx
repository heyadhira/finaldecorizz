import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="custom-heading mb-6"><span className="text-[#3b2f27]">Privacy</span> <span style={{ color: '#14b8a6' }}>Policy</span></h1>
        <div className="soft-card p-6 space-y-6">
          <p>At Decorizz your privacy matters to us, and we are committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and safeguard your data when you visit or make a purchase from www.decorizz.com. By using our website, you agree to the practices described in this policy.</p>
          <h2 className="text-xl font-semibold">Information We Collect</h2>
          <p>We collect Personal Information (name, email, phone, addresses, payment details via secure gateways) and Non-Personal Information (browser, device, IP, pages visited, cookies &amp; analytics) to improve performance and user experience.</p>
          <h2 className="text-xl font-semibold">How We Use Your Information</h2>
          <p>We use your data to process orders, communicate updates, respond to support, improve performance, send opt-in promotions, and prevent fraud. We never sell your data.</p>
          <h2 className="text-xl font-semibold">Cookies &amp; Tracking</h2>
          <p>Cookies remember preferences, keep cart items, analyze traffic, and improve browsing. You can disable cookies, but some features may not work.</p>
          <h2 className="text-xl font-semibold">Sharing Your Information</h2>
          <p>We share data only with trusted partners: payment gateways, shipping partners, analytics tools, and marketing platforms (if subscribed). These partners follow strict confidentiality.</p>
          <h2 className="text-xl font-semibold">Data Security</h2>
          <p>Measures include SSL encryption, secure payment processing, limited access, and regular checks. No online system is 100% secure—please practice safe browsing.</p>
          <h2 className="text-xl font-semibold">Your Rights</h2>
          <p>You may request access, correction, deletion, or opt-out of marketing. Contact us to exercise these rights.</p>
          <h2 className="text-xl font-semibold">Retention of Data</h2>
          <p>We retain data as long as necessary to fulfill orders, meet legal obligations, and improve customer service, then securely delete it.</p>
          <h2 className="text-xl font-semibold">Links to Other Websites</h2>
          <p>We may link to third-party sites. Review their policies; Decorizz is not responsible for their practices.</p>
          <h2 className="text-xl font-semibold">Children’s Privacy</h2>
          <p>We do not knowingly collect data from individuals under 13. If you believe such data exists, contact us for removal.</p>
          <h2 className="text-xl font-semibold">Changes</h2>
          <p>We may update this Privacy Policy; changes will be posted with an updated “Last Updated” date.</p>
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <p>contact@decorizz.com · +91 9705180483 · www.decorizz.com</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
