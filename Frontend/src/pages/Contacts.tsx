import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import { useGoogleLogin } from "@react-oauth/google";
import PageMeta from "../components/common/PageMeta";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";

interface Contact {
  id: string;
  phone: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status: 'opted_in' | 'opted_out';
  source: string;
  createdAt: string;
  segment: string;
  tags?: any[];
  customFields?: Record<string, any>;
  lastInteractionAt: string;
}

const getTimeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const isWithin24Hours = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  return diff < 24 * 60 * 60 * 1000;
};

const COUNTRY_CODES = [
  { code: 'US', dialCode: '+1', name: 'United States' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom' },
  { code: 'IN', dialCode: '+91', name: 'India' },
  { code: 'ID', dialCode: '+62', name: 'Indonesia' },
  { code: 'BR', dialCode: '+55', name: 'Brazil' },
  { code: 'MX', dialCode: '+52', name: 'Mexico' },
  { code: 'DE', dialCode: '+49', name: 'Germany' },
  { code: 'FR', dialCode: '+33', name: 'France' },
  { code: 'IT', dialCode: '+39', name: 'Italy' },
  { code: 'ES', dialCode: '+34', name: 'Spain' },
  { code: 'AU', dialCode: '+61', name: 'Australia' },
  { code: 'JP', dialCode: '+81', name: 'Japan' },
  { code: 'CN', dialCode: '+86', name: 'China' },
  { code: 'ZA', dialCode: '+27', name: 'South Africa' },
  { code: 'NG', dialCode: '+234', name: 'Nigeria' },
  { code: 'AR', dialCode: '+54', name: 'Argentina' },
  { code: 'CO', dialCode: '+57', name: 'Colombia' },
  { code: 'PK', dialCode: '+92', name: 'Pakistan' },
  { code: 'BD', dialCode: '+880', name: 'Bangladesh' },
  { code: 'RU', dialCode: '+7', name: 'Russia' },
  { code: 'AE', dialCode: '+971', name: 'UAE' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia' },
  { code: 'EG', dialCode: '+20', name: 'Egypt' },
  { code: 'TR', dialCode: '+90', name: 'Turkey' },
  { code: 'MY', dialCode: '+60', name: 'Malaysia' },
  { code: 'PH', dialCode: '+63', name: 'Philippines' },
  { code: 'VN', dialCode: '+84', name: 'Vietnam' },
  { code: 'TH', dialCode: '+66', name: 'Thailand' },
];

export default function Contacts() {
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactAddMode, setContactAddMode] = useState<'single' | 'bulk'>('single');
  
  // Contact State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'opted_in' | 'opted_out'>('all');
  
  // Segment State (now objects with id and name)
  const [activeSegment, setActiveSegment] = useState<string>('All Contacts'); // Name of active segment or 'All Contacts'
  const [segments, setSegments] = useState<{id: string, name: string}[]>([]);
  
  // Tags State
  const [availableTags, setAvailableTags] = useState<{id: string, name: string}[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      const token = sessionStorage.getItem('crm_token');
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [contactsRes, segmentsRes, tagsRes] = await Promise.all([
          fetch('/openwa-api/crm/contacts', { headers }),
          fetch('/openwa-api/crm/segments', { headers }),
          fetch('/openwa-api/crm/tags', { headers })
        ]);

        if (contactsRes.ok) {
          const data = await contactsRes.json();
          // Map backend CrmContact to frontend Contact
          setContacts(data.map((c: any) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName || ''}`.trim() || 'Unknown',
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone || '',
            email: c.email || '',
            segment: c.segment ? c.segment.name : 'Unassigned',
            tags: c.tags || [],
            status: c.status || 'opted_in',
            source: c.source || 'Database',
            createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            lastInteractionAt: c.createdAt || new Date().toISOString(),
            customFields: c.customFields || {}
          })));
        }

        if (segmentsRes.ok) {
          const data = await segmentsRes.json();
          setSegments(data);
        }

        if (tagsRes.ok) {
          const data = await tagsRes.json();
          setAvailableTags(data);
        }
      } catch (e) {
        console.error("Failed to load CRM data", e);
      }
    };
    loadData();
  }, []);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [csvUrl, setCsvUrl] = useState('');
  const [csvFileContent, setCsvFileContent] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(false);
  
  // Filter Popover State
  const [showFilters, setShowFilters] = useState(false);
  const [filterImporting, setFilterImporting] = useState('All');
  const [filterIncoming, setFilterIncoming] = useState('All');
  const [filter24Hours, setFilter24Hours] = useState('All');
  
  // Move Modal State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTargetIds, setMoveTargetIds] = useState<string[]>([]);
  
  // Custom Modals State
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [segmentInput, setSegmentInput] = useState('');
  const [popupMessage, setPopupMessage] = useState<{title: string, message: string, type?: 'info' | 'success'} | null>(null);
  
  // Edit State
  const [editContactId, setEditContactId] = useState<string | null>(null);
  
  // Delete Modal State
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);
  
  // Form State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState<'opted_in' | 'opted_out'>('opted_in');

  // Trigger for live time updates
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // No longer saving to localStorage

  // Google Contact Sync
  const [isSyncing, setIsSyncing] = useState(false);

  const syncGoogleContacts = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/contacts.readonly',
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        const res = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,metadata&pageSize=1000', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const data = await res.json();
        
        if (data.connections && data.connections.length > 0) {
          const importedContacts: Contact[] = [];
          
          data.connections.forEach((person: any) => {
            if (person.phoneNumbers && person.phoneNumbers.length > 0) {
              const phone = person.phoneNumbers[0].value;
              const name = person.names && person.names.length > 0 ? person.names[0].displayName : 'Unknown';
              
              importedContacts.push({
                id: Math.random().toString(36).substr(2, 9),
                phone,
                name,
                status: 'opted_in',
                source: 'Google Sync',
                createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                segment: 'Unassigned',
                lastInteractionAt: new Date().toISOString()
              });
            }
          });

          // Prepare and send to backend
          const existingPhones = new Set(contacts.map(c => c.phone.replace(/[^0-9+]/g, '')));
          const newUnique = importedContacts.filter(c => !existingPhones.has(c.phone.replace(/[^0-9+]/g, '')));
          
          if (newUnique.length > 0) {
            const token = sessionStorage.getItem('crm_token');
            const bulkRes = await fetch('/openwa-api/crm/contacts/bulk', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(newUnique.map(c => ({
                phone: c.phone,
                firstName: c.name,
                status: c.status,
                source: c.source
              })))
            });
            if (bulkRes.ok) {
              const savedContacts = await bulkRes.json();
              const formatted = savedContacts.map((c: any) => ({
                id: c.id,
                phone: c.phone || '',
                name: `${c.firstName} ${c.lastName || ''}`.trim() || 'Unknown',
                status: c.status || 'opted_in',
                source: 'Google Sync',
                createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                segment: c.segment ? c.segment.name : 'Unassigned',
                lastInteractionAt: c.createdAt || new Date().toISOString()
              }));
              setContacts(prev => [...formatted, ...prev]);
              setPopupMessage({ title: 'Sync Successful', message: `Successfully imported ${formatted.length} contacts.`, type: 'success' });
            } else {
              setPopupMessage({ title: 'Sync Failed', message: 'Failed to save contacts to the database. The server rejected the request.' });
            }
          } else {
            setPopupMessage({ title: 'Sync Completed', message: 'No new unique contacts found to import.', type: 'info' });
          }
        } else {
          setPopupMessage({ title: 'Sync Completed', message: 'No contacts with phone numbers found in your Google account.', type: 'info' });
        }
      } catch (err) {
        console.error('Error syncing Google contacts:', err);
        setPopupMessage({ title: 'Sync Failed', message: 'There was an error syncing your Google contacts.' });
      } finally {
        setIsSyncing(false);
      }
    },
    onError: () => {
      setPopupMessage({ title: 'Sync Failed', message: 'Google authentication failed or was cancelled.' });
    }
  });

  // Computed Metrics
  const optedInCount = contacts.filter(c => c.status === 'opted_in').length;
  const optedOutCount = contacts.filter(c => c.status === 'opted_out').length;

  // Filter Logic
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      if (activeTab === 'opted_in' && c.status !== 'opted_in') return false;
      if (activeTab === 'opted_out' && c.status !== 'opted_out') return false;
      if (searchQuery && !c.phone.includes(searchQuery) && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeSegment !== 'All Contacts' && c.segment !== activeSegment) return false;
      
      // Advanced Filters
      if (filterImporting !== 'All') {
        if (filterImporting === 'Manual' && c.source !== 'Manual entry') return false;
        if (filterImporting === 'CSV' && c.source !== 'CSV Import') return false;
      }
      
      if (filterIncoming !== 'All') {
        if (filterIncoming === 'Opted-In' && c.status !== 'opted_in') return false;
        if (filterIncoming === 'Opted-Out' && c.status !== 'opted_out') return false;
      }

      if (filter24Hours !== 'All') {
        const isWithin = isWithin24Hours(c.lastInteractionAt);
        if (filter24Hours === 'Within Window' && !isWithin) return false;
        if (filter24Hours === 'Outside Window' && isWithin) return false;
      }
      
      return true;
    });
  }, [contacts, activeTab, searchQuery, activeSegment, filterImporting, filterIncoming, filter24Hours]);

  // Handlers
  const handleSaveContact = async () => {
    if (!newPhone) return;
    
    const token = sessionStorage.getItem('crm_token');
    
    if (editContactId) {
      const fullPhoneForEdit = `${selectedCountry.dialCode} ${newPhone.trim()}`;
      const isDuplicate = contacts.some(c => c.phone === fullPhoneForEdit && c.id !== editContactId);
      if (isDuplicate) {
        setPopupMessage({ title: 'Duplicate Found', message: 'A contact with this phone number already exists.' });
        return;
      }
      
      const payload = {
        firstName: newName || 'Unknown',
        phone: fullPhoneForEdit,
        status: newStatus
      };
      
      try {
        const res = await fetch(`/openwa-api/crm/contacts/${editContactId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const updated = await res.json();
          setContacts(prev => prev.map(c => 
            c.id === editContactId ? {
              ...c,
              phone: updated.phone,
              name: `${updated.firstName} ${updated.lastName || ''}`.trim(),
              status: updated.status
            } : c
          ));
        }
      } catch(e) { console.error(e); }
    } else {
      const fullPhoneForNew = `${selectedCountry.dialCode} ${newPhone}`;
      const isDuplicate = contacts.some(c => c.phone === fullPhoneForNew);
      if (isDuplicate) {
        setPopupMessage({ title: 'Duplicate Found', message: 'A contact with this phone number already exists.' });
        return;
      }
      
      let segmentId = null;
      if (activeSegment !== 'All Contacts') {
        const seg = segments.find(s => s.name === activeSegment);
        if (seg) segmentId = seg.id;
      }
      
      const payload = {
        firstName: newName || 'Unknown',
        phone: fullPhoneForNew,
        status: newStatus,
        segmentId,
        source: 'Manual'
      };
      
      try {
        const res = await fetch('/openwa-api/crm/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const c = await res.json();
          const newContact: Contact = {
            id: c.id,
            phone: c.phone || '',
            name: `${c.firstName} ${c.lastName || ''}`.trim(),
            status: c.status || 'opted_in',
            source: 'Manual',
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            segment: c.segment ? c.segment.name : 'Unassigned',
            lastInteractionAt: new Date().toISOString(),
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email || '',
            tags: c.tags || [],
            customFields: c.customFields || {}
          };
          setContacts(prev => [newContact, ...prev]);
        }
      } catch(e) { console.error(e); }
    }
    
    closeDrawer();
  };

  const closeDrawer = () => {
    setShowAddContact(false);
    setEditContactId(null);
    setNewPhone('');
    setNewName('');
    setNewStatus('opted_in');
    setSelectedTagIds([]);
  };

  const handleDeleteContact = async (id: string) => {
    const token = sessionStorage.getItem('crm_token');
    try {
      if (activeSegment === 'All Contacts') {
        await fetch(`/openwa-api/crm/contacts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setContacts(prev => prev.filter(c => c.id !== id));
      } else {
        await fetch(`/openwa-api/crm/contacts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ segmentId: null })
        });
        setContacts(prev => prev.map(c => c.id === id ? { ...c, segment: 'Unassigned' } : c));
      }
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (e) { console.error(e); }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredContacts.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleExport = () => {
    const contactsToExport = activeSegment === 'All Contacts' ? contacts : contacts.filter(c => c.segment === activeSegment);
    
    if (contactsToExport.length === 0) {
      setPopupMessage({ title: 'Export Failed', message: 'There are no contacts to export in this segment.' });
      return;
    }
    
    const headers = ['Phone', 'Name', 'Status', 'Source', 'Created At', '24 Hours Status'];
    
    const csvRows = contactsToExport.map(c => {
      const twentyFourHourStatus = isWithin24Hours(c.lastInteractionAt) ? "Within Window" : "Outside Window";
      return [
        `"=""${c.phone}"""`, // Force Excel formula to treat as text without visible quote
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.status}"`,
        `"${c.source}"`,
        `"${c.createdAt}"`,
        `"${twentyFourHourStatus}"`
      ].join(',');
    });
    
    const csvString = [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const token = sessionStorage.getItem('crm_token');
    try {
      if (activeSegment === 'All Contacts') {
        const res = await fetch('/openwa-api/crm/contacts/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ids: selectedIds })
        });
        if (res.ok) {
          setContacts(prev => prev.filter(c => !selectedIds.includes(c.id)));
        }
      } else {
        // Bulk remove from segment by removing association one by one (or bulk if supported)
        for (const id of selectedIds) {
          await fetch(`/openwa-api/crm/contacts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ segmentId: null })
          });
        }
        setContacts(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, segment: 'Unassigned' } : c));
      }
      setSelectedIds([]);
    } catch (e) { console.error(e); }
  };

  const handleImportContacts = async () => {
    if (!csvUrl && !csvFileContent) {
      setPopupMessage({ title: 'Upload Required', message: 'Please provide a CSV URL or upload a file first.' });
      return;
    }
    
    let parsedContacts: Contact[] = [];

    if (csvFileContent) {
      // Parse CSV File
      const lines = csvFileContent.split(/\r?\n/).filter(line => line.trim());
      if (lines.length > 1) { // Needs at least header + 1 row
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const nameIdx = header.findIndex(h => h.includes('name'));
        const mobileIdx = header.findIndex(h => h.includes('mobile') || h.includes('phone') || h.includes('number'));
        const optinIdx = header.findIndex(h => h.includes('optin') || h.includes('opt-in') || h.includes('opt in'));

        for (let i = 1; i < lines.length; i++) {
          // Extremely basic split (does not handle quoted commas, but sufficient for standard simple CSVs)
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 2) continue; // Skip empty/malformed rows
          
          let mobile = mobileIdx >= 0 && cols[mobileIdx] ? cols[mobileIdx] : cols[1]; // Fallback to col 2 if header missing
          if (!mobile) continue;

          // Repair Scientific Notation (e.g. 9.2E+11 from Excel)
          if (mobile.toUpperCase().includes('E+')) {
            mobile = Number(mobile).toLocaleString('fullwide', { useGrouping: false });
          }
          // Ensure it has a plus sign if it's a long number without one
          if (!mobile.startsWith('+') && mobile.length >= 10) {
            mobile = '+' + mobile;
          }

          if (skipDuplicates) {
            const isDuplicate = contacts.some(c => c.phone === mobile) || parsedContacts.some(c => c.phone === mobile);
            if (isDuplicate) continue;
          }

          const name = nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx] : 'Unknown';
          
          let isOptedIn = true; // default true
          if (optinIdx >= 0 && cols[optinIdx]) {
            const optinStr = cols[optinIdx].toLowerCase();
            if (optinStr === 'false' || optinStr === 'no' || optinStr === '0') {
              isOptedIn = false;
            }
          }

          parsedContacts.push({
            id: Math.random().toString(36).substr(2, 9),
            phone: mobile,
            name: name,
            status: isOptedIn ? 'opted_in' : 'opted_out',
            source: 'Csv import',
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            segment: 'Unassigned',
            lastInteractionAt: new Date().toISOString()
          });
        }
      }
    } else if (csvUrl) {
      // Mock URL Import if no file was uploaded but URL was provided
      parsedContacts = [
        { id: Math.random().toString(36).substr(2, 9), phone: '+1 555 123 4567', name: 'URL Import User', status: 'opted_in', source: 'Csv import', createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), segment: 'Unassigned', lastInteractionAt: new Date().toISOString() },
      ];
    }
    
    if (parsedContacts.length > 0) {
      const token = sessionStorage.getItem('crm_token');
      try {
        const bulkRes = await fetch('/openwa-api/crm/contacts/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(parsedContacts.map(c => ({
            phone: c.phone,
            firstName: c.name,
            status: c.status,
            source: c.source
          })))
        });
        if (bulkRes.ok) {
          const savedContacts = await bulkRes.json();
          const formatted = savedContacts.map((c: any) => ({
            id: c.id,
            phone: c.phone || '',
            name: `${c.firstName} ${c.lastName || ''}`.trim(),
            status: c.status || 'opted_in',
            source: 'Csv import',
            createdAt: new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            segment: c.segment ? c.segment.name : 'Unassigned',
            lastInteractionAt: c.createdAt
          }));
          setContacts(prev => [...formatted, ...prev]);
          setShowAddContact(false);
          setCsvUrl('');
          setCsvFileContent('');
          setPopupMessage({ title: 'Import Successful', message: `Successfully imported ${formatted.length} contacts.`, type: 'success' });
        } else {
          setPopupMessage({ title: 'Import Failed', message: 'Failed to save contacts to the database.' });
        }
      } catch (e) {
        console.error(e);
        setPopupMessage({ title: 'Import Failed', message: 'An error occurred while saving.' });
      }
    } else {
      setPopupMessage({ title: 'Import Failed', message: 'Could not parse any valid contacts from the provided file.' });
    }
  };

  const handleSaveSegment = async () => {
    if (segmentInput && segmentInput.trim()) {
      const name = segmentInput.trim();
      const token = sessionStorage.getItem('crm_token');
      try {
        const res = await fetch('/openwa-api/crm/segments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name })
        });
        if (res.ok) {
          const data = await res.json();
          setSegments(prev => [...prev, data]);
          setActiveSegment(data.name);
          setPopupMessage({ title: 'Segment Created', message: `Successfully created segment "${data.name}".`, type: 'success' });
        } else {
          setPopupMessage({ title: 'Creation Failed', message: 'Failed to create segment in the database.' });
        }
      } catch (e) {
        console.error("Failed to save segment", e);
        setPopupMessage({ title: 'Creation Failed', message: 'A network error occurred while saving the segment.' });
      }
    }
    setShowSegmentModal(false);
    setSegmentInput('');
  };

  const handleDeleteSegment = async (segmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const token = sessionStorage.getItem('crm_token');
    try {
      await fetch(`/openwa-api/crm/segments/${segmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const segmentToRemove = segments.find(s => s.id === segmentId);
      
      // Re-assign any contacts in this segment back to Unassigned locally
      if (segmentToRemove) {
        setContacts(prev => prev.map(c => c.segment === segmentToRemove.name ? { ...c, segment: 'Unassigned' } : c));
      }
      
      // Remove segment
      setSegments(prev => prev.filter(s => s.id !== segmentId));
      
      // Reset view if we are currently looking at the deleted segment
      if (segmentToRemove && activeSegment === segmentToRemove.name) {
        setActiveSegment('All Contacts');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const executeMove = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;
    
    const token = sessionStorage.getItem('crm_token');
    
    // Move on backend one by one (or bulk if API supported, but we loop for now)
    for (const id of moveTargetIds) {
      try {
        await fetch(`/openwa-api/crm/contacts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ segmentId })
        });
      } catch (e) {
        console.error(e);
      }
    }
    
    setContacts(prev => prev.map(c => moveTargetIds.includes(c.id) ? { ...c, segment: segment.name } : c));
    setShowMoveModal(false);
    setSelectedIds([]);
  };

  const handleEditContact = (contact: Contact) => {
    setEditContactId(contact.id);
    setContactAddMode('single');
    
    // Attempt to split phone code
    const matchedCountry = COUNTRY_CODES.find(c => contact.phone.startsWith(c.dialCode)) || COUNTRY_CODES[0];
    setSelectedCountry(matchedCountry);
    setNewPhone(contact.phone.replace(matchedCountry.dialCode, '').trim());
    
    setNewName(contact.name !== 'Unknown' ? contact.name : '');
    setNewStatus(contact.status);
    setShowAddContact(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvFileContent(event.target?.result as string);
        setPopupMessage({ title: 'File Ready', message: `File "${file.name}" ready for import. Click 'Import Contacts' to proceed.`, type: 'success' });
        setCsvUrl(`blob://local-file/${file.name}`); 
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <PageMeta title="Contacts | Waflow" description="Manage your contacts" />

      {/* Page Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Build and manage your audience. Segment contacts for targeted campaigns.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => syncGoogleContacts()}
            disabled={isSyncing}
            className={`flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 ${isSyncing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSyncing ? (
              <svg className="h-4 w-4 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {isSyncing ? 'Syncing...' : 'Sync Google Contacts'}
          </button>
          <button 
            onClick={() => { setEditContactId(null); setShowAddContact(true); }}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Contact
          </button>
        </div>
      </div>

      {/* Modern Metrics Ribbon */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Contacts</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{contacts.length}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Opted-In</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{optedInCount}</h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Opted-Out</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{optedOutCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-col gap-6 xl:flex-row">
        
        {/* Sleek Sidebar */}
        <div className="w-full shrink-0 xl:w-64">
          <div className="rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white">SEGMENTS</h2>
            </div>
            <div className="space-y-1 p-3">
              <button 
                onClick={() => setActiveSegment('All Contacts')}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeSegment === 'All Contacts' ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'}`}
              >
                <div className="flex items-center gap-3">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <span>All Contacts</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${activeSegment === 'All Contacts' ? 'bg-white text-brand-600 dark:bg-brand-500/20' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{contacts.length}</span>
              </button>

              {segments.map(segment => (
                <div key={segment.id} className="group relative">
                  <button 
                    onClick={() => setActiveSegment(segment.name)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition ${activeSegment === segment.name ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'}`}
                  >
                    <div className="flex items-center gap-3 pr-6">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                      <span className="truncate">{segment.name}</span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${activeSegment === segment.name ? 'bg-white text-brand-600 dark:bg-brand-500/20' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{contacts.filter(c => c.segment === segment.name).length}</span>
                  </button>
                  
                  {segment.name !== 'Unassigned' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModalConfig({
                          isOpen: true,
                          title: 'Delete Segment',
                          itemName: segment.name,
                          onConfirm: () => handleDeleteSegment(segment.id, e)
                        });
                      }} 
                      className="absolute right-12 top-1/2 -translate-y-1/2 rounded p-1.5 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      title="Delete Segment"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-100 p-4 dark:border-gray-800">
              <button 
                onClick={() => setShowSegmentModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-brand-500 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                New Segment
              </button>
            </div>
          </div>
        </div>

        {/* Data Table Area */}
        <div className="flex-1 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Table Tabs Header */}
          <div className="border-b border-gray-100 dark:border-gray-800">
            <div className="px-5 pb-2 pt-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeSegment}</h2>
            </div>
            <div className="mt-2 flex gap-6 px-5">
              <button 
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${activeTab === 'all' ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                All <span className={`rounded px-1.5 py-0.5 text-xs ${activeTab === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{contacts.length}</span>
              </button>
              <button 
                onClick={() => setActiveTab('opted_in')}
                className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${activeTab === 'opted_in' ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                Opted-In <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">{optedInCount}</span>
              </button>
              <button 
                onClick={() => setActiveTab('opted_out')}
                className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${activeTab === 'opted_out' ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                Opted-Out <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">{optedOutCount}</span>
              </button>
            </div>
          </div>

          {/* Table Toolbar */}
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-lg flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                placeholder="Search contacts by Mobile number or Name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition ${showFilters || filterImporting !== 'All' || filterIncoming !== 'All' || filter24Hours !== 'All' ? 'border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/20 dark:text-brand-400' : 'border-transparent text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10'}`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                  Filters
                </button>

                {showFilters && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)}></div>
                    <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-gray-100 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                      <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">Importing Status</label>
                        <select 
                          value={filterImporting} 
                          onChange={e => setFilterImporting(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        >
                          <option value="All">All Sources</option>
                          <option value="Manual">Manual Entry</option>
                          <option value="CSV">CSV / URL Import</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">Incoming Status</label>
                        <select 
                          value={filterIncoming} 
                          onChange={e => setFilterIncoming(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Opted-In">Opted-In</option>
                          <option value="Opted-Out">Opted-Out</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">24 Hours Status</label>
                        <select 
                          value={filter24Hours} 
                          onChange={e => setFilter24Hours(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        >
                          <option value="All">All Timeframes</option>
                          <option value="Within Window">Within 24 Hours</option>
                          <option value="Outside Window">Outside 24 Hours</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={handleExport}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                title="Export Contacts"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
            </div>
          </div>

          {/* Table Header / Bulk Actions Bar */}
          {selectedIds.length > 0 ? (
            <div className="flex items-center justify-between bg-brand-50 px-5 py-3 dark:bg-brand-500/10">
              <div className="flex items-center gap-4">
                <div className="w-8 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" 
                  />
                </div>
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                  {selectedIds.length} contact{selectedIds.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setMoveTargetIds(selectedIds); setShowMoveModal(true); }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-500/20"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  Move to
                </button>
                <button 
                  onClick={() => setDeleteModalConfig({
                    isOpen: true,
                    title: 'Delete Selected Contacts',
                    itemName: `${selectedIds.length} contact(s)`,
                    onConfirm: handleBulkDelete
                  })}
                  className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50/80 px-5 py-3 dark:bg-gray-800/50">
              <div className="flex items-center gap-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                <div className="w-8 shrink-0">
                  <input 
                    type="checkbox" 
                    checked={filteredContacts.length > 0 && selectedIds.length === filteredContacts.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" 
                  />
                </div>
                <div className="min-w-[140px] flex-1">Status/Created at</div>
                <div className="min-w-[180px] flex-1">WhatsApp Number/Name</div>
                <div className="min-w-[180px] flex-1">Source</div>
                <div className="min-w-[150px] flex-1">24 Hours Status</div>
                <div className="w-[140px] shrink-0 text-right">Actions</div>
              </div>
            </div>
          )}

          {/* Table Body */}
          {filteredContacts.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center bg-gray-50/20 dark:bg-gray-900/30">
              <div className="flex flex-col items-center opacity-50">
                <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="40" y="30" width="80" height="60" rx="8" fill="#E2E8F0" />
                  <rect x="40" y="30" width="80" height="16" rx="8" fill="#CBD5E1" />
                  <circle cx="48" cy="38" r="3" fill="#F8FAFC" />
                  <circle cx="56" cy="38" r="3" fill="#F8FAFC" />
                  <circle cx="64" cy="38" r="3" fill="#F8FAFC" />
                  <rect x="50" y="55" width="25" height="4" rx="2" fill="#F1F5F9" />
                  <rect x="50" y="65" width="20" height="4" rx="2" fill="#F1F5F9" />
                  <rect x="50" y="75" width="20" height="4" rx="2" fill="#F1F5F9" />
                  <rect x="85" y="55" width="25" height="25" rx="4" fill="#CBD5E1" />
                  {/* little decorative sparkles */}
                  <circle cx="70" cy="15" r="2" fill="#CBD5E1" />
                  <circle cx="110" cy="110" r="2" fill="#CBD5E1" />
                  <circle cx="35" cy="80" r="2" fill="#CBD5E1" />
                  <path d="M120 40L124 44M124 40L120 44" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M100 20L104 24M104 20L100 24" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M45 105L49 109M49 105L45 109" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">No contacts found.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredContacts.map(contact => (
                <div key={contact.id} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/30">
                  <div className="w-8 shrink-0">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(contact.id)}
                      onChange={() => toggleSelection(contact.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" 
                    />
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${contact.status === 'opted_in' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{contact.status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{contact.createdAt}</span>
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{contact.phone}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{contact.name}</p>
                  </div>
                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{contact.source}</p>
                  </div>
                  <div className="min-w-[150px] flex-1">
                    <p className={`text-sm font-medium ${isWithin24Hours(contact.lastInteractionAt) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isWithin24Hours(contact.lastInteractionAt) ? 'Within Window' : 'Outside Window'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getTimeAgo(contact.lastInteractionAt)}
                    </p>
                  </div>
                  <div className="w-[140px] shrink-0 flex items-center justify-end gap-2">
                    <button onClick={() => handleEditContact(contact)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white" title="Edit">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button 
                      onClick={() => setDeleteModalConfig({
                        isOpen: true,
                        title: 'Delete Contact',
                        itemName: contact.name,
                        onConfirm: () => handleDeleteContact(contact.id)
                      })} 
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" 
                      title="Delete"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Slide-over Panel (Modern SaaS Drawer) */}
      {showAddContact && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm transition-opacity" 
            onClick={closeDrawer}
          />

          {/* Sliding Panel */}
          <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900 sm:w-[480px]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editContactId ? 'Edit Contact' : 'New Contact'}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {editContactId ? 'Update details for this contact.' : 'Add a new contact to your audience list.'}
                </p>
              </div>
              <button 
                onClick={closeDrawer} 
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                
                {/* Contact Type Toggle */}
                <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                  <button 
                    onClick={() => setContactAddMode('single')}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold shadow-sm transition-all ${contactAddMode === 'single' ? 'bg-white text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Single Contact
                  </button>
                  <button 
                    onClick={() => setContactAddMode('bulk')}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold shadow-sm transition-all ${contactAddMode === 'bulk' ? 'bg-white text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  >
                    Bulk Import
                  </button>
                </div>

                {contactAddMode === 'single' ? (
                  <div className="space-y-6">
                    {/* WhatsApp Number Group */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                        WhatsApp Number
                      </label>
                      <div className="flex rounded-xl border border-gray-200 shadow-sm focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50">
                        <div className="relative flex items-center gap-2 border-r border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900/50">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{selectedCountry.code}</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedCountry.dialCode}</span>
                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        <select 
                          className="absolute inset-0 w-full cursor-pointer opacity-0"
                          value={selectedCountry.code}
                          onChange={(e) => setSelectedCountry(COUNTRY_CODES.find(c => c.code === e.target.value) || COUNTRY_CODES[0])}
                        >
                          {COUNTRY_CODES.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.name} ({country.dialCode})
                            </option>
                          ))}
                        </select>
                      </div>
                        <input 
                          type="text" 
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="e.g. 555 0123 456" 
                          className="w-full border-none bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-0 dark:text-white" 
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Format: Country code followed by the mobile number (without spaces/dashes).
                      </p>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Name */}
                    <div>
                      <div className="mb-2 flex justify-between">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Display Name
                        </label>
                        <span className="text-xs text-gray-400">Optional</span>
                      </div>
                      <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter contact's name" 
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white" 
                      />
                    </div>

                    {/* Status Toggle */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                        Subscription Status
                      </label>
                      <div className="relative">
                        <select 
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as 'opted_in' | 'opted_out')}
                          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                        >
                          <option value="opted_in">🟢 Opted In (Subscribed)</option>
                          <option value="opted_out">🔴 Opted Out (Unsubscribed)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>


                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* CSV URL Option */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                        CSV File URL
                      </label>
                      <input 
                        type="url" 
                        value={csvUrl}
                        onChange={(e) => setCsvUrl(e.target.value)}
                        placeholder="https://example.com/contacts.csv" 
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white" 
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Provide a publicly accessible URL to your CSV file.
                      </p>
                    </div>

                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                      <span className="mx-4 shrink-0 text-xs text-gray-400">OR</span>
                      <div className="flex-grow border-t border-gray-100 dark:border-gray-800"></div>
                    </div>

                    {/* File Upload Option */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                        Upload CSV File
                      </label>
                      <div className="flex w-full items-center justify-center">
                        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800">
                          <div className="flex flex-col items-center justify-center pb-6 pt-5 text-center">
                            <svg className="mb-3 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold text-brand-600 dark:text-brand-400">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">CSV files only (MAX. 10MB)</p>
                          </div>
                          <input type="file" onChange={handleFileUpload} className="hidden" accept=".csv" />
                        </label>
                      </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Duplicate Record Option */}
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
                      <div className="flex h-5 items-center">
                        <input 
                          type="checkbox" 
                          checked={skipDuplicates}
                          onChange={(e) => setSkipDuplicates(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" 
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Skip Duplicate Records</span>
                        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">If a contact is already added or appears multiple times in the CSV, it will be automatically skipped.</span>
                      </div>
                    </label>
                  </div>
                )}

              </div>
            </div>

            {/* Drawer Footer */}
            <div className="flex gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
              <button 
                onClick={closeDrawer}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={contactAddMode === 'single' ? handleSaveContact : handleImportContacts}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-600"
              >
                {contactAddMode === 'single' ? (editContactId ? 'Update Contact' : 'Save Contact') : 'Import Contacts'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Move Contacts Modal */}
      {showMoveModal && (
        <>
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowMoveModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Move to Segment</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Select a segment to move {moveTargetIds.length} contact(s) to:</p>
              
              <div className="mb-6 space-y-2">
                {segments.map(segment => (
                  <button
                    key={segment.id}
                    onClick={() => executeMove(segment.id)}
                    className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-brand-50 hover:text-brand-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                  >
                    <span>{segment.name}</span>
                    <svg className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowMoveModal(false)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Generic Information/Placeholder Modal */}
      {popupMessage && (
        <>
          <div className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm" onClick={() => setPopupMessage(null)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${popupMessage.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                  {popupMessage.type === 'success' ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{popupMessage.title}</h3>
              </div>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{popupMessage.message}</p>
              <div className="flex justify-end">
                <button 
                  onClick={() => setPopupMessage(null)}
                  className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom New Segment Modal */}
      {showSegmentModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowSegmentModal(false)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Create New Segment</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Enter a name for your new segment folder.</p>
              
              <input 
                type="text" 
                value={segmentInput}
                onChange={(e) => setSegmentInput(e.target.value)}
                placeholder="e.g. VIP Customers"
                className="mb-6 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveSegment()}
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSegmentModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveSegment}
                  disabled={!segmentInput.trim()}
                  className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {deleteModalConfig && (
        <ConfirmDeleteModal
          isOpen={deleteModalConfig.isOpen}
          onClose={() => setDeleteModalConfig(null)}
          onConfirm={deleteModalConfig.onConfirm}
          title={deleteModalConfig.title}
          itemName={deleteModalConfig.itemName}
        />
      )}
    </>
  );
}
