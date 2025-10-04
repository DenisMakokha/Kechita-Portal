import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Stage {
  id: string;
  name: string;
  description?: string;
  order: number;
  color: string;
  type: string;
  applications: Application[];
}

interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  score?: number;
  tags: string[];
  source?: string;
  lastActivityAt: string;
  createdAt: string;
  resumeUrl?: string;
  notes?: string;
  job: {
    id: string;
    title: string;
    branch: string;
    region: string;
  };
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: Stage[];
}

export default function ATSPipeline() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [draggedCandidate, setDraggedCandidate] = useState<Application | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [bulkActionMenu, setBulkActionMenu] = useState(false);

  // Email compose state
  const [emailData, setEmailData] = useState({
    subject: '',
    body: '',
    template: ''
  });

  // Schedule interview state
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    duration: 60,
    interviewers: '',
    location: '',
    type: 'video' as 'video' | 'phone' | 'in-person'
  });

  useEffect(() => {
    fetchPipelines();
    fetchJobs();
  }, []);

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      const defaultPipeline = pipelines.find(p => p.id) || pipelines[0];
      setSelectedPipeline(defaultPipeline);
      if (defaultPipeline) {
        fetchPipelineBoard(defaultPipeline.id);
      }
    }
  }, [pipelines]);

  const fetchPipelines = async () => {
    try {
      const response = await axios.get('http://localhost:4000/ats/pipelines');
      setPipelines(response.data);
    } catch (error) {
      console.error('Failed to fetch pipelines:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://localhost:4000/recruitment/jobs');
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchPipelineBoard = async (pipelineId: string, jobId?: string) => {
    try {
      setLoading(true);
      const url = jobId 
        ? `http://localhost:4000/ats/board/${pipelineId}?jobId=${jobId}`
        : `http://localhost:4000/ats/board/${pipelineId}`;
      
      const response = await axios.get(url);
      setSelectedPipeline(response.data);
    } catch (error) {
      console.error('Failed to fetch pipeline board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      fetchPipelineBoard(pipelineId, selectedJob || undefined);
    }
  };

  const handleJobFilter = (jobId: string) => {
    setSelectedJob(jobId);
    if (selectedPipeline) {
      fetchPipelineBoard(selectedPipeline.id, jobId || undefined);
    }
  };

  const handleDragStart = (e: React.DragEvent, candidate: Application) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
    // Add ghost image
    const ghost = document.createElement('div');
    ghost.className = 'bg-white p-4 rounded-lg shadow-lg border-2 border-blue-500';
    ghost.innerHTML = `<div class="font-semibold">${candidate.firstName} ${candidate.lastName}</div>`;
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: Stage) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedCandidate) return;

    try {
      await axios.post(`http://localhost:4000/ats/applications/${draggedCandidate.id}/move-stage`, {
        stageId: targetStage.id,
        userId: 'current-user-id'
      });

      // Show success animation
      showNotification(`Moved ${draggedCandidate.firstName} to ${targetStage.name}`, 'success');

      // Refresh board
      if (selectedPipeline) {
        fetchPipelineBoard(selectedPipeline.id, selectedJob || undefined);
      }
    } catch (error) {
      console.error('Failed to move candidate:', error);
      showNotification('Failed to move candidate', 'error');
    }

    setDraggedCandidate(null);
  };

  const handleCandidateClick = (candidate: Application) => {
    setSelectedCandidate(candidate);
    setShowQuickView(true);
  };

  const handleSendEmail = async () => {
    if (!selectedCandidate) return;

    try {
      await axios.post(`http://localhost:4000/ats/communication/email/${selectedCandidate.id}`, emailData);
      showNotification('Email sent successfully!', 'success');
      setShowEmailModal(false);
      setEmailData({ subject: '', body: '', template: '' });
    } catch (error) {
      showNotification('Failed to send email', 'error');
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedCandidate) return;

    try {
      await axios.post(`http://localhost:4000/ats/screening/schedule-interview/${selectedCandidate.id}`, scheduleData);
      showNotification('Interview scheduled successfully!', 'success');
      setShowScheduleModal(false);
      setScheduleData({
        date: '',
        time: '',
        duration: 60,
        interviewers: '',
        location: '',
        type: 'video'
      });
    } catch (error) {
      showNotification('Failed to schedule interview', 'error');
    }
  };

  const toggleCandidateSelection = (candidateId: string) => {
    const newSelection = new Set(selectedCandidates);
    if (newSelection.has(candidateId)) {
      newSelection.delete(candidateId);
    } else {
      newSelection.add(candidateId);
    }
    setSelectedCandidates(newSelection);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCandidates.size === 0) return;

    try {
      await axios.post(`http://localhost:4000/ats/applications/bulk/${action}`, {
        applicationIds: Array.from(selectedCandidates)
      });
      showNotification(`Bulk action "${action}" completed`, 'success');
      setSelectedCandidates(new Set());
      setBulkActionMenu(false);
      if (selectedPipeline) {
        fetchPipelineBoard(selectedPipeline.id, selectedJob || undefined);
      }
    } catch (error) {
      showNotification('Bulk action failed', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification - could be enhanced with a toast library
    alert(message);
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score?: number) => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-blue-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const getTotalCandidates = () => {
    return selectedPipeline?.stages.reduce((sum, stage) => sum + stage.applications.length, 0) || 0;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const filteredStages = selectedPipeline?.stages.map(stage => ({
    ...stage,
    applications: stage.applications.filter(app => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        app.firstName.toLowerCase().includes(search) ||
        app.lastName.toLowerCase().includes(search) ||
        app.email.toLowerCase().includes(search) ||
        app.job.title.toLowerCase().includes(search)
      );
    })
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your pipeline...</p>
          <p className="text-gray-400 text-sm mt-1">Gathering candidates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="px-6 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recruitment Pipeline</h1>
                <p className="text-sm text-gray-500">Visual hiring workflow • {getTotalCandidates()} active candidates</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search candidates..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Bulk Actions */}
              {selectedCandidates.size > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setBulkActionMenu(!bulkActionMenu)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                  >
                    <span>{selectedCandidates.size} selected</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {bulkActionMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => handleBulkAction('send-email')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Email
                      </button>
                      <button
                        onClick={() => handleBulkAction('add-tag')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Add Tag
                      </button>
                      <button
                        onClick={() => handleBulkAction('export')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => setSelectedCandidates(new Set())}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Refresh */}
              <button
                onClick={() => selectedPipeline && fetchPipelineBoard(selectedPipeline.id, selectedJob || undefined)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <select
                value={selectedPipeline?.id || ''}
                onChange={(e) => handlePipelineChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {pipelines.map(pipeline => (
                  <option key={pipeline.id} value={pipeline.id}>
                    📋 {pipeline.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <select
                value={selectedJob}
                onChange={(e) => handleJobFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">🌍 All Positions</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} • {job.branch}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pipeline Stats */}
        <div className="px-6 py-3 bg-gray-50 border-t flex gap-6">
          {filteredStages?.map(stage => (
            <div key={stage.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }}></div>
              <span className="text-sm text-gray-600">{stage.name}</span>
              <span className="text-sm font-semibold text-gray-900">{stage.applications.length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-[calc(100vh-280px)]" style={{ minWidth: 'max-content' }}>
          {filteredStages?.map((stage) => (
            <div
              key={stage.id}
              className={`flex flex-col bg-white rounded-xl shadow-sm w-80 flex-shrink-0 transition-all duration-200 ${
                dragOverStage === stage.id ? 'ring-2 ring-blue-500 ring-offset-2 scale-105' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Stage Header */}
              <div
                className="px-4 py-3 flex items-center justify-between rounded-t-xl"
                style={{ backgroundColor: `${stage.color}15`, borderTop: `3px solid ${stage.color}` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getScoreBgColor(stage.applications[0]?.score)}`}>
                    {stage.applications.length}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              {/* Candidate Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {stage.applications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <svg className="w-16 h-16 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="text-sm font-medium">No candidates yet</p>
                    <p className="text-xs mt-1">Drag candidates here</p>
                  </div>
                ) : (
                  stage.applications.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, candidate)}
                      className={`bg-white border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-move group ${
                        selectedCandidates.has(candidate.id) ? 'border-blue-500 shadow-md' : 'border-gray-200'
                      } ${draggedCandidate?.id === candidate.id ? 'opacity-50' : ''}`}
                    >
                      {/* Candidate Header */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {getInitials(candidate.firstName, candidate.lastName)}
                          </div>
                          {candidate.score && (
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getScoreBgColor(candidate.score)} ${getScoreColor(candidate.score)} flex items-center justify-center text-xs font-bold border-2 border-white shadow`}>
                              {candidate.score}
                            </div>
                          )}
                        </div>

                        {/* Name & Info */}
                        <div className="flex-1 min-w-0">
                          <h4
                            onClick={() => handleCandidateClick(candidate)}
                            className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer truncate"
                          >
                            {candidate.firstName} {candidate.lastName}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
                        </div>

                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedCandidates.has(candidate.id)}
                          onChange={() => toggleCandidateSelection(candidate.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Job Title */}
                      <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 truncate">{candidate.job.title}</p>
                        <p className="text-xs text-gray-500">{candidate.job.branch} • {candidate.job.region}</p>
                      </div>

                      {/* Tags */}
                      {candidate.tags && candidate.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {candidate.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                          {candidate.tags.length > 3 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                              +{candidate.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{getTimeAgo(candidate.lastActivityAt)}</span>
                        </div>
                        <span className="font-medium">{candidate.source || 'Direct'}</span>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-3 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCandidateClick(candidate)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(candidate);
                            setShowEmailModal(true);
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(candidate);
                            setShowScheduleModal(true);
                          }}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Meet
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
