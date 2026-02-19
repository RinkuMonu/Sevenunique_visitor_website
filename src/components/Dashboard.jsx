import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  UserCheck,
  Clock,
  LogOut,
  Calendar,
  UserPlus,
  UserCog,
  Shield,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import toast from "react-hot-toast";
import axiosInstance from "../utils/axiosInstance";

const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [counts, setCounts] = useState({
    totalUsers: 0,
    admin: 0,
    reception: 0,
    security: 0,
    employee: 0,
    active: 0,
    deactivated: 0,
    allTimeVisitors: {
      total: 0,
      completed: 0,
      waiting: 0,
      inMeeting: 0,
    },
    todayVisitors: {
      total: 0,
      completed: 0,
      waiting: 0,
      inMeeting: 0,
    },
  });

  const [allVisitors, setAllVisitors] = useState([]);
  const [todayVisitors, setTodayVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get("/admin/dashboard/counts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;

      setCounts({
        totalUsers: data.users.total,
        admin: data.users.roles.admin,
        reception: data.users.roles.reception,
        security: data.users.roles.security,
        employee: data.users.roles.employee,
        active: data.users.active,
        deactivated: data.users.deactivated,
        allTimeVisitors: {
          total: data.visitors.allTime.total,
          completed: data.visitors.allTime.completed,
          waiting: data.visitors.allTime.waiting,
          inMeeting: data.visitors.allTime.inMeeting,
        },
        todayVisitors: {
          total: data.visitors.today.total,
          completed: data.visitors.today.completed,
          waiting: data.visitors.today.waiting,
          inMeeting: data.visitors.today.inMeeting,
        },
      });

      setAllVisitors(data.visitors.allTime.list || []);
      setTodayVisitors(data.visitors.today.list || []);
    } catch (error) {
      toast.error("Failed to fetch dashboard data");
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (visitorId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      await axiosInstance.put(
        `/visitors/${visitorId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Visitor status updated successfully");
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const handleVisitorClick = async (visitorId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axiosInstance.get(`/visitors/${visitorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSelectedVisitor(res.data);
      setShowVisitorModal(true);
    } catch (error) {
      toast.error("Failed to fetch visitor details");
    }
  };

  /* ================= Stats Cards ================= */

  const stats = [
    {
      title: "Today Visitors",
      value: counts.todayVisitors.total,
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "Waiting Today",
      value: counts.todayVisitors.waiting,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      title: "In Meeting Today",
      value: counts.todayVisitors.inMeeting,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Completed Today",
      value: counts.todayVisitors.completed,
      icon: UserCheck,
      color: "bg-green-500",
    },
  ];

  const userStats = [
    {
      title: "Total Users",
      value: counts.totalUsers,
      icon: Users,
      color: "bg-indigo-500",
    },
    {
      title: "Employees",
      value: counts.employee,
      icon: User,
      color: "bg-blue-500",
    },
    {
      title: "Admins",
      value: counts.admin,
      icon: UserCog,
      color: "bg-red-500",
    },
    {
      title: "Reception",
      value: counts.reception,
      icon: UserCheck,
      color: "bg-green-500",
    },
    {
      title: "Security",
      value: counts.security,
      icon: Shield,
      color: "bg-yellow-500",
    },
    {
      title: "Active Users",
      value: counts.active,
      icon: UserCheck,
      color: "bg-emerald-500",
    },
  ];

  /* ================= Chart Data ================= */

  const todayChartData = {
    labels: ["Waiting", "In Meeting", "Completed"],
    datasets: [
      {
        label: "Today Visitor Status",
        data: [
          counts.todayVisitors.waiting,
          counts.todayVisitors.inMeeting,
          counts.todayVisitors.completed,
        ],
        backgroundColor: [
          "rgba(251, 191, 36, 0.7)",
          "rgba(59, 130, 246, 0.7)",
          "rgba(34, 197, 94, 0.7)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const allTimeChartData = {
    labels: ["Waiting", "In Meeting", "Completed"],
    datasets: [
      {
        label: "All Time Visitor Status",
        data: [
          counts.allTimeVisitors.waiting,
          counts.allTimeVisitors.inMeeting,
          counts.allTimeVisitors.completed,
        ],
        backgroundColor: [
          "rgba(251, 191, 36, 0.7)",
          "rgba(59, 130, 246, 0.7)",
          "rgba(34, 197, 94, 0.7)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const userRoleChartData = {
    labels: ["Admin", "Reception", "Security", "Employee"],
    datasets: [
      {
        label: "Users by Role",
        data: [
          counts.admin,
          counts.reception,
          counts.security,
          counts.employee,
        ],
        backgroundColor: [
          "rgba(239, 68, 68, 0.7)",
          "rgba(34, 197, 94, 0.7)",
          "rgba(234, 179, 8, 0.7)",
          "rgba(59, 130, 246, 0.7)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "WAITING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_MEETING":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center space-x-3">
              <img
                src="/sevenuniqueLogo.png"
                alt="Company Logo"
                className="h-10 w-auto"
              />

              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {user?.role}
              </span>

              {user?.role === "ADMIN" && (
                <button
                  onClick={() => navigate("/users")}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Users</span>
                </button>
              )}

              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Today's Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Today's Visitors</h3>
            <p className="text-3xl font-bold">{counts.todayVisitors.total}</p>
            <p className="text-sm opacity-90 mt-2">
              {counts.todayVisitors.completed} completed ·{" "}
              {counts.todayVisitors.waiting} waiting ·{" "}
              {counts.todayVisitors.inMeeting} in meeting
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">All Time Visitors</h3>
            <p className="text-3xl font-bold">{counts.allTimeVisitors.total}</p>
            <p className="text-sm opacity-90 mt-2">
              {counts.allTimeVisitors.completed} completed ·{" "}
              {counts.allTimeVisitors.waiting} waiting ·{" "}
              {counts.allTimeVisitors.inMeeting} in meeting
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4 mt-10">
          <button
            onClick={() => navigate("/create-visitor")}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <UserPlus className="w-5 h-5" />
            <span>New Visitor Check-in</span>
          </button>

          <button
            onClick={() => navigate("/visitors")}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:opacity-90 transition shadow-md"
          >
            <Users className="w-5 h-5" />
            <span>All Visitors</span>
          </button>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Today's Visitor Status Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Today's Visitor Status
            </h2>
            {counts.todayVisitors.total > 0 ? (
              <div className="h-64">
                <Pie
                  data={todayChartData}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No visitors today
              </div>
            )}
          </div>

          {/* All Time Visitor Status Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              All Time Visitor Status
            </h2>
            {counts.allTimeVisitors.total > 0 ? (
              <div className="h-64">
                <Pie
                  data={allTimeChartData}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No visitors yet
              </div>
            )}
          </div>
        </div>

        {/* Visitors Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Visitors */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Today's Visitors ({counts.todayVisitors.total})
              </h2>
              <button
                onClick={() => navigate("/visitors")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>

            {todayVisitors.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {todayVisitors.map((visitor) => (
                  <div
                    key={visitor._id}
                    onClick={() => handleVisitorClick(visitor._id)}
                    className="flex items-center space-x-4 border-b pb-3 hover:bg-gray-50 p-2 rounded transition cursor-pointer"
                  >
                    <img
                      // src={`http://localhost:5001${visitor.photo}`}
                      src={`${IMAGE_BASE_URL}${visitor.photo || visitor?.visitorIdPhoto}`}
                      alt={visitor.name}
                      className="w-12 h-12 rounded-full object-cover"
                      // onError={(e) => {
                      //   e.target.src = 'https://via.placeholder.com/48';
                      // }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {visitor.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Meeting with: {visitor.employeeToMeet?.name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(visitor.inTime).toLocaleTimeString()}
                      </p>
                    </div>
                    {/* <span
                      className={`px-3 py-1 text-xs rounded-full ${getStatusBadgeColor(visitor.status)}`}
                    >
                      {visitor.status}
                    </span> */}

                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${getStatusBadgeColor(visitor.status)}`}
                      >
                        {visitor.status}
                      </span>

                      {/* Status Buttons */}
                      <div className="flex space-x-1">
                        {/* WAITING BUTTON */}
                        <button
                          disabled={visitor.status === "COMPLETED"}
                          onClick={() =>
                            handleStatusChange(visitor._id, "WAITING")
                          }
                          className={`text-xs px-2 py-1 rounded text-white 
        ${
          visitor.status === "COMPLETED"
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-yellow-500 hover:bg-yellow-600"
        }
      `}
                        >
                          Waiting
                        </button>

                        {/* IN MEETING BUTTON */}
                        <button
                          disabled={visitor.status === "COMPLETED"}
                          onClick={() =>
                            handleStatusChange(visitor._id, "IN_MEETING")
                          }
                          className={`text-xs px-2 py-1 rounded text-white 
        ${
          visitor.status === "COMPLETED"
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }
      `}
                        >
                          In Meeting
                        </button>

                        {/* COMPLETED BUTTON */}
                        <button
                          disabled={visitor.status === "COMPLETED"}
                          onClick={() =>
                            handleStatusChange(visitor._id, "COMPLETED")
                          }
                          className={`text-xs px-2 py-1 rounded text-white 
        ${
          visitor.status === "COMPLETED"
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600"
        }
      `}
                        >
                          Completed
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No visitors today
              </p>
            )}
          </div>

          {/* Recent All-Time Visitors */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Visitors ({counts.allTimeVisitors.total})
              </h2>
              <button
                onClick={() => navigate("/visitors")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>

            {allVisitors.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allVisitors.slice(0, 5).map((visitor) => (
                  <div
                    key={visitor._id}
                    onClick={() => handleVisitorClick(visitor._id)}
                    className="flex items-center space-x-4 border-b pb-3 hover:bg-gray-50 p-2 rounded transition cursor-pointer"
                  >
                    <img
                      // src={`http://localhost:5001${visitor.photo}`}
                      src={`${IMAGE_BASE_URL}${visitor.photo || visitor.visitorIdPhoto}`}
                      alt={visitor.name}
                      className="w-12 h-12 rounded-full object-cover"
                      // onError={(e) => {
                      //   e.target.src = 'https://via.placeholder.com/48';
                      // }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {visitor.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Meeting with: {visitor.employeeToMeet?.name || "N/A"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(visitor.inTime).toLocaleDateString()}{" "}
                        {new Date(visitor.inTime).toLocaleTimeString()}
                      </p>
                    </div>
                    {/* <span
                      className={`px-3 py-1 text-xs rounded-full ${getStatusBadgeColor(visitor.status)}`}
                    >
                      {visitor.status}
                    </span> */}

                    <div className="flex flex-col items-end space-y-2">
                      <span
                        className={`px-3 py-1 text-xs rounded-full ${getStatusBadgeColor(visitor.status)}`}
                      >
                        {visitor.status}
                      </span>

                      {/* Status Buttons */}
                      <div className="flex space-x-1">
                        {visitor.status !== "WAITING" && (
                          <button
                            disabled={visitor.status === "COMPLETED"}
                            onClick={() =>
                              handleStatusChange(visitor._id, "WAITING")
                            }
                            className={`text-xs px-2 py-1 rounded text-white
          ${
            visitor.status === "COMPLETED"
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
                          >
                            Waiting
                          </button>
                        )}

                        {visitor.status !== "IN_MEETING" && (
                          <button
                            disabled={visitor.status === "COMPLETED"}
                            onClick={() =>
                              handleStatusChange(visitor._id, "IN_MEETING")
                            }
                            className={`text-xs px-2 py-1 rounded text-white
          ${
            visitor.status === "COMPLETED"
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
                          >
                            In Meeting
                          </button>
                        )}

                        {visitor.status !== "COMPLETED" && (
                          <button
                            disabled={visitor.status === "COMPLETED"}
                            onClick={() =>
                              handleStatusChange(visitor._id, "COMPLETED")
                            }
                            className={`text-xs px-2 py-1 rounded text-white
          ${
            visitor.status === "COMPLETED"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600"
          }`}
                          >
                            Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No visitors yet</p>
            )}
          </div>
        </div>
      </main>

      {/* visitor details modal */}
      {showVisitorModal && selectedVisitor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowVisitorModal(false);
                setSelectedVisitor(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
            >
              ✕
            </button>

            {/* Header Section */}
            <div className="p-6 border-b flex items-center space-x-6">
              <img
                src={`${IMAGE_BASE_URL}${selectedVisitor.photo || selectedVisitor?.visitorIdPhoto}`}
                alt={selectedVisitor.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-gray-200 shadow"
                // onError={(e) => {
                //   e.target.onerror = null;
                //   e.target.src = "https://via.placeholder.com/100";
                // }}
              />

              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedVisitor.name}
                </h2>

                <span
                  className={`mt-2 inline-flex px-4 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(
                    selectedVisitor.status,
                  )}`}
                >
                  {selectedVisitor.status}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Contact Info */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <p>
                    <span className="font-medium text-gray-600">Email:</span>{" "}
                    {selectedVisitor.email}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600">Mobile:</span>{" "}
                    {selectedVisitor.mobile}
                  </p>
                </div>
              </div>

              {/* Meeting Info */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Meeting Information
                </h3>

                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-medium text-gray-600">Employee:</span>{" "}
                    {selectedVisitor.employeeToMeet?.name || "N/A"}
                  </p>

                  <p>
                    <span className="font-medium text-gray-600">Purpose:</span>{" "}
                    {selectedVisitor.purpose}
                  </p>

                  <p>
                    <span className="font-medium text-gray-600">
                      Check-in Time:
                    </span>{" "}
                    {new Date(selectedVisitor.inTime).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Visit Timeline
                </h3>

                <div className="space-y-2 text-sm">
                  {selectedVisitor.meetingStartTime && (
                    <p>
                      <span className="font-medium text-blue-600">
                        Meeting Started:
                      </span>{" "}
                      {new Date(
                        selectedVisitor.meetingStartTime,
                      ).toLocaleString()}
                    </p>
                  )}

                  {selectedVisitor.meetingEndTime && (
                    <p>
                      <span className="font-medium text-green-600">
                        Meeting Ended:
                      </span>{" "}
                      {new Date(
                        selectedVisitor.meetingEndTime,
                      ).toLocaleString()}
                    </p>
                  )}

                  {selectedVisitor.meetingDuration && (
                    <p className="text-lg font-semibold text-purple-700">
                      Total Meeting Duration: {selectedVisitor.meetingDuration}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
