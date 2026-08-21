import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';
import { AdminAPI } from '../../api/admin';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import MediaPickerModal from '../../components/ui/MediaPickerModal';

type SEOData = {
  id: number;
  url: string;
  title: string;
  createdAt: string;
  canonicalUrl: string;
  description: string;
  keywords: string;
  image: string;
  author: string;
  robots: string;
  viewport: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogUrl: string;
  ogSiteName: string;
  ogLocale: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite: string;
  twitterCreator: string;
  structuredData: string;
  updatedAt: string;
};

type FilterRule = {
  id: string;
  logic: 'and' | 'or';
  column: keyof SEOData;
  operator: string;
  value: string;
};

const INITIAL_DATA: SEOData[] = [];

const COLUMN_LABELS: Record<keyof SEOData, string> = {
  url: 'Url',
  title: 'Title',
  createdAt: 'Created At',
  id: 'ID',
  canonicalUrl: 'Canonical Url',
  description: 'Description',
  keywords: 'Keywords',
  image: 'Image',
  author: 'Author',
  robots: 'Robots',
  viewport: 'Viewport',
  ogTitle: 'Open Graph > Og Title',
  ogDescription: 'Open Graph > Og Description',
  ogImage: 'Open Graph > Og Image',
  ogType: 'Open Graph > Og Type',
  ogUrl: 'Open Graph > Og Url',
  ogSiteName: 'Open Graph > Og Site Name',
  ogLocale: 'Open Graph > Og Locale',
  twitterCard: 'Twitter / X Card > Twitter Card',
  twitterTitle: 'Twitter / X Card > Twitter Title',
  twitterDescription: 'Twitter / X Card > Twitter Description',
  twitterImage: 'Twitter / X Card > Twitter Image',
  twitterSite: 'Twitter / X Card > Twitter Site',
  twitterCreator: 'Twitter / X Card > Twitter Creator',
  structuredData: 'Structured Data (JSON-LD)',
  updatedAt: 'Updated At'
};

