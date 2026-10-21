import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Briefcase,
  Compass,
  Edit2,
  FolderGit2,
  GraduationCap,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { Alert } from '../components/common/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useSelectedPath } from '../context/SelectedPathContext';
import {
  FullProfile,
  SelfSkillLevel,
  Skill,
} from '../types';

export const Profile: React.FC = () => {
  const { refreshProfile } = useAuth();
  const { selectedPath, clearPath } = useSelectedPath();
  const [data, setData] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isClearingPath, setIsClearingPath] = useState(false);

  // Edit Basics Mode
  const [editingBasics, setEditingBasics] = useState(false);
  const [basicsForm, setBasicsForm] = useState<any>({});

  // Add Education Modal/Form
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [eduForm, setEduForm] = useState({
    level: '12th',
    institution_name: '',
    board_or_university: 'CBSE',
    passing_year: new Date().getFullYear(),
    percentage: 85.0,
  });

  // Add Project Modal/Form
  const [showAddProj, setShowAddProj] = useState(false);
  const [projForm, setProjForm] = useState({
    title: '',
    description: '',
    tech_stack: '',
    link: '',
  });

  // Add Experience Modal/Form
  const [showAddExp, setShowAddExp] = useState(false);
  const [expForm, setExpForm] = useState({
    type: 'internship' as const,
    title: '',
    organization: '',
    description: '',
    date_or_duration: '',
  });

  // Skills Editing Modal/Drawer
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [editableSkills, setEditableSkills] = useState<
    { skill_id?: number; custom_skill_name?: string; category?: string; self_level: SelfSkillLevel; skill_name: string }[]
  >([]);
  const [customSkillName, setCustomSkillName] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.profile.get();
      setData(res);
      if (res.profile) {
        setBasicsForm({
          full_name: res.profile.full_name || '',
          phone: res.profile.phone || '',
          college: res.profile.college || '',
          branch: res.profile.branch || '',
          year_of_study: res.profile.year_of_study || 3,
          expected_graduation_year: res.profile.expected_graduation_year || 2026,
          cgpa: res.profile.cgpa || 8.0,
          city: res.profile.city || '',
          state: res.profile.state || '',
          linkedin_url: res.profile.linkedin_url || '',
          github_url: res.profile.github_url || '',
          portfolio_url: res.profile.portfolio_url || '',
          career_goal_text: res.profile.career_goal_text || '',
          preferred_work_style: res.profile.preferred_work_style || 'Hybrid',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Save Basics
  const handleSaveBasics = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanPhone = basicsForm.phone.replace(/[\s\-\+]/g, '').replace(/^91/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      await api.profile.update({
        ...basicsForm,
        phone: cleanPhone,
        year_of_study: Number(basicsForm.year_of_study),
        expected_graduation_year: Number(basicsForm.expected_graduation_year),
        cgpa: Number(basicsForm.cgpa),
      });
      setSuccess('Basic details updated successfully!');
      setEditingBasics(false);
      await loadProfile();
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update details.');
    }
  };

  // Education Actions
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.profile.addEducation({
        level: eduForm.level,
        institution_name: eduForm.institution_name.trim(),
        board_or_university: eduForm.board_or_university.trim(),
        passing_year: Number(eduForm.passing_year),
        percentage: Number(eduForm.percentage),
      });
      setShowAddEdu(false);
      setSuccess('Education entry added.');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to add education.');
    }
  };

  const handleDeleteEducation = async (id?: number) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this education record?')) return;
    try {
      await api.profile.deleteEducation(id);
      setSuccess('Education entry removed.');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to delete education.');
    }
  };

  // Project Actions
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.profile.addProject({
        title: projForm.title.trim(),
        description: projForm.description.trim(),
        tech_stack: projForm.tech_stack.trim(),
        link: projForm.link.trim() || null,
      });
      setShowAddProj(false);
      setProjForm({ title: '', description: '', tech_stack: '', link: '' });
      setSuccess('Project added successfully.');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to add project.');
    }
  };

  const handleDeleteProject = async (id?: number) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.profile.deleteProject(id);
      setSuccess('Project removed.');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to delete project.');
    }
  };

  // Experience Actions
  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.profile.addExperience({
        type: expForm.type,
        title: expForm.title.trim(),
        organization: expForm.organization.trim() || null,
        description: expForm.description.trim() || null,
        date_or_duration: expForm.date_or_duration.trim() || null,
      });
      setShowAddExp(false);
      setExpForm({ type: 'internship', title: '', organization: '', description: '', date_or_duration: '' });
      setSuccess('Experience entry added successfully.');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to add experience.');
    }
  };

  const handleDeleteExperience = async (id?: number) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this experience record?')) return;
    try {
      await api.profile.deleteExperience(id);
      setSuccess('Experience record removed.');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to delete experience.');
    }
  };

  // Skills Editing
  const openSkillsEditor = async () => {
    if (data) {
      setEditableSkills(
        data.skills.map((s) => ({
          skill_id: s.skill_id,
          skill_name: s.skill_name,
          category: s.category,
          self_level: s.self_level,
        }))
      );
    }
    if (availableSkills.length === 0) {
      try {
        const cat = await api.catalog.getSkills();
        setAvailableSkills(cat);
      } catch (err) {
        console.error(err);
      }
    }
    setShowSkillsModal(true);
  };

  const handleSaveSkills = async () => {
    setError(null);
    try {
      await api.profile.updateSkills(
        editableSkills.map((s) => ({
          skill_id: s.skill_id,
          custom_skill_name: s.custom_skill_name,
          category: s.category,
          self_level: s.self_level,
        }))
      );
      setShowSkillsModal(false);
      setSuccess('Skills updated successfully.');
      await loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update skills.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your comprehensive profile..." size="lg" />;
  }

  const p = data?.profile;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Alerts */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Selected Career Path Area */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-bold text-gray-900">Active Career Target</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 font-semibold border border-primary-200">
            {selectedPath ? 'Committed Track' : 'Not Selected'}
          </span>
        </div>

        {selectedPath ? (
          <div className="p-5 bg-primary-50/40 rounded-xl border border-primary-200 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-primary-950 text-base">{selectedPath.career_path.name}</h3>
                {selectedPath.simulated_path?.fit_score && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                    <Award className="w-3 h-3 text-emerald-600" />
                    {selectedPath.simulated_path.fit_score}% Fit
                  </span>
                )}
              </div>
              <p className="text-xs text-primary-800 leading-relaxed max-w-2xl">
                {selectedPath.career_path.description}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isClearingPath}
                onClick={async () => {
                  if (window.confirm('Are you sure you want to unselect your active career path?')) {
                    setIsClearingPath(true);
                    try {
                      await clearPath();
                      setSuccess('Active career path cleared.');
                    } catch (err: any) {
                      setError(err?.message || 'Failed to clear career path.');
                    } finally {
                      setIsClearingPath(false);
                    }
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
              >
                Clear Track
              </button>
              <Link
                to="/paths"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Switch Track</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">No Career Path Selected Yet</p>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-0.5">
                Simulate 3 career tracks and pick one to personalize your preparation roadmap, diagnostic tests, and ATS resume.
              </p>
            </div>
            <Link
              to="/paths"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <span>Explore Simulated Career Paths</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Primary Profile Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Academic & Personal Profile</h2>
          </div>
          {!editingBasics ? (
            <button
              onClick={() => setEditingBasics(true)}
              className="inline-flex items-center text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Basics
            </button>
          ) : (
            <button
              onClick={() => setEditingBasics(false)}
              className="inline-flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" /> Cancel
            </button>
          )}
        </div>

        {editingBasics ? (
          <form onSubmit={handleSaveBasics} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={basicsForm.full_name}
                onChange={(e) => setBasicsForm({ ...basicsForm, full_name: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mobile (India)</label>
              <input
                type="text"
                required
                value={basicsForm.phone}
                onChange={(e) => setBasicsForm({ ...basicsForm, phone: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">College</label>
              <input
                type="text"
                required
                value={basicsForm.college}
                onChange={(e) => setBasicsForm({ ...basicsForm, college: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
              <input
                type="text"
                required
                value={basicsForm.branch}
                onChange={(e) => setBasicsForm({ ...basicsForm, branch: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year of Study</label>
              <select
                value={basicsForm.year_of_study}
                onChange={(e) => setBasicsForm({ ...basicsForm, year_of_study: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CGPA (0 - 10)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={10}
                required
                value={basicsForm.cgpa}
                onChange={(e) => setBasicsForm({ ...basicsForm, cgpa: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Graduation Year</label>
              <input
                type="number"
                required
                value={basicsForm.expected_graduation_year}
                onChange={(e) => setBasicsForm({ ...basicsForm, expected_graduation_year: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input
                type="text"
                required
                value={basicsForm.city}
                onChange={(e) => setBasicsForm({ ...basicsForm, city: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
              <input
                type="text"
                required
                value={basicsForm.state}
                onChange={(e) => setBasicsForm({ ...basicsForm, state: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={basicsForm.linkedin_url || ''}
                onChange={(e) => setBasicsForm({ ...basicsForm, linkedin_url: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GitHub URL</label>
              <input
                type="url"
                value={basicsForm.github_url || ''}
                onChange={(e) => setBasicsForm({ ...basicsForm, github_url: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Career Goal Statement</label>
              <textarea
                rows={2}
                value={basicsForm.career_goal_text || ''}
                onChange={(e) => setBasicsForm({ ...basicsForm, career_goal_text: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingBasics(false)}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 shadow-xs inline-flex items-center"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Full Name</span>
              <span className="font-medium text-gray-900">{p?.full_name || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Mobile Phone</span>
              <span className="font-medium text-gray-900">+91 {p?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">College</span>
              <span className="font-medium text-gray-900">{p?.college || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Branch & Year</span>
              <span className="font-medium text-gray-900">
                {p?.branch} &bull; Year {p?.year_of_study}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">B.Tech CGPA</span>
              <span className="font-bold text-primary-700">{p?.cgpa ? Number(p.cgpa).toFixed(2) : 'N/A'} / 10.0</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Graduation Batch</span>
              <span className="font-medium text-gray-900">{p?.expected_graduation_year || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Location</span>
              <span className="font-medium text-gray-900">{p?.city}, {p?.state}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Preferred Work Style</span>
              <span className="font-medium text-gray-900">{p?.preferred_work_style || 'N/A'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Links</span>
              <div className="flex gap-2 text-xs text-primary-600 mt-0.5">
                {p?.linkedin_url && (
                  <a href={p.linkedin_url} target="_blank" rel="noreferrer" className="hover:underline">
                    LinkedIn
                  </a>
                )}
                {p?.github_url && (
                  <a href={p.github_url} target="_blank" rel="noreferrer" className="hover:underline">
                    GitHub
                  </a>
                )}
                {p?.portfolio_url && (
                  <a href={p.portfolio_url} target="_blank" rel="noreferrer" className="hover:underline">
                    Portfolio
                  </a>
                )}
              </div>
            </div>
            {p?.career_goal_text && (
              <div className="sm:col-span-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-400 block mb-1">Career Goal Statement</span>
                <p className="text-xs text-gray-700 leading-relaxed italic">&ldquo;{p.career_goal_text}&rdquo;</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Claimed Technical Skills Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Claimed Skills ({data?.skills.length || 0})</h2>
          </div>
          <button
            onClick={openSkillsEditor}
            className="inline-flex items-center text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" /> Manage Skills
          </button>
        </div>

        {data?.skills.length === 0 ? (
          <EmptyState
            title="No Skills Claimed"
            description="Add the programming languages, frameworks, and databases you have studied."
            actionText="Add Skills"
            onAction={openSkillsEditor}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {data?.skills.map((s) => {
              const levelLabel = s.self_level === 3 ? 'Advanced' : s.self_level === 2 ? 'Intermediate' : 'Beginner';
              const levelColor =
                s.self_level === 3
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : s.self_level === 2
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200';

              return (
                <div key={s.id || s.skill_name} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
                  <div>
                    <span className="font-semibold text-xs text-gray-900 block truncate">{s.skill_name}</span>
                    <span className="text-[10px] text-gray-400 block truncate">{s.category}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${levelColor}`}>
                      {levelLabel}
                    </span>
                    <span className="text-[10px] text-gray-400">Claimed</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Education History */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Education Entries ({data?.education.length || 0})</h2>
          </div>
          <button
            onClick={() => setShowAddEdu(true)}
            className="inline-flex items-center text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Degree
          </button>
        </div>

        {showAddEdu && (
          <form onSubmit={handleAddEducation} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h4 className="font-bold text-xs uppercase text-gray-500">New Education Record</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
                <select
                  value={eduForm.level}
                  onChange={(e) => setEduForm({ ...eduForm, level: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
                >
                  <option value="10th">10th</option>
                  <option value="12th">12th</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Undergraduate">Undergraduate</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">School / College</label>
                <input
                  type="text"
                  required
                  value={eduForm.institution_name}
                  onChange={(e) => setEduForm({ ...eduForm, institution_name: e.target.value })}
                  placeholder="e.g. DPS R.K. Puram"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Board / University</label>
                <input
                  type="text"
                  required
                  value={eduForm.board_or_university}
                  onChange={(e) => setEduForm({ ...eduForm, board_or_university: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0}
                  max={100}
                  value={eduForm.percentage}
                  onChange={(e) => setEduForm({ ...eduForm, percentage: Number(e.target.value) })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddEdu(false)}
                className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-primary-600 text-white rounded text-xs font-semibold hover:bg-primary-700"
              >
                Save Record
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-100">
          {data?.education.map((edu) => (
            <div key={edu.id} className="py-3 flex justify-between items-center text-sm">
              <div>
                <span className="font-semibold text-gray-900">{edu.level}</span> &bull; {edu.institution_name} (
                {edu.board_or_university})
                <div className="text-xs text-gray-400 mt-0.5">
                  Passing Year: {edu.passing_year} &bull; Score:{' '}
                  <span className="font-semibold text-gray-700">{Number(edu.percentage).toFixed(2)}%</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteEducation(edu.id)}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">Projects ({data?.projects.length || 0})</h2>
          </div>
          <button
            onClick={() => setShowAddProj(true)}
            className="inline-flex items-center text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Project
          </button>
        </div>

        {showAddProj && (
          <form onSubmit={handleAddProject} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h4 className="font-bold text-xs uppercase text-gray-500">New Technical Project</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={projForm.title}
                  onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                  placeholder="e.g. Distributed Task Queue"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tech Stack</label>
                <input
                  type="text"
                  required
                  value={projForm.tech_stack}
                  onChange={(e) => setProjForm({ ...projForm, tech_stack: e.target.value })}
                  placeholder="e.g. FastAPI, Redis, Docker"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={projForm.description}
                  onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Project URL / GitHub</label>
                <input
                  type="url"
                  value={projForm.link}
                  onChange={(e) => setProjForm({ ...projForm, link: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddProj(false)}
                className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-primary-600 text-white rounded text-xs font-semibold hover:bg-primary-700"
              >
                Save Project
              </button>
            </div>
          </form>
        )}

        {data?.projects.length === 0 ? (
          <EmptyState
            title="No Projects Added Yet"
            description="Projects show recruiters your practical abilities. Add self-built systems or hackathon apps."
            actionText="Add Project"
            onAction={() => setShowAddProj(true)}
          />
        ) : (
          <div className="space-y-3">
            {data?.projects.map((proj) => (
              <div key={proj.id} className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-200 space-y-1 relative">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm text-gray-900">{proj.title}</h4>
                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-600">{proj.description}</p>
                <div className="text-xs text-primary-700 font-medium pt-1">
                  Stack: {proj.tech_stack}{' '}
                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noreferrer" className="underline ml-2">
                      View Code &rarr;
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experiences Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-700" />
            <h2 className="text-base font-bold text-gray-900">
              Experiences & Certifications ({data?.experiences.length || 0})
            </h2>
          </div>
          <button
            onClick={() => setShowAddExp(true)}
            className="inline-flex items-center text-xs font-semibold text-primary-700 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Entry
          </button>
        </div>

        {showAddExp && (
          <form onSubmit={handleAddExperience} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <h4 className="font-bold text-xs uppercase text-gray-500">New Experience Record</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={expForm.type}
                  onChange={(e) => setExpForm({ ...expForm, type: e.target.value as any })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white"
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
                  required
                  value={expForm.title}
                  onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
                  placeholder="e.g. Backend SDE Intern"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={expForm.organization}
                  onChange={(e) => setExpForm({ ...expForm, organization: e.target.value })}
                  placeholder="e.g. Swiggy, AWS"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddExp(false)}
                className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-primary-600 text-white rounded text-xs font-semibold hover:bg-primary-700"
              >
                Save Entry
              </button>
            </div>
          </form>
        )}

        {data?.experiences.length === 0 ? (
          <EmptyState
            title="No Experiences Added"
            description="Add your internships, hackathon rankings, or certifications."
            actionText="Add Entry"
            onAction={() => setShowAddExp(true)}
          />
        ) : (
          <div className="space-y-3">
            {data?.experiences.map((exp) => (
              <div key={exp.id} className="p-3.5 bg-gray-50/50 rounded-xl border border-gray-200 flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold text-gray-900">{exp.title}</span>
                  {exp.organization && <span className="text-gray-500"> &bull; {exp.organization}</span>}
                  <div className="text-xs text-gray-400 capitalize mt-0.5">
                    {exp.type} {exp.date_or_duration ? `&bull; ${exp.date_or_duration}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteExperience(exp.id)}
                  className="text-gray-400 hover:text-red-500 p-1"
                  title="Delete experience"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills Management Modal */}
      {showSkillsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-lg">Manage Claimed Skills</h3>
              <button onClick={() => setShowSkillsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Current editable skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Active Claimed Skills ({editableSkills.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {editableSkills.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-lg border border-gray-200 bg-gray-50 text-xs">
                      <span className="font-medium text-gray-800 truncate pr-2">{s.skill_name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <select
                          value={s.self_level}
                          onChange={(e) => {
                            const updated = [...editableSkills];
                            updated[idx].self_level = Number(e.target.value) as SelfSkillLevel;
                            setEditableSkills(updated);
                          }}
                          className="px-1.5 py-0.5 border border-gray-300 rounded bg-white text-[11px]"
                        >
                          <option value={1}>Beginner</option>
                          <option value={2}>Intermediate</option>
                          <option value={3}>Advanced</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setEditableSkills(editableSkills.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-500 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Skill */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={customSkillName}
                  onChange={(e) => setCustomSkillName(e.target.value)}
                  placeholder="Type any other skill to add..."
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = customSkillName.trim();
                    if (!t) return;
                    setEditableSkills([...editableSkills, { custom_skill_name: t, skill_name: t, category: 'Other', self_level: 2 }]);
                    setCustomSkillName('');
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                >
                  Add Skill
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSkillsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSkills}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700"
              >
                Save All Skills
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
