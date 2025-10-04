import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

interface ScreeningQuestion {
  id: string;
  jobId: string;
  question: string;
  questionType: string;
  options?: any;
  isKnockout: boolean;
  knockoutAnswer?: string;
  required: boolean;
  order: number;
  weight: number;
}

interface Job {
  id: string;
  title: string;
  branch: string;
  region: string;
}

export default function ScreeningQuestions() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ScreeningQuestion | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    questionType: 'text',
    options: [] as string[],
    isKnockout: false,
    knockoutAnswer: '',
    required: true,
    order: 0,
    weight: 1
  });

  const questionTypes = [
    { value: 'text', label: 'Text Answer' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' }
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchQuestions();
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:4000/recruitment/jobs', {
        withCredentials: true
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchQuestions = async () => {
    if (!selectedJob) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:4000/ats-screen/screening-questions/job/${selectedJob}`,
        { withCredentials: true }
      );
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedQuestion(null);
    setFormData({
      question: '',
      questionType: 'text',
      options: [],
      isKnockout: false,
      knockoutAnswer: '',
      required: true,
      order: questions.length,
      weight: 1
    });
    setShowModal(true);
  };

  const handleEdit = (question: ScreeningQuestion) => {
    setSelectedQuestion(question);
    setFormData({
      question: question.question,
      questionType: question.questionType,
      options: question.options || [],
      isKnockout: question.isKnockout,
      knockoutAnswer: question.knockoutAnswer || '',
      required: question.required,
      order: question.order,
      weight: question.weight
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedJob) {
      alert('Please select a job first');
      return;
    }

    try {
      const payload = {
        ...formData,
        jobId: selectedJob,
        options: formData.questionType === 'multiple_choice' ? formData.options : null
      };

      if (selectedQuestion) {
        await axios.patch(
          `http://localhost:4000/ats-screen/screening-questions/${selectedQuestion.id}`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post(
          'http://localhost:4000/ats-screen/screening-questions',
          payload,
          { withCredentials: true }
        );
      }
      
      setShowModal(false);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
      alert('Failed to save question');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await axios.delete(`http://localhost:4000/ats-screen/screening-questions/${id}`, {
        withCredentials: true
      });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question');
    }
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Screening Questions</h1>
          <p className="text-gray-600">Create pre-screening questions with knockout logic for job applications</p>
        </div>

        {/* Job Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Job *
              </label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select a job --</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.branch} ({job.region})
                  </option>
                ))}
              </select>
            </div>

            {selectedJob && (
              <button
                onClick={handleCreate}
                className="bg-[#018ede] text-white px-6 py-2 rounded-lg hover:bg-[#0171bd] transition-colors"
              >
                + Add Question
              </button>
            )}
          </div>
        </div>

        {/* Questions List */}
        {selectedJob && (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede]"></div>
              </div>
            ) : questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Question Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="bg-gray-100 text-gray-700 font-semibold px-3 py-1 rounded-full text-sm">
                              Q{index + 1}
                            </span>
                            {question.isKnockout && (
                              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                                🚫 KNOCKOUT
                              </span>
                            )}
                            {question.required && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {questionTypes.find(t => t.value === question.questionType)?.label}
                            </span>
                          </div>

                          {/* Question Text */}
                          <p className="text-lg text-gray-900 font-medium mb-2">{question.question}</p>

                          {/* Multiple Choice Options */}
                          {question.questionType === 'multiple_choice' && question.options && (
                            <div className="mt-3 space-y-1">
                              {question.options.map((option: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                  <span className="w-6 h-6 rounded-full border-2 border-gray-300"></span>
                                  <span>{option}</span>
                                  {question.isKnockout && option === question.knockoutAnswer && (
                                    <span className="text-xs text-red-600 font-semibold">(Required answer)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Knockout Info */}
                          {question.isKnockout && question.questionType !== 'multiple_choice' && (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm text-red-700">
                                <span className="font-semibold">Required answer:</span> {question.knockoutAnswer}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                Candidates who don't match this answer will be auto-rejected
                              </p>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                            <span>Order: {question.order}</span>
                            <span>Weight: {question.weight}</span>
                            <span>{question.required ? 'Required' : 'Optional'}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(question)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(question.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-lg mb-2">No screening questions yet</p>
                <p className="text-gray-400 text-sm mb-4">Add pre-screening questions to filter candidates automatically</p>
                <button
                  onClick={handleCreate}
                  className="text-[#018ede] hover:underline font-medium"
                >
                  Create your first question
                </button>
              </div>
            )}
          </>
        )}

        {!selectedJob && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg">Select a job to manage screening questions</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {selectedQuestion ? 'Edit Question' : 'New Screening Question'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* Question Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question *
                      </label>
                      <textarea
                        required
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="e.g., Do you have at least 3 years of experience in React development?"
                      />
                    </div>

                    {/* Question Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Type *
                      </label>
                      <select
                        value={formData.questionType}
                        onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {questionTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Multiple Choice Options */}
                    {formData.questionType === 'multiple_choice' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Answer Options *
                        </label>
                        <div className="space-y-2 mb-2">
                          {formData.options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder={`Option ${index + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={addOption}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          + Add Option
                        </button>
                      </div>
                    )}

                    {/* Knockout Question */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id="isKnockout"
                          checked={formData.isKnockout}
                          onChange={(e) => setFormData({ ...formData, isKnockout: e.target.checked })}
                          className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <label htmlFor="isKnockout" className="ml-2 text-sm font-medium text-red-700">
                          🚫 Make this a knockout question
                        </label>
                      </div>
                      <p className="text-xs text-red-600 mb-3">
                        Candidates who don't provide the correct answer will be automatically rejected
                      </p>
                      
                      {formData.isKnockout && (
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">
                            Required Answer *
                          </label>
                          {formData.questionType === 'multiple_choice' ? (
                            <select
                              required
                              value={formData.knockoutAnswer}
                              onChange={(e) => setFormData({ ...formData, knockoutAnswer: e.target.value })}
                              className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            >
                              <option value="">-- Select required answer --</option>
                              {formData.options.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              required
                              value={formData.knockoutAnswer}
                              onChange={(e) => setFormData({ ...formData, knockoutAnswer: e.target.value })}
                              className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                              placeholder="e.g., Yes"
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Additional Settings */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Order
                        </label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight
                        </label>
                        <input
                          type="number"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.required}
                            onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Required</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#018ede] hover:bg-[#0171bd] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      {selectedQuestion ? 'Update Question' : 'Create Question'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
