import React, { useState } from 'react';
import { Briefcase, FolderGit2, Plus, Trash2 } from 'lucide-react';
import { Experience, OnboardingDraft, Project } from '../../../types';

interface Step6Props {
  draft: OnboardingDraft;
  updateDraft: (updater: (prev: OnboardingDraft) => OnboardingDraft) => void;
  onNext: () => void;
  onBack: () => void;
  setError: (err: string | null) => void;
}

export const Step6Projects: React.FC<Step6Props> = ({
  draft,
  updateDraft,
  onNext,
  onBack,
  setError,
}) => {
  const { projects, experiences } = draft;
  const [activeTab, setActiveTab] = useState<'projects' | 'experiences'>('projects');

  // Add Project
  const handleAddProject = () => {
    const newProj: Project = {
      title: '',
      description: '',
      tech_stack: '',
      link: '',
    };
    updateDraft((d) => ({
      ...d,
      projects: [...d.projects, newProj],
    }));
  };

  const handleUpdateProject = (index: number, field: keyof Project, val: string) => {
    updateDraft((d) => {
      const updated = [...d.projects];
      updated[index] = { ...updated[index], [field]: val };
      return { ...d, projects: updated };
    });
  };

  const handleRemoveProject = (index: number) => {
    updateDraft((d) => ({
      ...d,
      projects: d.projects.filter((_, i) => i !== index),
    }));
  };

  // Add Experience
  const handleAddExperience = () => {
    const newExp: Experience = {
      type: 'internship',
      title: '',
      organization: '',
      description: '',
      date_or_duration: '',
      link: '',
    };
    updateDraft((d) => ({
      ...d,
      experiences: [...d.experiences, newExp],
    }));
  };

  const handleUpdateExperience = (index: number, field: keyof Experience, val: string) => {
    updateDraft((d) => {
      const updated = [...d.experiences];
      updated[index] = { ...updated[index], [field]: val };
      return { ...d, experiences: updated };
    });
  };

  const handleRemoveExperience = (index: number) => {
    updateDraft((d) => ({
      ...d,
      experiences: d.experiences.filter((_, i) => i !== index),
    }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate only if entries have been started
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      if (p.title || p.description || p.tech_stack) {
        if (!p.title.trim()) {
          setError(`Please provide a title for Project #${i + 1}.`);
          return;
        }
        if (!p.description.trim()) {
          setError(`Please provide a description for Project #${i + 1}.`);
          return;
        }
        if (!p.tech_stack.trim()) {
          setError(`Please list tech stack tags for Project #${i + 1}.`);
          return;
        }
      }
    }

    for (let i = 0; i < experiences.length; i++) {
      const exp = experiences[i];
      if (exp.title || exp.organization) {
        if (!exp.title.trim()) {
          setError(`Please provide a title for Experience #${i + 1}.`);
          return;
        }
      }
    }

    // Filter out completely empty rows
    updateDraft((d) => ({
      ...d,
      projects: d.projects.filter((p) => p.title.trim() && p.description.trim()),
      experiences: d.experiences.filter((exp) => exp.title.trim()),
    }));

    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Step 6: Projects & Experiences</h3>
          <p className="text-sm text-gray-500 mt-1">
            Optional but recommended for auto-generating your placement resume. You can also skip this and add them later in your profile.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 flex items-center transition-colors ${
            activeTab === 'projects'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FolderGit2 className="w-4 h-4 mr-1.5" />
          Projects ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('experiences')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 flex items-center transition-colors ${
            activeTab === 'experiences'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Briefcase className="w-4 h-4 mr-1.5" />
          Experiences & Certifications ({experiences.length})
        </button>
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Technical Projects (Self-built / Hackathons)
            </span>
            <button
              type="button"
              onClick={handleAddProject}
              className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 bg-white">
              No projects added yet. Click &ldquo;Add Project&rdquo; or skip to the next step.
            </div>
          ) : (
            projects.map((proj, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-xl bg-white shadow-xs space-y-3 relative"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-700">Project #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Project Title</label>
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => handleUpdateProject(idx, 'title', e.target.value)}
                      placeholder="e.g. Distributed Task Queue"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tech Stack</label>
                    <input
                      type="text"
                      value={proj.tech_stack}
                      onChange={(e) => handleUpdateProject(idx, 'tech_stack', e.target.value)}
                      placeholder="e.g. Python, Redis, Docker"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={proj.description}
                      onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                      placeholder="Describe the problem solved, architecture, and impact..."
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Project Link (GitHub / Live Demo)</label>
                    <input
                      type="url"
                      value={proj.link || ''}
                      onChange={(e) => handleUpdateProject(idx, 'link', e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Experiences Tab */}
      {activeTab === 'experiences' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Internships, Hackathons & Certifications
            </span>
            <button
              type="button"
              onClick={handleAddExperience}
              className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Entry
            </button>
          </div>

          {experiences.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 bg-white">
              No experiences added yet. Click &ldquo;Add Entry&rdquo; or skip to the next step.
            </div>
          ) : (
            experiences.map((exp, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-xl bg-white shadow-xs space-y-3 relative"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-xs font-bold text-gray-700">Entry #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(idx)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                      value={exp.type}
                      onChange={(e) => handleUpdateExperience(idx, 'type', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="internship">Internship</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="certification">Certification</option>
                      <option value="achievement">Academic / Coding Achievement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => handleUpdateExperience(idx, 'title', e.target.value)}
                      placeholder="e.g. SDE Intern / Smart India Hackathon Winner"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Organization / Event</label>
                    <input
                      type="text"
                      value={exp.organization || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'organization', e.target.value)}
                      placeholder="e.g. Infosys, AWS, College Hackathon"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duration / Date</label>
                    <input
                      type="text"
                      value={exp.date_or_duration || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'date_or_duration', e.target.value)}
                      placeholder="e.g. June 2024 - August 2024"
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="pt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50"
        >
          &larr; Back
        </button>

        <div className="space-x-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 shadow-sm"
          >
            {projects.length === 0 && experiences.length === 0
              ? 'Skip & Proceed &rarr;'
              : 'Save & Continue &rarr;'}
          </button>
        </div>
      </div>
    </form>
  );
};
