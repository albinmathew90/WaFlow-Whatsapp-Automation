import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

import WhatsAppPreview from "../../components/Templates/WhatsAppPreview";
import AiGeneratorTab from "../../components/Templates/AiGeneratorTab";
import LocationPicker from "../../components/common/LocationPicker";
import MediaSelectorModal from "../../components/common/MediaSelectorModal";

interface ButtonData {
  type: 'url' | 'phone' | 'quick_reply';
  text: string;
  value?: string; // URL or Phone number
}

export default function CreateTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const editId = searchParams.get('edit');

  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');

  // Base Settings
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState<'Marketing' | 'Utility' | 'Authentication'>('Marketing');
  const [language, setLanguage] = useState('English');
  const [type, setType] = useState('Text'); // Text, Image, Video, Document, Location, Carousel, Catalog, Limited Time Offer

  // Content State
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [buttons, setButtons] = useState<ButtonData[]>([]);
  
  const [popupMessage, setPopupMessage] = useState<{ title: string; message: string; type?: 'error' | 'success' } | null>(null);

  // Interactive Actions State
  const [actionType, setActionType] = useState('none'); // none, cta, quick_reply, all

  // Location State
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLong, setLocationLong] = useState('');

  // Carousel State
  const [carouselCards, setCarouselCards] = useState<any[]>([]);

  // Catalog State
  const [catalogId, setCatalogId] = useState('');
  const [catalogThumbnail, setCatalogThumbnail] = useState('');

  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [carouselModalIndex, setCarouselModalIndex] = useState<number | null>(null);

  // Load existing template if editing
  useEffect(() => {
    if (editId) {
      const loadTemplate = async () => {
        try {
          const token = sessionStorage.getItem('crm_token');
          const res = await fetch(`/openwa-api/crm/templates/${editId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const found = await res.json();
            setTemplateName(found.name);
            setCategory(found.category);
            setLanguage(found.language);
            setType(found.type);

            if (found) {
              setHeader(found.header || found.content?.header || '');
              setBody(found.body || found.content?.body || '');
              setFooter(found.footer || found.content?.footer || '');
              setMediaUrl(found.content?.mediaUrl || '');
              setButtons(found.content?.buttons || []);
              setMappings(found.content?.mappings || {});
              
              setLocationName(found.content?.locationName || '');
              setLocationAddress(found.content?.locationAddress || '');
              setLocationLat(found.content?.locationLat || '');
              setLocationLong(found.content?.locationLong || '');
              setCarouselCards(found.content?.carouselCards || []);
              setCatalogId(found.content?.catalogId || '');
              setCatalogThumbnail(found.content?.catalogThumbnail || '');

              // Guess action type based on buttons
              if (found.content?.buttons && found.content.buttons.length > 0) {
                const hasCta = found.content.buttons.some((b: any) => b.type === 'url' || b.type === 'phone');
                const hasQr = found.content.buttons.some((b: any) => b.type === 'quick_reply');
                if (hasCta && hasQr) setActionType('all');
                else if (hasCta) setActionType('cta');
                else if (hasQr) setActionType('quick_reply');
              }
            }
          }
        } catch (e) {
          console.error("Error loading template for edit", e);
        }
      };
      loadTemplate();
    }
  }, [editId]);

  const addAction = (btnType: 'url' | 'phone' | 'quick_reply') => {
    setButtons(prev => [...prev, { type: btnType, text: '', value: '' }]);
  };

  const updateAction = (index: number, field: keyof ButtonData, value: string) => {
    const newBtns = [...buttons];
    newBtns[index] = { ...newBtns[index], [field]: value };
    setButtons(newBtns);
  };

  const removeAction = (index: number) => {
    setButtons(prev => prev.filter((_, i) => i !== index));
  };

  const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionType(e.target.value);
    setButtons([]); // Clear existing when switching types
  };

  const handleSave = async () => {
    if (!templateName || !category || !language || !body) {
      setPopupMessage({ title: 'Validation Error', message: 'Please fill all required fields', type: 'error' });
      return;
    }

    const payload = {
      ...(editId ? { id: editId } : {}),
      name: templateName,
      category,
      language,
      type,
      header,
      body,
      footer,
      isFavorite: false,
      content: {
        header,
        body,
        footer,
        mediaUrl,
        buttons,
        ...(type === 'Location' && { locationName, locationAddress, locationLat, locationLong }),
        ...(type === 'Carousel' && { carouselCards }),
        ...(type === 'Catalog' && { catalogId, catalogThumbnail })
      }
    };

    try {
      const token = sessionStorage.getItem('crm_token');
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `/openwa-api/crm/templates/${editId}` : '/openwa-api/crm/templates';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save');
      }
      navigate('/templates');
    } catch (e: any) {
      console.error("Save failed", e);
      setPopupMessage({ title: 'Save Failed', message: e.message || 'An error occurred while saving. Are you logged in?', type: 'error' });
    }
  };

  const handleAiGenerate = (data: any) => {
    setCategory(data.category);
    setLanguage(data.language);
    setType(data.type);
    if (data.content) {
      setHeader(data.content.header || '');
      setBody(data.content.body || '');
      setFooter(data.content.footer || '');
      setButtons(data.content.buttons || []);

      const hasCta = data.content.buttons?.some((b: any) => b.type === 'url' || b.type === 'phone');
      if (hasCta) setActionType('cta');
    }
    setActiveTab('manual'); // Switch to manual tab to see results
  };

  const commonSettingsJSX = (
    <>
      {/* Meta Settings Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label>Template Name *</Label>
            <Input 
              type="text" 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
              placeholder="e.g. order_confirmation"
            />
            <p className="text-xs text-gray-500 mt-1">Only lowercase, alphanumeric characters, and underscores allowed.</p>
          </div>
          
          <div>
            <Label>Category</Label>
            <div className="relative mt-2">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              >
                <option value="Marketing">Marketing (Promotional, Offers)</option>
                <option value="Utility">Utility (Transactional, Updates)</option>
                <option value="Authentication">Authentication (OTP, Login)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          <div>
            <Label>Language</Label>
            <div className="relative mt-2">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Hindi">Hindi</option>
                <option value="Arabic">Arabic</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Type & Uploader */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Template Settings</h3>
          <Label>Template Type</Label>
          <div className="relative mt-2 w-full lg:w-1/2">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setHeader('');
                setMediaUrl('');
              }}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
            >
              <option value="Text">Text Only</option>
              <option value="Image">Image</option>
              <option value="Video">Video</option>
              <option value="Document">Document</option>
              <option value="Location">Location</option>
              <option value="Carousel">Carousel</option>
              <option value="Catalog">Catalog</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>

        {(type === 'Image' || type === 'Video' || type === 'Document') && (
          <>
            <hr className="border-gray-100 dark:border-gray-800" />
            <div>
              <Label>Select / Upload {type}</Label>
              <div className="mt-2 flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-8 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setMediaModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-700 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Select from Media Library / Upload
                    </button>
                  </div>
                  {mediaUrl && (
                    <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg inline-block max-w-full">
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium break-all">✓ Selected: {mediaUrl}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {type === 'Location' && (
          <>
            <hr className="border-gray-100 dark:border-gray-800" />
            <div>
              <h3 className="text-md font-semibold mb-3 dark:text-white">Location Details</h3>
              <LocationPicker 
                initialLat={locationLat}
                initialLong={locationLong}
                initialName={locationName}
                initialAddress={locationAddress}
                onChange={(data) => {
                  setLocationLat(data.lat);
                  setLocationLong(data.long);
                  setLocationName(data.name);
                  setLocationAddress(data.address);
                }}
              />
            </div>
          </>
        )}

        {type === 'Catalog' && (
          <>
            <hr className="border-gray-100 dark:border-gray-800" />
            <div>
              <h3 className="text-md font-semibold mb-3 dark:text-white">Catalog Details</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Catalog ID</Label>
                  <Input value={catalogId} onChange={(e) => setCatalogId(e.target.value)} placeholder="e.g. 1234567890" />
                </div>
                <div>
                  <Label>Thumbnail URL or Upload</Label>
                  <div className="flex gap-2 items-center mt-2">
                    <Input value={catalogThumbnail} onChange={(e) => setCatalogThumbnail(e.target.value)} placeholder="e.g. https://..." className="flex-1" />
                    
                    <label className="shrink-0 cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Upload
                      <input type="file" className="sr-only" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCatalogThumbnail(URL.createObjectURL(file));
                        }
                      }} accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {type === 'Carousel' && (
          <>
            <hr className="border-gray-100 dark:border-gray-800" />
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-semibold dark:text-white">Carousel Cards</h3>
                <button 
                  type="button"
                  onClick={() => {
                    if (carouselCards.length < 10) {
                      setCarouselCards([...carouselCards, { mediaUrl: '', body: '', buttons: [] }]);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold text-sm transition shadow-xs border border-gray-200 dark:border-gray-700 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Card
                </button>
              </div>
              
              <div className="space-y-4">
                {carouselCards.map((card, idx) => (
                  <div key={idx} className="p-4 border rounded-xl dark:border-gray-800 space-y-4 relative bg-gray-50 dark:bg-gray-800/30">
                    <button onClick={() => setCarouselCards(cards => cards.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-red-500 hover:text-red-600 bg-white dark:bg-gray-700 rounded-full p-1 shadow-sm">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <h4 className="font-medium text-sm dark:text-white">Card {idx + 1}</h4>
                    <div className="flex flex-col gap-2">
                      <Label>Image URL or Upload</Label>
                      <div className="flex gap-2 items-center">
                        <Input value={card.mediaUrl} onChange={e => {
                          const newCards = [...carouselCards];
                          newCards[idx].mediaUrl = e.target.value;
                          setCarouselCards(newCards);
                        }} placeholder="https://..." className="flex-1" />
                        
                        <button
                          type="button"
                          onClick={() => setCarouselModalIndex(idx)}
                          className="shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          Media Library
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label>Body Text</Label>
                      <Input value={card.body} onChange={e => {
                        const newCards = [...carouselCards];
                        newCards[idx].body = e.target.value;
                        setCarouselCards(newCards);
                      }} placeholder="Card body..." />
                    </div>
                  </div>
                ))}
                {carouselCards.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No cards added. Click "Add Card" to begin.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  const interactiveActionsJSX = (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Interactive Actions</h3>
        <div className="relative w-full lg:w-1/2">
          <select
            value={actionType}
            onChange={handleActionTypeChange}
            className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
          >
            <option value="none">None</option>
            <option value="cta">Call-To-Action (URL/Phone Buttons)</option>
            <option value="quick_reply">Quick Replies</option>
            <option value="all">Both CTA & Quick Replies</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {actionType !== 'none' && (
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">

          {buttons.map((btn, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 relative group">
              <button
                onClick={() => removeAction(index)}
                className="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="sm:w-1/3">
                <Label>Button Type</Label>
                <div className="relative mt-1">
                  <select
                    value={btn.type}
                    onChange={(e) => updateAction(index, 'type', e.target.value as any)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    {(actionType === 'cta' || actionType === 'all') && (
                      <>
                        <option value="url">URL Visit</option>
                        <option value="phone">Phone Call</option>
                      </>
                    )}
                    {(actionType === 'quick_reply' || actionType === 'all') && (
                      <option value="quick_reply">Quick Reply</option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="sm:w-1/3">
                <Label>Button Text</Label>
                <input
                  type="text"
                  value={btn.text}
                  onChange={(e) => updateAction(index, 'text', e.target.value)}
                  placeholder="e.g. Buy Now"
                  maxLength={25}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              {btn.type !== 'quick_reply' && (
                <div className="sm:w-1/3">
                  <Label>{btn.type === 'url' ? 'URL Link' : 'Phone Number'}</Label>
                  <input
                    type="text"
                    value={btn.value || ''}
                    onChange={(e) => updateAction(index, 'value', e.target.value)}
                    placeholder={btn.type === 'url' ? "https://" : "+1234567890"}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-3">
            {(actionType === 'cta' || actionType === 'all') && buttons.filter(b => b.type !== 'quick_reply').length < 2 && (
              <Button variant="outline" size="sm" onClick={() => addAction('url')}>+ Add CTA Button</Button>
            )}
            {(actionType === 'quick_reply' || actionType === 'all') && buttons.filter(b => b.type === 'quick_reply').length < 3 && (
              <Button variant="outline" size="sm" onClick={() => addAction('quick_reply')}>+ Add Quick Reply</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageMeta title="Create Template | Waflow" description="Build a new WhatsApp Template" />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/templates" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editId ? 'Edit Template' : 'Create Template'}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/templates')}>Cancel</Button>
          <Button onClick={handleSave}>{editId ? 'Update Template' : 'Save Template'}</Button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('manual')}
              className={`pb-3 px-4 text-sm font-semibold transition-colors ${activeTab === 'manual' ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              Template Builder
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'ai' ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
            >
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.6H22l-6.2 4.6 2.4 7.6-6.2-4.6-6.2 4.6 2.4-7.6-6.2-4.6h7.6z" /></svg>
              Generate with AI
            </button>
          </div>

          {activeTab === 'ai' ? (
            <div className="space-y-6">
              <AiGeneratorTab onGenerate={handleAiGenerate} />
            </div>
          ) : (
            <div className="space-y-6">
              {commonSettingsJSX}

              {/* Dynamic Content Builder */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Message Content</h3>
                </div>

                {/* Text Header (Only for text templates) */}
                {type === 'Text' && (
                  <div>
                    <Label>Header (Optional)</Label>
                    <Input
                      type="text"
                      value={header}
                      onChange={(e) => setHeader(e.target.value)}
                      placeholder="Add a short header title..."
                      className="mt-2 font-bold"
                    />
                  </div>
                )}

                {/* Body Text */}
                <div>
                  <div className="flex justify-between">
                    <Label>Body Message *</Label>
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter your message here..."
                    className="mt-2 w-full h-40 rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white placeholder:text-gray-400 resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Enter the message content. Use <b className="text-brand-600 dark:text-brand-400">{"{{name}}"}</b> to personalize the message with each contact's name.
                  </p>
                </div>

                {/* Footer Text */}
                <div>
                  <Label>Footer (Optional)</Label>
                  <Input
                    type="text"
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    placeholder="Add a short footer (e.g. Reply STOP to opt out)"
                    className="mt-2 text-gray-500"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              {interactiveActionsJSX}
            </div>
          )}
        </div>

        {/* Right Column: Live Preview Sticky Panel */}
        <div className="lg:col-span-1 lg:sticky lg:top-24">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-inner">
            <div className="w-full lg:w-[350px] shrink-0 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Preview</h3>
              <WhatsAppPreview 
                type={type}
                headerText={header} 
                bodyText={body} 
                footerText={footer} 
                mediaUrl={mediaUrl}
                buttons={buttons}
                locationData={{ locationName, locationAddress, locationLat, locationLong }}
                carouselCards={carouselCards}
                catalogData={{ catalogId, catalogThumbnail }}
              />
            </div>
            <p className="text-center text-xs text-gray-400 mt-6 px-4">
              This preview shows how your message will appear on a customer's WhatsApp device.
            </p>
          </div>
        </div>

      </div>

      {popupMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${popupMessage.type === 'error' ? 'bg-error-50 text-error-500 dark:bg-error-500/10 dark:text-error-400' : 'bg-success-50 text-success-500 dark:bg-success-500/10 dark:text-success-400'}`}>
                {popupMessage.type === 'error' ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{popupMessage.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{popupMessage.message}</p>
              <button 
                onClick={() => setPopupMessage(null)}
                className="mt-6 w-full py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaSelectorModal
        isOpen={mediaModalOpen || carouselModalIndex !== null}
        onClose={() => {
          setMediaModalOpen(false);
          setCarouselModalIndex(null);
        }}
        onSelect={(media) => {
          if (carouselModalIndex !== null) {
            const newCards = [...carouselCards];
            newCards[carouselModalIndex].mediaUrl = media.url;
            setCarouselCards(newCards);
          } else {
            setMediaUrl(media.url);
          }
        }}
        defaultFilter={type === 'Image' ? 'image' : type === 'Video' ? 'video' : type === 'Document' ? 'document' : 'all'}
      />
    </>
  );
}

