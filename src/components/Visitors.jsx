

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Filter,
  Trash2,
  Clock,
  CheckCircle,
  Edit3,
  Eye,
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Users,
  Calendar,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import axiosInstance from "../utils/axiosInstance";
import Swal from "sweetalert2";

const Visitors = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [filteredVisitors, setFilteredVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // State for modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  // State for edit form
  const [editFormData, setEditFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    purpose: '',
    employeeToMeet: '',
    visitDateTime: ''
  });
  const [employees, setEmployees] = useState([]);
  const [updating, setUpdating] = useState(false);

const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchVisitors();
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterVisitors();
  }, [searchTerm, statusFilter, visitors]);

  const fetchVisitors = async () => {
    try {
      const response = await axiosInstance.get('/visitors');
      setVisitors(response.data);
      setFilteredVisitors(response.data);
    } catch (error) {
      toast.error('Failed to fetch visitors');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get('/admin/employees');
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
  };

  const filterVisitors = () => {
    let filtered = visitors;

    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.mobile.includes(searchTerm) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    setFilteredVisitors(filtered);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Visitor?',
      text: 'Are you sure you want to delete this visitor record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/visitors/${id}`);

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Visitor deleted successfully',
          timer: 1500,
          showConfirmButton: false
        });

        fetchVisitors();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'Failed to delete visitor'
        });
      }
    }
  };

  // View Details
  const handleViewDetails = (visitor) => {
    setSelectedVisitor(visitor);
    setShowViewModal(true);
  };

  // Edit Visitor
  const handleEditClick = (visitor) => {
    setSelectedVisitor(visitor);
    setEditFormData({
      name: visitor.name || '',
      mobile: visitor.mobile || '',
      email: visitor.email || '',
      purpose: visitor.purpose || '',
      employeeToMeet: visitor.employeeToMeet?._id || visitor.employeeToMeet || '',
      visitDateTime: visitor.visitDateTime ? new Date(visitor.visitDateTime).toISOString().slice(0, 16) : ''
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;

    // Mobile number validation
    if (name === 'mobile') {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleEditSubmit = async () => {
    if (!selectedVisitor) return;

    // Validate form
    if (!editFormData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editFormData.mobile || editFormData.mobile.length !== 10) {
      toast.error('Valid 10-digit mobile number is required');
      return;
    }
    if (!editFormData.email || !/\S+@\S+\.\S+/.test(editFormData.email)) {
      toast.error('Valid email is required');
      return;
    }
    if (!editFormData.purpose.trim()) {
      toast.error('Purpose is required');
      return;
    }
    if (!editFormData.employeeToMeet) {
      toast.error('Please select an employee');
      return;
    }

    setUpdating(true);

    try {
      const formData = new FormData();
      formData.append('name', editFormData.name);
      formData.append('mobile', editFormData.mobile);
      formData.append('email', editFormData.email);
      formData.append('purpose', editFormData.purpose);
      formData.append('employeeToMeet', editFormData.employeeToMeet);

      if (editFormData.visitDateTime) {
        formData.append('visitDateTime', new Date(editFormData.visitDateTime).toISOString());
      }

      const response = await axiosInstance.put(`/visitors/${selectedVisitor._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Visitor updated successfully');
      setShowEditModal(false);
      setSelectedVisitor(null);
      fetchVisitors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update visitor');
    } finally {
      setUpdating(false);
    }
  };

  // Status Update
  const handleStatusUpdateClick = (visitor) => {
    setSelectedVisitor(visitor);
    setNewStatus(visitor.status);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedVisitor) return;

    try {
      await axiosInstance.put(
        `/visitors/${selectedVisitor._id}/status`,
        { status: newStatus }
      );

      toast.success(`Visitor status updated to ${newStatus}`);
      setShowStatusModal(false);
      setSelectedVisitor(null);
      fetchVisitors();
    } catch (error) {
      toast.error('Failed to update visitor status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      WAITING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      IN_MEETING: 'bg-blue-100 text-blue-800'
    };
    return styles[status] || styles.WAITING;
  };

  const statusOptions = [
    { value: 'WAITING', label: 'Waiting', color: 'yellow' },
    { value: 'IN_MEETING', label: 'In Meeting', color: 'blue' },
    { value: 'COMPLETED', label: 'Completed', color: 'gray' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Visitors History</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, mobile or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Visitors Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Time</th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No visitors found
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((visitor) => (
                    <tr key={visitor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={`${IMAGE_BASE_URL}${visitor.photo}`}
                            alt={visitor.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/40';
                            }}
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{visitor.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{visitor.email}</div>
                        <div className="text-sm text-gray-500">{visitor.mobile}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{visitor.employeeToMeet?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{visitor.purpose.substring(0, 30)}...</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(visitor.status)}`}>
                          {visitor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.visitDateTime ? format(new Date(visitor.visitDateTime), 'dd MMM yyyy, hh:mm a') : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {visitor.status === "COMPLETED" && visitor.meetingDuration
                          ? visitor.meetingDuration
                          : visitor.status === "IN_MEETING"
                            ? "In Progress..."
                            : "-"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(visitor)}
                            className="text-green-600 hover:text-green-900"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEditClick(visitor)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Visitor"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdateClick(visitor)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Update Status"
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(visitor._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Visitor"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* View Details Modal */}
      {showViewModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Visitor Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedVisitor(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center space-x-6 mb-6">
                <img
                  src={`${IMAGE_BASE_URL}${selectedVisitor.photo}`}
                  alt={selectedVisitor.name}
                  className="w-24 h-24 rounded-xl object-cover border-4 border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/96';
                  }}
                />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedVisitor.name}</h3>
                  <span className={`mt-2 px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(selectedVisitor.status)}`}>
                    {selectedVisitor.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-gray-900">{selectedVisitor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Mobile</p>
                      <p className="text-gray-900">{selectedVisitor.mobile}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Visit Date & Time</p>
                      <p className="text-gray-900">
                        {selectedVisitor.visitDateTime
                          ? format(new Date(selectedVisitor.visitDateTime), 'dd MMM yyyy, hh:mm a')
                          : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Employee to Meet</p>
                      <p className="text-gray-900">{selectedVisitor.employeeToMeet?.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">{selectedVisitor.employeeToMeet?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Purpose</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedVisitor.purpose}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <p>In Time: {format(new Date(selectedVisitor.inTime), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
                <div>
                  <p>Last Updated: {format(new Date(selectedVisitor.updatedAt), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              </div>

              {selectedVisitor.meetingStartTime && (
                <div>
                  <p>
                    Meeting Started:{" "}
                    {format(new Date(selectedVisitor.meetingStartTime), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
              )}

              {selectedVisitor.meetingEndTime && (
                <div>
                  <p>
                    Meeting Ended:{" "}
                    {format(new Date(selectedVisitor.meetingEndTime), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
              )}

              {selectedVisitor.meetingDuration && (
                <div>
                  <p>
                    Total Meeting Time:{" "}
                    <span className="font-semibold text-gray-900">
                      {selectedVisitor.meetingDuration}
                    </span>
                  </p>
                </div>
              )}


            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Edit Visitor</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedVisitor(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={editFormData.mobile}
                      onChange={handleEditInputChange}
                      maxLength="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee to Meet <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="employeeToMeet"
                    value={editFormData.employeeToMeet}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} - {emp.department || 'Department'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Visit Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="visitDateTime"
                    value={editFormData.visitDateTime}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="purpose"
                    value={editFormData.purpose}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleEditSubmit}
                  disabled={updating}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedVisitor(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">Update Visitor Status</h2>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500">Visitor</p>
                <p className="font-medium text-gray-900">{selectedVisitor.name}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Update Status
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedVisitor(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;