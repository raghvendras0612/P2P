import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Step1Account } from '../pages/onboarding/steps/Step1Account';
import { Step2Basics } from '../pages/onboarding/steps/Step2Basics';
import { OnboardingDraft } from '../types';

const mockDraft: OnboardingDraft = {
  step: 1,
  account: { email: '', password: '', confirmPassword: '' },
  basics: {
    full_name: '',
    phone: '',
    college: '',
    branch: '',
    year_of_study: 3,
    expected_graduation_year: 2026,
    cgpa: 8.0,
    city: '',
    state: 'Karnataka',
  },
  education: [],
  skills: [],
  interest_ids: [],
  projects: [],
  experiences: [],
  links: {
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    career_goal_text: '',
    preferred_work_style: 'Hybrid',
  },
};

describe('Onboarding Wizard Step 1: Account Validation', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const setError = vi.fn();
    const onNext = vi.fn();
    const draft = {
      ...mockDraft,
      account: { email: 'student@example.com', password: '123', confirmPassword: '123' },
    };

    render(
      <Step1Account
        draft={draft}
        updateDraft={vi.fn()}
        onNext={onNext}
        setError={setError}
      />
    );

    const submitBtn = screen.getByText(/Next: Academic Basics/i);
    fireEvent.click(submitBtn);

    expect(setError).toHaveBeenCalledWith('Password must be at least 8 characters long.');
    expect(onNext).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', () => {
    const setError = vi.fn();
    const onNext = vi.fn();
    const draft = {
      ...mockDraft,
      account: {
        email: 'student@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      },
    };

    render(
      <Step1Account
        draft={draft}
        updateDraft={vi.fn()}
        onNext={onNext}
        setError={setError}
      />
    );

    const submitBtn = screen.getByText(/Next: Academic Basics/i);
    fireEvent.click(submitBtn);

    expect(setError).toHaveBeenCalledWith('Passwords do not match.');
    expect(onNext).not.toHaveBeenCalled();
  });

  it('allows valid email and matching passwords to proceed', () => {
    const setError = vi.fn();
    const onNext = vi.fn();
    const draft = {
      ...mockDraft,
      account: {
        email: 'student@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
    };

    render(
      <Step1Account
        draft={draft}
        updateDraft={vi.fn()}
        onNext={onNext}
        setError={setError}
      />
    );

    const submitBtn = screen.getByText(/Next: Academic Basics/i);
    fireEvent.click(submitBtn);

    expect(onNext).toHaveBeenCalled();
  });
});

describe('Onboarding Wizard Step 2: Basics Validation', () => {
  it('enforces Indian 10-digit mobile number format', () => {
    const setError = vi.fn();
    const onNext = vi.fn();
    const draft = {
      ...mockDraft,
      basics: {
        ...mockDraft.basics,
        full_name: 'Rahul Sharma',
        phone: '1234567890', // Starts with 1, invalid in India (must be 6-9)
        college: 'NIT',
        branch: 'CSE',
        cgpa: 8.5,
        city: 'Bengaluru',
        state: 'Karnataka',
      },
    };

    render(
      <Step2Basics
        draft={draft}
        updateDraft={vi.fn()}
        onNext={onNext}
        onBack={vi.fn()}
        setError={setError}
      />
    );

    const submitBtn = screen.getByText(/Next: Education History/i);
    fireEvent.click(submitBtn);

    expect(setError).toHaveBeenCalledWith(
      expect.stringContaining('10-digit Indian mobile number')
    );
    expect(onNext).not.toHaveBeenCalled();
  });

  it('accepts valid 10-digit Indian mobile number (e.g. 9876543210)', () => {
    const setError = vi.fn();
    const onNext = vi.fn();
    const draft = {
      ...mockDraft,
      basics: {
        ...mockDraft.basics,
        full_name: 'Rahul Sharma',
        phone: '9876543210',
        college: 'NIT',
        branch: 'CSE',
        cgpa: 8.5,
        city: 'Bengaluru',
        state: 'Karnataka',
      },
    };

    render(
      <Step2Basics
        draft={draft}
        updateDraft={vi.fn()}
        onNext={onNext}
        onBack={vi.fn()}
        setError={setError}
      />
    );

    const submitBtn = screen.getByText(/Next: Education History/i);
    fireEvent.click(submitBtn);

    expect(onNext).toHaveBeenCalled();
  });

  it('rejects CGPA greater than 10.0', () => {
    const setError = vi.fn();
    const onNext = vi.fn();
    const draft = {
      ...mockDraft,
      basics: {
        ...mockDraft.basics,
        full_name: 'Rahul Sharma',
        phone: '9876543210',
        college: 'NIT',
        branch: 'CSE',
        cgpa: 11.5,
        city: 'Bengaluru',
        state: 'Karnataka',
      },
    };

    render(
      <Step2Basics
        draft={draft}
        updateDraft={vi.fn()}
        onNext={onNext}
        onBack={vi.fn()}
        setError={setError}
      />
    );

    const submitBtn = screen.getByText(/Next: Education History/i);
    fireEvent.click(submitBtn);

    expect(setError).toHaveBeenCalledWith('CGPA must be between 0.00 and 10.00 on a 10-point scale.');
    expect(onNext).not.toHaveBeenCalled();
  });
});
