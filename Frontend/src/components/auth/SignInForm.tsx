import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useGoogleLogin } from "@react-oauth/google";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useUser } from "../../context/UserContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { refetch } = useUser();
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  const plan = searchParams.get('plan');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; isNotFound?: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/openwa-api/crm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        let errText = "Login failed";
        try {
          const errData = await response.json();
          errText = errData.message || errData.error || errText;
        } catch (e) {}

        if (response.status === 401 || response.status === 404 || errText.toLowerCase().includes("invalid") || errText.toLowerCase().includes("not found")) {
          setError({ message: 'Invalid credentials or account not found.', isNotFound: true });
          setIsLoading(false);
          return;
        }

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
      setError({ message: err.message || 'Login failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
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
          navigate('/signup', { state: { requiresPhoneVerification: true, email: data.email, name: data.name } });
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
        console.error("Google login failed", err);
      }
    }
  });
  return (
    <div className="flex flex-col flex-1 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-lg mx-auto pt-16 pb-10">
        <div className="flex justify-center w-full mb-0 mt-4">
          <img src="/images/logo/logo.png" className="h-32 scale-[1.6] object-contain" alt="Waflow" />
        </div>
        <div>
          <div className="mb-5">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div>
            <div className="flex justify-center w-full">
              <button 
                type="button"
                onClick={() => loginWithGoogle()}
                className="inline-flex items-center justify-center w-full gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
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
                Sign in with Google
              </button>
            </div>
            <div className="relative pt-3 pb-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  Or
                </span>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 mb-5 text-sm font-medium border rounded-xl bg-error-50 text-error-600 border-error-200 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                <svg className="shrink-0 mt-0.5 size-5 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  {error.message}{" "}
                  {error.isNotFound && (
                    <Link to={plan ? `/signup?plan=${plan}` : "/signup"} className="font-bold underline hover:text-error-700 dark:hover:text-error-300">
                      Please sign up first.
                    </Link>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    placeholder="info@gmail.com" 
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to={plan ? `/signup?plan=${plan}` : "/signup"}
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
