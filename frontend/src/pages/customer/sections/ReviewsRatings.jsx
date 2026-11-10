
import { useEffect, useState } from 'react';
import {
  Star,
  Send,
  MessageSquare,
  LoaderCircle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import './ReviewsRatings.css';

const API_URL = 'http://localhost:3006/api';

export default function ReviewsRatings() {
  const [bookings, setBookings] = useState([]);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submitted, setSubmitted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = sessionStorage.getItem('token');

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load bookings');
      }

      const completedBookings = Array.isArray(data)
        ? data.filter(
            booking => booking.status?.toLowerCase() === 'completed'
          )
        : (data.bookings || []).filter(
            booking => booking.status?.toLowerCase() === 'completed'
          );

      setBookings(completedBookings);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (bookingId, rating) => {
    setRatings(prev => ({
      ...prev,
      [bookingId]: rating
    }));
  };

  const handleComment = (bookingId, comment) => {
    setComments(prev => ({
      ...prev,
      [bookingId]: comment
    }));
  };

  const submitReview = async bookingId => {
    const rating = ratings[bookingId];
    const comment = comments[bookingId] || '';

    if (!rating) {
      setError('Please select a star rating.');
      return;
    }

    try {
      setSubmitting(bookingId);
      setError('');
      setSuccess('');

      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId,
          rating,
          comment
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit review');
      }

      setSubmitted(prev => [...prev, bookingId]);
      setSuccess('Your review was submitted successfully!');
    } catch (err) {
      setError(err.message || 'Unable to submit your review.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="reviews-loading">
        <LoaderCircle className="reviews-spinner" size={30} />
        <p>Loading your completed bookings...</p>
      </div>
    );
  }

  return (
    <div className="reviews-page">
      <div className="reviews-heading">
        <div>
          <span className="reviews-eyebrow">YOUR FEEDBACK MATTERS</span>
          <h2>Reviews & Ratings</h2>
          <p>Share your experience and help us improve our service.</p>
        </div>

        <div className="reviews-heading-icon">
          <Star size={28} />
        </div>
      </div>

      <div className="reviews-summary">
        <div className="reviews-summary-icon">
          <MessageSquare size={23} />
        </div>
        <div>
          <h3>{bookings.length} Completed Bookings</h3>
          <p>Rate the service you received from your technicians.</p>
        </div>
      </div>

      {error && (
        <div className="reviews-alert reviews-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="reviews-alert reviews-success">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="reviews-empty">
          <div className="reviews-empty-icon">
            <Star size={32} />
          </div>
          <h3>No completed bookings yet</h3>
          <p>
            Once your repair service is completed, you can share your
            experience here.
          </p>
        </div>
      ) : (
        <div className="reviews-list">
          {bookings.map(booking => {
            const bookingId = booking._id;
            const technician = booking.technician;
            const isSubmitted = submitted.includes(bookingId);

            return (
              <div className="review-card" key={bookingId}>
                <div className="review-card-top">
                  <div>
                    <span className="review-booking-label">BOOKING ID</span>
                    <h3>#{bookingId.slice(-8).toUpperCase()}</h3>
                  </div>

                  <span className="review-completed-badge">
                    <CheckCircle size={14} />
                    Completed
                  </span>
                </div>

                <div className="review-technician">
                  <div className="review-technician-avatar">
                    {technician?.name?.charAt(0)?.toUpperCase() || 'T'}
                  </div>

                  <div>
                    <h4>{technician?.name || 'Technician'}</h4>
                    <p>
                      {technician?.specialization || 'Repair Technician'}
                    </p>
                  </div>
                </div>

                <div className="review-booking-details">
                  <p>
                    <strong>Service:</strong>{' '}
                    {booking.repairType?.name || 'Photo-based repair request'}
                  </p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {booking.bookingDate
                      ? new Date(booking.bookingDate).toLocaleDateString()
                      : 'Not available'}
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="review-submitted">
                    <CheckCircle size={20} />
                    <div>
                      <strong>Thank you for your feedback!</strong>
                      <p>Your review has been submitted.</p>
                    </div>
                  </div>
                ) : (
                  <div className="review-form">
                    <h4>How was your experience?</h4>

                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          className={
                            star <= (ratings[bookingId] || 0)
                              ? 'review-star active'
                              : 'review-star'
                          }
                          onClick={() => handleRating(bookingId, star)}
                          aria-label={`Rate ${star} out of 5`}
                        >
                          <Star
                            size={27}
                            fill={
                              star <= (ratings[bookingId] || 0)
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>
                      ))}
                    </div>

                    <p className="review-rating-label">
                      {ratings[bookingId]
                        ? `${ratings[bookingId]} out of 5 stars`
                        : 'Select your rating'}
                    </p>

                    <textarea
                      placeholder="Tell us about your service experience (optional)..."
                      value={comments[bookingId] || ''}
                      onChange={e =>
                        handleComment(bookingId, e.target.value)
                      }
                      rows={3}
                    />

                    <button
                      className="review-submit-btn"
                      onClick={() => submitReview(bookingId)}
                      disabled={submitting === bookingId}
                    >
                      {submitting === bookingId ? (
                        <>
                          <LoaderCircle size={17} className="reviews-spinner" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Submit Review
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
