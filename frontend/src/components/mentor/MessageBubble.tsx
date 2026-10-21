import React from 'react';
import { Bot, User as UserIcon } from 'lucide-react';
import { ChatMessage, ProposedAction } from '../../types';
import { ProposedActionCard } from './ProposedActionCard';

interface MessageBubbleProps {
  message: ChatMessage;
  careerPathSlug?: string;
  onActionAdded?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  careerPathSlug,
  onActionAdded,
}) => {
  const isUser = message.role === 'user';

  // Helper to format content and strip raw [PROPOSED_ACTION: ...] tags from prose view
  const cleanContent = message.content
    .replace(/\[PROPOSED_ACTION:\s*\{.*?\}\s*\]/gs, '')
    .trim();

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
          isUser
            ? 'bg-primary-600 shadow-xs'
            : 'bg-emerald-600 shadow-xs'
        }`}
      >
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isUser ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-2xs font-semibold text-gray-500">
            {isUser ? 'You' : 'Placement Mentor'}
          </span>
          {formattedTime && (
            <span className="text-3xs text-gray-400">&bull; {formattedTime}</span>
          )}
        </div>

        <div
          className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-primary-600 text-white rounded-tr-xs shadow-xs'
              : 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs shadow-xs'
          }`}
        >
          {cleanContent}
        </div>

        {/* Proposed Action Cards */}
        {message.proposed_actions && message.proposed_actions.length > 0 && (
          <div className="space-y-2 pt-1 text-left">
            {message.proposed_actions.map((act: ProposedAction, i: number) => (
              <ProposedActionCard
                key={i}
                action={act}
                careerPathSlug={careerPathSlug}
                onAdded={onActionAdded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
