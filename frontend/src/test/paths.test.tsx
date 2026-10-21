import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { api } from '../api/client';
import { AuthProvider } from '../context/AuthContext';
import { SelectedPathProvider } from '../context/SelectedPathContext';
import { MyPaths } from '../pages/MyPaths';

vi.mock('../api/client', () => ({
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn().mockReturnValue('mock-token'),
  api: {
    auth: {
      me: vi.fn().mockResolvedValue({
        user: { id: 1, email: 'test@example.com' },
        profile: { full_name: 'Test Student', year_of_study: 3 },
        selected_path: null,
      }),
      refresh: vi.fn().mockResolvedValue({ access_token: 'mock-token' }),
    },
    profile: {
      getSelectedPath: vi.fn().mockResolvedValue({ selected_path: null }),
      setSelectedPath: vi.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        career_path: { id: 1, slug: 'full-stack-developer', name: 'Full Stack Developer', description: '' },
        is_active: true,
      }),
      clearSelectedPath: vi.fn().mockResolvedValue({ message: 'cleared' }),
    },
    simulations: {
      getHistory: vi.fn().mockResolvedValue([]),
      getDetail: vi.fn(),
      create: vi.fn(),
      getJobStatus: vi.fn(),
      resimulate: vi.fn(),
      regeneratePath: vi.fn(),
    },
  },
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <SelectedPathProvider>{ui}</SelectedPathProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('MyPaths Component', () => {
  it('renders empty state when no simulation history exists', async () => {
    renderWithProviders(<MyPaths />);
    await waitFor(() => {
      expect(screen.getByText('No Career Simulation Generated Yet')).toBeInTheDocument();
    });
    expect(screen.getByText('Run New Simulation')).toBeInTheDocument();
  });

  it('triggers simulation creation and shows polling state', async () => {
    vi.mocked(api.simulations.create).mockResolvedValue({
      job_id: 'test-job-123',
      status: 'queued',
    });

    renderWithProviders(<MyPaths />);
    await waitFor(() => {
      expect(screen.getByText('No Career Simulation Generated Yet')).toBeInTheDocument();
    });

    const runButton = screen.getAllByRole('button', { name: /run new simulation/i })[0];
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(api.simulations.create).toHaveBeenCalledWith({ mode: 'auto' });
    });
  });

  it('toggles to custom mode and displays path chips', async () => {
    renderWithProviders(<MyPaths />);
    await waitFor(() => {
      expect(screen.getByText('Custom Target Selection')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Custom Target Selection'));

    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
    expect(screen.getByText('Data Engineer')).toBeInTheDocument();
    expect(screen.getByText('AI / ML Engineer')).toBeInTheDocument();
  });
});
