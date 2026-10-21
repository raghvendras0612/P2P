import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ProposedActionCard } from '../components/mentor/ProposedActionCard';
import { QuickActionChips } from '../components/mentor/QuickActionChips';
import { MessageBubble } from '../components/mentor/MessageBubble';
import { MentorChat } from '../pages/mentor/MentorChat';
import { apiClient } from '../api/client';
import { AuthProvider } from '../context/AuthContext';
import { SelectedPathProvider } from '../context/SelectedPathContext';
import { ProposedAction, ChatMessage } from '../types';

describe('AI Placement Mentor Frontend Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProposedActionCard and triggers confirmation to add to progress', async () => {
    const action: ProposedAction = {
      type: 'add_task',
      title: 'Master Graph BFS and DFS Patterns',
      description: 'Frequently tested in Tier-1 product placement rounds.',
    };

    const confirmSpy = vi.spyOn(apiClient.mentor, 'confirmAction').mockResolvedValue({
      status: 'created',
      message: "Successfully added 'Master Graph BFS and DFS Patterns' to your milestone checkpoint list.",
      item_id: 42,
    });

    const onAddedMock = vi.fn();

    render(
      <ProposedActionCard
        action={action}
        careerPathSlug="full-stack-developer"
        onAdded={onAddedMock}
      />
    );

    expect(screen.getByText('Actionable Task')).toBeInTheDocument();
    expect(screen.getByText('Master Graph BFS and DFS Patterns')).toBeInTheDocument();
    expect(
      screen.getByText('Frequently tested in Tier-1 product placement rounds.')
    ).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /Add to Progress/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalledWith({
        type: 'add_task',
        title: 'Master Graph BFS and DFS Patterns',
        description: 'Frequently tested in Tier-1 product placement rounds.',
        career_path_slug: 'full-stack-developer',
      });
      expect(onAddedMock).toHaveBeenCalled();
      expect(screen.getByText('Added')).toBeInTheDocument();
    });
  });

  it('renders QuickActionChips and invokes prompt on selection', () => {
    const onSelectActionMock = vi.fn();

    render(<QuickActionChips onSelectAction={onSelectActionMock} />);

    expect(screen.getByText('Explain my biggest skill gap')).toBeInTheDocument();
    expect(screen.getByText('What should I do this week?')).toBeInTheDocument();
    expect(screen.getByText('Review my progress')).toBeInTheDocument();
    expect(screen.getByText('Prepare me for placements in 3 months')).toBeInTheDocument();
    expect(screen.getByText('Why this path over the others?')).toBeInTheDocument();

    const chip = screen.getByText('What should I do this week?');
    fireEvent.click(chip);

    expect(onSelectActionMock).toHaveBeenCalledWith('What should I do this week?');
  });

  it('renders MessageBubble correctly for user and mentor roles', () => {
    const userMsg: ChatMessage = {
      id: 1,
      thread_id: 10,
      role: 'user',
      content: 'How do I prepare for Amazon SDE-1 OA?',
      created_at: new Date().toISOString(),
    };

    const { rerender } = render(<MessageBubble message={userMsg} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('How do I prepare for Amazon SDE-1 OA?')).toBeInTheDocument();

    const mentorMsg: ChatMessage = {
      id: 2,
      thread_id: 10,
      role: 'assistant',
      content: 'Focus on Top 50 LeetCode Medium questions and sliding window algorithms.',
      proposed_actions: [
        {
          type: 'add_task',
          title: 'Solve Sliding Window Maximum',
          description: 'Hard level problem asked frequently',
        },
      ],
      created_at: new Date().toISOString(),
    };

    rerender(<MessageBubble message={mentorMsg} />);
    expect(screen.getByText('Placement Mentor')).toBeInTheDocument();
    expect(
      screen.getByText(/Focus on Top 50 LeetCode Medium questions/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Solve Sliding Window Maximum')).toBeInTheDocument();
  });

  it('renders MentorChat workspace and sends a message', async () => {
    vi.spyOn(apiClient.auth, 'refresh').mockResolvedValue({ access_token: 'mock-token' } as any);
    vi.spyOn(apiClient.auth, 'me').mockResolvedValue({
      user: { id: 1, email: 'student@example.com', created_at: new Date().toISOString() },
      profile: { full_name: 'Aditya Sharma' },
      selected_path: null,
    } as any);

    vi.spyOn(apiClient.profile, 'getSelectedPath').mockResolvedValue({
      selected_path: null,
    });

    vi.spyOn(apiClient.mentor, 'listThreads').mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        title: 'Full Stack Mentoring',
        career_path_name: 'Full Stack Developer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 2,
        last_message_preview: 'Keep practicing DSA...',
      },
    ]);

    vi.spyOn(apiClient.mentor, 'getMessages').mockResolvedValue([
      {
        id: 1,
        thread_id: 1,
        role: 'user',
        content: 'Should I learn Next.js or React first?',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        thread_id: 1,
        role: 'assistant',
        content: 'Start with React fundamentals before moving to Next.js SSR.',
        created_at: new Date().toISOString(),
      },
    ]);

    render(
      <BrowserRouter>
        <AuthProvider>
          <SelectedPathProvider>
            <MentorChat />
          </SelectedPathProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Full Stack Mentoring')[0]).toBeInTheDocument();
      expect(screen.getByText('Should I learn Next.js or React first?')).toBeInTheDocument();
      expect(
        screen.getByText('Start with React fundamentals before moving to Next.js SSR.')
      ).toBeInTheDocument();
    });
  });
});
