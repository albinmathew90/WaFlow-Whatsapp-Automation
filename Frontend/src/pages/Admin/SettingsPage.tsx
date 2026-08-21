import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { AdminAPI } from '../../api/admin';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'billing'>('security');
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#notifications') setActiveTab('notifications');
    else if (location.hash === '#billing') setActiveTab('billing');
    else setActiveTab('security');
  }, [location.hash]);
  
  const [profile, setProfile] = useState<any>({});
  const [settings, setSettings] = useState<any>({});

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState('');
  const [billingSuccess, setBillingSuccess] = useState('');

  // 2FA State
  const [qrCode, setQrCode] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);

  // Email & Notifications State
  const [smtpSettings, setSmtpSettings] = useState({ provider: 'custom', host: '', port: 587, user: '', pass: '', fromEmail: '' });
  const [emailTriggers, setEmailTriggers] = useState({ welcome: true, invoice: true, expiration: true });
  const [adminAlerts, setAdminAlerts] = useState({ newUser: true, paymentFail: true, email: '', whatsapp: '' });
  const [emailTemplates, setEmailTemplates] = useState({
    welcomeSubject: 'Welcome to Waflow!', welcomeBody: '',
    invoiceSubject: 'Your Invoice', invoiceBody: '',
    expirationSubject: 'Plan Expiring Soon', expirationBody: ''
  });

  // Subscriptions & Billing State
  const [paymentGatewaySettings, setPaymentGatewaySettings] = useState({ provider: 'razorpay', apiKey: '', apiSecret: '', webhookSecret: '' });
  const [taxConfiguration, setTaxConfiguration] = useState({ currency: 'INR (₹)', gstPercentage: 18, gstInNumber: '' });
  const [planParameters, setPlanParameters] = useState({ trialDurationHours: 24, monthlyPlanEnabled: true, yearlyPlanEnabled: true, yearlyDiscountPercentage: 20, couponCode: '', couponDiscountPercentage: 0, couponMaxRedemptions: 100 });
  const [invoiceSettings, setInvoiceSettings] = useState({ invoicePrefix: 'WAF-', businessAddress: '', companySignature: '' });

  useEffect(() => {
    fetchProfile();
    fetchSettings();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await AdminAPI.getProfile();
      setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await AdminAPI.getSettings();
      setSettings(data);
      if (data.smtpSettings) setSmtpSettings(data.smtpSettings);
      if (data.emailTriggers) setEmailTriggers(data.emailTriggers);
      if (data.adminAlerts) setAdminAlerts(data.adminAlerts);
      if (data.emailTemplates) setEmailTemplates(data.emailTemplates);
      if (data.paymentGatewaySettings) setPaymentGatewaySettings(data.paymentGatewaySettings);
      if (data.taxConfiguration) setTaxConfiguration(data.taxConfiguration);
      if (data.planParameters) setPlanParameters(data.planParameters);
      if (data.invoiceSettings) setInvoiceSettings(data.invoiceSettings);
    } catch (err) {
      console.error(err);
    }
  };

  const saveProfile = async () => {
    await AdminAPI.updateProfile({ email: profile.email });
    setProfileSuccess('Profile updated successfully.');
    setTimeout(() => setProfileSuccess(''), 3000);
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await AdminAPI.updatePassword({ currentPassword, newPassword });
      if (res.success) {
        setPasswordSuccess('Password updated successfully.');
        setTimeout(() => setPasswordSuccess(''), 3000);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(res.message || 'Failed to update password');
      }
    } catch (error) {
      console.error(error);
      setPasswordError('An error occurred while updating the password.');
    }
  };

  const setup2FA = async () => {
    const res = await AdminAPI.generate2FA();
    setQrCode(res.qrCodeDataUrl);
    setIsSettingUp2FA(true);
  };

  const turnOn2FA = async () => {
    const res = await AdminAPI.turnOn2FA(twoFactorCode);
    if (res.success) {
      alert('2FA Enabled successfully!');
      setIsSettingUp2FA(false);
      fetchProfile();
    } else {
      alert('Invalid code!');
    }
  };

  const turnOff2FA = async () => {
    const code = prompt('Enter your 2FA code to disable it:');
    if (code) {
      const res = await AdminAPI.turnOff2FA(code);
      if (res.success) {
        alert('2FA Disabled successfully!');
        fetchProfile();
      } else {
        alert('Invalid code!');
      }
    }
  };

  const saveNotificationSettings = async () => {
    await AdminAPI.updateSettings({
      ...settings,
      smtpSettings,
      emailTriggers,
      adminAlerts,
      emailTemplates
    });
    setNotificationSuccess('Notification Settings saved!');
    setTimeout(() => setNotificationSuccess(''), 3000);
  };

  const saveBillingSettings = async () => {
    await AdminAPI.updateSettings({
      ...settings,
      paymentGatewaySettings,
      taxConfiguration,
      planParameters,
      invoiceSettings
    });
    setBillingSuccess('Billing Settings saved!');
    setTimeout(() => setBillingSuccess(''), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-admin-bg dark:bg-gray-950 p-0 sm:p-0">
      <div className="flex flex-col gap-3 w-full">
        
        {/* Horizontal Tabs */}
        <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'security' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
            Profile & Security
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'notifications' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            Email & Notifications
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${activeTab === 'billing' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Subscriptions & Billing
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          
          {activeTab === 'security' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-6">Profile & Security</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
                
                {/* Left Column: Profile & 2FA */}
                <div className="space-y-8">
                  
                  {/* Profile Form */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Admin Profile</h3>
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Email Address</label>
                      <input 
                        type="email" 
                        value={profile.email || ''} 
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10" 
                      />
                    </div>
                    <button onClick={saveProfile} className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-lg text-xs font-semibold hover:bg-black transition-colors shadow-sm mt-1">
                      Update Profile
                    </button>
                    {profileSuccess && (
                      <div className="mt-2 inline-block px-3 py-1.5 bg-[#f0fdf4] text-[#166534] text-xs font-semibold rounded border border-[#bbf7d0] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        ✓ {profileSuccess}
                      </div>
                    )}
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* 2FA Setup */}
                  <div className="space-y-4 w-full">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Two-Factor Authentication</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">Add an extra layer of security to your admin account using an authenticator app.</p>
                      </div>
                      <div className="flex-shrink-0">
                        {profile.isTwoFactorEnabled ? (
                          <button onClick={turnOff2FA} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors whitespace-nowrap">
                            Disable 2FA
                          </button>
                        ) : (
                          <button onClick={setup2FA} className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors whitespace-nowrap">
                            Enable 2FA
                          </button>
                        )}
                      </div>
                    </div>

                    {isSettingUp2FA && !profile.isTwoFactorEnabled && (
                      <div className="p-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-300">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">Scan this QR Code</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Use Google Authenticator or Authy to scan.</p>
                        {qrCode && <img src={qrCode} alt="2FA QR Code" className="w-32 h-32 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 mt-2" />}
                        <div className="flex flex-col gap-2 w-full mt-3">
                          <input 
                            type="text" 
                            placeholder="Enter 6-digit code" 
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            className="w-full px-3 py-2.5 text-center tracking-widest text-base font-mono bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-black"
                            maxLength={6}
                          />
                          <button onClick={turnOn2FA} className="w-full px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors">
                            Verify & Activate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Password Form */}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Change Password</h3>
                    <div className="flex flex-col gap-3 w-full">
                      {passwordError && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{passwordError}</div>}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Current Password</label>
                        <input 
                          type="password" 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10" 
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">New Password</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10" 
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Confirm New Password</label>
                        <input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black/10" 
                        />
                      </div>
                    </div>
                    <button onClick={handleUpdatePassword} className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-lg text-xs font-semibold hover:bg-black transition-colors shadow-sm mt-2">
                      Update Password
                    </button>
                    {passwordSuccess && (
                      <div className="mt-2 inline-block px-3 py-1.5 bg-[#f0fdf4] text-[#166534] text-xs font-semibold rounded border border-[#bbf7d0] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                        ✓ {passwordSuccess}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="animate-in fade-in duration-300 pb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Email & Notifications</h2>
                <div className="flex items-center gap-3">
                  {notificationSuccess && (
                    <div className="inline-block px-3 py-1.5 bg-[#f0fdf4] text-[#166534] text-xs font-semibold rounded border border-[#bbf7d0] shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
                      ✓ {notificationSuccess}
                    </div>
                  )}
                  <button onClick={saveNotificationSettings} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 w-full">
                
                {/* Left Column: SMTP & Admin Alerts */}
                <div className="space-y-8">
                  
                  {/* SMTP Credentials */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">SMTP Provider Settings</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure your mail server for sending transactional emails.</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Provider</label>
                        <select 
                          value={smtpSettings.provider} 
                          onChange={(e) => setSmtpSettings({...smtpSettings, provider: e.target.value})}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black"
                        >
                          <option value="sendgrid">SendGrid</option>
                          <option value="mailgun">Mailgun</option>
                          <option value="ses">Amazon SES</option>
                          <option value="hostinger">Hostinger Mail</option>
                          <option value="custom">Custom SMTP</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Host</label>
                          <input type="text" value={smtpSettings.host} onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="smtp.example.com" />
                        </div>
                        <div className="col-span-1 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Port</label>
                          <input type="number" value={smtpSettings.port} onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="587" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Username</label>
                          <input type="text" value={smtpSettings.user} onChange={(e) => setSmtpSettings({...smtpSettings, user: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="api_key_or_user" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
                          <input type="password" value={smtpSettings.pass} onChange={(e) => setSmtpSettings({...smtpSettings, pass: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="••••••••••••" />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">From Email Address</label>
                        <input type="email" value={smtpSettings.fromEmail} onChange={(e) => setSmtpSettings({...smtpSettings, fromEmail: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="noreply@waflow.com" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* Admin Alerts */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Admin Alerts</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Get notified of important system events.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <input type="checkbox" checked={adminAlerts.newUser} onChange={(e) => setAdminAlerts({...adminAlerts, newUser: e.target.checked})} className="w-4 h-4 text-black dark:text-white rounded border-gray-300 dark:border-gray-600 focus:ring-black" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Alert on New User Registration</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <input type="checkbox" checked={adminAlerts.paymentFail} onChange={(e) => setAdminAlerts({...adminAlerts, paymentFail: e.target.checked})} className="w-4 h-4 text-black dark:text-white rounded border-gray-300 dark:border-gray-600 focus:ring-black" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Alert on Payment Failure</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Alert Email</label>
                        <input type="email" value={adminAlerts.email} onChange={(e) => setAdminAlerts({...adminAlerts, email: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="admin@domain.com" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Alert WhatsApp Number</label>
                        <input type="text" value={adminAlerts.whatsapp} onChange={(e) => setAdminAlerts({...adminAlerts, whatsapp: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="+1234567890" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Templates & Triggers */}
                <div className="space-y-8">

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Automated Email Templates</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure when and what emails are sent to your users.</p>
                    </div>

                    {/* Welcome Email */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={emailTriggers.welcome} onChange={(e) => setEmailTriggers({...emailTriggers, welcome: e.target.checked})} className="w-4 h-4 text-black dark:text-white rounded border-gray-300 dark:border-gray-600 focus:ring-black" />
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Send Welcome & Verification Email</span>
                      </label>
                      {emailTriggers.welcome && (
                        <div className="pl-7 space-y-3 mt-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Subject</label>
                            <input type="text" value={emailTemplates.welcomeSubject} onChange={(e) => setEmailTemplates({...emailTemplates, welcomeSubject: e.target.value})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Body</label>
                            <textarea value={emailTemplates.welcomeBody} onChange={(e) => setEmailTemplates({...emailTemplates, welcomeBody: e.target.value})} rows={3} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-black resize-none" placeholder="Welcome to Waflow! Please verify your email..."></textarea>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Invoice Receipts */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={emailTriggers.invoice} onChange={(e) => setEmailTriggers({...emailTriggers, invoice: e.target.checked})} className="w-4 h-4 text-black dark:text-white rounded border-gray-300 dark:border-gray-600 focus:ring-black" />
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Send Invoice Receipts & Renewals</span>
                      </label>
                      {emailTriggers.invoice && (
                        <div className="pl-7 space-y-3 mt-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Subject</label>
                            <input type="text" value={emailTemplates.invoiceSubject} onChange={(e) => setEmailTemplates({...emailTemplates, invoiceSubject: e.target.value})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Body</label>
                            <textarea value={emailTemplates.invoiceBody} onChange={(e) => setEmailTemplates({...emailTemplates, invoiceBody: e.target.value})} rows={3} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-black resize-none" placeholder="Thank you for your payment. Here is your receipt..."></textarea>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Expiration Alerts */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={emailTriggers.expiration} onChange={(e) => setEmailTriggers({...emailTriggers, expiration: e.target.checked})} className="w-4 h-4 text-black dark:text-white rounded border-gray-300 dark:border-gray-600 focus:ring-black" />
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Send Plan Expiration & Low-Credit Alerts</span>
                      </label>
                      {emailTriggers.expiration && (
                        <div className="pl-7 space-y-3 mt-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Subject</label>
                            <input type="text" value={emailTemplates.expirationSubject} onChange={(e) => setEmailTemplates({...emailTemplates, expirationSubject: e.target.value})} className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-black" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Body</label>
                            <textarea value={emailTemplates.expirationBody} onChange={(e) => setEmailTemplates({...emailTemplates, expirationBody: e.target.value})} rows={3} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-black resize-none" placeholder="Your subscription is expiring in 3 days..."></textarea>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="animate-in fade-in duration-300 pb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Subscriptions & Billing</h2>
                <div className="flex items-center gap-3">
                  {billingSuccess && (
                    <div className="inline-block px-3 py-1.5 bg-[#f0fdf4] text-[#166534] text-xs font-semibold rounded border border-[#bbf7d0] shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
                      ✓ {billingSuccess}
                    </div>
                  )}
                  <button onClick={saveBillingSettings} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
                    Save Changes
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 w-full">
                
                {/* Left Column */}
                <div className="space-y-8">
                  
                  {/* Payment Gateway Settings */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Payment Gateways</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure your preferred provider for INR transactions.</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Provider</label>
                        <select 
                          value={paymentGatewaySettings.provider} 
                          onChange={(e) => setPaymentGatewaySettings({...paymentGatewaySettings, provider: e.target.value})}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black"
                        >
                          <option value="razorpay">Razorpay</option>
                          <option value="cashfree">Cashfree</option>
                          <option value="payu">PayU</option>
                          <option value="stripe">Stripe (India)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">API Key / Client ID</label>
                        <input type="text" value={paymentGatewaySettings.apiKey} onChange={(e) => setPaymentGatewaySettings({...paymentGatewaySettings, apiKey: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="rzp_live_xxx..." />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">API Secret / Salt</label>
                        <input type="password" value={paymentGatewaySettings.apiSecret} onChange={(e) => setPaymentGatewaySettings({...paymentGatewaySettings, apiSecret: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="••••••••••••" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Webhook Secret</label>
                        <input type="password" value={paymentGatewaySettings.webhookSecret} onChange={(e) => setPaymentGatewaySettings({...paymentGatewaySettings, webhookSecret: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="••••••••••••" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* Plan & Trial Parameters */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Plan & Trial Configurations</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Control your subscription offerings and trials.</p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Free Trial Duration (Hours)</label>
                        <input type="number" value={planParameters.trialDurationHours} onChange={(e) => setPlanParameters({...planParameters, trialDurationHours: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="24" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer">
                          <input type="checkbox" checked={planParameters.monthlyPlanEnabled} onChange={(e) => setPlanParameters({...planParameters, monthlyPlanEnabled: e.target.checked})} className="w-4 h-4 text-black dark:text-white rounded border-gray-300 dark:border-gray-600 focus:ring-black" />
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Enable Monthly</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer">
                          <input type="checkbox" checked={planParameters.yearlyPlanEnabled} onChange={(e) => setPlanParameters({...planParameters, yearlyPlanEnabled: e.target.checked})} className="w-4 h-4 text-black dark:text-white rounded border-gray-300 dark:border-gray-600 focus:ring-black" />
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Enable Yearly</span>
                        </label>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Yearly Discount Percentage (%)</label>
                        <input type="number" value={planParameters.yearlyDiscountPercentage} onChange={(e) => setPlanParameters({...planParameters, yearlyDiscountPercentage: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="20" />
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* Promo Codes */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Promo & Coupon Codes</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure global discounts for early users.</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="col-span-3 flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Coupon Code</label>
                        <input type="text" value={planParameters.couponCode} onChange={(e) => setPlanParameters({...planParameters, couponCode: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black uppercase" placeholder="EARLYBIRD" />
                      </div>
                      <div className="col-span-2 flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Discount Percentage (%)</label>
                        <input type="number" value={planParameters.couponDiscountPercentage} onChange={(e) => setPlanParameters({...planParameters, couponDiscountPercentage: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="50" />
                      </div>
                      <div className="col-span-1 flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Max Redemptions</label>
                        <input type="number" value={planParameters.couponMaxRedemptions} onChange={(e) => setPlanParameters({...planParameters, couponMaxRedemptions: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="100" />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  
                  {/* Currency & Tax */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Currency & Tax</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure base currency and GST requirements.</p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Base Currency</label>
                        <input type="text" value={taxConfiguration.currency} disabled className="w-full px-3 py-2 bg-gray-200 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg text-sm cursor-not-allowed font-medium" />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">GST (%)</label>
                          <input type="number" value={taxConfiguration.gstPercentage} onChange={(e) => setTaxConfiguration({...taxConfiguration, gstPercentage: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black" placeholder="18" />
                        </div>
                        <div className="col-span-2 flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">GSTIN Number</label>
                          <input type="text" value={taxConfiguration.gstInNumber} onChange={(e) => setTaxConfiguration({...taxConfiguration, gstInNumber: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black uppercase" placeholder="22AAAAA0000A1Z5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  {/* Invoice Settings */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Invoice Settings</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Details that will appear on automated user invoices.</p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Invoice Prefix</label>
                        <input type="text" value={invoiceSettings.invoicePrefix} onChange={(e) => setInvoiceSettings({...invoiceSettings, invoicePrefix: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black uppercase font-mono" placeholder="WAF-" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Registered Business Address</label>
                        <textarea value={invoiceSettings.businessAddress} onChange={(e) => setInvoiceSettings({...invoiceSettings, businessAddress: e.target.value})} rows={3} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black resize-none" placeholder="123 Startup Tower, Tech City..."></textarea>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Company Signature (Text)</label>
                        <textarea value={invoiceSettings.companySignature} onChange={(e) => setInvoiceSettings({...invoiceSettings, companySignature: e.target.value})} rows={2} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-black resize-none" placeholder="Auth. Signatory, Waflow Inc."></textarea>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
