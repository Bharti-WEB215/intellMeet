import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { GlassCard } from '../components/GlassCard';
import { 
  Hash, FileText, Plus, Clock, Download, 
  Save, Activity, Paperclip 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TeamWorkspace: React.FC = () => {
  const {
    workspaceChannels,
    workspaceActiveChannelId,
    setWorkspaceActiveChannelId,
    workspaceDocuments,
    workspaceActiveDocumentId,
    setWorkspaceActiveDocumentId,
    addWorkspaceDocument,
    workspaceFiles,
    addWorkspaceFile,
    workspaceActivities
  } = useStore();

  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Active items
  const activeDoc = workspaceDocuments.find(d => d.id === workspaceActiveDocumentId) || workspaceDocuments[0];

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    addWorkspaceDocument(newDocTitle, newDocContent || 'Start writing here...');
    setNewDocTitle('');
    setNewDocContent('');
    setIsCreatingDoc(false);
  };

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    addWorkspaceFile(newFileName, '250 KB', 'DOC');
    setNewFileName('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full text-[var(--theme-text)] min-h-[calc(100vh-140px)]">
      
      {/* 1. LEFT PANEL: Slack Channels & Workspace List (col-span-3) */}
      <div className="w-full lg:w-60 flex flex-col space-y-4 flex-shrink-0">
        <GlassCard className="border-[var(--theme-border)] p-4 flex flex-col justify-between h-full space-y-6">
          <div className="space-y-6">
            
            {/* Header section */}
            <div>
              <span className="text-[9px] text-[var(--theme-text-muted)] font-mono tracking-wider block">TEAM COLLABORATION</span>
              <h2 className="text-sm font-black text-[var(--theme-text)] mt-0.5">IntellMeet Workspace</h2>
            </div>

            {/* Slack Channels */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
                <span>Channels</span>
                <span className="text-[9px] text-[var(--theme-text-muted)] font-mono">Slack Feed</span>
              </div>
              <div className="space-y-1">
                {workspaceChannels.map(ch => {
                  const isActive = ch.id === workspaceActiveChannelId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setWorkspaceActiveChannelId(ch.id)}
                      className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-primary/20 text-primary border border-primary/25' 
                          : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)]'
                      }`}
                    >
                      <Hash className="w-4.5 h-4.5 flex-shrink-0 text-[var(--theme-text-muted)]" />
                      <span className="truncate">{ch.name}</span>
                      {ch.unread && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent ml-auto flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notion Documents */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">
                <span>Notion Pages</span>
                <button 
                  onClick={() => setIsCreatingDoc(true)}
                  className="text-primary hover:text-primary-hover flex items-center gap-0.5"
                  title="New Document"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {workspaceDocuments.map(doc => {
                  const isActive = doc.id === workspaceActiveDocumentId;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setWorkspaceActiveDocumentId(doc.id);
                        setIsCreatingDoc(false);
                      }}
                      className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                        isActive && !isCreatingDoc
                          ? 'bg-secondary/20 text-secondary border border-secondary/25' 
                          : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-surface-hover)]'
                      }`}
                    >
                      <FileText className="w-4.5 h-4.5 flex-shrink-0 text-[var(--theme-text-muted)]" />
                      <span className="truncate">{doc.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Active presence roster */}
          <div className="pt-4 border-t border-[var(--theme-divider)] space-y-2">
            <span className="text-[9px] text-[var(--theme-text-muted)] font-mono tracking-wider block">ACTIVE NOW</span>
            <div className="flex -space-x-1.5 items-center">
              <div className="relative">
                <img className="w-6 h-6 rounded-full object-cover border border-[var(--theme-surface)]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60" alt="Sarah" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[var(--theme-surface)]" />
              </div>
              <div className="relative">
                <img className="w-6 h-6 rounded-full object-cover border border-[var(--theme-surface)]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60" alt="Alex" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[var(--theme-surface)]" />
              </div>
              <div className="relative">
                <img className="w-6 h-6 rounded-full object-cover border border-[var(--theme-surface)]" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60" alt="Elena" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[var(--theme-surface)]" />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 2. CENTER PANEL: Notion-style Document Workspace (col-span-6) */}
      <div className="flex-1 flex flex-col space-y-4">
        
        <GlassCard className="border-[var(--theme-border)] p-6 flex-1 flex flex-col justify-between space-y-6">
          <AnimatePresence mode="wait">
            
            {/* Create new document form layout */}
            {isCreatingDoc ? (
              <motion.div
                key="create-doc"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 flex-1 flex flex-col justify-between"
              >
                <form onSubmit={handleCreateDocument} className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Document Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Marketing Campaign Deliverables"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="w-full bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-sm text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-secondary/40 transition-colors font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 flex flex-col">
                    <label className="text-[10px] font-bold text-[var(--theme-text-secondary)] uppercase tracking-wider">Content Canvas</label>
                    <textarea
                      placeholder="Write markdown content, agendas, or checklist blocks..."
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      rows={12}
                      className="w-full flex-1 bg-[var(--theme-input-bg)] border border-[var(--theme-border)] rounded-xl px-4 py-3 text-xs text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none focus:border-secondary/40 transition-colors font-mono resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingDoc(false)}
                      className="px-4 py-2 border border-[var(--theme-border)] rounded-xl text-xs font-semibold hover:bg-[var(--theme-surface-hover)] transition-colors cursor-pointer text-[var(--theme-text-secondary)]"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-secondary text-slate-950 rounded-xl font-bold text-xs hover:bg-secondary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Save className="w-4 h-4" /> Save Document
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* Display selected document */
              <motion.div
                key={activeDoc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 flex-1 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Title & metadata bar */}
                  <div className="flex justify-between items-start border-b border-[var(--theme-divider)] pb-4">
                    <div>
                      <h1 className="text-2xl font-black text-[var(--theme-text)] leading-tight">{activeDoc.title}</h1>
                      <p className="text-[10px] text-[var(--theme-text-muted)] mt-1 flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5" /> Updated {activeDoc.lastUpdated} by {activeDoc.author}
                      </p>
                    </div>
                  </div>

                  {/* Notion block-editor simulator */}
                  <div className="text-xs text-[var(--theme-text)] leading-relaxed font-sans space-y-4 overflow-y-auto max-h-[350px] pr-1">
                    {activeDoc.content.split('\n').map((line, idx) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={idx} className="text-lg font-black text-[var(--theme-text)] mt-6 mb-2 border-b border-[var(--theme-divider)] pb-1">{line.replace('## ', '')}</h2>;
                      }
                      if (line.startsWith('### ')) {
                        return <h3 key={idx} className="text-sm font-bold text-[var(--theme-text)] mt-4 mb-1">{line.replace('### ', '')}</h3>;
                      }
                      if (line.startsWith('- [x] ')) {
                        return (
                          <div key={idx} className="flex items-center space-x-2 text-[var(--theme-text-secondary)] line-through">
                            <input type="checkbox" checked readOnly className="rounded border-slate-600 bg-[var(--theme-bg)] text-accent focus:ring-accent" />
                            <span>{line.replace('- [x] ', '')}</span>
                          </div>
                        );
                      }
                      if (line.startsWith('- [ ] ')) {
                        return (
                          <div key={idx} className="flex items-center space-x-2">
                            <input type="checkbox" readOnly className="rounded border-slate-600 bg-[var(--theme-bg)] focus:ring-primary" />
                            <span>{line.replace('- [ ] ', '')}</span>
                          </div>
                        );
                      }
                      if (line.startsWith('- ')) {
                        return (
                          <ul key={idx} className="list-disc pl-5 my-1 space-y-1">
                            <li>{line.replace('- ', '')}</li>
                          </ul>
                        );
                      }
                      return <p key={idx} className="my-2">{line}</p>;
                    })}
                  </div>
                </div>

                {/* Notion styled divider advice footer */}
                <div className="border-t border-[var(--theme-divider)] pt-4 bg-[var(--theme-surface-alt)] -mx-6 -mb-6 p-4 px-6 flex justify-between items-center text-[10px] text-[var(--theme-text-secondary)]">
                  <span>Currently viewing: {activeDoc.title}</span>
                  <span className="text-[var(--theme-text-muted)]">Notion Workspace v2.0</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </GlassCard>

      </div>

      {/* 3. RIGHT PANEL: Uploaded Files & Active Activity Feed (col-span-3) */}
      <div className="w-full lg:w-64 flex flex-col space-y-4 flex-shrink-0">
        
        {/* Uploaded files section */}
        <GlassCard className="border-[var(--theme-border)] p-4 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[var(--theme-divider)]">
            <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-secondary" /> Active Assets
            </h3>
            <span className="text-[10px] bg-[var(--theme-surface-alt)] px-2 py-0.5 rounded font-mono font-bold text-[var(--theme-text-secondary)]">{workspaceFiles.length} files</span>
          </div>

          {/* Files List */}
          <div className="space-y-3">
            {workspaceFiles.map(f => (
              <div key={f.id} className="flex items-center justify-between bg-[var(--theme-input-bg)] border border-[var(--theme-divider)] p-2 rounded-xl">
                <div className="flex items-center space-x-2.5 truncate max-w-[140px]">
                  <FileText className="w-4 h-4 text-[var(--theme-text-secondary)] flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-xs font-bold text-[var(--theme-text)] truncate block">{f.name}</span>
                    <span className="text-[9px] text-[var(--theme-text-muted)] font-mono">{f.size} • {f.type}</span>
                  </div>
                </div>
                <button 
                  onClick={() => alert(`Downloading ${f.name} mockup...`)}
                  className="p-1 hover:bg-[var(--theme-surface-hover)] rounded-lg text-[var(--theme-text-muted)] hover:text-secondary transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload input form */}
          <form onSubmit={handleUploadFile} className="flex gap-1.5 pt-2 border-t border-[var(--theme-divider)]">
            <input 
              type="text" 
              placeholder="asset-name.sketch" 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 bg-[var(--theme-bg)] border border-[var(--theme-border)] rounded-lg px-2 py-1.5 text-[10px] text-[var(--theme-text)] placeholder-[var(--theme-text-muted)] focus:outline-none"
            />
            <button 
              type="submit" 
              className="bg-secondary text-slate-950 font-bold text-[10px] px-2.5 rounded-lg hover:bg-secondary/90 cursor-pointer"
            >
              Upload
            </button>
          </form>
        </GlassCard>

        {/* Activity feed ticker */}
        <GlassCard className="border-[var(--theme-border)] p-4 space-y-4 flex-1">
          <div className="flex justify-between items-center pb-2 border-b border-[var(--theme-divider)]">
            <h3 className="text-xs font-bold text-[var(--theme-text-secondary)] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary animate-pulse" /> Workspace Activities
            </h3>
          </div>

          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
            {workspaceActivities.map(act => (
              <div key={act.id} className="flex items-start space-x-2">
                <img className="w-5.5 h-5.5 rounded-full object-cover border border-[var(--theme-border)] mt-0.5" src={act.avatar} alt="avatar" />
                <div>
                  <p className="text-[10px] text-[var(--theme-text)] leading-tight">
                    <span className="font-bold text-[var(--theme-text)]">{act.user}</span> {act.action}
                  </p>
                  <span className="text-[8px] text-[var(--theme-text-muted)] font-mono mt-0.5 block">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

    </div>
  );
};
export default TeamWorkspace;
