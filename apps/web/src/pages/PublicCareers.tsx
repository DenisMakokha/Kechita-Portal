import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  salary?: string;
  branch: string;
  region: string;
  employmentType: string;
  deadline: string;
  status: string;
  createdAt: string;
}

export default function PublicCareers() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Application form
  const [applicationData, setApplicationData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resumeText: '',
    coverLetter: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, searchTerm, filterRegion, filterType]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:4000/recruitment/jobs/public');
      // Only show active jobs before deadline
      const activeJobs = response.data.filter((job: Job) => 
        job.status === 'ACTIVE' && new Date(job.deadline) > new Date()
      );
      setJobs(activeJobs);
      setFilteredJobs(activeJobs);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.branch.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Region filter
    if (filterRegion !== 'all') {
      filtered = filtered.filter(job => job.region === filterRegion);
    }

    // Employment type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(job => job.employmentType === filterType);
    }

    setFilteredJobs(filtered);
  };

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJob) return;

    try {
      setSubmitting(true);
      await axios.post('http://localhost:4000/recruitment/apply', {
        jobId: selectedJob.id,
        applicantType: 'EXTERNAL',
        ...applicationData
      });
      
      alert('Application submitted successfully! We will review your application and get back to you soon.');
      setShowApplicationForm(false);
      setApplicationData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resumeText: '',
        coverLetter: ''
      });
    } catch (error) {
      console.error('Failed to submit application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const regions = [...new Set(jobs.map(j => j.region))];
  const employmentTypes = [...new Set(jobs.map(j => j.employmentType))];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#018ede] to-[#0171bd] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl mb-8">Discover exciting career opportunities at Kechita</p>
          <div className="flex gap-4 max-w-2xl">
            <input
              type="text"
              placeholder="Search jobs by title, location, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-6 py-4 rounded-lg text-gray-900 focus:ring-4 focus:ring-white/30"
            />
            <button 
              onClick={() => applyFilters()}
              className="bg-white text-[#018ede] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Region:</span>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {employmentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-600">
              {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede]"></div>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid gap-6">
            {filteredJobs.map((job) => {
              const daysLeft = getDaysUntilDeadline(job.deadline);
              return (
                <div key={job.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                            {job.branch}
                          </span>
                          <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                            {job.region}
                          </span>
                          <span className="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                            {job.employmentType}
                          </span>
                          {job.salary && (
                            <span className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full">
                              {job.salary}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {daysLeft <= 7 && (
                        <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>

                    {/* Requirements & Responsibilities Preview */}
                    {job.requirements && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Requirements:</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{job.requirements}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        <span>Deadline: {formatDate(job.deadline)}</span>
                      </div>
                      <button
                        onClick={() => handleApply(job)}
                        className="bg-[#018ede] text-white px-6 py-2 rounded-lg hover:bg-[#0171bd] transition-colors font-semibold"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg">
            <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for {selectedJob.title}</h2>
                  <p className="text-gray-600">{selectedJob.branch} - {selectedJob.region}</p>
                </div>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitApplication}>
                <div className="space-y-4">
                  {/* Personal Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={applicationData.firstName}
                        onChange={(e) => setApplicationData({ ...applicationData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={applicationData.lastName}
                        onChange={(e) => setApplicationData({ ...applicationData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={applicationData.email}
                      onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({ ...applicationData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume / CV (Paste text) *
                    </label>
                    <textarea
                      required
                      value={applicationData.resumeText}
                      onChange={(e) => setApplicationData({ ...applicationData, resumeText: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={8}
                      placeholder="Paste your resume or CV text here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Letter (Optional)
                    </label>
                    <textarea
                      value={applicationData.coverLetter}
                      onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={6}
                      placeholder="Tell us why you're a great fit for this position..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-[#018ede] hover:bg-[#0171bd] text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
