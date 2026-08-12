import { useState, useEffect } from 'react';

interface DateTimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // YYYY-MM-DD
  initialTime?: string; // HH:mm in 24h
  onConfirm: (dateStr: string, timeStr: string, displayStr: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const AMPM = ['AM', 'PM'];

export default function DateTimePickerModal({
  isOpen,
  onClose,
  initialDate,
  initialTime,
  onConfirm,
}: DateTimePickerModalProps) {
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth());
  const [selDay, setSelDay] = useState<number>(new Date().getDate());
  
  const [selHour, setSelHour] = useState<string>('03');
  const [selMinute, setSelMinute] = useState<string>('05');
  const [selAmPm, setSelAmPm] = useState<'AM' | 'PM'>('PM');
  const [mode, setMode] = useState<'calendar' | 'monthYear'>('calendar');

  useEffect(() => {
    if (isOpen) {
      setMode('calendar');
      if (initialDate && initialTime) {
        const parts = initialDate.split('-');
        if (parts.length === 3) {
          setViewYear(parseInt(parts[0], 10));
          setViewMonth(parseInt(parts[1], 10) - 1);
          setSelDay(parseInt(parts[2], 10));
        }
        const tParts = initialTime.split(':');
        if (tParts.length >= 2) {
          let h = parseInt(tParts[0], 10);
          const m = parseInt(tParts[1], 10);
          const ap: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
          if (h === 0) h = 12;
          else if (h > 12) h -= 12;
          setSelHour(String(h).padStart(2, '0'));
          setSelMinute(String(Math.floor(m / 5) * 5).padStart(2, '0'));
          setSelAmPm(ap);
        }
      } else {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
        setSelDay(now.getDate());
        let h = now.getHours();
        const ap: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;
        setSelHour(String(h).padStart(2, '0'));
        setSelMinute('05');
        setSelAmPm(ap);
      }
    }
  }, [isOpen, initialDate, initialTime]);

  if (!isOpen) return null;

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleOK = () => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(selDay).padStart(2, '0');
    const yearStr = String(viewYear);

    let h24 = parseInt(selHour, 10);
    if (selAmPm === 'AM' && h24 === 12) h24 = 0;
    else if (selAmPm === 'PM' && h24 < 12) h24 += 12;

    const timeStr = `${String(h24).padStart(2, '0')}:${selMinute}`;
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
    const displayStr = `${monthStr}/${dayStr}/${yearStr} ${selHour}:${selMinute} ${selAmPm}`;

    onConfirm(dateStr, timeStr, displayStr);
  };

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-5 w-[440px] max-w-[95vw] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-row gap-4">
          {/* Left Column: Calendar (approx 55%) */}
          <div className="w-[55%] flex flex-col">
            {mode === 'monthYear' ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                  <button 
                    type="button"
                    onClick={() => setMode('calendar')}
                    className="flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 text-xs hover:underline cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back
                  </button>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setViewYear(y => y - 1)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded font-bold cursor-pointer">&lt;</button>
                    <select 
                      value={viewYear} 
                      onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-xs px-2 py-1 rounded border-none cursor-pointer focus:ring-1 focus:ring-brand-500"
                    >
                      {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setViewYear(y => y + 1)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded font-bold cursor-pointer">&gt;</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 flex-1 items-center py-1">
                  {MONTH_NAMES.map((m, idx) => {
                    const isSelMonth = idx === viewMonth;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setViewMonth(idx);
                          setMode('calendar');
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                          isSelMonth
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
                        }`}
                      >
                        {m.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Month Year Header */}
                <div className="flex items-center justify-between mb-4">
                  <div 
                    onClick={() => setMode('monthYear')} 
                    className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white text-base cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition py-1 px-2 -ml-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    title="Click to change Month or Year"
                  >
                    <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      type="button" 
                      onClick={prevMonth} 
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition cursor-pointer"
                      title="Previous Month"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button 
                      type="button" 
                      onClick={nextMonth} 
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg transition cursor-pointer"
                      title="Next Month"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {DAYS_OF_WEEK.map((d, i) => (
                    <div key={i} className="text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center flex-1">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-8 h-8" />
                  ))}
                  {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected = dayNum === selDay;
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => setSelDay(dayNum)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition mx-auto cursor-pointer ${
                          isSelected
                            ? 'bg-brand-600 text-white font-bold shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right Column: Time Picker Columns (approx 45%) */}
          <div className="w-[45%] border-l border-gray-200 dark:border-gray-800 pl-3 flex flex-col">
            <div className="grid grid-cols-3 gap-1.5 flex-1 max-h-[250px]">
              {/* Hour Column */}
              <div className="flex flex-col overflow-y-auto max-h-[250px] pr-0.5 space-y-1">
                {HOURS.map((h) => {
                  const isSelected = h === selHour;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelHour(h)}
                      className={`py-1.5 px-2 rounded-lg text-sm text-center transition w-full block ${
                        isSelected
                          ? 'bg-brand-600 text-white font-bold shadow-sm order-first sticky top-0 z-10'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>

              {/* Minute Column */}
              <div className="flex flex-col overflow-y-auto max-h-[250px] pr-0.5 space-y-1">
                {MINUTES.map((m) => {
                  const isSelected = m === selMinute;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelMinute(m)}
                      className={`py-1.5 px-2 rounded-lg text-sm text-center transition w-full block ${
                        isSelected
                          ? 'bg-brand-600 text-white font-bold shadow-sm order-first sticky top-0 z-10'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>

              {/* AM/PM Column */}
              <div className="flex flex-col overflow-y-auto max-h-[250px] space-y-1">
                {AMPM.map((ap) => {
                  const isSelected = ap === selAmPm;
                  return (
                    <button
                      key={ap}
                      type="button"
                      onClick={() => setSelAmPm(ap as 'AM' | 'PM')}
                      className={`py-1.5 px-2 rounded-lg text-sm text-center transition w-full block ${
                        isSelected
                          ? 'bg-brand-600 text-white font-bold shadow-sm order-first sticky top-0 z-10'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
                      }`}
                    >
                      {ap}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom OK Button */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={handleOK}
            className="px-6 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold text-sm rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 shadow-md transition"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

