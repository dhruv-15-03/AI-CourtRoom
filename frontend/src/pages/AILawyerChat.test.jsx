import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AILawyerChat from "./AILawyerChat";
import { agentService } from "../services/api";

jest.mock("../services/api", () => ({
  agentService: { stream: jest.fn() },
  feedbackService: { submit: jest.fn(() => Promise.resolve()) },
}));

describe("AILawyerChat citation trust state", () => {
  let streamHandlers;

  beforeEach(() => {
    streamHandlers = null;
    agentService.stream.mockImplementation((_params, handlers) => {
      streamHandlers = handlers;
      return jest.fn();
    });
    Element.prototype.scrollIntoView = jest.fn();
    localStorage.clear();
  });

  const submitQuestion = async () => {
    const user = userEvent.setup();
    render(<AILawyerChat />);
    await user.type(
      screen.getByPlaceholderText(/ask a legal question/i),
      "Explain the right to personal liberty"
    );
    await user.click(screen.getByRole("button", { name: /send/i }));
  };

  test("warns when the citation contract marks an answer as ungrounded", async () => {
    await submitQuestion();

    act(() => {
      streamHandlers.onCitations({
        cases: [{ title: "Maneka Gandhi v. Union of India", outcome: "Allowed" }],
        statutes_excerpt: "Article 21 protects life and personal liberty.",
        grounded: false,
        unverified_citations: ["Invented Authority v. State"],
      });
      streamHandlers.onToken({ text: "Personal liberty receives broad protection." });
    });

    expect(screen.getByText(/Maneka Gandhi v\. Union of India/)).toBeInTheDocument();
    expect(
      screen.getByRole("alert", { name: "Citation grounding warning" })
    ).toHaveTextContent(
      "Grounding check failed. Verify before relying on: Invented Authority v. State"
    );
  });

  test("shows verified grounding only when the completed stream explicitly confirms it", async () => {
    await submitQuestion();

    act(() => {
      streamHandlers.onCitations({
        cases: [{ title: "Maneka Gandhi v. Union of India" }],
        statutes_excerpt: "Article 21",
      });
      streamHandlers.onToken({ text: "The cited authority supports this answer." });
    });

    expect(
      screen.queryByRole("status", { name: "Citation grounding verified" })
    ).not.toBeInTheDocument();

    act(() => {
      streamHandlers.onDone({
        model: "test-model",
        provider: "test-provider",
        elapsed_seconds: 0.1,
        citation_count: 1,
        session_id: "session-123",
        grounded: true,
        unverified_citations: [],
      });
    });

    expect(
      screen.getByRole("status", { name: "Citation grounding verified" })
    ).toHaveTextContent(
      "Grounding check passed. Cited authorities matched the retrieved sources."
    );
    expect(
      screen.queryByRole("alert", { name: "Citation grounding warning" })
    ).not.toBeInTheDocument();
  });
});
