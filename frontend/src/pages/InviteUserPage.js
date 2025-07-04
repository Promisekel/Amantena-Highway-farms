import React, { useState, useEffect } from 'react';
import { invitesAPI as invitesApi } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  UserPlusIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const InviteUserPage = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'USER',
    message: ''
  });

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const response = await invitesApi.getInvites();
      setInvites(response.data || []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      await invitesApi.sendInvite(inviteForm);
      setInviteForm({ email: '', role: 'USER', message: '' });
      fetchInvites();
      alert('Invite sent successfully!');
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Error sending invite. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!window.confirm('Are you sure you want to delete this invite?')) {
      return;
    }
    
    try {
      await invitesApi.deleteInvite(inviteId);
      setInvites(prev => prev.filter(invite => invite.id !== inviteId));
    } catch (error) {
      console.error('Error deleting invite:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'EXPIRED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'Accepted';
      case 'EXPIRED':
        return 'Expired';
      default:
        return 'Pending';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Invitations</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Invite Form */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserPlusIcon className="h-5 w-5 mr-2 text-green-600" />
                Send Invitation
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="USER">User</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Add a personal message to the invitation..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <EnvelopeIcon className="h-5 w-5 mr-2" />
                      Send Invitation
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Role Information */}
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Role Permissions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">User</h4>
                  <p className="text-gray-600">Can view products and sales data</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Manager</h4>
                  <p className="text-gray-600">Can manage products, sales, and view reports</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Admin</h4>
                  <p className="text-gray-600">Full access to all features and user management</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invites List */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Invitation History</h3>
            </div>
            <div className="p-6">
              {invites.length > 0 ? (
                <div className="space-y-4">
                  {invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getStatusIcon(invite.status)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(invite.status)}`}>
                              {getStatusText(invite.status)}
                            </span>
                            <span className="text-xs text-gray-500">Role: {invite.role}</span>
                            <span className="text-xs text-gray-500">
                              Sent: {new Date(invite.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {invite.message && (
                            <p className="text-xs text-gray-600 mt-1">"{invite.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {invite.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/register?token=${invite.token}`);
                              alert('Invite link copied to clipboard!');
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Copy Link
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvite(invite.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations sent</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by sending your first invitation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Invites</dt>
                  <dd className="text-lg font-medium text-gray-900">{invites.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Accepted</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {invites.filter(invite => invite.status === 'ACCEPTED').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {invites.filter(invite => invite.status === 'PENDING').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteUserPage;
