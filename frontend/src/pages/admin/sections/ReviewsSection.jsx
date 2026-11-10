
import { useMemo, useState } from 'react';
import {
    Star,
    MessageSquare,
    Award,
    Users,
    RefreshCw,
    Eye,
    X
} from 'lucide-react';

function ReviewsSection({
    reviews = [],
    reviewsLoading = false,
    reviewsError = '',
    fetchReviews = () => {},
    searchTerm = ''
}) {
    const [selectedRating, setSelectedRating] = useState('all');
    const [sortOption, setSortOption] = useState('newest');
    const [viewingReview, setViewingReview] = useState(null);

    const averageRating = reviews.length
        ? (
            reviews.reduce(
                (total, review) => total + Number(review.rating || 0),
                0
            ) / reviews.length
        ).toFixed(1)
        : '0.0';

    const fiveStarReviews = reviews.filter(
        review => Number(review.rating) === 5
    ).length;

    const oneStarReviews = reviews.filter(
        review => Number(review.rating) === 1
    ).length;

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
        rating,
        count: reviews.filter(
            review => Number(review.rating) === rating
        ).length
    }));

    const filteredReviews = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return reviews.filter(review => {
            const customer = review.customer?.name || '';
            const technician = review.technician?.name || '';
            const comment = review.comment || '';

            const matchesSearch =
                customer.toLowerCase().includes(search) ||
                technician.toLowerCase().includes(search) ||
                comment.toLowerCase().includes(search);

            const matchesRating =
                selectedRating === 'all' ||
                Number(review.rating) === Number(selectedRating);

            return matchesSearch && matchesRating;
        });
    }, [reviews, searchTerm, selectedRating]);

    const sortedReviews = useMemo(() => {
        return [...filteredReviews].sort((a, b) => {
            switch (sortOption) {
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'highest':
                    return Number(b.rating) - Number(a.rating);
                case 'lowest':
                    return Number(a.rating) - Number(b.rating);
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }, [filteredReviews, sortOption]);

    const renderStars = rating => (
        <span className="admin-review-stars">
            {[1, 2, 3, 4, 5].map(star => (
                <Star
                    key={star}
                    size={17}
                    fill={star <= Number(rating) ? '#F59E0B' : 'none'}
                    color={star <= Number(rating) ? '#F59E0B' : '#CBD5E1'}
                />
            ))}
        </span>
    );

    const formatDate = date => {
        if (!date) return 'N/A';

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) return 'N/A';

        return parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="admin-reviews-page">

            <div className="admin-welcome">
                <div>
                    <h1>Reviews Management</h1>
                    <p>Monitor customer feedback and service ratings.</p>
                </div>

                <button
                    className="admin-refresh-button"
                    onClick={fetchReviews}
                    disabled={reviewsLoading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Statistics */}
            <div className="admin-stats-grid">

                <div className="admin-stat-card">
                    <MessageSquare size={25} />
                    <div className="admin-stat-info">
                        <h3>Total Reviews</h3>
                        <p className="admin-stat-value">{reviews.length}</p>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <Star size={25} />
                    <div className="admin-stat-info">
                        <h3>Average Rating</h3>
                        <p className="admin-stat-value">{averageRating}/5</p>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <Award size={25} />
                    <div className="admin-stat-info">
                        <h3>5-Star Reviews</h3>
                        <p className="admin-stat-value">{fiveStarReviews}</p>
                    </div>
                </div>

                <div className="admin-stat-card">
                    <Users size={25} />
                    <div className="admin-stat-info">
                        <h3>1-Star Reviews</h3>
                        <p className="admin-stat-value">{oneStarReviews}</p>
                    </div>
                </div>

            </div>

            {/* Rating Distribution */}
            <div className="admin-review-distribution">
                <h2>Rating Distribution</h2>

                {ratingDistribution.map(item => {
                    const percentage = reviews.length
                        ? (item.count / reviews.length) * 100
                        : 0;

                    return (
                        <div className="admin-rating-row" key={item.rating}>
                            <span>{item.rating} Star</span>

                            <div className="admin-rating-track">
                                <div
                                    className="admin-rating-fill"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            <span>{item.count}</span>
                        </div>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="admin-products-toolbar">
                <h3>Customer Reviews</h3>

                <div className="admin-products-toolbar-actions">
                    <select
                        className="admin-category-filter"
                        value={selectedRating}
                        onChange={e => setSelectedRating(e.target.value)}
                    >
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>

                    <select
                        className="admin-category-filter"
                        value={sortOption}
                        onChange={e => setSortOption(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                    </select>
                </div>
            </div>

            {/* Reviews Table */}
            {reviewsLoading ? (
                <div className="admin-customer-message">
                    <RefreshCw size={25} />
                    <p>Loading reviews...</p>
                </div>
            ) : reviewsError ? (
                <div className="admin-customer-message">
                    <MessageSquare size={30} />
                    <p>{reviewsError}</p>
                </div>
            ) : sortedReviews.length === 0 ? (
                <div className="admin-customer-message">
                    <MessageSquare size={35} />
                    <h3>No reviews found</h3>
                    <p>Customer reviews will appear here.</p>
                </div>
            ) : (
                <div className="admin-customer-table-wrapper">
                    <table className="admin-products-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Customer</th>
                                <th>Technician</th>
                                <th>Rating</th>
                                <th>Comment</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedReviews.map((review, index) => (
                                <tr key={review._id}>
                                    <td>{index + 1}</td>

                                    <td>
                                        <strong>
                                            {review.customer?.name || 'Unknown Customer'}
                                        </strong>
                                    </td>

                                    <td>
                                        {review.technician?.name || 'Unknown Technician'}
                                    </td>

                                    <td>
                                        <div className="admin-review-rating">
                                            {renderStars(review.rating)}
                                            <span>{review.rating}/5</span>
                                        </div>
                                    </td>

                                    <td className="admin-review-comment">
                                        {review.comment
                                            ? review.comment.length > 45
                                                ? `${review.comment.substring(0, 45)}...`
                                                : review.comment
                                            : 'No comment'}
                                    </td>

                                    <td>{formatDate(review.createdAt)}</td>

                                    <td>
                                        <button
                                            className="admin-view-button"
                                            onClick={() => setViewingReview(review)}
                                        >
                                            <Eye size={14} />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Review Details Modal */}
            {viewingReview && (
                <div
                    className="admin-modal-overlay"
                    onClick={() => setViewingReview(null)}
                >
                    <div
                        className="admin-modal admin-review-details-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="admin-review-modal-header">
                            <h2>Review Details</h2>

                            <button
                                type="button"
                                onClick={() => setViewingReview(null)}
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="admin-review-details">
                            <div>
                                <label>Customer</label>
                                <p>{viewingReview.customer?.name || 'Unknown Customer'}</p>
                            </div>

                            <div>
                                <label>Technician</label>
                                <p>{viewingReview.technician?.name || 'Unknown Technician'}</p>
                            </div>

                            <div>
                                <label>Rating</label>
                                <div className="admin-review-rating">
                                    {renderStars(viewingReview.rating)}
                                    <strong>{viewingReview.rating}/5</strong>
                                </div>
                            </div>

                            <div>
                                <label>Booking ID</label>
                                <p>
                                    {viewingReview.booking?._id ||
                                        viewingReview.booking ||
                                        'Not available'}
                                </p>
                            </div>

                            <div>
                                <label>Review Date</label>
                                <p>{formatDate(viewingReview.createdAt)}</p>
                            </div>

                            <div>
                                <label>Customer Comment</label>
                                <p className="admin-review-full-comment">
                                    {viewingReview.comment || 'No comment provided.'}
                                </p>
                            </div>
                        </div>

                        <div className="admin-modal-actions">
                            <button
                                type="button"
                                onClick={() => setViewingReview(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ReviewsSection;
