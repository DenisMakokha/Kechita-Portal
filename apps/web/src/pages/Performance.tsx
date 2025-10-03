import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface PerformanceReview {
  id: string;
  period: string;
  score: number;
  status: string;
  reviewDate: string;
  reviewer: {
    firstName: string;
    lastName: string;
  };
}

export default function Performance() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceReviews();
  }, []);

  const fetchPerformanceReviews = async () => {
    try {
      const response = await fetch('http://localhost:4000/performance/reviews', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch performance reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-blue-600';
    if (score >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8">Loading performance reviews...</div>
      </Layout>
    );
  }

  const averageScore = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
    : 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Performance Reviews</h1>
          <p className="text-gray-600">View your performance review history and feedback</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Reviews</div>
            <div className="text-2xl font-bold text-blue-600">{reviews.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Average Score</div>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)} / 5.0
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Last Review</div>
            <div className="text-2xl font-bold text-purple-600">
              {reviews.length > 0
                ? new Date(reviews[0].reviewDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Review History</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>No performance reviews yet</p>
              <p className="text-sm mt-1">Your reviews will appear here once conducted</p>
            </div>
          ) : (
            <div className="divide-y">
              {reviews.map(review => (
                <div key={review.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{review.period}</h3>
                      <p className="text-sm text-gray-600">
                        Reviewed by {review.reviewer.firstName} {review.reviewer.lastName}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded ${getStatusColor(review.status)}`}>
                      {review.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                      <div className={`text-3xl font-bold ${getScoreColor(review.score)}`}>
                        {review.score.toFixed(1)}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-1">Performance Rating</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg
                            key={star}
                            className={`w-6 h-6 ${
                              star <= review.score ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-600">Review Date</div>
                      <div className="font-medium">
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Full Review →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">ℹ️ About Performance Reviews</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Reviews are conducted quarterly (every 3 months)</li>
            <li>• Scores range from 1.0 to 5.0 (5.0 being excellent)</li>
            <li>• Reviews include feedback from your direct supervisor</li>
            <li>• Performance impacts promotions and salary adjustments</li>
            <li>• You can schedule a follow-up meeting to discuss your review</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
