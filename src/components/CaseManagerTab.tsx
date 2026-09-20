import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Download,
  Upload,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  Copy,
  Sparkles,
  AlertCircle,
  FileText,
  User,
  HeartHandshake,
  Shield,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Check,
  RefreshCw,
  Eye,
  Lightbulb,
} from 'lucide-react';
import { CaseVignette, DomainTrack, DifficultyLevel } from '../types';

interface CaseManagerTabProps {
  onCasesUpdated?: () => void;
}

export const CaseManagerTab: React.FC<CaseManagerTabProps> = ({ onCasesUpdated }) => {
  const [allCases, setAllCases] = useState<CaseVignette[]>([]);
  const [customCases, setCustomCases] = useState<CaseVignette[]>([]);
  const [builtInCases, setBuiltInCases] = useState<CaseVignette[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'custom' | 'builtin'>('all');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State for Create / Edit / Clone
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formTrack, setFormTrack] = useState<string>('school');
  const [formCustomTrack, setFormCustomTrack] = useState<string>('');
  const [formDifficulty, setFormDifficulty] = useState<string>('novice');
  const [formClientName, setFormClientName] = useState<string>('');
  const [formClientAge, setFormClientAge] = useState<number>(16);
  const [formClientPronouns, setFormClientPronouns] = useState<string>('they/them');
  const [formClientRole, setFormClientRole] = useState<string>('');
  const [formPresentingProblem, setFormPresentingProblem] = useState<string>('');
  const [formBackgroundStory, setFormBackgroundStory] = useState<string>('');
  const [formBaselineResistance, setFormBaselineResistance] = useState<string>('');
  const [formPositiveTriggers, setFormPositiveTriggers] = useState<string>('');
  const [formNegativeTriggers, setFormNegativeTriggers] = useState<string>('');
  const [formSomaticTendencies, setFormSomaticTendencies] = useState<string>('');
  const [formIntakeGoal, setFormIntakeGoal] = useState<string>('');

  // Referral Cue Fields
  const [formHasReferralCue, setFormHasReferralCue] = useState<boolean>(false);
  const [formReferralSubtlety, setFormReferralSubtlety] = useState<string>('subtle');
  const [formReferralDesc, setFormReferralDesc] = useState<string>('');
  const [formReferralCategory, setFormReferralCategory] = useState<string>('');
  const [formReferralPath, setFormReferralPath] = useState<string>('');

  // Import State
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importJsonData, setImportJsonData] = useState<any[] | null>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Fetch Cases from API
  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cases');
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = await res.json();
      setAllCases(data.all || []);
      setCustomCases(data.custom || []);
      setBuiltInCases(data.builtIn || []);
      if (onCasesUpdated) {
        onCasesUpdated();
      }
    } catch (err: any) {
      console.error('Failed to load case studies:', err);
      setError(err.message || 'Failed to load case studies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Reset form fields
  const resetForm = () => {
    setFormTitle('');
    setFormTrack('school');
    setFormCustomTrack('');
    setFormDifficulty('novice');
    setFormClientName('');
    setFormClientAge(16);
    setFormClientPronouns('she/her');
    setFormClientRole('Student');
    setFormPresentingProblem('');
    setFormBackgroundStory('');
    setFormBaselineResistance('');
    setFormPositiveTriggers('');
    setFormNegativeTriggers('');
    setFormSomaticTendencies('');
    setFormIntakeGoal('');
    setFormHasReferralCue(false);
    setFormReferralSubtlety('subtle');
    setFormReferralDesc('');
    setFormReferralCategory('');
    setFormReferralPath('');
    setEditingCaseId(null);
  };

  // Populate form with case
  const populateFormWithCase = (v: CaseVignette, mode: 'edit' | 'clone') => {
    setModalMode(mode);
    setEditingCaseId(mode === 'edit' ? v.id : null);
    setFormTitle(mode === 'clone' ? `${v.title} (Custom Clone)` : v.title);

    const standardTracks = ['school', 'workplace', 'cbt', 'general'];
    if (standardTracks.includes(v.track)) {
      setFormTrack(v.track);
      setFormCustomTrack('');
    } else {
      setFormTrack('custom');
      setFormCustomTrack(v.track);
    }

    setFormDifficulty(v.difficulty || 'novice');
    setFormClientName(v.clientName);
    setFormClientAge(v.clientAge || 18);
    setFormClientPronouns(v.clientPronouns || 'they/them');
    setFormClientRole(v.clientRole || 'Client');
    setFormPresentingProblem(v.presentingProblem || '');
    setFormBackgroundStory(v.backgroundStory || '');
    setFormBaselineResistance(v.baselineResistance || '');
    setFormPositiveTriggers((v.positiveTriggers || []).join('\n'));
    setFormNegativeTriggers((v.negativeTriggers || []).join('\n'));
    setFormSomaticTendencies((v.somaticTendencies || []).join('\n'));
    setFormIntakeGoal(v.counselorIntakeGoal || '');

    if (v.plantedReferralCue && v.plantedReferralCue.exists) {
      setFormHasReferralCue(true);
      setFormReferralSubtlety(v.plantedReferralCue.subtlety || 'subtle');
      setFormReferralDesc(v.plantedReferralCue.description || '');
      setFormReferralCategory(v.plantedReferralCue.clinicalCategory || '');
      setFormReferralPath(v.plantedReferralCue.properReferralPath || '');
    } else {
      setFormHasReferralCue(false);
      setFormReferralSubtlety('subtle');
      setFormReferralDesc('');
      setFormReferralCategory('');
      setFormReferralPath('');
    }

    setIsModalOpen(true);
  };

  // Quick Sample Auto-Fill (Template Helper)
  const handleAutoFillSample = () => {
    setFormTitle('Tariq M. — Career Identity Loss Following Layoff');
    setFormTrack('workplace');
    setFormCustomTrack('');
    setFormDifficulty('novice');
    setFormClientName('Tariq Mansoor');
    setFormClientAge(41);
    setFormClientPronouns('he/him');
    setFormClientRole('Former Senior Product Specialist');
    setFormPresentingProblem('Referred after experiencing intense panic attacks and withdrawal following an abrupt company restructuring after 12 years of service.');
    setFormBackgroundStory('Tariq defined his entire self-worth through his productivity and mentorship of junior staff. He has not told his extended family that he was let go and pretends to leave for an office every morning to sit in a library.');
    setFormBaselineResistance('Speaks in quick, analytical sentences. Repeatedly deflects away from grief by listing job search statistics and spreadsheet applications.');
    setFormPositiveTriggers(
      'Validating the acute grief of lost institutional identity\nNormalizing the terror of role dislocation without judgment\nReflecting how exhaustion manifests beneath frantic productivity'
    );
    setFormNegativeTriggers(
      'Offering resume writing advice or networking platforms prematurely\nSaying "Everything happens for a reason"\nMinimizing his 12 years of devotion to his previous team'
    );
    setFormSomaticTendencies(
      '*[Clears throat and taps index finger rhythmically against knee]*\n*[Swallows hard and looks down when mentioning his family]*\n*[Takes a slow, deep breath and visibly drops shoulders when heard]*'
    );
    setFormIntakeGoal('Help client acknowledge the profound grief of identity loss, deconstruct shame around unemployment, and avoid premature career-action planning.');
    setFormHasReferralCue(false);
  };

  // Save Case Study (Create or Edit)
  const handleSaveCase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showFeedback('error', 'Please provide a descriptive case study title.');
      return;
    }
    if (!formClientName.trim()) {
      showFeedback('error', 'Please provide the simulated client persona full name.');
      return;
    }

    const finalTrack = formTrack === 'custom' ? (formCustomTrack.trim() || 'general') : formTrack;

    const parseLines = (text: string): string[] => {
      return text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    };

    const casePayload: Partial<CaseVignette> = {
      title: formTitle.trim(),
      track: finalTrack,
      difficulty: formDifficulty,
      clientName: formClientName.trim(),
      clientAge: Number(formClientAge) || 25,
      clientPronouns: formClientPronouns.trim() || 'they/them',
      clientRole: formClientRole.trim() || 'Client',
      presentingProblem: formPresentingProblem.trim(),
      backgroundStory: formBackgroundStory.trim(),
      baselineResistance: formBaselineResistance.trim(),
      positiveTriggers: parseLines(formPositiveTriggers),
      negativeTriggers: parseLines(formNegativeTriggers),
      somaticTendencies: parseLines(formSomaticTendencies),
      counselorIntakeGoal: formIntakeGoal.trim(),
      plantedReferralCue: {
        exists: formHasReferralCue,
        subtlety: formReferralSubtlety as any,
        description: formReferralDesc.trim(),
        clinicalCategory: formReferralCategory.trim(),
        properReferralPath: formReferralPath.trim(),
      },
    };

    try {
      if (modalMode === 'edit' && editingCaseId) {
        // PUT update
        const res = await fetch(`/api/cases/${editingCaseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(casePayload),
        });
        if (!res.ok) throw new Error('Failed to update case study');
        showFeedback('success', `Case study "${formTitle}" updated successfully.`);
      } else {
        // POST create
        const res = await fetch('/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(casePayload),
        });
        if (!res.ok) throw new Error('Failed to publish case study');
        showFeedback('success', `New case study "${formTitle}" published successfully to local database.`);
      }

      setIsModalOpen(false);
      resetForm();
      fetchCases();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error saving case study');
    }
  };

  // Delete Custom Case
  const handleDeleteCase = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the case study "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete case study');
      showFeedback('success', `Case study "${title}" removed.`);
      fetchCases();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting case study');
    }
  };

  // Handle Export
  const handleExportCases = (scope: 'custom' | 'all') => {
    window.location.href = `/api/cases/export?scope=${scope}`;
    showFeedback('success', `Exporting ${scope === 'custom' ? 'custom' : 'all'} case studies as JSON...`);
  };

  // Handle Import File Selection
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const casesList = Array.isArray(parsed) ? parsed : (parsed.records || parsed.cases || []);
        if (!Array.isArray(casesList) || casesList.length === 0) {
          showFeedback('error', 'The selected file does not contain a valid array of case studies.');
          setImportJsonData(null);
          return;
        }
        setImportJsonData(casesList);
        setIsImportModalOpen(true);
      } catch (err) {
        showFeedback('error', 'Failed to parse file. Please upload a valid JSON file.');
        setImportJsonData(null);
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be selected again
    e.target.value = '';
  };

  // Execute Batch Import
  const handleExecuteImport = async () => {
    if (!importJsonData || importJsonData.length === 0) return;

    setIsImporting(true);
    try {
      const res = await fetch('/api/cases/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cases: importJsonData,
          mode: importMode,
        }),
      });

      if (!res.ok) throw new Error('Failed to import case studies');
      const data = await res.json();
      showFeedback('success', data.message || `Imported ${importJsonData.length} case studies successfully.`);
      setIsImportModalOpen(false);
      setImportJsonData(null);
      setImportFileName(null);
      fetchCases();
    } catch (err: any) {
      showFeedback('error', err.message || 'Error during case study import');
    } finally {
      setIsImporting(false);
    }
  };

  // Filter cases
  const filteredCases = allCases.filter((c) => {
    // Source filter
    if (sourceFilter === 'custom' && !c.isCustom) return false;
    if (sourceFilter === 'builtin' && c.isCustom) return false;

    // Track filter
    if (selectedTrack !== 'all' && c.track !== selectedTrack) return false;

    // Difficulty filter
    if (selectedDifficulty !== 'all' && c.difficulty !== selectedDifficulty) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (c.title || '').toLowerCase().includes(q);
      const matchName = (c.clientName || '').toLowerCase().includes(q);
      const matchRole = (c.clientRole || '').toLowerCase().includes(q);
      const matchProblem = (c.presentingProblem || '').toLowerCase().includes(q);
      const matchStory = (c.backgroundStory || '').toLowerCase().includes(q);
      return matchTitle || matchName || matchRole || matchProblem || matchStory;
    }

    return true;
  });

  // Unique list of tracks across all cases
  const availableTracks = Array.from(new Set(allCases.map((c) => c.track))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Case Management Header & Key Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                <BookOpen className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-stone-900">
                Case Studies & Simulated Client Personas
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
              Create, customize, and publish new clinical case vignettes and patient personas separate from the app build.
              Cases are stored locally and will seamlessly appear in the counselor simulation selection.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="create-new-case-btn"
              onClick={() => {
                resetForm();
                setModalMode('create');
                setIsModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition-all flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Case & Persona</span>
            </button>

            <button
              onClick={() => importFileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 transition-all flex items-center space-x-1.5 border border-stone-200"
              title="Import case studies from JSON file"
            >
              <Upload className="w-3.5 h-3.5 text-stone-600" />
              <span>Import Cases</span>
            </button>

            <input
              type="file"
              ref={importFileInputRef}
              onChange={handleImportFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => handleExportCases('all')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 transition-all flex items-center space-x-1.5 border border-stone-200"
              title="Export all case studies as JSON"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>Export Catalog</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Total Case Studies
            </span>
            <span className="text-xl font-black text-stone-900 mt-0.5 block">{allCases.length}</span>
          </div>

          <div className="bg-teal-50/70 rounded-xl p-3 border border-teal-200/70">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              Custom Published
            </span>
            <span className="text-xl font-black text-teal-900 mt-0.5 block">{customCases.length}</span>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Standard Built-In
            </span>
            <span className="text-xl font-black text-stone-700 mt-0.5 block">{builtInCases.length}</span>
          </div>

          <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Active Domains
            </span>
            <span className="text-xl font-black text-stone-700 mt-0.5 block">{availableTracks.length}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case title, client name, or problem..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e: any) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
          >
            <option value="all">All Sources ({allCases.length})</option>
            <option value="custom">Custom Cases Only ({customCases.length})</option>
            <option value="builtin">Built-In Catalog Only ({builtInCases.length})</option>
          </select>

          {/* Track Filter */}
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
          >
            <option value="all">All Domains / Tracks</option>
            {availableTracks.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 bg-stone-50 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
          >
            <option value="all">All Difficulties</option>
            <option value="novice">Novice (Mild Resistance)</option>
            <option value="intermediate">Intermediate (Guarded)</option>
            <option value="advanced">Advanced</option>
          </select>

          <button
            onClick={fetchCases}
            disabled={loading}
            className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Refresh case catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Case Studies List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-700" />
          <p className="text-xs text-stone-500">Loading clinical case studies and personas catalog...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <FileText className="w-8 h-8 mx-auto text-stone-300" />
          <h3 className="text-sm font-bold text-stone-800">No Case Studies Found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            No case vignettes match your current search or filter criteria. You can create a new case study or clear filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredCases.map((c) => {
            const isExpanded = expandedCaseId === c.id;
            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border transition-all ${
                  c.isCustom
                    ? 'border-teal-300/80 shadow-xs hover:border-teal-400'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-stone-900">{c.title}</span>

                      {/* Custom vs Built-in Badge */}
                      {c.isCustom ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-teal-100 text-teal-800 border border-teal-200 flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5 text-teal-600 mr-0.5" />
                          <span>Custom Published</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                          Built-In Standard
                        </span>
                      )}

                      {/* Track Badge */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 text-stone-700 uppercase">
                        {c.track}
                      </span>

                      {/* Difficulty Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                          c.difficulty === 'novice'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.difficulty}
                      </span>
                    </div>

                    {/* Client Persona Demographics */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                      <span className="font-semibold text-stone-800 flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>
                          {c.clientName}, {c.clientAge} ({c.clientPronouns})
                        </span>
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="italic">{c.clientRole}</span>
                    </div>

                    {/* Presenting Problem Summary */}
                    <p className="text-xs text-stone-700 leading-relaxed max-w-3xl pt-1">
                      <strong className="text-stone-800 font-semibold">Presenting Problem: </strong>
                      {c.presentingProblem}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center space-x-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Hide Persona Details' : 'View Persona Details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {c.isCustom ? (
                      <>
                        <button
                          onClick={() => populateFormWithCase(c, 'edit')}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                          title="Edit Custom Case & Persona"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCase(c.id, c.title)}
                          className="p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Custom Case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => populateFormWithCase(c, 'clone')}
                        className="px-2.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-teal-700 hover:bg-teal-50 transition-colors text-xs font-semibold flex items-center space-x-1"
                        title="Clone this standard case into a custom editable template"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Clone Template</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Persona In-Depth View */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/50 space-y-4 text-xs">
                    {/* Background Story */}
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200/70">
                      <span className="font-bold text-stone-800 uppercase tracking-wider block mb-1 text-[11px]">
                        Client Biographical & Psychological Context
                      </span>
                      <p className="text-stone-700 leading-relaxed whitespace-pre-line">{c.backgroundStory}</p>
                    </div>

                    {/* Counselor Intake Goal */}
                    <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/70 text-teal-950">
                      <span className="font-bold text-teal-900 uppercase tracking-wider block mb-1 text-[11px]">
                        Pedagogical Counselor Intake Goal
                      </span>
                      <p className="text-teal-900 leading-relaxed">{c.counselorIntakeGoal}</p>
                    </div>

                    {/* Behavioral Dynamics & Triggers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Positive Triggers */}
                      <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/70">
                        <span className="font-bold text-emerald-900 uppercase tracking-wider block mb-2 text-[11px]">
                          Positive Triggers (Softens Resistance)
                        </span>
                        <ul className="space-y-1 text-emerald-950 list-disc list-inside">
                          {c.positiveTriggers?.map((t, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {t}
                            </li>
                          )) || <li>Active listening and empathy.</li>}
                        </ul>
                      </div>

                      {/* Negative Triggers */}
                      <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/70">
                        <span className="font-bold text-amber-900 uppercase tracking-wider block mb-2 text-[11px]">
                          Negative Triggers (Triggers Defensiveness)
                        </span>
                        <ul className="space-y-1 text-amber-950 list-disc list-inside">
                          {c.negativeTriggers?.map((t, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {t}
                            </li>
                          )) || <li>Unsolicited advice and interrogative questions.</li>}
                        </ul>
                      </div>

                      {/* Somatic Tendencies */}
                      <div className="bg-stone-100/80 p-3.5 rounded-xl border border-stone-200/80">
                        <span className="font-bold text-stone-800 uppercase tracking-wider block mb-2 text-[11px]">
                          Non-Verbal Somatic Body Language
                        </span>
                        <ul className="space-y-1 text-stone-700 list-disc list-inside">
                          {c.somaticTendencies?.map((t, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {t}
                            </li>
                          )) || <li>Fidgets with hands, looks down when anxious.</li>}
                        </ul>
                      </div>
                    </div>

                    {/* Planted Referral Cue (if any) */}
                    {c.plantedReferralCue && c.plantedReferralCue.exists && (
                      <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/70 text-indigo-950">
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Shield className="w-3.5 h-3.5 text-indigo-700" />
                          <span className="font-bold text-indigo-900 uppercase tracking-wider text-[11px]">
                            Planted Out-of-Scope Referral Trigger ({c.plantedReferralCue.subtlety} cue)
                          </span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">
                          <strong>Condition: </strong> {c.plantedReferralCue.description}
                          <br />
                          <strong>Clinical Referral Path: </strong> {c.plantedReferralCue.properReferralPath}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CASE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between shrink-0 bg-stone-50 rounded-t-3xl">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {modalMode === 'edit'
                    ? 'Edit Case Study & Client Persona'
                    : modalMode === 'clone'
                    ? 'Clone Standard Case as Custom Persona'
                    : 'Create New Case Study & Simulated Client Persona'}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  This vignette will be saved to your local database and will immediately appear in the trainee portal.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAutoFillSample}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-100 text-teal-800 hover:bg-teal-200 transition-colors flex items-center space-x-1"
                  title="Auto-fill sample persona fields"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  <span>Sample Template</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveCase} className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* SECTION 1: CASE STUDY OVERVIEW */}
              <div className="space-y-3">
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] block border-b border-stone-100 pb-1">
                  1. Case Study Identification & Domain
                </span>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    Case Study Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Maya T. — Dropping Grades & Silent Withdrawal"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Domain Track</label>
                    <select
                      value={formTrack}
                      onChange={(e) => setFormTrack(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    >
                      <option value="school">School Counseling</option>
                      <option value="workplace">Workplace & Career Transitions</option>
                      <option value="cbt">CBT Thought Record Practice</option>
                      <option value="general">General Clinical & Mental Health</option>
                      <option value="custom">Custom Track / Domain...</option>
                    </select>
                    {formTrack === 'custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom track name (e.g., Geriatric, Addiction, Family)"
                        value={formCustomTrack}
                        onChange={(e) => setFormCustomTrack(e.target.value)}
                        className="w-full mt-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Difficulty Resistance</label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    >
                      <option value="novice">Novice (Mild Resistance, Softens Fast)</option>
                      <option value="intermediate">Intermediate (Guarded, Sensitive to Triggers)</option>
                      <option value="advanced">Advanced (Deep Defense & Ambivalence)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    Pedagogical Counselor Intake Goal <span className="text-stone-400 font-normal">(Evaluated by Supervisor)</span>
                  </label>
                  <input
                    type="text"
                    value={formIntakeGoal}
                    onChange={(e) => setFormIntakeGoal(e.target.value)}
                    placeholder="e.g., Establish psychological safety, validate academic burnout, avoid premature solutions"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>
              </div>

              {/* SECTION 2: CLIENT SIMULATION PERSONA */}
              <div className="space-y-3">
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] block border-b border-stone-100 pb-1">
                  2. Simulated Client Persona & Demographics
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">
                      Client Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formClientName}
                      onChange={(e) => setFormClientName(e.target.value)}
                      placeholder="e.g., Elena Rostova"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Age</label>
                    <input
                      type="number"
                      min={10}
                      max={99}
                      value={formClientAge}
                      onChange={(e) => setFormClientAge(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Pronouns</label>
                    <input
                      type="text"
                      value={formClientPronouns}
                      onChange={(e) => setFormClientPronouns(e.target.value)}
                      placeholder="she/her, he/him, they/them"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Client Role / Profession</label>
                  <input
                    type="text"
                    value={formClientRole}
                    onChange={(e) => setFormClientRole(e.target.value)}
                    placeholder="e.g., High School Junior, Tech Lead, Retired Nurse"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    Presenting Problem <span className="text-stone-400 font-normal">(Why they are in counseling)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formPresentingProblem}
                    onChange={(e) => setFormPresentingProblem(e.target.value)}
                    placeholder="Brief description of what prompted the referral or intake..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    Detailed Background & Internal Story <span className="text-stone-400 font-normal">(Grounds the simulated persona)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formBackgroundStory}
                    onChange={(e) => setFormBackgroundStory(e.target.value)}
                    placeholder="Describe their emotional history, fears, defense mechanisms, and what they secretly wish the counselor would understand..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs resize-none"
                  />
                </div>
              </div>

              {/* SECTION 3: CLINICAL DYNAMICS & TRIGGERS */}
              <div className="space-y-3">
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px] block border-b border-stone-100 pb-1">
                  3. Behavioral Triggers & Somatic Realism
                </span>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Baseline Resistance & Posture</label>
                  <input
                    type="text"
                    value={formBaselineResistance}
                    onChange={(e) => setFormBaselineResistance(e.target.value)}
                    placeholder="e.g., Crossed arms, guarded one-sentence replies, skeptical tone"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">
                      Positive Triggers <span className="text-stone-400 font-normal">(1 per line)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formPositiveTriggers}
                      onChange={(e) => setFormPositiveTriggers(e.target.value)}
                      placeholder="Reflecting exhaustion without problem-solving&#10;Acknowledging unfairness&#10;Open-ended questions about daily routine"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">
                      Negative Triggers <span className="text-stone-400 font-normal">(1 per line)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formNegativeTriggers}
                      onChange={(e) => setFormNegativeTriggers(e.target.value)}
                      placeholder="Unsolicited time management tips&#10;Accusatory 'why' questions&#10;Minimizing client pain"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    Somatic Non-Verbal Tendencies <span className="text-stone-400 font-normal">(1 per line)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formSomaticTendencies}
                    onChange={(e) => setFormSomaticTendencies(e.target.value)}
                    placeholder="*[Looks down at shoes and fidgets with jacket]*&#10;*[Takes a slow breath and drops shoulders]*"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-xs resize-none"
                  />
                </div>

                {/* Optional Referral Cue Toggle */}
                <div className="pt-2 border-t border-stone-100 space-y-2.5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formHasReferralCue}
                      onChange={(e) => setFormHasReferralCue(e.target.checked)}
                      className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-stone-800">
                      Plant Out-of-Scope Referral Cue (Advanced Clinical Training)
                    </span>
                  </label>

                  {formHasReferralCue && (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="font-medium text-stone-700 block mb-1">Subtlety</label>
                          <select
                            value={formReferralSubtlety}
                            onChange={(e) => setFormReferralSubtlety(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                          >
                            <option value="subtle">Subtle (Offhand remark)</option>
                            <option value="overt">Overt (Direct admission)</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-medium text-stone-700 block mb-1">Clinical Category</label>
                          <input
                            type="text"
                            placeholder="e.g., Eating Disorder, Medical Anomaly"
                            value={formReferralCategory}
                            onChange={(e) => setFormReferralCategory(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-medium text-stone-700 block mb-1">Condition Description</label>
                        <input
                          type="text"
                          placeholder="e.g., Severe caloric restriction and dizzy spells"
                          value={formReferralDesc}
                          onChange={(e) => setFormReferralDesc(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-stone-700 block mb-1">Proper Referral Destination</label>
                        <input
                          type="text"
                          placeholder="e.g., Adolescent Medicine Specialist / Pediatric Dietetics"
                          value={formReferralPath}
                          onChange={(e) => setFormReferralPath(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 font-semibold text-stone-600 hover:bg-stone-100 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 transition-colors text-xs shadow-xs"
                >
                  {modalMode === 'edit' ? 'Save Changes' : 'Publish Case Study'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-stone-900">Import Case Studies JSON</h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-stone-600 leading-relaxed">
              Found <strong className="text-teal-900 font-bold">{importJsonData?.length || 0}</strong> case vignettes in{' '}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">{importFileName}</code>.
            </p>

            <div className="space-y-2">
              <label className="font-bold text-stone-800 block">Import Mode:</label>
              <div className="space-y-1.5">
                <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="font-semibold text-stone-800 block">Merge with Existing Custom Cases</span>
                    <span className="text-[11px] text-stone-500">
                      Adds newly found cases without removing your existing custom library.
                    </span>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="font-semibold text-stone-800 block">Replace All Custom Cases</span>
                    <span className="text-[11px] text-stone-500">
                      Replaces existing custom cases with the items in this file. (Standard built-in cases are always preserved).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={handleExecuteImport}
                className="px-4 py-1.5 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Execute Import</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
