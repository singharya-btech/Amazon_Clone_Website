import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import {
  getCurrentUser,
  updateUserProfile,
  changePassword,
  resendVerificationEmail,
  getAddresses,
  createAddress,
  deleteAddress,
  setDefaultAddress,
} from "../services/authService";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile: authProfile, logout, updateProfileState } = useAuth();

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    avatar: "",
    email_verified: false,
  });

  const [addresses, setAddresses] = useState([]);
  const [newAddrModal, setNewAddrModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: "",
    phone: "",
    street_address: "",
    city: "",
    state: "",
    postal_code: "",
    address_type: "home",
    is_default: false,
  });

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [profData, addrData] = await Promise.all([
        getCurrentUser(),
        getAddresses(),
      ]);
      setProfile(profData);
      setAddresses(addrData || []);
      updateProfileState(profData);
    } catch (e) {
      console.warn("Error loading profile or addresses", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage("");
    try {
      const updated = await updateUserProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      });
      setProfile((prev) => ({ ...prev, ...updated }));
      updateProfileState(updated);
      setProfileMessage("Profile updated successfully!");
    } catch (err) {
      setProfileMessage(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setVerificationMessage("Sending verification email...");
      const res = await resendVerificationEmail(profile.email);
      setVerificationMessage(
        res.message || "Verification email sent! Check your inbox or copy token from network tab."
      );
    } catch (e) {
      setVerificationMessage("Could not resend email. Please try again later.");
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await createAddress(newAddress);
      setNewAddrModal(false);
      setNewAddress({
        full_name: "",
        phone: "",
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
        address_type: "home",
        is_default: false,
      });
      const updated = await getAddresses();
      setAddresses(updated);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add address.");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Remove this delivery address?")) return;
    try {
      await deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (e) {
      alert("Failed to delete address.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      const updated = await getAddresses();
      setAddresses(updated);
    } catch (e) {
      alert("Failed to set default address.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setPasswordMessage("Password changed successfully!");
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setPasswordMessage(err.response?.data?.error || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-400 text-gray-900 font-bold text-2xl flex items-center justify-center shadow">
              {(profile.first_name?.[0] || profile.username?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.first_name ? `${profile.first_name} ${profile.last_name}` : profile.username}
                </h1>
                {profile.email_verified ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    ⚠ Unverified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/orders"
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs px-4 py-2 rounded transition"
            >
              Your Orders &rarr;
            </Link>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="border border-red-300 text-red-600 hover:bg-red-50 font-semibold text-xs px-4 py-2 rounded transition"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Email Verification Banner if Unverified */}
        {!profile.email_verified && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-amber-800">Email Verification Required</h3>
              <p className="text-xs text-amber-700 mt-1">
                Please verify your email address to unlock account protection and instant notifications.
              </p>
              {verificationMessage && (
                <p className="text-xs font-semibold text-blue-600 mt-2">{verificationMessage}</p>
              )}
            </div>
            <button
              onClick={handleResendVerification}
              className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-xs px-4 py-2 rounded shadow transition"
            >
              Resend Verification Email
            </button>
          </div>
        )}

        {/* Grid: Profile Management & Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Details Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">
              Personal Information
            </h2>
            {profileMessage && (
              <div className="mb-4 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded">
                {profileMessage}
              </div>
            )}
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                <input
                  disabled
                  type="text"
                  value={profile.username}
                  className="w-full border bg-gray-100 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <input
                  disabled
                  type="email"
                  value={profile.email}
                  className="w-full border bg-gray-100 rounded px-3 py-2 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profile.first_name || ""}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profile.last_name || ""}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-2 rounded text-xs transition"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">
              Security & Password
            </h2>
            {passwordMessage && (
              <div className={`mb-4 text-xs font-semibold p-2 rounded ${
                passwordMessage.includes("success") ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
              }`}>
                {passwordMessage}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                <input
                  required
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="w-full border rounded px-3 py-2 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 rounded text-xs transition"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Multiple Delivery Addresses Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Delivery Addresses</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage your saved home, office, and default addresses.</p>
            </div>
            <button
              onClick={() => setNewAddrModal(true)}
              className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-xs px-4 py-2 rounded shadow transition"
            >
              + Add New Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No saved addresses. Click "+ Add New Address" above to save one for quick checkout.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`border rounded-lg p-4 flex flex-col justify-between ${
                    addr.is_default ? "border-amber-500 bg-amber-50/20 shadow-sm" : "border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs uppercase font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {addr.address_type}
                      </span>
                      {addr.is_default && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                          Default Address
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">{addr.full_name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{addr.street_address}</p>
                    <p className="text-xs text-gray-600">{addr.city}, {addr.state} - {addr.postal_code}</p>
                    <p className="text-xs text-gray-600">{addr.country}</p>
                    <p className="text-xs text-gray-500 mt-2">Phone: {addr.phone}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    {!addr.is_default && (
                      <button
                        onClick={() => handleSetDefault(addr.id)}
                        className="text-amber-700 hover:underline font-semibold"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-red-600 hover:underline ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Address Modal */}
        {newAddrModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Delivery Address</h3>
              <form onSubmit={handleAddAddress} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="w-full border rounded px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                  <input
                    required
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full border rounded px-3 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address *</label>
                  <input
                    required
                    type="text"
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                    className="w-full border rounded px-3 py-1.5 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                    <input
                      required
                      type="text"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full border rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
                    <input
                      required
                      type="text"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full border rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code *</label>
                    <input
                      required
                      type="text"
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      className="w-full border rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address Type</label>
                    <select
                      value={newAddress.address_type}
                      onChange={(e) => setNewAddress({ ...newAddress, address_type: e.target.value })}
                      className="w-full border rounded px-3 py-1.5 text-xs"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work / Office</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-gray-700 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                  />
                  Make this my default address
                </label>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setNewAddrModal(false)}
                    className="px-4 py-2 border rounded text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-500 font-bold rounded text-xs text-gray-900"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
