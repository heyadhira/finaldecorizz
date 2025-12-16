import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MapPin, Phone, Mail, Search as SearchIcon, Send } from "lucide-react";
import TiltCard from "../components/TiltCard";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";

export default function ContactUsPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [instaPosts, setInstaPosts] = useState<{ id: string; embedUrl: string }[]>([]);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    try {
      setSubmitting(true);
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-52d68140/contact-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await resp.json();
      if (!resp.ok) toast.error(data.error || "Failed to send message");
      else {
        toast.success("Message sent successfully");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-52d68140/instagram`);
        const data = await res.json();
        setInstaPosts((data.items || []).slice(0, 6));
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />

   {/* HERO HEADER */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="soft-card p-8 sm:p-12 card-appear">
            <h1 className="text-center custom-heading">
              Contact <span style={{ color: "#14b8a6" }}>Us</span>
            </h1>
            <p className="text-center max-w-3xl mx-auto italic text-base sm:text-lg" style={{ color: "#cbd5e1" }}>
               Get in touch with us for any enquiries and questions
            </p>
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT FORM — PREMIUM 3D CARD */}
          <TiltCard className="lg:col-span-2 soft-card p-8 card-appear">
            <h2 className="text-xl font-semibold mb-6" style={{ color: "#e5e7eb" }}>
              Send us a message
            </h2>

            <form onSubmit={onSubmit} className="space-y-6">

              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#cbd5e1' }}>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    style={{ backgroundColor: '#0b1220', border: '1px solid #334155', color: '#e5e7eb' }}
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#cbd5e1' }}>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    style={{ backgroundColor: '#0b1220', border: '1px solid #334155', color: '#e5e7eb' }}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Phone + Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#cbd5e1' }}>Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    style={{ backgroundColor: '#0b1220', border: '1px solid #334155', color: '#e5e7eb' }}
                    placeholder="+91 9258784544"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#cbd5e1' }}>Subject</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => update("subject", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                    style={{ backgroundColor: '#0b1220', border: '1px solid #334155', color: '#e5e7eb' }}
                    placeholder="How can we help?"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#cbd5e1' }}>Message</label>
                <textarea
                  rows={6}
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  style={{ backgroundColor: '#0b1220', border: '1px solid #334155', color: '#e5e7eb' }}
                  placeholder="Write your message here"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="premium-btn px-6 py-3 rounded-lg text-white font-semibold"
                  style={{ backgroundColor: "#14b8a6" }}
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>

                <button
                  type="reset"
                  className="px-6 py-3 rounded-lg font-semibold transition"
                  style={{ border: '2px solid #334155', color: '#e5e7eb', backgroundColor: 'transparent' }}
                  onClick={() =>
                    setForm({
                      name: "",
                      email: "",
                      phone: "",
                      subject: "",
                      message: "",
                    })
                  }
                >
                  Clear
                </button>
              </div>

            </form>
          </TiltCard>

          {/* RIGHT SIDE CARDS */}
          <div className="space-y-6">

  {/* PHONE */}
  <TiltCard className="rounded-3xl shadow-lg p-6 transition-all duration-300 card-appear" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
    <div className="flex items-start gap-6">

      {/* Icon circle */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6]/10 to-[#3b2f27]/10 flex items-center justify-center shadow-inner">
        <Phone className="w-6 h-6" color="#14b8a6" />
      </div>

      {/* Text */}
      <div>
        <p className="text-lg font-semibold" style={{ color: '#e5e7eb' }}>Phone Number</p>
        <p className="text-sm mt-1" style={{ color: '#cbd5e1' }}>+91 9705180483</p>
      </div>

    </div>
  </TiltCard>

  {/* EMAIL */}
  <TiltCard className="rounded-3xl shadow-lg p-6 transition-all duration-300 card-appear" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
    <div className="flex items-start gap-6">

      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6]/10 to-[#3b2f27]/10 flex items-center justify-center shadow-inner">
        <Mail className="w-6 h-6" color="#14b8a6" />
      </div>

      <div>
        <p className="text-lg font-semibold" style={{ color: '#e5e7eb' }}>Email Address</p>
        <p className="text-sm mt-1" style={{ color: '#cbd5e1' }}>Contact@decorizz.com</p>
      </div>

    </div>
  </TiltCard>

  {/* LOCATION */}
  <TiltCard className="rounded-3xl shadow-lg p-6 transition-all duration-300 card-appear" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
    <div className="flex items-start gap-6">

      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#14b8a6]/10 to-[#3b2f27]/10 flex items-center justify-center shadow-inner">
        <MapPin className="w-6 h-6" color="#14b8a6" />
      </div>

      <div>
        <p className="text-lg font-semibold" style={{ color: '#e5e7eb' }}>Location</p>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: '#cbd5e1' }}>
          Gurugram Road, Near Subhash Chowk, Shaktifarm Market,<br />
          Sitarganj, Udham Singh Nagar, 253151.
        </p>
      </div>

    </div>
  </TiltCard>

</div>


        </div>
      </section>



      {/* MAP SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <h3 className="custom-heading text-center">Find Us</h3>
        <p className="text-sm text-gray-600 text-center mt-2">
          Click the map to get directions instantly
        </p>

        <div className="relative mt-8 rounded-3xl overflow-hidden soft-card shadow-xl">
          <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3489.2669416026324!2d79.64781057555636!3d29.00908607546123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39a061f87cc0f677%3A0xe5fb13c9df318542!2sShakti%20farm%20market!5e0!3m2!1sen!2sin!4v1765270792894!5m2!1sen!2sin"
    width="100%"
    height="350"
    style={{
      border: "0",
      borderRadius: "18px",
     
    }}
    allowFullScreen=""
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>

          {/* Overlaid Search Bar */}
          <div className="absolute left-4 top-4 bg-white rounded-full px-4 py-2 shadow flex items-center gap-2">
            <SearchIcon className="w-4 h-4 text-gray-600" />
            <input
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-40"
            />
            <Send className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
