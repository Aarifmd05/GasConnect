import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Wrench,
  CalendarDays,
  Clock,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Camera,
  ImagePlus,
  X,
  Upload
} from 'lucide-react';

import LocationSelector from '../components/LocationSelector';
import './BookRepair.css';

const API_URL = 'http://localhost:3006/api';
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const BookRepair = ({ selectedAddress, onAddressSelect }) => {
  const [repairs, setRepairs] = useState([]);
  const [repairType, setRepairType] = useState('');
  const [description, setDescription] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [loadingRepairs, setLoadingRepairs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    fetchRepairs();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const fetchRepairs = async () => {
    try {
      setLoadingRepairs(true);

      const response = await axios.get(`${API_URL}/repairs`);

      const repairData =
        response.data.repairs || response.data;

      setRepairs(Array.isArray(repairData) ? repairData : []);
    } catch (error) {
      console.error('Error fetching repair services:', error);
      setErrorMessage(
        'Unable to load repair services. Please refresh and try again.'
      );
    } finally {
      setLoadingRepairs(false);
    }
  };

  const getMinimumDate = () => {
    const now = new Date();
    const localDate = new Date(
      now.getTime() - now.getTimezoneOffset() * 60000
    );

    return localDate.toISOString().slice(0, 10);
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    // Allow choosing the same file again later
    event.target.value = '';

    if (!file) return;

    setErrorMessage('');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Please upload a JPG, PNG or WEBP image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Image size must be less than 5 MB.');
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setIssuePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setIssuePhoto(null);
    setPhotoPreview('');

    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setRepairType('');
    setDescription('');
    setBookingDate('');
    setBookingTime('');
    removePhoto();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccessMessage('');
    setErrorMessage('');

    // Repair type OR photo is required
    if (!repairType && !issuePhoto) {
      setErrorMessage(
        'Please select a repair service or upload a photo of the problem.'
      );
      return;
    }

    if (!bookingDate || !bookingTime) {
      setErrorMessage(
        'Please select your preferred date and time.'
      );
      return;
    }

    if (!selectedAddress?.fullAddress) {
      setErrorMessage('Please select a saved service address.');
      return;
    }

    const selectedDateTime = new Date(
      `${bookingDate}T${bookingTime}`
    );

    if (
      Number.isNaN(selectedDateTime.getTime()) ||
      selectedDateTime <= new Date()
    ) {
      setErrorMessage('Please select a future date and time.');
      return;
    }

    try {
      setSubmitting(true);

      const token = sessionStorage.getItem('token');

      if (!token) {
        setErrorMessage(
          'Your session has expired. Please log in again.'
        );
        return;
      }

      const formData = new FormData();

      if (repairType) {
        formData.append('repairType', repairType);
      }

      formData.append(
        'bookingDate',
        selectedDateTime.toISOString()
      );

      formData.append(
        'address',
        selectedAddress.fullAddress
      );

      formData.append(
        'description',
        description.trim()
      );

      if (issuePhoto) {
        formData.append('issuePhoto', issuePhoto);
      }

      const response = await axios.post(
        `${API_URL}/bookings`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccessMessage(
        response.data.message ||
        'Your repair booking has been submitted successfully!'
      );

      resetForm();

    } catch (error) {
      console.error('Booking submission failed:', error);

      setErrorMessage(
        error.response?.data?.message ||
        'Unable to submit your booking. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="book-repair-page">

      <div className="book-repair-intro">
        <div className="book-repair-intro-icon">
          <Wrench size={28} />
        </div>

        <div>
          <h2>Book a Repair Service</h2>
          <p>
            Tell us what needs repairing. You can also upload
            a photo if you don't know the issue name.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="booking-alert booking-success">
          <CheckCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="booking-alert booking-error">
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form
        className="repair-booking-form"
        onSubmit={handleSubmit}
      >

        <div className="booking-form-heading">
          <h3>Service Details</h3>
          <span>Fields marked * are required</span>
        </div>

        {/* Repair type */}
        <div className="booking-form-group">
          <label htmlFor="repairType">
            <Wrench size={17} />
            Select Repair Service
            <span className="optional-label">Optional if uploading a photo</span>
          </label>

          <select
            id="repairType"
            value={repairType}
            onChange={(event) => setRepairType(event.target.value)}
          >
            <option value="">
              {loadingRepairs
                ? 'Loading services...'
                : 'Choose a repair service'}
            </option>

            {!loadingRepairs && repairs.length === 0 && (
              <option value="" disabled>
                No repair services available
              </option>
            )}

            {repairs.map((repair) => (
              <option key={repair._id} value={repair._id}>
                {repair.name}
                {repair.price != null
                  ? ` - ₹${repair.price}`
                  : ''}
              </option>
            ))}
          </select>

          <small>
            Don't know the repair name? Upload a photo below.
          </small>
        </div>

        {/* Photo upload */}
        <div className="booking-form-group">
          <label>
            <Camera size={17} />
            Upload Problem Photo
            <span className="optional-label">Optional</span>
          </label>

          <p className="photo-upload-description">
            Take a picture of your gas appliance or upload an
            existing image so our technician can understand the issue.
          </p>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden-photo-input"
            onChange={handlePhotoChange}
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden-photo-input"
            onChange={handlePhotoChange}
          />

          {!photoPreview ? (
            <div className="photo-upload-options">

              <button
                type="button"
                className="photo-upload-option"
                onClick={() => cameraInputRef.current?.click()}
              >
                <div className="photo-option-icon">
                  <Camera size={25} />
                </div>

                <div>
                  <strong>Take a Photo</strong>
                  <span>Open your camera</span>
                </div>
              </button>

              <button
                type="button"
                className="photo-upload-option"
                onClick={() => galleryInputRef.current?.click()}
              >
                <div className="photo-option-icon">
                  <ImagePlus size={25} />
                </div>

                <div>
                  <strong>Choose from Gallery</strong>
                  <span>Upload an existing image</span>
                </div>
              </button>

            </div>
          ) : (
            <div className="issue-photo-preview">
              <img
                src={photoPreview}
                alt="Uploaded appliance problem"
              />

              <div className="issue-photo-info">
                <div>
                  <strong>{issuePhoto?.name}</strong>
                  <span>
                    {(issuePhoto?.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <button
                  type="button"
                  className="remove-issue-photo"
                  onClick={removePhoto}
                  aria-label="Remove uploaded photo"
                >
                  <X size={19} />
                </button>
              </div>
            </div>
          )}

          <small className="photo-upload-hint">
            <Upload size={13} />
            JPG, PNG or WEBP. Maximum file size: 5 MB.
          </small>
        </div>

        {/* Description */}
        <div className="booking-form-group">
          <label htmlFor="description">
            <FileText size={17} />
            Describe Your Problem
            <span className="optional-label">Optional</span>
          </label>

          <textarea
            id="description"
            rows="4"
            maxLength="500"
            placeholder="Explain what happened with your gas appliance..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <small>{description.length}/500 characters</small>
        </div>

        {/* Date and time */}
        <div className="booking-date-time-grid">

          <div className="booking-form-group">
            <label htmlFor="bookingDate">
              <CalendarDays size={17} />
              Preferred Date *
            </label>

            <input
              id="bookingDate"
              type="date"
              min={getMinimumDate()}
              value={bookingDate}
              onChange={(event) => setBookingDate(event.target.value)}
              required
            />
          </div>

          <div className="booking-form-group">
            <label htmlFor="bookingTime">
              <Clock size={17} />
              Preferred Time *
            </label>

            <input
              id="bookingTime"
              type="time"
              value={bookingTime}
              onChange={(event) => setBookingTime(event.target.value)}
              required
            />
          </div>

        </div>

        {/* Service address */}
        <div className="booking-form-group">

          <div className="booking-address-heading">
            <label>
              <MapPin size={17} />
              Service Address *
            </label>

            <button
              type="button"
              className="change-address-btn"
              onClick={() =>
                setShowAddressSelector(!showAddressSelector)
              }
            >
              {selectedAddress ? 'Change Address' : 'Select Address'}
            </button>
          </div>

          {selectedAddress ? (
            <div className="selected-service-address">
              <div className="selected-address-icon">
                <MapPin size={20} />
              </div>

              <div>
                <strong>
                  {selectedAddress.label || 'Selected Address'}
                </strong>

                <p>{selectedAddress.fullAddress}</p>

                {selectedAddress.landmark && (
                  <small>
                    Landmark: {selectedAddress.landmark}
                  </small>
                )}
              </div>
            </div>
          ) : (
            <div className="no-service-address">
              No address selected. Please choose a saved address.
            </div>
          )}

          {showAddressSelector && (
            <div className="booking-address-selector">
              <LocationSelector
                selectedAddress={selectedAddress}
                onSelect={(address) => {
                  onAddressSelect?.(address);
                  setShowAddressSelector(false);
                }}
              />
            </div>
          )}

        </div>

        <div className="booking-form-footer">
          <p>
            Please verify your service details before submitting.
          </p>

          <button
            type="submit"
            className="submit-repair-booking"
            disabled={submitting || loadingRepairs}
          >
            {submitting
              ? 'Submitting...'
              : 'Confirm Repair Booking'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default BookRepair;