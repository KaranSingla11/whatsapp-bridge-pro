import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { getApiBaseUrl } from '../config';

interface AutoReplyRule {
  id: string;
  instanceId: string;
  fromNumber: string;
  triggerMessage: string;
  replyMessage: string;
  caseSensitive: boolean;
  matchType: 'exact' | 'contains';
  enabled: boolean;
}

export default function AutoReply() {
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    instanceId: '',
    fromNumber: '',
    triggerMessage: '',
    replyMessage: '',
    caseSensitive: false,
    matchType: 'contains' as 'exact' | 'contains',
    enabled: true
  });

  useEffect(() => {
    loadInstances();
    loadRules();
  }, []);

  const loadInstances = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/instances`);
      const data = await response.json();
      setInstances(data);
    } catch (error) {
      console.error('Failed to load instances:', error);
    }
  };

  const loadRules = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auto-reply`);
      if (response.ok) {
        const data = await response.json();
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const handleOpenModal = (rule?: AutoReplyRule) => {
    if (rule) {
      setEditingId(rule.id);
      setFormData({
        instanceId: rule.instanceId,
        fromNumber: rule.fromNumber,
        triggerMessage: rule.triggerMessage,
        replyMessage: rule.replyMessage,
        caseSensitive: rule.caseSensitive,
        matchType: rule.matchType,
        enabled: rule.enabled
      });
    } else {
      setEditingId(null);
      setFormData({
        instanceId: '',
        fromNumber: '',
        triggerMessage: '',
        replyMessage: '',
        caseSensitive: false,
        matchType: 'contains',
        enabled: true
      });
    }
    setShowModal(true);
  };

  const handleSaveRule = async () => {
    if (!formData.instanceId || !formData.triggerMessage || !formData.replyMessage) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const url = `${getApiBaseUrl()}/auto-reply${editingId ? `/${editingId}` : ''}`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        await loadRules();
        setShowModal(false);
        alert(editingId ? 'Rule updated!' : 'Rule created!');
      } else {
        alert(`Failed to save rule: ${data.error || 'Unknown error'}`);
        console.error('Error response:', data);
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      alert(`Error saving rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Delete this auto-reply rule?')) return;

    try {
      const response = await fetch(`${getApiBaseUrl()}/auto-reply/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadRules();
        alert('Rule deleted!');
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const handleToggleRule = async (rule: AutoReplyRule) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/auto-reply/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, enabled: !rule.enabled })
      });

      if (response.ok) {
        await loadRules();
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Auto Reply</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add Auto Reply
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Instance</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">From</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trigger Message</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Reply Message</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Match Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No auto-reply rules. Click "Add Auto Reply" to create one.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    {instances.find(i => i.id === rule.instanceId)?.phoneNumber || rule.instanceId}
                  </td>
                  <td className="px-6 py-4 text-sm">{rule.fromNumber || 'All'}</td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">{rule.triggerMessage}</td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">{rule.replyMessage}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {rule.matchType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        rule.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleOpenModal(rule)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Auto Reply' : 'Add Auto Reply'}
            </h2>

            <div className="space-y-4">
              {/* Instance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instance *
                </label>
                <select
                  value={formData.instanceId}
                  onChange={(e) => setFormData({ ...formData, instanceId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select Instance</option>
                  {instances.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.phoneNumber || inst.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Number (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Number/Group (Optional)
                </label>
                <input
                  type="text"
                  value={formData.fromNumber}
                  onChange={(e) => setFormData({ ...formData, fromNumber: e.target.value })}
                  placeholder="Leave empty to trigger from any number"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>

              {/* Match Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Match Type
                </label>
                <select
                  value={formData.matchType}
                  onChange={(e) => setFormData({ ...formData, matchType: e.target.value as 'exact' | 'contains' })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="contains">Contains</option>
                  <option value="exact">Exact Match</option>
                </select>
              </div>

              {/* Trigger Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Message *
                </label>
                <textarea
                  value={formData.triggerMessage}
                  onChange={(e) => setFormData({ ...formData, triggerMessage: e.target.value })}
                  placeholder="Message to trigger the auto-reply"
                  className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                />
              </div>

              {/* Reply Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reply Message *
                </label>
                <textarea
                  value={formData.replyMessage}
                  onChange={(e) => setFormData({ ...formData, replyMessage: e.target.value })}
                  placeholder="Auto-reply message"
                  className="w-full border border-gray-300 rounded px-3 py-2 h-20"
                />
              </div>

              {/* Case Sensitive */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="caseSensitive"
                  checked={formData.caseSensitive}
                  onChange={(e) => setFormData({ ...formData, caseSensitive: e.target.checked })}
                  className="h-4 w-4 text-green-600"
                />
                <label htmlFor="caseSensitive" className="ml-2 text-sm text-gray-700">
                  Case Sensitive
                </label>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="h-4 w-4 text-green-600"
                />
                <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
                  Enable this rule
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                onClick={handleSaveRule}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
