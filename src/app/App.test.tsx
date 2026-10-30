import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createInitialState } from '../domain/model';
import { IndexedDbWorkspace, type WorkspaceRepository } from '../adapters/storage/indexedDb';

describe('dashboard feedback', () => {
  it('shows loading and a recoverable storage error without pretending to save', async () => {
    let rejectLoad: (reason: Error) => void = () => undefined;
    const repository: WorkspaceRepository = { load: () => new Promise((_, reject) => { rejectLoad = reject; }), dispatch: vi.fn(), close: vi.fn() };
    render(<App repository={repository} />);
    expect(screen.getByText('Loading workspace…')).toBeInTheDocument();
    rejectLoad(new Error('Unavailable'));
    expect(await screen.findByRole('alert')).toHaveTextContent('has not been reset');
    expect(screen.getByRole('button', { name: 'Retry storage' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Add task' })).not.toBeInTheDocument();
  });
  it('retains draft text and the saved snapshot when a task write fails', async () => {
    const state = createInitialState(new Date());
    const repository: WorkspaceRepository = { load: async () => state, dispatch: async (command) => { if (command.type === 'create') throw new Error('Quota'); return state; }, close: vi.fn() };
    render(<App repository={repository} />);
    const input = await screen.findByLabelText('Task title');
    await userEvent.type(input, 'Do not lose this draft');
    await userEvent.click(screen.getByRole('button', { name: 'Add task' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not saved');
    expect(input).toHaveValue('Do not lose this draft');
    expect(screen.queryByRole('button', { name: 'Do not lose this draft' })).not.toBeInTheDocument();
  });
  it('simulates Join and lets optional satire be disabled independently of functional copy', async () => {
    const repo = new IndexedDbWorkspace(crypto.randomUUID());
    render(<App repository={repo} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Preview audio options for Team check-in' }));
    expect(screen.getByText('Meeting preview only. Connect Outlook to open your meetings.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Optional satirical copy/ }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Optional satirical copy/ })).not.toBeChecked());
    await userEvent.click(screen.getByRole('button', { name: 'About CAi' }));
    expect(screen.queryByText('CORPORATE PROPAGANDA · SATIRE')).not.toBeInTheDocument();
    expect(screen.getByText(/Outlook is not connected yet/)).toBeInTheDocument();
    await repo.close();
  });
});
