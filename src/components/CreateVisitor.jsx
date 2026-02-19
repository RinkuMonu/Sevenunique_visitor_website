import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  Briefcase,
  Users,
  X,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import Webcam from "react-webcam";
import axiosInstance from "../utils/axiosInstance";

const CreateVisitor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const webcamRef = useRef(null);
  const idWebcamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [idPreview, setIdPreview] = useState(null);
  const [capturedIdImage, setCapturedIdImage] = useState(null);
  const [showIdCamera, setShowIdCamera] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    purpose: "",
    employeeToMeet: "",
    visitDateTime: "", // ✅ NEW FIELD
    visitorIdNumber: "",
  });

  const [errors, setErrors] = useState({});

  const capturePhoto = () => {
    if (!webcamRef.current) {
      toast.error("Camera not ready yet");
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();

    if (imageSrc) {
      setCapturedImage(imageSrc);
      setPhotoPreview(imageSrc);
      setShowCamera(false);
      toast.success("Photo captured successfully!");
    } else {
      toast.error("Failed to capture photo");
    }
  };

  const captureIdPhoto = () => {
    if (!idWebcamRef.current) {
      toast.error("Camera not ready yet");
      return;
    }

    const imageSrc = idWebcamRef.current.getScreenshot();

    if (imageSrc) {
      setCapturedIdImage(imageSrc);
      setIdPreview(imageSrc);
      setShowIdCamera(false);
      toast.success("Visitor ID captured!");
    }
  };

  const retakeIdPhoto = () => {
    setCapturedIdImage(null);
    setIdPreview(null);
    setShowIdCamera(true);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setPhotoPreview(null);
    setShowCamera(true);
  };

  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get("/admin/employees");
      setEmployees(response.data);
    } catch (error) {
      toast.error("Failed to fetch employees");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Mobile number validation
    if (name === "mobile") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
      if (value.length === 1 && !/[6-9]/.test(value)) return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (formData.mobile.length !== 10) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = "Purpose is required";
    }

    if (!formData.employeeToMeet) {
      newErrors.employeeToMeet = "Please select an employee";
    }
    if (!formData.visitorIdNumber.trim()) {
      newErrors.visitorIdNumber = "Visitor ID is required";
    }
    // if (!photoPreview) {
    //   toast.error("Please capture visitor photo");
    //   return false;
    // }
    if (!idPreview) {
      toast.error("Please capture visitor ID");
      return false;
    }

    if (!formData.visitDateTime) {
      newErrors.visitDateTime = "Visit date & time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("mobile", formData.mobile);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("purpose", formData.purpose);
    formDataToSend.append("employeeToMeet", formData.employeeToMeet);
    formDataToSend.append("visitDateTime", formData.visitDateTime); // ✅ NEW
    formDataToSend.append("visitorIdNumber", formData.visitorIdNumber);

    // const file = dataURLtoFile(capturedImage, "visitor.jpg");
    // formDataToSend.append("photo", file);
    if (capturedIdImage) {
      const idFile = dataURLtoFile(capturedIdImage, "visitor-id.jpg");
      formDataToSend.append("visitorIdPhoto", idFile);
    }

    if (capturedImage) {
      const photoFile = dataURLtoFile(capturedImage, "visitor.jpg");
      formDataToSend.append("photo", photoFile);
    }

    try {
      await axiosInstance.post("/visitors", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Visitor checked in successfully!");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to check in visitor",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const deviceInfos = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = deviceInfos.filter(
          (device) => device.kind === "videoinput",
        );

        setDevices(videoDevices);

        const usbCamera = videoDevices.find((device) =>
          device.label.toLowerCase().includes("quantron"),
        );

        if (usbCamera) {
          setSelectedDeviceId(usbCamera.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Camera error:", err);
        toast.error("Camera permission denied");
      }
    };

    getDevices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-gray-100 rounded-lg transition group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  New Visitor Check-in
                </h1>
                <p className="text-sm text-gray-500">
                  Complete the form below to check in a visitor
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Ready for check-in</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Photo Capture */}
              <div className="lg:col-span-1">
                <div className="">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Visitor Photo
                  </label>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 flex flex-col items-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all">
                    <div className="relative mb-4">
                      <div className="w-48 h-48 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white ring-2 ring-blue-100">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">
                              No photo captured
                            </p>
                          </div>
                        )}
                      </div>

                      {!photoPreview && showCamera && (
                        <div className="absolute inset-0">
                          <Webcam
                            key={selectedDeviceId}
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            screenshotQuality={1}
                            className="w-full h-full rounded-2xl object-cover"
                            videoConstraints={{
                              deviceId: selectedDeviceId || undefined,
                              width: 480,
                              height: 480,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Camera Controls */}
                    <div className="w-full space-y-3">
                      {!photoPreview && !showCamera && (
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition flex items-center justify-center space-x-2"
                        >
                          <Camera className="w-5 h-5" />
                          <span>Open Camera</span>
                        </button>
                      )}

                      {showCamera && (
                        <>
                          {devices.length > 1 && (
                            <select
                              value={selectedDeviceId || ""}
                              onChange={(e) =>
                                setSelectedDeviceId(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              {devices.map((device, index) => (
                                <option
                                  key={device.deviceId}
                                  value={device.deviceId}
                                >
                                  {device.label || `Camera ${index + 1}`}
                                </option>
                              ))}
                            </select>
                          )}

                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center space-x-2"
                            >
                              <Camera className="w-5 h-5" />
                              <span>Capture</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowCamera(false)}
                              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      )}

                      {photoPreview && (
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={retakePhoto}
                            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-700 transition flex items-center justify-center space-x-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            <span>Retake</span>
                          </button>
                          <div className="flex-1 bg-green-100 text-green-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Captured</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Please ensure face is clearly visible
                    </p>
                  </div>
                </div>
                <div className="sticky top-24">
                  <label>
                    Visitor ID Photo <span className="text-red-500">*</span>
                  </label>

                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 flex flex-col items-center border-2 border-dashed border-gray-300 hover:border-blue-400 transition-all">
                    <div className="relative mb-4">
                      <div className="w-48 h-48 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden border-4 border-white ring-2 ring-blue-100">
                        {idPreview ? (
                          <img
                            src={idPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">
                              No photo captured
                            </p>
                          </div>
                        )}
                      </div>

                      {!idPreview && showIdCamera && (
                        <div className="absolute inset-0">
                          <Webcam
                            key={selectedDeviceId}
                            audio={false}
                            ref={idWebcamRef}
                            screenshotFormat="image/jpeg"
                            screenshotQuality={1}
                            className="w-full h-full rounded-2xl object-cover"
                            videoConstraints={{
                              deviceId: selectedDeviceId || undefined,
                              width: 480,
                              height: 480,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Camera Controls */}
                    <div className="w-full space-y-3">
                      {!idPreview && !showIdCamera && (
                        <button
                          type="button"
                          onClick={() => setShowIdCamera(true)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:opacity-90 transition flex items-center justify-center space-x-2"
                        >
                          <Camera className="w-5 h-5" />
                          <span>Open Camera</span>
                        </button>
                      )}

                      {showIdCamera && (
                        <>
                          {devices.length > 1 && (
                            <select
                              value={selectedDeviceId || ""}
                              onChange={(e) =>
                                setSelectedDeviceId(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              {devices.map((device, index) => (
                                <option
                                  key={device.deviceId}
                                  value={device.deviceId}
                                >
                                  {device.label || `Camera ${index + 1}`}
                                </option>
                              ))}
                            </select>
                          )}

                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={captureIdPhoto}
                              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-green-700 transition flex items-center justify-center space-x-2"
                            >
                              <Camera className="w-5 h-5" />
                              <span>Capture</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowIdCamera(false)}
                              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      )}

                      {idPreview && (
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={retakeIdPhoto}
                            className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-700 transition flex items-center justify-center space-x-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            <span>Retake</span>
                          </button>
                          <div className="flex-1 bg-green-100 text-green-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Captured</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Please ensure face is clearly visible
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Form Fields */}
              <div className="lg:col-span-2 space-y-5">
                {/* Row 1: Name and Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3.5 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white`}
                        placeholder="Enter full name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3.5 border ${errors.mobile ? "border-red-500" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white`}
                        placeholder="9876543210"
                        maxLength="10"
                      />
                    </div>
                    {errors.mobile && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.mobile}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 2: Email and Employee */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address 
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition">
                        <Mail className="w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3.5 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 focus:bg-white`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employee to Meet <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition">
                        <Users className="w-5 h-5" />
                      </div>
                      <select
                        name="employeeToMeet"
                        value={formData.employeeToMeet}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3.5 border ${errors.employeeToMeet ? "border-red-500" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-gray-50 focus:bg-white cursor-pointer`}
                      >
                        <option value="">Select employee</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} - {emp.department || "Department"}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.employeeToMeet && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.employeeToMeet}
                      </p>
                    )}
                  </div>
                </div>

                {/* Row 3: Visit Date & Time */}
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Visit Date & Time */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Visit Date & Time{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="datetime-local"
                        name="visitDateTime"
                        value={formData.visitDateTime}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3.5 border ${
                          errors.visitDateTime
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white`}
                      />

                      {errors.visitDateTime && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.visitDateTime}
                        </p>
                      )}
                    </div>

                    {/* Visitor ID Number */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Visitor ID Number{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        name="visitorIdNumber"
                        value={formData.visitorIdNumber || ""}
                        onChange={handleInputChange}
                        placeholder="Enter ID number"
                        className={`w-full px-4 py-3.5 border ${
                          errors.visitorIdNumber
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white`}
                      />

                      {errors.visitorIdNumber && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.visitorIdNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 3: Purpose (Full Width) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Purpose of Visit <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-4 text-gray-400 group-focus-within:text-blue-600 transition">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      rows="4"
                      className={`w-full pl-10 pr-4 py-3.5 border ${errors.purpose ? "border-red-500" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition bg-gray-50 focus:bg-white`}
                      placeholder="Enter detailed purpose of visit..."
                    ></textarea>
                  </div>
                  {errors.purpose && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.purpose}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                    <span>Checking in visitor...</span>
                  </div>
                ) : (
                  "Check-in Visitor"
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">
                By checking in, you agree to our terms and conditions
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateVisitor;
