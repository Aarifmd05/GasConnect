
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    MapPin,
    Home,
    BriefcaseBusiness,
    MapPinned,
    Plus,
    Pencil,
    Trash2,
    Check,
    Navigation,
    X,
    LoaderCircle
} from 'lucide-react';

import './LocationSelector.css';

const API_URL = 'http://localhost:3006/api/users';

const emptyForm = {
    label: 'Home',
    fullAddress: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    location: null,
    isDefault: false
};

function LocationSelector({ onSelect, selectedAddress }) {
    const [addresses, setAddresses] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [error, setError] = useState('');

    const token = sessionStorage.getItem('token');

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const getAddressIcon = (label) => {
        if (label === 'Home') return <Home size={19} />;
        if (label === 'Work') return <BriefcaseBusiness size={19} />;
        return <MapPinned size={19} />;
    };

    // Fetch saved addresses
    const fetchAddresses = async () => {
        try {
            setLoading(true);

            const response = await axios.get(
                `${API_URL}/customer/addresses`,
                config
            );

            const saved = response.data.addresses || [];

            setAddresses(saved);

            const defaultAddress = saved.find(item => item.isDefault);

            if (defaultAddress && !selectedAddress) {
                onSelect?.(defaultAddress);
            }

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load saved addresses'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
        // Load saved addresses when the component mounts.
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Capture current GPS coordinates
    
// Get current GPS location and automatically fill address
const getCurrentLocation = () => {
    if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser.');
        return;
    }

    setGpsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                // Reverse Geocoding using OpenStreetMap
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                    {
                        headers: {
                            'Accept-Language': 'en'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Unable to fetch address details.');
                }

                const data = await response.json();
                const address = data.address || {};

                // Extract complete address
                const completeAddress = [
                    address.house_number,
                    address.road,
                    address.neighbourhood,
                    address.suburb,
                    address.residential
                ]
                    .filter(Boolean)
                    .filter((value, index, array) =>
                        array.indexOf(value) === index
                    )
                    .join(', ');

                // Extract city
                const city =
                    address.city ||
                    address.town ||
                    address.village ||
                    address.municipality ||
                    address.county ||
                    '';

                // Automatically populate all form fields
                setForm(prev => ({
                    ...prev,

                    fullAddress:
                        completeAddress || data.display_name || '',

                    city: city,

                    state: address.state || '',

                    pincode: address.postcode || '',

                    location: {
                        latitude: latitude,
                        longitude: longitude
                    }
                }));

                setError('');

            } catch (error) {
                console.error('Reverse geocoding error:', error);
                setError(
                    'GPS detected, but unable to fetch address. Please enter it manually.'
                );
            } finally {
                setGpsLoading(false);
            }
        },

        (error) => {
            console.error('GPS Error:', error);

            setError(
                error.code === 1
                    ? 'Location permission denied. Please allow location access.'
                    : 'Unable to access your location. Please try again.'
            );

            setGpsLoading(false);
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
};


    const openAddForm = () => {
        setEditingId(null);
        setForm({
            ...emptyForm,
            isDefault: addresses.length === 0
        });
        setError('');
        setShowForm(true);
    };

    const openEditForm = (address) => {
        setEditingId(address._id);

        setForm({
            label: address.label || 'Home',
            fullAddress: address.fullAddress || '',
            landmark: address.landmark || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            location: address.location?.latitude != null
                ? {
                    latitude: address.location.latitude,
                    longitude: address.location.longitude
                }
                : null,
            isDefault: address.isDefault || false
        });

        setError('');
        setShowForm(true);
    };

    // Add or update address
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');

        if (!form.fullAddress.trim()) {
            setError('Please enter your complete address.');
            return;
        }

        if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
            setError('Please enter a valid 6-digit pincode.');
            return;
        }

        try {
            setSaving(true);

            const payload = {
                ...form,
                fullAddress: form.fullAddress.trim()
            };

            if (editingId) {
                await axios.put(
                    `${API_URL}/customer/addresses/${editingId}`,
                    payload,
                    config
                );
            } else {
                await axios.post(
                    `${API_URL}/customer/addresses`,
                    payload,
                    config
                );
            }

            setShowForm(false);
            setForm(emptyForm);
            setEditingId(null);

            await fetchAddresses();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to save address'
            );
        } finally {
            setSaving(false);
        }
    };

    // Select address for service booking
    const handleSelect = (address) => {
        onSelect?.(address);
    };

    // Set default address
    const handleSetDefault = async (addressId) => {
        try {
            setError('');

            await axios.patch(
                `${API_URL}/customer/addresses/${addressId}/default`,
                {},
                config
            );

            await fetchAddresses();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to update default address'
            );
        }
    };

    // Delete address
    const handleDelete = async (addressId) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this address?'
        );

        if (!confirmed) return;

        try {
            setError('');

            await axios.delete(
                `${API_URL}/customer/addresses/${addressId}`,
                config
            );

            if (selectedAddress?._id === addressId) {
                onSelect?.(null);
            }

            await fetchAddresses();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to delete address'
            );
        }
    };

    if (loading) {
        return (
            <div className="location-loading">
                <LoaderCircle className="location-spinner" size={25} />
                <span>Loading your saved locations...</span>
            </div>
        );
    }

    return (
        <div className="location-selector">

            <div className="location-header">
                <div>
                    <h2>Saved Locations</h2>
                    <p>Choose where you need our technician.</p>
                </div>

                <button
                    className="location-add-btn"
                    onClick={openAddForm}
                    type="button"
                >
                    <Plus size={17} />
                    Add Address
                </button>
            </div>

            {error && (
                <div className="location-error">
                    {error}
                </div>
            )}

            {addresses.length === 0 ? (
                <div className="location-empty">
                    <div className="location-empty-icon">
                        <MapPin size={32} />
                    </div>

                    <h3>No saved addresses yet</h3>

                    <p>
                        Add your home or work address to book a repair
                        service quickly.
                    </p>

                    <button
                        type="button"
                        onClick={openAddForm}
                    >
                        <Plus size={17} />
                        Add Your First Address
                    </button>
                </div>
            ) : (
                <div className="location-list">
                    {addresses.map(address => {
                        const isSelected =
                            selectedAddress?._id === address._id;

                        return (
                            <div
                                className={`location-card ${
                                    isSelected ? 'selected' : ''
                                }`}
                                key={address._id}
                            >
                                <div
                                    className="location-card-main"
                                    onClick={() => handleSelect(address)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            handleSelect(address);
                                        }
                                    }}
                                >
                                    <div className="location-card-icon">
                                        {getAddressIcon(address.label)}
                                    </div>

                                    <div className="location-card-details">
                                        <div className="location-card-title">
                                            <strong>{address.label}</strong>

                                            {address.isDefault && (
                                                <span className="default-tag">
                                                    Default
                                                </span>
                                            )}

                                            {isSelected && (
                                                <span className="selected-tag">
                                                    Selected
                                                </span>
                                            )}
                                        </div>

                                        <p>{address.fullAddress}</p>

                                        {address.landmark && (
                                            <small>
                                                Landmark: {address.landmark}
                                            </small>
                                        )}

                                        <small>
                                            {[address.city, address.state, address.pincode]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </small>
                                    </div>

                                    <div className="location-select-icon">
                                        {isSelected && <Check size={20} />}
                                    </div>
                                </div>

                                <div className="location-card-actions">
                                    {!address.isDefault && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSetDefault(address._id)
                                            }
                                        >
                                            Set as default
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => openEditForm(address)}
                                        aria-label="Edit address"
                                    >
                                        <Pencil size={15} />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        className="delete-address-btn"
                                        onClick={() =>
                                            handleDelete(address._id)
                                        }
                                        aria-label="Delete address"
                                    >
                                        <Trash2 size={15} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <div className="location-modal-overlay">
                    <div className="location-modal">

                        <div className="location-modal-header">
                            <div>
                                <h3>
                                    {editingId
                                        ? 'Edit Address'
                                        : 'Add New Address'}
                                </h3>

                                <p>Enter your service location details.</p>
                            </div>

                            <button
                                type="button"
                                className="location-close-btn"
                                onClick={() => setShowForm(false)}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>

                            <label>Address Type</label>

                            <div className="location-label-options">
                                {['Home', 'Work', 'Other'].map(label => (
                                    <button
                                        key={label}
                                        type="button"
                                        className={
                                            form.label === label
                                                ? 'active'
                                                : ''
                                        }
                                        onClick={() =>
                                            setForm(prev => ({
                                                ...prev,
                                                label
                                            }))
                                        }
                                    >
                                        {getAddressIcon(label)}
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <label htmlFor="fullAddress">
                                Complete Address *
                            </label>

                            <textarea
                                id="fullAddress"
                                name="fullAddress"
                                value={form.fullAddress}
                                onChange={handleChange}
                                placeholder="House number, street, area..."
                                rows="3"
                                required
                            />

                            <label htmlFor="landmark">Landmark</label>

                            <input
                                id="landmark"
                                name="landmark"
                                value={form.landmark}
                                onChange={handleChange}
                                placeholder="Near school, hospital..."
                            />

                            <div className="location-form-grid">
                                <div>
                                    <label htmlFor="city">City</label>
                                    <input
                                        id="city"
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="state">State</label>
                                    <input
                                        id="state"
                                        name="state"
                                        value={form.state}
                                        onChange={handleChange}
                                        placeholder="State"
                                    />
                                </div>
                            </div>

                            <label htmlFor="pincode">Pincode</label>

                            <input
                                id="pincode"
                                name="pincode"
                                value={form.pincode}
                                onChange={handleChange}
                                placeholder="6-digit pincode"
                                maxLength="6"
                                inputMode="numeric"
                            />

                            <button
                                type="button"
                                className="location-gps-btn"
                                onClick={getCurrentLocation}
                                disabled={gpsLoading}
                            >
                                {gpsLoading ? (
                                    <LoaderCircle
                                        size={17}
                                        className="location-spinner"
                                    />
                                ) : (
                                    <Navigation size={17} />
                                )}

                                {gpsLoading
                                    ? 'Getting location...'
                                    : 'Use Current GPS Location'}
                            </button>

                            {form.location && (
    <p className="gps-success">
        <Check size={15} />
        Location and address details fetched successfully.
    </p>
)}

                            <label className="location-default-checkbox">
                                <input
                                    type="checkbox"
                                    checked={form.isDefault}
                                    onChange={(e) =>
                                        setForm(prev => ({
                                            ...prev,
                                            isDefault: e.target.checked
                                        }))
                                    }
                                />
                                Make this my default address
                            </label>

                            <div className="location-form-actions">
                                <button
                                    type="button"
                                    className="location-cancel-btn"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="location-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Address'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default LocationSelector;
