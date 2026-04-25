import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Link,
  Alert,
  alpha,
} from "@mui/material";
import { Send, Stop, Gavel, AutoAwesome, MenuBook, ThumbUp, ThumbDown } from "@mui/icons-material";
import { agentService } from "../services/api";

const LEGAL_DISCLAIMER =
  "This AI assistant provides legal research support only — it does NOT constitute legal advice. " +
  "No attorney-client relationship is created. Always consult a qualified lawyer before acting on AI-generated analysis.";

/**
 * AILawyerChat — streaming legal consultation with the AI agent.
 *
 * Flow per message:
 *   1. User submits question.
 *   2. Frontend opens an SSE stream to /api/agent/stream.
 *   3. Status events update the progress indicator (understanding → law search → case search → generating).
 *   4. Citations arrive before tokens, so we render source chips above the answer.
 *   5. Tokens are appended to the current assistant message as they arrive.
 *   6. On `done`, the message is finalized and stored in local history.
 */
export default function AILawyerChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // [{role, text, citations?}]
  const [status, setStatus] = useState(null); // {step, message}
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => () => abortRef.current?.(), []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || isStreaming) return;

    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: query },
      { role: "assistant", text: "", citations: null, pending: true },
    ]);
    setIsStreaming(true);
    setStatus({ step: "starting", message: "Connecting…" });

    abortRef.current = agentService.stream(
      { query, sessionId, kCases: 5, kStatutes: 5 },
      {
        onStatus: (p) => setStatus(p),
        onCitations: (p) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") last.citations = p;
            return next;
          });
        },
        onToken: (p) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              last.text = (last.text || "") + (p.text || "");
            }
            return next;
          });
        },
        onDone: (p) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              last.pending = false;
              last.meta = p;
            }
            return next;
          });
          // Persist session id so the next message continues this conversation.
          if (p?.session_id && !sessionId) setSessionId(p.session_id);
          if (p?.session_id) {
            try { localStorage.setItem('ai.sessionId', p.session_id); } catch {}
          }
          setStatus(null);
          setIsStreaming(false);
          abortRef.current = null;
        },
        onError: (p) => {
          setError(p?.message || "Stream error");
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant" && last.pending) {
              last.text = last.text || "_(stream interrupted)_";
              last.pending = false;
            }
            return next;
          });
          setStatus(null);
          setIsStreaming(false);
          abortRef.current = null;
        },
      }
    );
  };

  const handleStop = () => {
    abortRef.current?.();
    abortRef.current = null;
    setIsStreaming(false);
    setStatus(null);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 2, height: "calc(100vh - 96px)", display: "flex", flexDirection: "column" }}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Gavel sx={{ fontSize: 32, color: "#d97706" }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Legal Consultation</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Streaming responses • Cites Indian statutes and case law
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Alert severity="warning" sx={{ mb: 2, fontSize: 12 }} icon={<Gavel fontSize="small" />}>
        {LEGAL_DISCLAIMER}
      </Alert>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

      <Paper
        variant="outlined"
        sx={{ flex: 1, overflow: "auto", p: 2, mb: 2, borderRadius: 2, bgcolor: (t) => alpha(t.palette.primary.main, 0.02) }}
      >
        {messages.length === 0 && (
          <Box sx={{ textAlign: "center", color: "text.secondary", mt: 6 }}>
            <AutoAwesome sx={{ fontSize: 48, color: "#d97706", mb: 1 }} />
            <Typography variant="body1">
              Describe your case or ask a legal question to begin.
            </Typography>
            <Typography variant="caption">
              Example: <em>“Can anticipatory bail be granted for offences under Section 307 IPC?”</em>
            </Typography>
          </Box>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}

        {status && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary", mt: 1 }}>
            <CircularProgress size={14} />
            <Typography variant="caption">{status.message || status.step}</Typography>
          </Box>
        )}
        <div ref={scrollRef} />
      </Paper>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask a legal question or describe your case…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <IconButton color="error" onClick={handleStop} sx={{ alignSelf: "flex-end" }}>
            <Stop />
          </IconButton>
        ) : (
          <Button
            type="submit"
            variant="contained"
            disabled={!input.trim()}
            endIcon={<Send />}
            sx={{ alignSelf: "flex-end" }}
          >
            Send
          </Button>
        )}
      </Box>
    </Box>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <Box sx={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", mb: 2 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: "85%",
          p: 1.5,
          borderRadius: 2,
          bgcolor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          border: (t) => (isUser ? "none" : `1px solid ${alpha(t.palette.text.primary, 0.1)}`),
        }}
      >
        {message.citations?.cases?.length > 0 && (
          <CitationsStrip citations={message.citations} />
        )}
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {message.text || (message.pending ? "…" : "")}
        </Typography>
        {message.meta && (
          <Typography variant="caption" sx={{ opacity: 0.6, display: "block", mt: 1 }}>
            {message.meta.model} · {message.meta.provider} · {message.meta.elapsed_seconds}s · {message.meta.citation_count} precedents
          </Typography>
        )}
        {!isUser && message.text && !message.pending && (
          <Box sx={{ display: "flex", gap: 0.5, mt: 1, justifyContent: "flex-end" }}>
            <IconButton size="small" title="Helpful"
              onClick={() => console.log("feedback:helpful", message.text?.slice(0, 50))}>
              <ThumbUp sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" title="Not helpful"
              onClick={() => console.log("feedback:not-helpful", message.text?.slice(0, 50))}>
              <ThumbDown sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

function CitationsStrip({ citations }) {
  const cases = citations.cases || [];
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
        <MenuBook sx={{ fontSize: 14 }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Sources ({cases.length})
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
        {cases.slice(0, 5).map((c, i) => (
          <Chip
            key={i}
            size="small"
            label={`${(c.title || "Case").slice(0, 40)}${c.outcome ? ` · ${c.outcome}` : ""}`}
            component={c.url ? Link : "div"}
            href={c.url || undefined}
            target={c.url ? "_blank" : undefined}
            rel="noopener"
            clickable={!!c.url}
            sx={{ fontSize: 11, height: 22 }}
          />
        ))}
      </Box>
      {citations.statutes_excerpt && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, display: "block" }}>
            Relevant statutes
          </Typography>
          <Typography variant="caption" sx={{ display: "block", opacity: 0.8, fontStyle: "italic" }}>
            {citations.statutes_excerpt.slice(0, 300)}
            {citations.statutes_excerpt.length > 300 ? "…" : ""}
          </Typography>
        </>
      )}
    </Box>
  );
}
