import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

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
  const [loading, setLoading] = useState(true);
  const [draggedCandidate, setDraggedCandidate] = useState<Application | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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
      const response = await axios.get('http://localhost:4000/ats/pipelines', {
        withCredentials: true
      });
      setPipelines(response.data);
    } catch (error) {
      console.error('Failed to fetch pipelines:', error);
    }
  };

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

  const fetchPipelineBoard = async (pipelineId: string, jobId?: string) => {
    try {
      setLoading(true);
      const url = jobId 
        ? `http://localhost:4000/ats/board/${pipelineId}?jobId=${jobId}`
        : `http://localhost:4000/ats/board/${pipelineId}`;
      
      const response = await axios.get(url, { withCredentials: true });
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

  const handleDragStart = (candidate: Application, stage: Stage) => {
    setDraggedCandidate(candidate);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
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
      await axios.post(
        `http://localhost:4000/ats/applications/${draggedCandidate.id}/move-stage`,
        {
          stageId: targetStage.id,
          userId: 'current-user-id' // TODO: Get from auth context
        },
        { withCredentials: true }
      );

      // Refresh board
      if (selectedPipeline) {
        fetchPipelineBoard(selectedPipeline.id, selectedJob || undefined);
      }
    } catch (error) {
      console.error('Failed to move candidate:', error);
      alert('Failed to move candidate');
    }

    setDraggedCandidate(null);
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#018ede] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pipeline...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ATS Pipeline</h1>
              <p className="text-gray-600">Visual hiring pipeline with drag & drop</p>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Pipeline Selector */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline</label>
              <select
                value={selectedPipeline?.id || ''}
                onChange={(e) => handlePipelineChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {pipelines.map(pipeline => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Job</label>
              <select
                value={selectedJob}
                onChange={(e) => handleJobFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Jobs</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.branch}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto bg-gray-50 p-6">
          <div className="flex gap-4 h-full" style={{ minWidth: 'max-content' }}>
            {selectedPipeline?.stages.map((stage) => (
              <div
                key={stage.id}
                className={`flex flex-col bg-white rounded-lg shadow w-80 flex-shrink-0 ${
                  dragOverStage === stage.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Stage Header */}
                <div
                  className="px-4 py-3 border-b flex items-center justify-between"
                  style={{ borderTopColor: stage.color, borderTopWidth: '3px' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {stage.applications.length}
                    </span>
                  </div>
                </div>

                {/* Candidate Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {stage.applications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-sm">No candidates</p>
                    </div>
                  ) : (
                    stage.applications.map((candidate) => (
                      <div
                        key={candidate.id}
                        draggable
                        onDragStart={() => handleDragStart(candidate, stage)}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-move"
                      >
                        {/* Candidate Name & Score */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                              {candidate.firstName} {candidate.lastName}
                            </h4>
                            <p className="text-sm text-gray-500">{candidate.email}</p>
                          </div>
                          {candidate.score !== null && candidate.score !== undefined && (
                            <div className={`text-lg font-bold ${getScoreColor(candidate.score)}`}>
                              {candidate.score}
                            </div>
                          )}
                        </div>

                        {/* Job Title */}
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{candidate.job.title}</span>
                          <span className="text-gray-400"> • </span>
                          <span>{candidate.job.branch}</span>
                        </div>

                        {/* Tags */}
                        {candidate.tags && candidate.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {candidate.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {candidate.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{candidate.tags.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Source & Time */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
                          <span>{candidate.source || 'Direct'}</span>
                          <span>{getTimeAgo(candidate.lastActivityAt)}</span>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-3">
                          <button className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded font-medium">
                            View
                          </button>
                          <button className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded font-medium">
                            Note
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
    </Layout>
  );
}
