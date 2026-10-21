import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Compass,
  CornerDownLeft,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useSelectedPath } from '../../context/SelectedPathContext';
import { ChatMessage, ChatThread, ProposedAction } from '../../types';
import { MessageBubble } from '../../components/mentor/MessageBubble';
import { QuickActionChips } from '../../components/mentor/QuickActionChips';

export const MentorChat: React.FC = () => {
  const { selectedPath } = useSelectedPath();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Live streaming accumulator
  const [streamedText, setStreamedText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText]);

  // Load threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      setIsLoadingThreads(true);
      const data = await apiClient.mentor.listThreads();
      setThreads(data);
      if (data.length > 0 && !activeThreadId) {
        setActiveThreadId(data[0].id);
      } else if (data.length === 0) {
        // Automatically create initial thread
        handleCreateThread();
      }
    } catch (err: any) {
      console.error('Failed to load threads:', err);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  // Load messages when active thread changes
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeThreadId);
  }, [activeThreadId]);

  const fetchMessages = async (threadId: number) => {
    try {
      setIsLoadingMessages(true);
      setStreamError(null);
      const data = await apiClient.mentor.getMessages(threadId);
      setMessages(data);
    } catch (err: any) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleCreateThread = async () => {
    try {
      const newThread = await apiClient.mentor.createThread({
        title: selectedPath ? `${selectedPath.career_path.name} Mentoring` : 'New Conversation',
        career_path_id: selectedPath?.career_path.id,
      });
      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      setMessages([]);
    } catch (err: any) {
      console.error('Failed to create thread:', err);
    }
  };

  const handleDeleteThread = async (threadId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation thread?')) return;

    try {
      await apiClient.mentor.deleteThread(threadId);
      const remaining = threads.filter((t) => t.id !== threadId);
      setThreads(remaining);
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      console.error('Failed to delete thread:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeThreadId || isStreaming) return;

    setInputText('');
    setStreamError(null);
    setStreamedText('');

    // Optimistically append user message to UI
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      thread_id: activeThreadId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);

    let accumulatedText = '';
    let accumulatedActions: ProposedAction[] = [];

    await apiClient.mentor.streamMessage(activeThreadId, text, {
      onToken: (token: string) => {
        accumulatedText += token;
        setStreamedText(accumulatedText);
      },
      onAction: (actions: ProposedAction[]) => {
        accumulatedActions = [...accumulatedActions, ...actions];
      },
      onDone: (data: { message_id: number; actions: ProposedAction[] }) => {
        // Replace streaming bubble with finalized assistant message
        const finalAsstMsg: ChatMessage = {
          id: data.message_id,
          thread_id: activeThreadId,
          role: 'assistant',
          content: accumulatedText,
          proposed_actions: accumulatedActions.length > 0 ? accumulatedActions : data.actions,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, finalAsstMsg]);
        setStreamedText('');
        setIsStreaming(false);

        // Refresh thread titles/preview
        apiClient.mentor.listThreads().then((th: ChatThread[]) => setThreads(th));
      },
      onError: (err: string) => {
        setStreamError(err);
        setIsStreaming(false);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <div className="h-[calc(100vh-10rem)] min-h-[500px] flex flex-col md:flex-row bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
      {/* Left Sidebar: Threads */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-600" />
            <h2 className="text-sm font-bold text-gray-900">Mentor Threads</h2>
          </div>
          <button
            onClick={handleCreateThread}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-xs"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingThreads ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading threads...</div>
          ) : threads.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No conversations yet.</div>
          ) : (
            threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2 text-left ${
                    isActive
                      ? 'bg-white shadow-xs border border-primary-200 text-primary-950 font-semibold'
                      : 'hover:bg-gray-100/80 text-gray-700 border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                      <span className="text-xs truncate font-medium">{thread.title}</span>
                    </div>
                    {thread.last_message_preview && (
                      <p className="text-2xs text-gray-400 truncate mt-1">
                        {thread.last_message_preview}
                      </p>
                    )}
                    {thread.career_path_name && (
                      <div className="mt-1 flex items-center gap-1 text-3xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full w-fit">
                        <Compass className="w-2.5 h-2.5" />
                        <span>{thread.career_path_name}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteThread(thread.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 rounded transition-opacity"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {activeThread?.title || 'AI Placement Mentor'}
              </h3>
              <p className="text-2xs text-gray-500">
                Context-aware guidance for Indian engineering placements &bull; Powered by Gemini
              </p>
            </div>
          </div>

          {selectedPath && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>{selectedPath.career_path.name}</span>
            </div>
          )}
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2">
          {isLoadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">Ask Your Placement Mentor</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  I have analyzed your profile, active career roadmap, test results, and milestone streak. Ask me anything about preparing for campus drives, projects, or closing your biggest skill gaps.
                </p>
              </div>
              <QuickActionChips
                onSelectAction={(actionText) => handleSendMessage(actionText)}
                disabled={isStreaming}
              />
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  careerPathSlug={selectedPath?.career_path.slug}
                  onActionAdded={() => {
                    // Refresh if needed
                  }}
                />
              ))}

              {/* Streaming Bubble */}
              {isStreaming && (
                <div className="flex gap-3 my-4 flex-row text-left">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[75%] space-y-1">
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-2xs font-semibold text-gray-500">Placement Mentor</span>
                      <span className="text-3xs text-emerald-600 flex items-center gap-1 font-medium">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Thinking &amp; streaming...
                      </span>
                    </div>
                    <div className="rounded-2xl p-4 text-xs sm:text-sm leading-relaxed bg-white text-gray-800 border border-gray-200 rounded-tl-xs shadow-xs whitespace-pre-wrap break-words">
                      {streamedText || <span className="text-gray-400 italic">Formulating tailored advice...</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {streamError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{streamError}</span>
                  </div>
                  <button
                    onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 text-white text-2xs font-semibold hover:bg-red-700 transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar & Quick Actions */}
        <div className="p-4 border-t border-gray-200 bg-white space-y-2">
          {messages.length > 0 && (
            <QuickActionChips
              onSelectAction={(actionText) => handleSendMessage(actionText)}
              disabled={isStreaming}
            />
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={2}
              maxLength={1000}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? 'AI Mentor is responding...'
                  : 'Ask a question about your path, skill gaps, or placements (Press Enter to send)...'
              }
              className="w-full pl-3 pr-24 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none disabled:bg-gray-50"
            />
            <div className="absolute right-2.5 bottom-3.5 flex items-center gap-2">
              <span className="text-3xs text-gray-400 font-mono">
                {inputText.length}/1000
              </span>
              <button
                type="button"
                disabled={!inputText.trim() || isStreaming}
                onClick={() => handleSendMessage()}
                className="p-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors shadow-xs"
                title="Send message (Enter)"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CornerDownLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
