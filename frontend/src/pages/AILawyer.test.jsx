import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AILawyer from './AILawyer';
import { agentService } from '../services/api';

// The page pulls in the whole agent surface; only the mount probe matters here.
jest.mock('../services/api', () => ({
  agentService: {
    getDocumentTypes: jest.fn(),
    analyze: jest.fn(),
    analyzeWithDocs: jest.fn(),
    chat: jest.fn(),
    uploadDocuments: jest.fn(),
    generateDocument: jest.fn(),
  },
}));

/** Mirrors what the backend actually returns when the Python agent is unreachable. */
const outage = () =>
  Object.assign(new Error('Request failed with status code 503'), {
    response: { status: 503, data: { error: 'service_unavailable' } },
  });

const ok = () => ({
  data: { document_types: [{ id: 'bail_application', title: 'Bail Application' }] },
});

// This page is large and MUI-heavy, so each render is expensive. Assertions are
// grouped per render on purpose rather than split across extra mounts.
describe('AILawyer — agent-service outage handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('surfaces a calm notice, hides the raw error code, and does not self-retry', async () => {
    agentService.getDocumentTypes.mockRejectedValue(outage());

    render(<AILawyer />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/temporarily unavailable/i);
    expect(alert).toHaveTextContent(/try again in a few minutes/i);

    // The machine-readable payload must never reach the user.
    expect(screen.queryByText(/service_unavailable/)).not.toBeInTheDocument();

    // One probe on mount, and nothing further without user intent.
    expect(agentService.getDocumentTypes).toHaveBeenCalledTimes(1);
  });

  it('retries when the user clicks Retry, and clears the notice on success', async () => {
    agentService.getDocumentTypes
      .mockRejectedValueOnce(outage())
      .mockResolvedValueOnce(ok());

    render(<AILawyer />);
    await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
    expect(agentService.getDocumentTypes).toHaveBeenCalledTimes(2);
  });

  it('shows no outage notice when the service is healthy', async () => {
    agentService.getDocumentTypes.mockResolvedValue(ok());

    render(<AILawyer />);

    await waitFor(() => expect(agentService.getDocumentTypes).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