const SEOPage: React.FC = () => {
  const [items, setItems] = useState<SEOData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'none' | 'columns' | 'filters'>('none');
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [activeMediaField, setActiveMediaField] = useState<'image' | 'ogImage' | 'twitterImage' | null>(null);
  
  const [image, setImage] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageWarning, setImageWarning] = useState('');
  
  const [ogImage, setOgImage] = useState<string | null>(null);
  const [twitterImage, setTwitterImage] = useState<string | null>(null);
  
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [canonicalUrlError, setCanonicalUrlError] = useState('');
  
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [titleWarning, setTitleWarning] = useState('');
  
  const [description, setDescription] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [descriptionWarning, setDescriptionWarning] = useState('');
  
  const [keywords, setKeywords] = useState('');
  const [keywordsError, setKeywordsError] = useState('');
  const [keywordsWarning, setKeywordsWarning] = useState('');
  
  const [author, setAuthor] = useState('');
  const [authorWarning, setAuthorWarning] = useState('');
  
  const [robots, setRobots] = useState('');
  const [robotsWarning, setRobotsWarning] = useState('');
  
  const [viewport, setViewport] = useState('width=device-width, initial-scale=1');
  const [viewportWarning, setViewportWarning] = useState('');
  
  const [ogTitle, setOgTitle] = useState('');
  const [ogTitleWarning, setOgTitleWarning] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogDescriptionWarning, setOgDescriptionWarning] = useState('');
  const [ogType, setOgType] = useState('website');
  const [ogUrl, setOgUrl] = useState('');
  const [ogUrlWarning, setOgUrlWarning] = useState('');
  const [ogSiteName, setOgSiteName] = useState('');
  const [ogSiteNameWarning, setOgSiteNameWarning] = useState('');
  const [ogLocale, setOgLocale] = useState('en_US');
  const [ogLocaleError, setOgLocaleError] = useState('');
  
  const [twitterCard, setTwitterCard] = useState('summary_large_image');
  const [twitterCardWarning, setTwitterCardWarning] = useState('');
  const [twitterTitle, setTwitterTitle] = useState('');
  const [twitterTitleWarning, setTwitterTitleWarning] = useState('');
  const [twitterDescription, setTwitterDescription] = useState('');
  const [twitterDescriptionWarning, setTwitterDescriptionWarning] = useState('');
  const [twitterSite, setTwitterSite] = useState('');
  const [twitterSiteWarning, setTwitterSiteWarning] = useState('');
  const [twitterCreator, setTwitterCreator] = useState('');
  const [twitterCreatorWarning, setTwitterCreatorWarning] = useState('');
  
  const [structuredData, setStructuredData] = useState('');
  const [structuredDataError, setStructuredDataError] = useState('');
  const [structuredDataWarning, setStructuredDataWarning] = useState('');
  
  useEffect(() => {
    let warning = '';
    const r = robots.toLowerCase();
    
    if (url && (url.includes('/staging/') || url.includes('/admin/') || url.includes('/preview/'))) {
      if (!r.includes('noindex') || !r.includes('nofollow')) {
        warning = 'Warning: This looks like a private URL. You should probably use "noindex, nofollow".';
      }
    }
    
    const isCanonical = canonicalUrl.trim() === '' || canonicalUrl === url;
    if (isCanonical && r.includes('noindex')) {
       warning = warning || 'Warning: You are adding "noindex" to a canonical page. This is a contradiction.';
    }
    
    setRobotsWarning(warning);
  }, [robots, url, canonicalUrl]);
  
  useEffect(() => {
    let authWarning = '';
    let sdWarning = '';
    
    if (structuredData.trim() !== '') {
      try {
        const jsonLd = JSON.parse(structuredData);
        
        const type = jsonLd['@type'];
        if (type === 'Article' || type === 'BlogPosting') {
           if (!jsonLd.headline || !jsonLd.author || !jsonLd.datePublished || !jsonLd.image) {
              sdWarning += `Missing required properties for ${type} (headline, author, datePublished, image). `;
           }
        } else if (type === 'Product') {
           if (!jsonLd.name || !jsonLd.offers || !jsonLd.sku) {
              sdWarning += `Missing required properties for Product (name, offers, sku). `;
           }
        }
        
        if (author.trim() !== '') {
            let jsonAuthorName = '';
            if (jsonLd.author) {
               if (typeof jsonLd.author === 'string') jsonAuthorName = jsonLd.author;
               else if (jsonLd.author.name) jsonAuthorName = jsonLd.author.name;
               else if (Array.isArray(jsonLd.author) && jsonLd.author[0]?.name) jsonAuthorName = jsonLd.author[0].name;
            }
            if (jsonAuthorName && jsonAuthorName.toLowerCase() !== author.toLowerCase()) {
               authWarning = `Warning: Author mismatch. Structured Data says "${jsonAuthorName}". This hurts E-E-A-T signals.`;
            }
        }
        
        if (title.trim() !== '' && jsonLd.headline) {
            if (jsonLd.headline.toLowerCase() !== title.toLowerCase()) {
               sdWarning += `Headline mismatch with Form Title. `;
            }
        }
        
        if (image && jsonLd.image) {
            let jsonImageUrl = '';
            if (typeof jsonLd.image === 'string') jsonImageUrl = jsonLd.image;
            else if (jsonLd.image.url) jsonImageUrl = jsonLd.image.url;
            else if (Array.isArray(jsonLd.image) && typeof jsonLd.image[0] === 'string') jsonImageUrl = jsonLd.image[0];
            else if (Array.isArray(jsonLd.image) && jsonLd.image[0]?.url) jsonImageUrl = jsonLd.image[0].url;
            
            if (jsonImageUrl && jsonImageUrl !== image) {
               sdWarning += `Image mismatch with Form Image. `;
            }
        }
      } catch (e) {
         // handled by structuredDataError
      }
    }
    
    setAuthorWarning(authWarning);
    setStructuredDataWarning(sdWarning ? 'Warning: ' + sdWarning : '');
  }, [author, title, image, structuredData]);
  
  useEffect(() => {
    if (image) {
      const img = new window.Image();
      img.onload = () => {
        if (img.width < 1200 || img.height < 630) {
          setImageWarning(`Warning: Image is ${img.width}x${img.height}. Recommended is ≥1200x630px for quality previews.`);
        } else {
          setImageWarning('');
        }
      };
      img.src = image;
    } else {
      setImageWarning('');
    }
  }, [image]);
  
  useEffect(() => {
    if (ogUrl.trim() !== '') {
      const canonical = canonicalUrl.trim() === '' ? url : canonicalUrl;
      if (ogUrl !== canonical) {
         setOgUrlWarning('Warning: Og Url should match the Canonical URL to prevent share-count fragmentation.');
      } else {
         setOgUrlWarning('');
      }
    } else {
      setOgUrlWarning('');
    }
  }, [ogUrl, canonicalUrl, url]);
  
  useEffect(() => {
    const hasAnyImage = !!(twitterImage || ogImage || image);
    if (hasAnyImage && twitterCard === 'summary') {
      setTwitterCardWarning('Warning: A large image is available. "summary_large_image" is preferred for higher engagement.');
    } else if (twitterCard === 'app') {
      setTwitterCardWarning('Warning: "app" card requires additional app ID tags (e.g., twitter:app:id:iphone) which are not supported in this basic form.');
    } else if (twitterCard === 'player') {
      setTwitterCardWarning('Warning: "player" card requires a secure iframe player URL (twitter:player) and dimensions, which are not supported in this basic form.');
    } else {
      setTwitterCardWarning('');
    }
  }, [twitterCard, twitterImage, ogImage, image]);
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    
    if (val.trim() === '') {
      setUrlError('');
      return;
    }
    if (val.includes('?')) {
      setUrlError('Query strings are not allowed.');
      return;
    }
    if (val !== '/' && val.endsWith('/')) {
      setUrlError('No trailing slashes allowed.');
      return;
    }
    if (!/^[a-z0-9\-\/]+$/.test(val)) {
      setUrlError('URL must be lowercase and hyphen-separated.');
      return;
    }
    if (items.some(item => item.url === val)) {
      setUrlError('An SEO configuration for this URL already exists.');
      return;
    }
    setUrlError('');
  };
  
  const handleCanonicalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCanonicalUrl(val);
    
    if (val.trim() === '') {
      setCanonicalUrlError('');
      return;
    }
    
    if (!/^https?:\/\//i.test(val)) {
      setCanonicalUrlError('Canonical URL must be a full absolute URL (including http:// or https://).');
      return;
    }
    
    try {
      new URL(val);
      setCanonicalUrlError('');
    } catch (error) {
      setCanonicalUrlError('Please enter a valid URL.');
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    
    if (val.trim() === '') {
      setTitleError('');
      setTitleWarning('');
      return;
    }
    
    if (items.some(item => item.title.toLowerCase() === val.toLowerCase())) {
      setTitleError('An SEO configuration with this title already exists.');
      setTitleWarning('');
      return;
    }
    
    if (val.length > 70) {
      setTitleError(`Title is too long (${val.length} chars). Over 70 characters will cause severe truncation.`);
      setTitleWarning('');
      return;
    } else {
      setTitleError('');
    }
    
    if (val.length < 50) {
      setTitleWarning(`Title is too short (${val.length} chars). Aim for 50-60 characters.`);
    } else if (val.length > 60) {
      setTitleWarning(`Title is slightly too long (${val.length} chars). Aim for 50-60 characters.`);
    } else {
      setTitleWarning('');
    }
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
    
    if (val.trim() === '') {
      setDescriptionError('');
      setDescriptionWarning('');
      return;
    }
    
    if (title.trim() !== '' && val.toLowerCase() === title.toLowerCase()) {
      setDescriptionError('Description cannot be identical to the Title.');
      setDescriptionWarning('');
      return;
    }
    
    if (items.some(item => item.description && item.description.toLowerCase() === val.toLowerCase())) {
      setDescriptionError('An SEO configuration with this description already exists.');
      setDescriptionWarning('');
      return;
    }
    
    if (val.length > 160) {
      setDescriptionError(`Description is too long (${val.length} chars). Over 160 characters will be truncated.`);
      setDescriptionWarning('');
      return;
    } else {
      setDescriptionError('');
    }
    
    if (val.length < 150) {
      setDescriptionWarning(`Description is short (${val.length} chars). Aim for 150-160 characters.`);
    } else {
      setDescriptionWarning('');
    }
  };
  
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeywords(val);
    
    if (val.trim() === '') {
      setKeywordsError('');
      setKeywordsWarning('');
      return;
    }
    
    const keywordList = val.split(',').map(k => k.trim()).filter(k => k !== '');
    
    if (keywordList.length > 8) {
      setKeywordsError(`Too many keywords (${keywordList.length}/8). Maximum is 8.`);
      setKeywordsWarning('');
      return;
    } else {
      setKeywordsError('');
    }
    
    // Using Title/Description as a proxy for 'content' to flag missing keywords
    const combinedContent = `${title} ${description}`.toLowerCase();
    const missingKeywords = keywordList.filter(k => !combinedContent.includes(k.toLowerCase()));
    
    if (missingKeywords.length > 0) {
      setKeywordsWarning(`Warning: Some keywords (${missingKeywords.join(', ')}) do not appear in your Title or Description.`);
    } else {
      setKeywordsWarning('');
    }
  };
  
  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthor(e.target.value);
  };
  
  const handleRobotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRobots(e.target.value);
  };
  
  const handleViewportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setViewport(val);
    
    if (val.trim() !== 'width=device-width, initial-scale=1') {
      setViewportWarning('Warning: Deviating from the standard viewport can break mobile rendering and negatively impact mobile-first indexing.');
    } else {
      setViewportWarning('');
    }
  };
  
  const handleOgTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOgTitle(val);
    if (val.length > 95) setOgTitleWarning(`Long (${val.length} chars). Aim for 60-95 for social previews.`);
    else setOgTitleWarning('');
  };

  const handleOgDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setOgDescription(val);
    if (val.length > 200) setOgDescriptionWarning('Over 200 characters may be truncated on some platforms.');
    else setOgDescriptionWarning('');
  };

  const handleOgTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOgType(e.target.value);
  };

  const handleOgUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOgUrl(e.target.value);
  };

  const handleOgSiteNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOgSiteName(val);
    
    if (val.trim() !== '') {
      // NOTE: Using title as a temporary proxy for testing items if no items have ogSiteName
      const existingSiteNames = items.map(i => i.ogSiteName).filter(Boolean);
      const uniqueNames = new Set(existingSiteNames);
      if (uniqueNames.size > 0 && !uniqueNames.has(val)) {
        setOgSiteNameWarning('Warning: Site name differs from other pages. It should be identical on every page.');
      } else {
        setOgSiteNameWarning('');
      }
    } else {
      setOgSiteNameWarning('');
    }
  };

  const handleOgLocaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOgLocale(val);
    if (val.trim() !== '' && !/^[a-z]{2}_[A-Z]{2}$/.test(val)) {
      setOgLocaleError('Invalid format. Use xx_XX (e.g. en_US).');
    } else {
      setOgLocaleError('');
    }
  };
  
  const handleTwitterCardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTwitterCard(e.target.value);
  };

  const handleTwitterTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTwitterTitle(val);
    if (val.length > 70) setTwitterTitleWarning(`Long (${val.length} chars). X truncates more aggressively; keep under 70.`);
    else setTwitterTitleWarning('');
  };

  const handleTwitterDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTwitterDescription(val);
    if (val.length > 200) setTwitterDescriptionWarning('Over 200 characters may be truncated on X.');
    else setTwitterDescriptionWarning('');
  };

  const handleTwitterSiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTwitterSite(val);
    
    if (val.trim() !== '') {
      let warning = '';
      if (!/^@\w+$/.test(val)) warning = 'Must be a valid handle starting with @ (e.g. @brand).';
      else {
        // NOTE: Using ogSiteName as a proxy for testing items if no items have twitterSite
        const existingTwitterSites = items.map(i => i.twitterSite).filter(Boolean);
        const uniqueNames = new Set(existingTwitterSites);
        if (uniqueNames.size > 0 && !uniqueNames.has(val)) {
           warning = 'Warning: Twitter Site differs from other pages. It should be identical site-wide.';
        }
      }
      setTwitterSiteWarning(warning);
    } else {
      setTwitterSiteWarning('');
    }
  };

  const handleTwitterCreatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTwitterCreator(val);
    if (val.trim() !== '' && !/^@\w+$/.test(val)) {
      setTwitterCreatorWarning('Must be a valid handle starting with @ (e.g. @author).');
    } else {
      setTwitterCreatorWarning('');
    }
  };
  
  const handleStructuredDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setStructuredData(val);
    if (val.trim() === '') {
      setStructuredDataError('');
      return;
    }
    try {
      JSON.parse(val);
      setStructuredDataError('');
    } catch (err) {
      setStructuredDataError('Invalid JSON format.');
    }
  };
  
  const [visibleColumns, setVisibleColumns] = useState<Record<keyof SEOData, boolean>>({
      url: true,
      title: true,
      createdAt: true,
      id: false,
      canonicalUrl: false,
      description: false,
      keywords: false,
      image: false,
      author: false,
      robots: false,
      viewport: false,
      ogTitle: false,
      ogDescription: false,
      ogImage: false,
      ogType: false,
      ogUrl: false,
      ogSiteName: false,
      ogLocale: false,
      twitterCard: false,
      twitterTitle: false,
      twitterDescription: false,
      twitterImage: false,
      twitterSite: false,
      twitterCreator: false,
      structuredData: false,
      updatedAt: false
  });

  const toggleTab = (tab: 'columns' | 'filters') => {
    setActiveTab(prev => prev === tab ? 'none' : tab);
  };

  const fetchSeo = async () => {
    try {
      const data = await AdminAPI.getSeo();
      setItems(data);
    } catch (err) {
      console.error('Error fetching SEO:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await AdminAPI.getSettings();
      if (data.uiPreferences?.seoTableColumns) {
        setVisibleColumns(prev => ({ ...prev, ...data.uiPreferences.seoTableColumns }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchSeo();
    fetchSettings();
  }, []);

  const addFilter = (logic: 'and' | 'or' = 'and') => {
    setFilters([...filters, { id: Math.random().toString(), logic, column: 'url', operator: 'contains', value: '' }]);
  };

  const updateFilter = (id: string, field: keyof FilterRule, value: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(u => u.url.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filters.length === 0) return result;

    result = result.filter(u => {
      let finalResult = false;
      let currentAndResult = true;
      let hasValidFilters = false;

      for (let i = 0; i < filters.length; i++) {
        const filter = filters[i];
        if (!filter.value && filter.operator !== 'exists') {
          continue; 
        }
        hasValidFilters = true;

        const cellValue = String(u[filter.column]).toLowerCase();
        const filterValue = filter.value.toLowerCase();
        
        let matched = false;
        switch (filter.operator) {
          case 'equals': matched = (cellValue === filterValue); break;
          case 'is not equal to': matched = (cellValue !== filterValue); break;
          case 'contains': matched = cellValue.includes(filterValue); break;
          case 'is in': matched = filterValue.split(',').map(s=>s.trim()).includes(cellValue); break;
          case 'is not in': matched = !filterValue.split(',').map(s=>s.trim()).includes(cellValue); break;
          case 'exists': matched = (cellValue !== '' && cellValue !== 'null'); break;
          case 'is greater than': matched = (cellValue > filterValue); break;
          case 'is less than': matched = (cellValue < filterValue); break;
          case 'is less than or equal to': matched = (cellValue <= filterValue); break;
          case 'is greater than or equal to': matched = (cellValue >= filterValue); break;
          default: matched = true;
        }

        if (i === 0 || filter.logic === 'or') {
           if (i > 0) {
              finalResult = finalResult || currentAndResult;
           }
           currentAndResult = matched;
        } else {
           currentAndResult = currentAndResult && matched;
        }
      }

      if (!hasValidFilters) return true;

      finalResult = finalResult || currentAndResult;
      return finalResult;
    });

    return result;
  }, [items, searchQuery, filters]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(filteredItems.map(u => u.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const executeDeleteSelected = async () => {
    for (const id of selectedItems) {
      await AdminAPI.deleteSeo(id);
    }
    fetchSeo();
    setSelectedItems([]);
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    setIsDeleteModalOpen(true);
  };

  const handleEditSelected = () => {
    if (selectedItems.length > 1) {
      setWarningMessage('Only 1 item can be edited at once.');
      return;
    }
    if (selectedItems.length === 1) {
      const itemToEdit = items.find(i => i.id === selectedItems[0]);
      if (itemToEdit) {
        setEditingItemId(itemToEdit.id);
        setUrl(itemToEdit.url);
        setTitle(itemToEdit.title);
        setCanonicalUrl(itemToEdit.canonicalUrl);
        setDescription(itemToEdit.description);
        setKeywords(itemToEdit.keywords);
        setImage(itemToEdit.image);
        setAuthor(itemToEdit.author);
        setRobots(itemToEdit.robots);
        setViewport(itemToEdit.viewport);
        setOgTitle(itemToEdit.ogTitle);
        setOgDescription(itemToEdit.ogDescription);
        setOgImage(itemToEdit.ogImage);
        setOgType(itemToEdit.ogType);
        setOgUrl(itemToEdit.ogUrl);
        setOgSiteName(itemToEdit.ogSiteName);
        setOgLocale(itemToEdit.ogLocale);
        setTwitterCard(itemToEdit.twitterCard);
        setTwitterTitle(itemToEdit.twitterTitle);
        setTwitterDescription(itemToEdit.twitterDescription);
        setTwitterImage(itemToEdit.twitterImage);
        setTwitterSite(itemToEdit.twitterSite);
        setTwitterCreator(itemToEdit.twitterCreator);
        setStructuredData(itemToEdit.structuredData);
        setIsCreateModalOpen(true);
      }
    }
  };

  const toggleColumn = async (key: keyof SEOData) => {
    const newCols = { ...visibleColumns, [key]: !visibleColumns[key] };
    setVisibleColumns(newCols);
    try {
      const currentSettings = await AdminAPI.getSettings();
      await AdminAPI.updateSettings({
         ...currentSettings,
         uiPreferences: {
            ...currentSettings.uiPreferences,
            seoTableColumns: newCols
         }
      });
    } catch (err) {
      console.error('Error saving column preferences:', err);
    }
  };

  const hasSelection = selectedItems.length > 0;

  return (
    <div className="w-full h-full relative">
      {warningMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black dark:bg-white/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-xl max-w-sm w-full text-center border border-gray-100 dark:border-gray-800">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Warning</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{warningMessage}</p>
              <button onClick={() => setWarningMessage('')} className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded text-sm hover:bg-black transition-colors shadow-sm font-medium">OK</button>
           </div>
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 min-h-[44px]">
          
          {hasSelection ? (
            <div className="flex items-center flex-1 gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{selectedItems.length} selected</span>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleEditSelected}
                  className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1 shadow-sm transition-colors"
                >
                  <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="px-2 py-1 bg-white dark:bg-gray-900 border border-red-100 rounded text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-1 shadow-sm transition-colors"
                >
                  <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center flex-1 gap-2">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 w-full outline-none placeholder-gray-400 text-gray-900 dark:text-white"
                placeholder="Search by Url"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                setEditingItemId(null);
                setUrl('');
                setTitle('');
                setCanonicalUrl('');
                setDescription('');
                setKeywords('');
                setImage('');
                setAuthor('');
                setRobots('');
                setViewport('width=device-width, initial-scale=1');
                setOgTitle('');
                setOgDescription('');
                setOgImage('');
                setOgType('website');
                setOgUrl('');
                setOgSiteName('');
                setOgLocale('en_US');
                setTwitterCard('summary_large_image');
                setTwitterTitle('');
                setTwitterDescription('');
                setTwitterImage('');
                setTwitterSite('');
                setTwitterCreator('');
                setStructuredData('');
                setIsCreateModalOpen(true);
              }}
              className="px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 mr-2"
            >
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create New
            </button>
            <button 
              onClick={() => toggleTab('columns')}
              className={`px-2 py-1 border rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors ${activeTab === 'columns' ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Columns
              <svg className={`w-3 h-3 text-gray-400 transition-transform ${activeTab === 'columns' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button 
              onClick={() => toggleTab('filters')}
              className={`px-2 py-1 border rounded text-xs font-medium flex items-center gap-1 shadow-sm transition-colors ${activeTab === 'filters' ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              Filters
              <svg className={`w-3 h-3 text-gray-400 transition-transform ${activeTab === 'filters' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        {activeTab === 'columns' && (
          <div className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-1.5 flex-wrap animate-in slide-in-from-top-1 fade-in duration-150">
            {(Object.keys(visibleColumns) as Array<keyof SEOData>).map((key) => (
              <div 
                key={key} 
                onClick={() => toggleColumn(key)}
                className={`flex items-center gap-1 px-2 py-0.5 border rounded text-[11px] font-medium shadow-sm cursor-pointer transition-colors ${visibleColumns[key] ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}`}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={visibleColumns[key] ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
                {COLUMN_LABELS[key]}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 px-3 py-3 flex flex-col items-start gap-3 animate-in slide-in-from-top-1 fade-in duration-150 w-full">
            {filters.length === 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">No filters set</span>
                <button 
                  onClick={() => addFilter('and')}
                  className="flex items-center gap-1 text-[11px] font-medium text-admin-text border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Filter
                </button>
              </div>
            ) : (
              <div className="flex flex-col w-full gap-2">
                <span className="text-[11px] text-gray-700 dark:text-gray-300 font-semibold mb-0.5">Filter items where</span>
                
                {filters.map((filter, index) => (
                  <React.Fragment key={filter.id}>
                    {index > 0 && filter.logic === 'or' && (
                      <span className="text-[11px] text-gray-800 dark:text-gray-200 font-semibold my-1 uppercase tracking-wider">Or</span>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 w-full">
                      {index > 0 && filter.logic === 'and' && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium w-5 text-center sm:block hidden">and</span>
                      )}
                      
                      <select 
                        value={filter.column}
                        onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-[11px] rounded px-1.5 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full sm:w-48"
                      >
                        {(Object.keys(COLUMN_LABELS) as Array<keyof SEOData>).map(key => (
                           <option key={key} value={key}>{COLUMN_LABELS[key]}</option>
                        ))}
                      </select>

                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-[11px] rounded px-1.5 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full sm:w-40"
                      >
                        <option value="equals">equals</option>
                        <option value="is not equal to">is not equal to</option>
                        <option value="contains">contains</option>
                        <option value="is in">is in</option>
                        <option value="is not in">is not in</option>
                        <option value="exists">exists</option>
                        <option value="is greater than">is greater than</option>
                        <option value="is less than">is less than</option>
                        <option value="is less than or equal to">is less than or equal to</option>
                        <option value="is greater than or equal to">is greater than or equal to</option>
                      </select>

                      <div className="relative w-full sm:w-56 flex-1 sm:flex-none">
                        <input 
                          type={filter.column.includes('At') ? 'date' : 'text'}
                          value={filter.value}
                          onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                          placeholder="Enter a value"
                          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-[11px] rounded px-2 py-1 outline-none focus:border-admin-primary focus:ring-1 focus:ring-admin-primary w-full"
                        />
                      </div>

                      <div className="flex items-center gap-1 mt-1 sm:mt-0">
                        <button 
                          onClick={() => removeFilter(filter.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove filter"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <button 
                          onClick={() => addFilter('and')}
                          className="p-1 text-gray-400 hover:text-admin-primary hover:bg-blue-50 rounded transition-colors"
                          title="Add 'and' condition"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
                
                <div className="flex items-center gap-1.5 mt-2">
                  <button 
                    onClick={() => addFilter('or')}
                    className="flex items-center gap-0.5 text-[11px] font-medium text-admin-primary hover:text-admin-primary-hover transition-colors px-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Or
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-100 dark:bg-gray-800/75 border-b border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-3 py-2 w-10 text-center sticky left-0 bg-gray-100 dark:bg-gray-800/75">
                  <input 
                    type="checkbox" 
                    checked={filteredItems.length > 0 && selectedItems.length === filteredItems.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-admin-primary focus:ring-admin-primary bg-white dark:bg-gray-900 cursor-pointer" 
                  />
                </th>
                {(Object.keys(visibleColumns) as Array<keyof SEOData>).map((key) => {
                  if (!visibleColumns[key]) return null;
                  return (
                    <th key={key} scope="col" className="px-3 py-2 cursor-pointer hover:text-gray-700 group">
                      <div className="flex items-center gap-1">
                        {COLUMN_LABELS[key]}
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${selectedItems.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-3 py-2 text-center sticky left-0 bg-white dark:bg-gray-900 group-hover:bg-gray-50/50">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-admin-primary focus:ring-admin-primary bg-white dark:bg-gray-900 cursor-pointer" 
                      />
                    </td>
                    {(Object.keys(visibleColumns) as Array<keyof SEOData>).map((key) => {
                      if (!visibleColumns[key]) return null;
                      
                      const val = item[key];
                      
                      if (key === 'url') {
                        return (
                          <td key={key} className="px-3 py-2">
                            <Link to="#" className="text-xs font-medium text-black dark:text-white hover:underline decoration-black dark:decoration-white underline-offset-2">
                              {val}
                            </Link>
                          </td>
                        );
                      }

                      if (key === 'createdAt' || key === 'updatedAt') {
                        return (
                          <td key={key} className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(val as string).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        );
                      }

                      if (key === 'id') {
                        return (
                          <td key={key} className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                            ID: <span className="text-black dark:text-white font-semibold">{val}</span>
                          </td>
                        );
                      }

                      return (
                        <td key={key} className="px-3 py-2 text-xs text-black dark:text-white max-w-[200px] truncate" title={String(val)}>
                          {val || <span className="text-gray-300 italic">empty</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={Object.keys(visibleColumns).length + 1} className="px-3 py-8 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No items found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
      </div>

      {/* Create New SEO Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 shadow-2xl w-full max-w-5xl flex flex-col my-8 rounded-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-10">
              <h3 className="font-bold text-gray-900 dark:text-white text-xl tracking-tight">{editingItemId ? 'Edit Page SEO' : 'Create New Page SEO'}</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar pb-24">
              <form 
                id="seo-form"
                className="flex flex-col gap-8 max-w-4xl" 
                onSubmit={async (e) => { 
                  e.preventDefault();
                  
                  if (urlError || titleError || descriptionError || keywordsError || canonicalUrlError || structuredDataError || ogLocaleError) {
                    return; 
                  }

                  const payload = {
                    url, title, canonicalUrl, description, keywords, image, imageAlt, author, robots, viewport,
                    ogTitle, ogDescription, ogImage, ogType, ogUrl, ogSiteName, ogLocale,
                    twitterCard, twitterTitle, twitterDescription, twitterImage, twitterSite, twitterCreator,
                    structuredData
                  };
                  
                  if (editingItemId) {
                    await AdminAPI.updateSeo(editingItemId, payload);
                  } else {
                    await AdminAPI.createSeo(payload);
                  }
                  
                  fetchSeo();
                  setIsCreateModalOpen(false);
                }}
              >
                
                {/* General Settings */}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">General Settings</h4>
                
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                      Url <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${urlError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      required 
                      value={url}
                      onChange={handleUrlChange}
                    />
                    {urlError ? (
                      <p className="text-[11px] text-red-500 mt-1.5 font-medium">{urlError}</p>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">Page URL this SEO config applies to</p>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Canonical Url</label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${canonicalUrlError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      placeholder="https://example.com/page"
                      value={canonicalUrl}
                      onChange={handleCanonicalUrlChange}
                    />
                    {canonicalUrlError ? (
                      <p className="text-[11px] text-red-500 mt-1.5 font-medium">{canonicalUrlError}</p>
                    ) : (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">Leave blank to default to self-referencing.</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                    Title
                    {title.length > 0 && (
                       <span className={`ml-2 text-[10px] font-medium ${title.length >= 50 && title.length <= 60 ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                         {title.length} chars
                       </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${titleError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : titleWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                    value={title}
                    onChange={handleTitleChange}
                  />
                  {titleError ? (
                    <p className="text-[11px] text-red-500 mt-1.5 font-medium">{titleError}</p>
                  ) : titleWarning ? (
                    <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{titleWarning}</p>
                  ) : null}
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                    Description
                    {description.length > 0 && (
                       <span className={`ml-2 text-[10px] font-medium ${description.length >= 150 && description.length <= 160 ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                         {description.length} chars
                       </span>
                    )}
                  </label>
                  <textarea 
                    rows={3} 
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${descriptionError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : descriptionWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                    value={description}
                    onChange={handleDescriptionChange}
                  />
                  {descriptionError ? (
                    <p className="text-[11px] text-red-500 mt-1.5 font-medium">{descriptionError}</p>
                  ) : descriptionWarning ? (
                    <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{descriptionWarning}</p>
                  ) : null}
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                    Keywords
                    {keywords.length > 0 && (
                       <span className="ml-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                         {keywords.split(',').map(k => k.trim()).filter(k => k !== '').length} / 8 max
                       </span>
                    )}
                  </label>
                  <input 
                    type="text" 
                    placeholder="keyword1, keyword2, long tail keyword 3"
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${keywordsError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : keywordsWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                    value={keywords}
                    onChange={handleKeywordsChange}
                  />
                  {keywordsError ? (
                    <p className="text-[11px] text-red-500 mt-1.5 font-medium">{keywordsError}</p>
                  ) : keywordsWarning ? (
                    <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{keywordsWarning}</p>
                  ) : (
                     <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">Comma-separated list (e.g. primary, secondary, long-tail variant)</p>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Image (Fallback Social)</label>
                  {image ? (
                    <div className="flex flex-col gap-3">
                      <div className="relative group rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700 w-full md:w-1/2 h-40">
                        <img src={image} alt={imageAlt} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black dark:bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => setImage(null)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded shadow-sm hover:bg-red-600 transition-colors">
                            Remove Image
                          </button>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Image Alt Text (Required)" 
                        className={`w-full md:w-1/2 px-3 py-2 bg-white dark:bg-gray-900 border ${!imageAlt ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`}
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                      />
                      {!imageAlt && <p className="text-[11px] text-yellow-600 font-medium">Warning: Alt text is required for accessibility and SEO.</p>}
                      {imageWarning && <p className="text-[11px] text-yellow-600 font-medium">{imageWarning}</p>}
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-sm p-3 bg-gray-50 dark:bg-gray-800/30 flex flex-col items-center justify-center transition-colors h-32 w-full md:w-1/2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setActiveMediaField('image'); setIsMediaPickerOpen(true); }}>
                      <span className="text-[11px] font-medium text-gray-900 dark:text-white mb-1 bg-white dark:bg-gray-900 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded shadow-sm">Upload media</span>
                      <span className="text-[11px] text-gray-400">Or Drag and drop a file</span>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">Recommended: ≥1200×630px (1.91:1), &lt;1MB, &lt;20% text overlay.</p>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Author</label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${authorWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={author}
                      onChange={handleAuthorChange}
                    />
                    {authorWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{authorWarning}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Robots</label>
                    <input 
                      type="text" 
                      placeholder="e.g. index, follow" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${robotsWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={robots}
                      onChange={handleRobotsChange}
                    />
                    {robotsWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{robotsWarning}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Viewport</label>
                    <input 
                      type="text" 
                      placeholder="width=device-width, initial-scale=1" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${viewportWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={viewport}
                      onChange={handleViewportChange}
                    />
                    {viewportWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{viewportWarning}</p>}
                  </div>
                </div>

                {/* Open Graph */}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2 mt-4">Open Graph</h4>
                
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                      Og Title
                      {ogTitle.length > 0 && (
                         <span className={`ml-2 text-[10px] font-medium ${ogTitle.length >= 60 && ogTitle.length <= 95 ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                           {ogTitle.length} chars
                         </span>
                      )}
                    </label>
                    <input 
                      type="text" 
                      placeholder={title || 'Leave blank to fallback to SEO Title'}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${ogTitleWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={ogTitle}
                      onChange={handleOgTitleChange}
                    />
                    {ogTitleWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{ogTitleWarning}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Og Type</label>
                    <select 
                      className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:border-gray-300 rounded-sm transition-colors text-gray-900 dark:text-white"
                      value={ogType}
                      onChange={handleOgTypeChange}
                    >
                      <option value="website">website</option>
                      <option value="article">article</option>
                      <option value="product">product</option>
                      <option value="profile">profile</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                    Og Description
                    {ogDescription.length > 0 && (
                       <span className={`ml-2 text-[10px] font-medium ${ogDescription.length <= 200 ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                         {ogDescription.length} chars
                       </span>
                    )}
                  </label>
                  <textarea 
                    rows={2} 
                    placeholder={description || 'Leave blank to fallback to SEO Description'}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${ogDescriptionWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                    value={ogDescription}
                    onChange={handleOgDescriptionChange}
                  />
                  {ogDescriptionWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{ogDescriptionWarning}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Og Image</label>
                  {ogImage ? (
                    <div className="relative group rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700 w-full md:w-1/2 h-40">
                      <img src={ogImage} alt="Og Image" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black dark:bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setOgImage(null)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded shadow-sm hover:bg-red-600 transition-colors">
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-sm p-3 bg-gray-50 dark:bg-gray-800/30 flex flex-col items-center justify-center transition-colors h-32 w-full md:w-1/2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setActiveMediaField('ogImage'); setIsMediaPickerOpen(true); }}>
                      <span className="text-[11px] font-medium text-gray-900 dark:text-white mb-1 bg-white dark:bg-gray-900 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded shadow-sm">Upload media</span>
                      <span className="text-[11px] text-gray-400">Or Drag and drop a file</span>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">Recommended: 1200×630px, &lt;8MB, 1.91:1 ratio. Keep subject in center 80% safe zone.</p>
                </div>
                
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Og Url</label>
                    <input 
                      type="text" 
                      placeholder={canonicalUrl || url || 'Absolute URL'}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${ogUrlWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={ogUrl}
                      onChange={handleOgUrlChange}
                    />
                    {ogUrlWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{ogUrlWarning}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Og Site Name</label>
                    <input 
                      type="text" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${ogSiteNameWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={ogSiteName}
                      onChange={handleOgSiteNameChange}
                    />
                    {ogSiteNameWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{ogSiteNameWarning}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Og Locale</label>
                    <input 
                      type="text" 
                      placeholder="en_US" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${ogLocaleError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={ogLocale}
                      onChange={handleOgLocaleChange}
                    />
                    {ogLocaleError ? (
                       <p className="text-[11px] text-red-500 mt-1.5 font-medium">{ogLocaleError}</p>
                    ) : (
                       <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">Format: xx_XX</p>
                    )}
                  </div>
                </div>

                {/* Twitter / X Card */}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2 mt-4">Twitter / X Card</h4>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Twitter Card</label>
                    <select 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${twitterCardWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors text-gray-900 dark:text-white`}
                      value={twitterCard}
                      onChange={handleTwitterCardChange}
                    >
                      <option value="summary_large_image">summary_large_image</option>
                      <option value="summary">summary</option>
                      <option value="app">app</option>
                      <option value="player">player</option>
                    </select>
                    {twitterCardWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{twitterCardWarning}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                      Twitter Title
                      {twitterTitle.length > 0 && (
                         <span className={`ml-2 text-[10px] font-medium ${twitterTitle.length <= 70 ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                           {twitterTitle.length} chars
                         </span>
                      )}
                    </label>
                    <input 
                      type="text" 
                      placeholder={ogTitle || title || ''}
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${twitterTitleWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={twitterTitle}
                      onChange={handleTwitterTitleChange}
                    />
                    {twitterTitleWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{twitterTitleWarning}</p>}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">
                    Twitter Description
                    {twitterDescription.length > 0 && (
                       <span className={`ml-2 text-[10px] font-medium ${twitterDescription.length <= 200 ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}>
                         {twitterDescription.length} chars
                       </span>
                    )}
                  </label>
                  <textarea 
                    rows={2} 
                    placeholder={ogDescription || description || ''}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${twitterDescriptionWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                    value={twitterDescription}
                    onChange={handleTwitterDescriptionChange}
                  />
                  {twitterDescriptionWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{twitterDescriptionWarning}</p>}
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Twitter Image</label>
                  {twitterImage ? (
                    <div className="relative group rounded-sm overflow-hidden border border-gray-200 dark:border-gray-700 w-full md:w-1/2 h-40">
                      <img src={twitterImage} alt="Twitter Image" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black dark:bg-white/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setTwitterImage(null)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded shadow-sm hover:bg-red-600 transition-colors">
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-sm p-3 bg-gray-50 dark:bg-gray-800/30 flex flex-col items-center justify-center transition-colors h-32 w-full md:w-1/2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => { setActiveMediaField('twitterImage'); setIsMediaPickerOpen(true); }}>
                      <span className="text-[11px] font-medium text-gray-900 dark:text-white mb-1 bg-white dark:bg-gray-900 px-3 py-1 border border-gray-200 dark:border-gray-700 rounded shadow-sm">Upload media</span>
                      <span className="text-[11px] text-gray-400">Or Drag and drop a file</span>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">Recommended: 1200×600px (2:1 ratio), &lt;5MB, central framing.</p>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Twitter Site</label>
                    <input 
                      type="text" 
                      placeholder="@handle" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${twitterSiteWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={twitterSite}
                      onChange={handleTwitterSiteChange}
                    />
                    {twitterSiteWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{twitterSiteWarning}</p>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-900 dark:text-white mb-1.5 flex items-center">Twitter Creator</label>
                    <input 
                      type="text" 
                      placeholder="@handle" 
                      className={`w-full px-3 py-2 bg-white dark:bg-gray-900 border ${twitterCreatorWarning ? 'border-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500' : 'border-gray-200 dark:border-gray-700 focus:border-gray-300'} text-sm focus:outline-none rounded-sm transition-colors`} 
                      value={twitterCreator}
                      onChange={handleTwitterCreatorChange}
                    />
                    {twitterCreatorWarning && <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{twitterCreatorWarning}</p>}
                  </div>
                </div>

                {/* Structured Data */}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2 mt-4">
                  Structured Data (JSON-LD)
                  <a href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer" className="ml-3 text-[10px] font-medium text-blue-600 hover:underline">
                    Test with Google
                  </a>
                </h4>
                <div className="flex flex-col">
                  <div className={`flex font-mono text-[11px] border ${structuredDataError ? 'border-red-500' : structuredDataWarning ? 'border-yellow-500' : 'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800/50 rounded-sm`}>
                     <div className={`px-3 py-2 border-r ${structuredDataError ? 'border-red-500' : structuredDataWarning ? 'border-yellow-500' : 'border-gray-200 dark:border-gray-700'} text-gray-400 bg-gray-100 dark:bg-gray-800/50`}>1</div>
                     <textarea 
                       rows={5} 
                       placeholder="Paste your schema.org JSON-LD object here" 
                       className="w-full px-3 py-2 bg-transparent focus:outline-none resize-y" 
                       value={structuredData}
                       onChange={handleStructuredDataChange}
                     />
                  </div>
                  {structuredDataError ? (
                    <p className="text-[11px] text-red-500 mt-1.5 font-medium">{structuredDataError}</p>
                  ) : structuredDataWarning ? (
                    <p className="text-[11px] text-yellow-600 mt-1.5 font-medium">{structuredDataWarning}</p>
                  ) : null}
                </div>
                
                {/* Footer Save Button */}
                <div className="mt-4 flex">
                  <button type="submit" className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black font-medium rounded-sm hover:bg-black transition-colors text-[13px] shadow-sm">
                    Save
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal 
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)} 
        onSelect={(media) => {
           if (activeMediaField === 'image') setImage(media.url);
           if (activeMediaField === 'ogImage') setOgImage(media.url);
           if (activeMediaField === 'twitterImage') setTwitterImage(media.url);
           setIsMediaPickerOpen(false);
        }} 
      />
      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteSelected}
        itemCount={selectedItems.length}
      />
    </div>
  );
};

export default SEOPage;
