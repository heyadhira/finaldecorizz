import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import logo from "../assets/logo.png";
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useContext(AuthContext);
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (e: any) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login Successful!');
      const redirect = (location.state as any)?.redirect || localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirect, { replace: true });
    } catch (err: any) {
      toast.error('Invalid Email or Password');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const state = location.state as any;
    if (state?.redirect) {
      localStorage.setItem('redirectAfterLogin', state.redirect);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen dark-theme content-offset">
      <Navbar />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">

      {/* CARD */}
      <div className="soft-card rounded-2xl p-8 w-full max-w-md">

        {/* LOGO + BRAND */}
        <div className="text-center mb-8">
          <Link to="/" className="flex flex-col items-center mb-3">
            <img src={logo} className="w-20 mb-2" alt="logo" />
          
          </Link>

          <h1 className="custom-heading" style={{ color: 'var(--text-main)' }}>Sign in to your account</h1>
        </div>

        {/* FORM */}
        <form onSubmit={submit} className="space-y-6">
          
          {/* EMAIL */}
          <div>
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={update}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
              style={{ color: 'var(--text-main)' }}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-sm font-medium" style={{ color: '#14b8a6' }}>
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={update}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
              style={{ color: 'var(--text-main)' }}
            />
          </div>

          {/* LOGIN BUTTON */}
          <button type="submit" disabled={loading} className="premium-btn-white px-6 py-4 rounded-xl transition">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <button type="button" onClick={googleLogin} className="premium-btn-white w-full flex items-center justify-center gap-2">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div> */}

        {/* FOOTER LINKS */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don’t have an account?{' '}
            <Link
              to="/signup"
              className="font-medium hover:underline"
              style={{ color: '#14b8a6' }}
            >
              Create one
            </Link>
          </p>
        </div>

      </div>
      </section>
      <Footer />
    </div>
  );
}
