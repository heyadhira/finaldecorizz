import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'sonner';
import logo from "../assets/logo-r.png";
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, googleLogin } = useContext(AuthContext);
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (e: any) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const submit = async (e: any) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(formData.email, formData.password, formData.name);
      toast.success('Account created successfully!');
      const redirect = (location.state as any)?.redirect || localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirect, { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
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

        {/* LOGO */}
        <div className="text-center mb-8">
          <Link to="/" className="flex flex-col items-center mb-3">
            <img src={logo} className="w-12 mb-2" alt="logo" />
            <span className="text-2xl font-semibold" style={{ color: '#14b8a6' }}>
              Decorizz
            </span>
          </Link>

          <h1 className="custom-heading" style={{ color: 'var(--text-main)' }}>Create your account</h1>
        </div>

        {/* FORM */}
        <form onSubmit={submit} className="space-y-6">

          {/* FULL NAME */}
          <div>
            <label className="block text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={update}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
              style={{ color: 'var(--text-main)' }}
            />
          </div>

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
            <label className="block text-gray-700 mb-2">Password</label>
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

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={update}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition"
              style={{ color: 'var(--text-main)' }}
            />
          </div>

          {/* BUTTON */}
          <button type="submit" disabled={loading} className="premium-btn-white px-6 py-4 rounded-xl transition">
            {loading ? 'Creating account…' : 'Sign Up'}
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

        {/* FOOTER */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium hover:underline"
              style={{ color: '#14b8a6' }}
            >
              Sign in
            </Link>
          </p>
        </div>

      </div>
      </section>
      <Footer />
    </div>
  );
}
