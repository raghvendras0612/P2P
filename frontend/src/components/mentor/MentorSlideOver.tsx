import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  Bot,
  Compass,
  CornerDownLeft,
  ExternalLink,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useSelectedPath } from '../../context/SelectedPathContext';
import { ChatMessage, ProposedAction } from '../../types';
import { MessageBubble } from './MessageBubble';
import { QuickActionChips } from './QuickActionChips';

export const MentorSlideOver: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedPath } = useSelectedPath();
  const location = useLocation();

  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const [streamedText, setStreamedText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If already on the dedicated /mentor page, don't show the slide-over floating launcher
  const isDedicatedMentorPage = location.pathname === '/mentor';

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, streamedText, isOpen]);

  // Load threads when opened
  useEffect(() => {
    if (!isOpen) return;

    const initThreads = async () => {
      try {
        const data = await apiClient.mentor.listThreads();
        if (data.length > 0) {
          setActiveThreadId(data[0].id);
        } else {
          // Create initial thread
          const created = await apiClient.mentor.createThread({
            title: selectedPath ? `${selectedPath.career_path.name} Mentoring` : 'New Conversation',
            career_path_id: selectedPath?.career_path.id,
          });
          setActiveThreadId(created.id);
        }
      } catch (err) {
        console.error('Failed to init mentor threads:', err);
      }
    };

    initThreads();
  }, [isOpen, selectedPath]);

  // Fetch messages when active thread changes
  useEffect(() => {
    if (!activeThreadId || !isOpen) return;

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const data = await apiClient.mentor.getMessages(activeThreadId);
        setMessages(data);
      } catch (err) {
        console.error('Failed to load thread messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeThreadId, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeThreadId || isStreaming) return;

    setInputText('');
    setStreamError(null);
    setStreamedText('');

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

  if (isDedicatedMentorPage) {
    return null;
  }

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-primary-600 text-white font-semibold shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
          aria-label="Open AI Placement Mentor"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span className="text-sm">Ask AI Mentor</span>
        </button>
      )}

      {/* Slide-Over Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-2xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-Over Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Placement Mentor</h3>
              {selectedPath && (
                <div className="flex items-center gap-1 text-3xs text-emerald-700 font-semibold">
                  <Compass className="w-2.5 h-2.5" />
                  <span>{selectedPath.career_path.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to="/mentor"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors text-xs flex items-center gap-1"
              title="Open full chat screen"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {isLoadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Ask Your Placement Mentor</h4>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                Need guidance while reviewing your resume, skill gaps, or test scores? Ask any question.
              </p>
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
                  onActionAdded={() => {}}
                />
              ))}

              {isStreaming && (
                <div className="flex gap-2.5 my-3 flex-row text-left">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-emerald-600 text-white shadow-xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="max-w-[85%] space-y-1">
                    <div className="flex items-center gap-1 text-2xs text-emerald-600 font-medium">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span>Thinking &amp; streaming...</span>
                    </div>
                    <div className="rounded-2xl p-3 text-xs leading-relaxed bg-white text-gray-800 border border-gray-200 rounded-tl-xs shadow-xs whitespace-pre-wrap break-words">
                      {streamedText || <span className="text-gray-400 italic">Thinking...</span>}
                    </div>
                  </div>
                </div>
              )}

              {streamError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{streamError}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-gray-200 bg-white space-y-2">
          {messages.length > 0 && (
            <QuickActionChips
              onSelectAction={(actionText) => handleSendMessage(actionText)}
              disabled={isStreaming}
            />
          )}

          <div className="relative">
            <textarea
              rows={2}
              maxLength={1000}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder="Ask anything (Enter to send)..."
              className="w-full pl-3 pr-20 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none disabled:bg-gray-50"
            />
            <div className="absolute right-2 bottom-3 flex items-center gap-1.5">
              <span className="text-3xs text-gray-400 font-mono">
                {inputText.length}/1000
              </span>
              <button
                type="button"
                disabled={!inputText.trim() || isStreaming}
                onClick={() => handleSendMessage()}
                className="p-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 transition-colors shadow-xs"
                title="Send"
              >
                {isStreaming ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CornerDownLeft className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
