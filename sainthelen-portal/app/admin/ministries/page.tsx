'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Ministry {
  id: string;
  name: string;
  requiresApproval: boolean;
  approvalCoordinator?: string;
  description?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface MinistryFormData {
  name: string;
  requiresApproval: boolean;
  approvalCoordinator: string;
  description: string;
  active: boolean;
}

const initialFormData: MinistryFormData = {
  name: '',
  requiresApproval: false,
  approvalCoordinator: 'adult-discipleship',
  description: '',
  active: true
};

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null);
  const [formData, setFormData] = useState<MinistryFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchMinistries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ministries');
      if (!response.ok) {
        throw new Error('Failed to fetch ministries');
      }
      const data = await response.json();
      setMinistries(data.ministries || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ministries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinistries();
  }, []);

  const handleAdd = () => {
    setEditingMinistry(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleEdit = (ministry: Ministry) => {
    setEditingMinistry(ministry);
    setFormData({
      name: ministry.name,
      requiresApproval: ministry.requiresApproval,
      approvalCoordinator: ministry.approvalCoordinator || 'adult-discipleship',
      description: ministry.description || '',
      active: ministry.active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      const url = editingMinistry ? '/api/admin/ministries' : '/api/admin/ministries';
      const method = editingMinistry ? 'PUT' : 'POST';
      const body = editingMinistry 
        ? { ...formData, id: editingMinistry.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save ministry');
      }

      setShowModal(false);
      await fetchMinistries();
    } catch (err: any) {
      setError(err.message || 'Failed to save ministry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/ministries?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete ministry');
      }

      setDeleteConfirm(null);
      await fetchMinistries();
    } catch (err: any) {
      setError(err.message || 'Failed to delete ministry');
    }
  };

  const activeMinistries = ministries.filter(m => m.active);
  const inactiveMinistries = ministries.filter(m => !m.active);

  return (
    <AdminLayout title="Ministry Management">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 dark:text-red-300 font-medium">Error</p>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
                <button 
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 text-sm underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ministry Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage ministries and configure approval requirements for announcements
            </p>
          </div>
          <Button onClick={handleAdd} className="bg-sh-primary hover:bg-sh-secondary">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Ministry
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sh-primary"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading ministries...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Ministries */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Active Ministries ({activeMinistries.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeMinistries.map((ministry) => (
                  <Card key={ministry.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {ministry.name}
                        </h3>
                        {ministry.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {ministry.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      {ministry.requiresApproval ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                          Requires Approval
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <CheckIcon className="w-3 h-3 mr-1" />
                          Auto-Approved
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(ministry)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <PencilIcon className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirm(ministry.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/30"
                      >
                        <TrashIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Inactive Ministries */}
            {inactiveMinistries.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Inactive Ministries ({inactiveMinistries.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveMinistries.map((ministry) => (
                    <Card key={ministry.id} className="p-4 opacity-60">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {ministry.name}
                          </h3>
                          {ministry.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {ministry.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                          <XMarkIcon className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(ministry)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <PencilIcon className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => setDeleteConfirm(ministry.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/30"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingMinistry ? 'Edit Ministry' : 'Add New Ministry'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ministry Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Adult Bible Study"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sh-primary focus:border-sh-primary dark:bg-gray-700 dark:text-white resize-none"
                      rows={2}
                      placeholder="Brief description of the ministry"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requiresApproval"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData(prev => ({ ...prev, requiresApproval: e.target.checked }))}
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                    />
                    <label htmlFor="requiresApproval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Requires approval from Adult Discipleship Coordinator
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      className="h-4 w-4 text-sh-primary focus:ring-sh-primary border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Active (show in autocomplete)
                    </label>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      type="submit"
                      disabled={submitting || !formData.name.trim()}
                      className="bg-sh-primary hover:bg-sh-secondary text-white flex-1"
                    >
                      {submitting ? 'Saving...' : (editingMinistry ? 'Update' : 'Create')}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowModal(false)}
                      variant="outline"
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Delete Ministry
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete this ministry? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm(null)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}