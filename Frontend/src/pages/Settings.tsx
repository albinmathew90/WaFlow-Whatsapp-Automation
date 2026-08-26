import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import MediaLibrarySection from "./Settings/MediaLibrarySection";
import ContactCustomFieldsSection from "./Settings/ContactCustomFieldsSection";
import SettingsLogs from "./Settings/SettingsLogs";
import SettingsBilling from "./Settings/SettingsBilling";
import UserProfiles from "./UserProfiles";

export interface Tag {
  id: string;
  name: string;
  autoTaggingStatus: boolean;
  firstMessageMatch: string;
  createdAt: string;
}

export default function Settings() {
  const location = useLocation();
  const activeTab = location.pathname.includes('/logs') ? 'logs' : location.pathname.includes('/contact-fields') ? 'contact-fields' : location.pathname.includes('/media') ? 'media' : location.pathname.includes('/billing') ? 'billing' : 'account';
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
        const res = await fetch('/openwa-api/crm/tags', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Backend returns CrmTag { id, name, color, createdAt, updatedAt }
          // We map it to the expected interface
          setTags(data.map((t: any) => ({
            id: t.id,
            name: t.name,
            autoTaggingStatus: false, // Not supported in DB yet
            firstMessageMatch: '',
            createdAt: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          })));
        }
      } catch (e) {
        console.error("Failed to load tags", e);
      }
    };
    fetchTags();
  }, []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [autoTaggingEnabled, setAutoTaggingEnabled] = useState(false);
  const [firstMessageKeywords, setFirstMessageKeywords] = useState('');

  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    onConfirm: () => void;
  } | null>(null);

  const handleSaveTag = () => {
    if (!newTagName.trim()) return;

    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      fetch('/openwa-api/crm/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newTagName })
      }).then(res => res.json()).then(data => {
        setTags([...tags, {
          id: data.id,
          name: data.name,
          autoTaggingStatus: false,
          firstMessageMatch: '',
          createdAt: new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }]);
      });
    } catch (e) {
      console.error(e);
    }

    // Reset and close
    setNewTagName('');
    setAutoTaggingEnabled(false);
    setFirstMessageKeywords('');
    setShowAddModal(false);
  };

  const handleDeleteTag = (id: string) => {
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      fetch(`/openwa-api/crm/tags/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (res.ok) {
          setTags(tags.filter(t => t.id !== id));
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <PageMeta
        title={activeTab === 'media' ? "Media Library | Waflow" : activeTab === 'contact-fields' ? "Contact Custom Fields | Waflow" : activeTab === 'billing' ? "Billing & Subscription | Waflow" : activeTab === 'logs' ? "Activity Logs | Waflow" : "Account Management | Waflow"}
        description={activeTab === 'media' ? "Media Library page for Waflow" : activeTab === 'contact-fields' ? "Contact Custom Fields page for Waflow" : activeTab === 'billing' ? "Billing and Subscription Management" : activeTab === 'logs' ? "Activity Logs for Waflow" : "Account Management page for Waflow"}
      />
      <PageBreadcrumb pageTitle={activeTab === 'media' ? "Media Library" : activeTab === 'contact-fields' ? "Contact Custom Fields" : activeTab === 'billing' ? "Billing & Subscription" : activeTab === 'logs' ? "Activity Logs" : "Account Management"} />

      {activeTab === 'media' ? (
        <MediaLibrarySection />
      ) : activeTab === 'contact-fields' ? (
        <ContactCustomFieldsSection />
      ) : activeTab === 'billing' ? (
        <SettingsBilling />
      ) : activeTab === 'logs' ? (
        <SettingsLogs />
      ) : (
        <UserProfiles />
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
    </div>
  );
}
