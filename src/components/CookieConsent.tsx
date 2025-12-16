import React, { useEffect, useState } from "react";

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${date.toUTCString()}; Path=/; SameSite=Lax${secure}`;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const c = getCookie("cookie_consent");
    setVisible(!c);
  }, []);

  const acceptAll = () => {
    const payload = { analytics: true, marketing: true, ts: Date.now() };
    setCookie("cookie_consent", JSON.stringify(payload));
    setVisible(false);
  };

  const save = () => {
    const payload = { analytics, marketing, ts: Date.now() };
    setCookie("cookie_consent", JSON.stringify(payload));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-4 md:p-6 max-w-3xl mx-auto">
        <div className="md:flex md:items-center md:justify-between gap-4">
          <div className="md:flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Cookies & Privacy</h3>
            <p className="text-sm text-gray-600 mt-1">We use cookies to improve your experience. Manage your preferences or accept all.</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={analytics} onChange={(e)=>setAnalytics(e.target.checked)} className="w-4 h-4" />
                <span>Analytics</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={marketing} onChange={(e)=>setMarketing(e.target.checked)} className="w-4 h-4" />
                <span>Marketing</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button onClick={save} className="px-4 py-2 rounded-lg border">Save</button>
            <button onClick={acceptAll} className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: '#14b8a6' }}>Accept All</button>
          </div>
        </div>
      </div>
    </div>
  );
}

