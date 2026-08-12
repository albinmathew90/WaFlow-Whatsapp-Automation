export default function IntegrationFlowTab() {
  const steps = [
    {
      num: 1,
      title: "Your Website / App",
      description: "Customer requests an OTP during login, signup, or checkout.",
      color: "from-brand-500 to-cyan-400",
      bg: "bg-brand-50 dark:bg-brand-900/20",
      textColor: "text-brand-600 dark:text-brand-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      )
    },
    {
      num: 2,
      title: "Your Backend Server",
      description: "Your server securely calls the Waflow Send OTP API using your App ID and Secret Key.",
      color: "from-brand-500 to-purple-500",
      bg: "bg-brand-50 dark:bg-brand-900/20",
      textColor: "text-brand-600 dark:text-brand-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" />
        </svg>
      )
    },
    {
      num: 3,
      title: "Waflow Infrastructure",
      description: "Waflow validates the request, prepares the WhatsApp template, and queues the message.",
      color: "from-brand-500 to-brand-400",
      bg: "bg-brand-50 dark:bg-brand-900/20",
      textColor: "text-brand-600 dark:text-brand-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      )
    },
    {
      num: 4,
      title: "Customer Delivery",
      description: "Customer receives the OTP instantly via WhatsApp and types it into your application.",
      color: "from-green-500 to-emerald-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      )
    },
    {
      num: 5,
      title: "Verification & Auth",
      description: "Your server calls the Verify OTP API. On success, securely authenticate your user.",
      color: "from-teal-500 to-emerald-500",
      bg: "bg-teal-50 dark:bg-teal-900/20",
      textColor: "text-teal-600 dark:text-teal-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Integration Flow</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
          Understand exactly how the Waflow OTP Builder seamlessly connects your application stack to WhatsApp.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm p-6 md:p-10 relative overflow-hidden">
        
        {/* Subtle Background Pattern/Glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-brand-500/10 dark:bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.num} className="relative flex group">
              {/* Connecting Line (except for last item) */}
              {index !== steps.length - 1 && (
                <div className="absolute top-14 left-7 bottom-[-24px] w-0.5 bg-gradient-to-b from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800 group-hover:from-brand-300 group-hover:to-gray-200 dark:group-hover:from-brand-600 dark:group-hover:to-gray-700 transition-colors duration-500"></div>
              )}

              {/* Step Number / Icon Container */}
              <div className="relative z-10 flex-shrink-0 flex flex-col items-center mr-6 md:mr-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 shadow-sm group-hover:scale-110 group-hover:border-transparent transition-all duration-300 relative`}>
                  {/* Hover Gradient Border Effect */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-[2px] scale-[1.05]`}></div>
                  
                  {/* Inner Icon Circle */}
                  <div className={`w-full h-full rounded-2xl flex items-center justify-center ${step.bg} ${step.textColor} bg-white dark:bg-gray-900 z-10 group-hover:bg-transparent group-hover:text-white transition-colors duration-300`}>
                    {step.icon}
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <div className="pb-10 pt-2 flex-1">
                <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/60 rounded-2xl p-5 md:p-6 group-hover:-translate-y-1 group-hover:shadow-md transition-all duration-300 relative overflow-hidden">
                  
                  {/* Step Number Badge */}
                  <div className={`absolute top-0 right-0 px-3 py-1 bg-gradient-to-r ${step.color} text-white text-xs font-bold rounded-bl-xl opacity-90`}>
                    STEP {step.num}
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 flex items-center gap-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed max-w-xl">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

