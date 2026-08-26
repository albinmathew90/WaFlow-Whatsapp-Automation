import { useState } from "react";
import Button from "../ui/button/Button";
import { useNavigate } from "react-router";
import { useUser } from "../../context/UserContext";
import { Modal } from "../ui/modal";

export default function DeleteAccountTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    
    try {
      const token = (sessionStorage.getItem('crm_token') || localStorage.getItem('crm_token'));
      const response = await fetch('/openwa-api/crm/auth/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      sessionStorage.removeItem('crm_token');
      setUser(null);
      navigate('/signin');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-2">
            Delete Account
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Once you delete your account, there is no going back. Please be certain.
          </p>

          {error && (
            <div className="p-3 mb-5 text-sm text-red-600 bg-red-50 rounded-lg dark:bg-red-500/10 dark:text-red-400 max-w-md">
              {error}
            </div>
          )}

          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-red-500 bg-red-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-red-600 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[400px]">
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Confirm Account Deletion
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300 disabled:opacity-50 dark:focus:ring-red-800"
            >
              {loading ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
