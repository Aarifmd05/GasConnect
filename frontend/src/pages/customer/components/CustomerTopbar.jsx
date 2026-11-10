
import React, { useState } from 'react';
import {
  MapPin,
  Bell,
  UserRound,
  ChevronDown,
  Menu,
  LogOut
} from 'lucide-react';
import LocationSelector from './LocationSelector';
import './CustomerTopbar.css';

const CustomerTopbar = ({
  user,
  selectedAddress,
  onAddressSelect,
  onMenuToggle,
  onLogout
}) => {
  const [showLocations, setShowLocations] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const displayName = user?.name || 'Customer';

  return (
    <header className="customer-topbar">

      <div className="topbar-left">
        <button
          className="topbar-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-location-wrapper">
          <button
            className="topbar-location"
            onClick={() => setShowLocations(!showLocations)}
          >
            <MapPin size={20} />
            <div className="topbar-location-text">
              <span>Service location</span>
              <strong>
                {selectedAddress?.label || 'Select address'}
              </strong>
              <small>
                {selectedAddress?.fullAddress || 'Choose your service address'}
              </small>
            </div>
            <ChevronDown size={17} />
          </button>

          {showLocations && (
            <div className="topbar-location-dropdown">
              <div className="location-dropdown-heading">
                <h3>Your saved locations</h3>
                <button onClick={() => setShowLocations(false)}>
                  ✕
                </button>
              </div>

              <LocationSelector
                selectedAddress={selectedAddress}
                onSelect={(address) => {
                  onAddressSelect?.(address);
                  setShowLocations(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="topbar-icon-btn"
          aria-label="Notifications"
        >
          <Bell size={21} />
        </button>

        <div className="topbar-profile-wrapper">
          <button
            className="topbar-profile"
            onClick={() => setShowProfile(!showProfile)}
          >
            <div className="topbar-avatar">
              <UserRound size={20} />
            </div>

            <div className="topbar-profile-info">
              <strong>{displayName}</strong>
              <span>Customer</span>
            </div>

            <ChevronDown size={16} />
          </button>

          {showProfile && (
            <div className="topbar-profile-dropdown">
              <button onClick={onLogout}>
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
};

export default CustomerTopbar;
