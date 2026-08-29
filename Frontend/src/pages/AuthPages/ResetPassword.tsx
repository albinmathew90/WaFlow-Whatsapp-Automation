import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "../../icons";

export default function ResetPassword() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/openwa-api/crm/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error('Failed to request code');
      }

      setStep(2);
      setSuccess('Reset code sent to your email.');
    } catch (err) {
      console.error(err);
      setError('Failed to request password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/openwa-api/crm/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });

      if (!response.ok) {
        throw new Error('Invalid code or failed to reset');
      }

      setSuccess('Password reset successful! Redirecting to sign in...');
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      console.error(err);
      setError('Failed to reset password. Check your code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto pt-10">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 1 ? 'Enter your email to receive a reset code.' : 'Enter the code sent to your email and your new password.'}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 mb-5 text-sm font-medium border rounded-xl bg-error-50 text-error-600 border-error-200 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
              <div className="flex-1">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="flex items-start gap-3 p-4 mb-5 text-sm font-medium border rounded-xl bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400">
              <div className="flex-1">{success}</div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input 
                    placeholder="info@gmail.com" 
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    type="email"
                    required
                  />
                </div>
                <div>
                  <Button size="sm" className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Code"}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Reset Code <span className="text-error-500">*</span>
                  </Label>
                  <Input 
                    placeholder="123456" 
                    value={code}
                    onChange={(e: any) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>
                    New Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e: any) => setNewPassword(e.target.value)}
                      required
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
                <div>
                  <Button size="sm" className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                to="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
