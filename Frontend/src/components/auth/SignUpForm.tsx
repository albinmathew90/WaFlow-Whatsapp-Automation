import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { countryCodes } from "../../constants/countryCodes";
import { useGoogleLogin } from "@react-oauth/google";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useUser } from "../../context/UserContext";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [rawPhone, setRawPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = Details, 2 = Phone, 3 = OTP
  const navigate = useNavigate();
  const reactLocation = useLocation();
  const { refetch } = useUser();
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  const plan = searchParams.get('plan');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isDuplicate?: boolean } | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    if (plan) {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [plan]);

  useEffect(() => {
    if (reactLocation.state?.requiresPhoneVerification) {
      setEmail(reactLocation.state.email);
      const nameParts = reactLocation.state.name?.split(' ') || [];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setPassword('');
      setStep(2);
      
      // Clear state so it doesn't trigger again on refresh
      navigate(reactLocation.pathname, { replace: true, state: {} });
    }
  }, [reactLocation, navigate]);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isChecked) {
      setError({ message: 'Please agree to the Terms and Conditions and Privacy Policy.' });
      return;
    }

    if (password.length < 8) {
      setError({ message: 'Password must be at least 8 characters long.' });
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError({ message: 'Password must contain at least one uppercase letter.' });
      return;
    }

    if (!/\d/.test(password)) {
      setError({ message: 'Password must contain at least one number.' });
      return;
    }

    if (!/[!@#$%^&*.,]/.test(password)) {
      setError({ message: 'Password must contain at least one special character (e.g. !@#$%^&*).' });
      return;
    }

    setStep(2);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = `${countryCode}${rawPhone.replace(/\D/g, '')}`;
    if (!rawPhone || rawPhone.length < 5) {
      setError({ message: 'Please enter a valid phone number.' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('/openwa-api/crm/auth/request-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${firstName} ${lastName}`.trim(), email, password, phoneNumber: fullPhone }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errText = "Failed to request OTP";
        try {
          const errData = await response.json();
          errText = errData.message || errData.error || errText;
        } catch (e) {}
        
        if (response.status === 409 || errText.toLowerCase().includes("already exists") || errText.toLowerCase().includes("duplicate")) {
          if (errText.includes('WhatsApp number')) {
            setError({ message: errText, isDuplicate: false });
          } else {
            setError({ message: 'Account is already signed up.', isDuplicate: true });
          }
          setIsLoading(false);
          return;
        }
        throw new Error(errText);
      }
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError({ message: err.message || 'Failed to request OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError({ message: 'Please enter a valid 4-digit OTP.' });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullPhone = `${countryCode}${rawPhone.replace(/\D/g, '')}`;
      const response = await fetch('/openwa-api/crm/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, otp }),
      });

      if (!response.ok) {
        let errText = "Verification failed";
        try {
          const errData = await response.json();
          errText = errData.message || errData.error || errText;
        } catch (e) {}
        throw new Error(errText);
      }

      const data = await response.json();
      if (isChecked) {
        localStorage.setItem("crm_token", data.accessToken);
      } else {
        sessionStorage.setItem("crm_token", data.accessToken);
      }
      await refetch();
      navigate(plan ? `/?plan=${plan}` : "/");
    } catch (err: any) {
      console.error(err);
      setError({ message: err.message || 'OTP verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const userInfo = await res.json();
        
        // Exchange with our backend for a CRM JWT token
        const backendRes = await fetch('/openwa-api/crm/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: userInfo.name,
            email: userInfo.email,
            avatar: userInfo.picture
          })
        });

        if (!backendRes.ok) throw new Error('Backend google login failed');

        const data = await backendRes.json();

        if (data.requiresPhoneVerification) {
          // Google authentication successful, but user needs to verify their phone number
          setEmail(data.email);
          const nameParts = data.name.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setPassword(''); // Google users don't have a password
          setStep(2);
          return;
        }

        // Only the JWT token is persisted — user profile is always fetched from the server
        if (isChecked) {
          localStorage.setItem("crm_token", data.accessToken);
        } else {
          sessionStorage.setItem("crm_token", data.accessToken);
        }
        await refetch();
        
        navigate(plan ? `/?plan=${plan}` : "/");
      } catch (err) {
        console.error("Google signup failed", err);
      }
    }
  });
  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-lg mx-auto pt-4 pb-4">
        <div className="flex justify-center w-full mb-0 mt-4">
          <img src="/images/logo/logo.png" className="h-32 scale-[1.6] object-contain" alt="Waflow" />
        </div>
        
        <div className={`transition-all duration-1000 ease-in-out overflow-hidden ${showBanner && plan ? 'max-h-24 opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
          {plan === 'trial' && (
            <div className="p-3 bg-brand-50 border border-brand-200 dark:bg-brand-900/20 dark:border-brand-500/30 rounded-lg text-brand-700 dark:text-brand-400 text-sm font-bold text-center shadow-sm flex items-center justify-center gap-2">
              <span className="text-lg">🚀</span> Create an account to start your 24-hour Free Trial!
            </div>
          )}
          {plan === 'yearly' && (
            <div className="p-3 bg-brand-50 border border-brand-200 dark:bg-brand-900/20 dark:border-brand-500/30 rounded-lg text-brand-700 dark:text-brand-400 text-sm font-bold text-center shadow-sm flex items-center justify-center gap-2">
              <span className="text-lg">✨</span> Create an account to purchase your plan!
            </div>
          )}
          {plan === 'monthly' && (
            <div className="p-3 bg-brand-50 border border-brand-200 dark:bg-brand-900/20 dark:border-brand-500/30 rounded-lg text-brand-700 dark:text-brand-400 text-sm font-bold text-center shadow-sm flex items-center justify-center gap-2">
              <span className="text-lg">✨</span> Create an account to purchase your plan!
            </div>
          )}
        </div>

        <div>
          <div className="mb-2">
            <h1 className="mb-1 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 1 && 'Enter your details to sign up!'}
              {step === 2 && 'Please enter your WhatsApp number to verify your account.'}
              {step === 3 && 'Enter the 4-digit code sent to your WhatsApp.'}
            </p>
          </div>
          <div>
            {step === 1 && (
              <>
                <div className="flex justify-center w-full">
                  <button 
                    type="button"
                    onClick={() => signUpWithGoogle()}
                    className="inline-flex items-center justify-center w-full gap-3 py-2.5 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                        fill="#EB4335"
                      />
                    </svg>
                    Sign up with Google
                  </button>
                </div>
                <div className="relative pt-2 pb-0">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                      Or
                    </span>
                  </div>
                </div>
              </>
            )}
            
            {error && (
              <div className="flex items-start gap-3 p-4 mb-5 text-sm font-medium border rounded-xl bg-error-50 text-error-600 border-error-200 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                <svg className="shrink-0 mt-0.5 size-5 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  {error.message}{" "}
                  {error.isDuplicate && (
                    <Link to="/signin" className="font-bold underline hover:text-error-700 dark:hover:text-error-300">
                      Please log in here.
                    </Link>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleDetailsSubmit}>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {/* <!-- First Name --> */}
                    <div className="sm:col-span-1">
                      <Label>
                        First Name<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="fname"
                        name="fname"
                        placeholder="Enter your first name"
                        value={firstName}
                        onChange={(e: any) => setFirstName(e.target.value)}
                      />
                    </div>
                    {/* <!-- Last Name --> */}
                    <div className="sm:col-span-1">
                      <Label>
                        Last Name<span className="text-error-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        id="lname"
                        name="lname"
                        placeholder="Enter your last name"
                        value={lastName}
                        onChange={(e: any) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* <!-- Email --> */}
                  <div>
                    <Label>
                      Email<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e: any) => setEmail(e.target.value)}
                    />
                  </div>
                  {/* <!-- Password --> */}
                  <div>
                    <Label>
                      Password<span className="text-error-500">*</span> <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">(Must contain at least 8 characters, 1 uppercase letter, 1 number, and 1 special character)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e: any) => setPassword(e.target.value)}
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      >
                        {showPassword ? (
                          <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        ) : (
                          <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                        )}
                      </span>
                    </div>
                  </div>
                  {/* <!-- Checkbox --> */}
                  <div className="flex items-center gap-3">
                    <Checkbox
                      className="w-5 h-5"
                      checked={isChecked}
                      onChange={setIsChecked}
                    />
                    <p className="inline-block text-xs font-normal text-gray-500 dark:text-gray-400">
                      By creating an account means you agree to the{" "}
                      <span className="text-gray-800 dark:text-white/90">
                        Terms and Conditions,
                      </span>{" "}
                      and our{" "}
                      <span className="text-gray-800 dark:text-white">
                        Privacy Policy
                      </span>
                    </p>
                  </div>
                  {/* <!-- Button --> */}
                  <div>
                    <button type="submit" disabled={isLoading} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50">
                      Next
                    </button>
                  </div>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handlePhoneSubmit}>
                <div className="space-y-4">
                  <div className="mb-5">
                    <Label>WhatsApp Number<span className="text-error-500">*</span></Label>
                    <div className="flex gap-2 w-full">
                      <div className="relative w-[120px] shrink-0">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-full h-11 appearance-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 pr-8 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          required
                        >
                          {countryCodes.map((c) => (
                            <option key={c.code} value={c.dial_code}>
                              {c.name} ({c.dial_code})
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </span>
                      </div>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        className="flex-1 min-w-0 h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        value={rawPhone}
                        onChange={(e) => setRawPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                      Back
                    </button>
                    <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50">
                      {isLoading ? "Sending..." : "Send OTP"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleOtpSubmit}>
                <div className="space-y-4">
                  <div>
                    <Label>
                      Verification Code<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Enter 4-digit code"
                      value={otp}
                      onChange={(e: any) => setOtp(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(2)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                      Back
                    </button>
                    <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50">
                      {isLoading ? "Verifying..." : "Verify & Sign Up"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="mt-2">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account? {""}
                <Link
                  to={plan ? `/signin?plan=${plan}` : "/signin"}
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
