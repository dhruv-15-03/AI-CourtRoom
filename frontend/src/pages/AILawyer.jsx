import { useState, useRef, useEffect, useCallback } from "react";
import {
  Box, Button, Typography, TextField, Card, CardContent,
  CircularProgress, Chip, Divider, Alert, IconButton, Paper,
  Tabs, Tab, Select, MenuItem, FormControl, InputLabel,
  Accordion, AccordionSummary, AccordionDetails, Tooltip,
  useTheme, alpha, LinearProgress, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Gavel, Send, AttachFile, Description, CloudUpload, Chat,
  Assessment, ExpandMore, ContentCopy, Download, RestartAlt,
  CheckCircle, Warning, TrendingUp, Info, Article, Upload,
  AccountBalance, Shield, Balance, AutoAwesome,
} from "@mui/icons-material";
import { agentService } from "../services/api";

const AILawyer = () => {
  const theme = useTheme();
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // State
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [documentsContext, setDocumentsContext] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [docGenOpen, setDocGenOpen] = useState(false);
  const [docTypes, setDocTypes] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState("");
  const [generatingDoc, setGeneratingDoc] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);
  const [docInstructions, setDocInstructions] = useState("");

  // Load document types on mount
  useEffect(() => {
    agentService.getDocumentTypes()
      .then(res => setDocTypes(res.data?.document_types || []))
      .catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── File Upload ──────────────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles].slice(0, 20));
  };

  const handleUploadDocuments = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const res = await agentService.uploadDocuments(files, sessionId || "");
      const data = res.data;
      setDocumentsContext(data.documents_context || "");
      setUploadedDocs(data.documents || []);
      setSnackbar({
        open: true,
        message: `${data.total_files} document(s) processed successfully`,
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to process documents: " + (err.response?.data?.message || err.message),
        severity: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Analysis ─────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setAnalyzing(true);
    setAnalysis(null);
    setMessages([]);
    setSessionId(null);

    try {
      let res;
      if (files.length > 0 || documentsContext) {
        res = await agentService.analyzeWithDocs(query, files, documentsContext);
      } else {
        res = await agentService.analyze(query);
      }

      const data = res.data;
      setAnalysis(data);
      setSessionId(data.session_id);
      setActiveTab(1); // Switch to analysis tab

      // Add initial messages
      setMessages([
        { role: "user", content: query, timestamp: new Date() },
        { role: "assistant", content: data.analysis || "Analysis complete. Ask me follow-up questions.", timestamp: new Date() },
      ]);

      setSnackbar({ open: true, message: "Case analysis complete!", severity: "success" });
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setSnackbar({ open: true, message: "Analysis failed: " + msg, severity: "error" });
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Follow-up Chat ───────────────────────────────────────────────────

  const handleSendChat = async () => {
    if (!chatInput.trim() || !sessionId) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg, timestamp: new Date() }]);
    setChatLoading(true);

    try {
      const res = await agentService.chat(sessionId, userMsg);
      const data = res.data;
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.response || data.answer || "I couldn't generate a response.",
        timestamp: new Date(),
      }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to get response";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error: ${errMsg}`,
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Document Generation ──────────────────────────────────────────────

  const handleGenerateDocument = async () => {
    if (!selectedDocType) return;
    setGeneratingDoc(true);
    setGeneratedDoc(null);
    try {
      const res = await agentService.generateDocument(selectedDocType, {
        case_info: query,
        session_id: sessionId || "",
        documents_context: documentsContext,
        user_instructions: docInstructions,
      });
      setGeneratedDoc(res.data);
      setSnackbar({ open: true, message: "Document generated!", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Document generation failed: " + (err.response?.data?.message || err.message),
        severity: "error",
      });
    } finally {
      setGeneratingDoc(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: "Copied to clipboard", severity: "info" });
  };

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, mb: 1 }}>
          <Balance sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          <Typography variant="h4" fontWeight={700}>AI Lawyer</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Upload your case documents, describe your situation, and get comprehensive legal analysis with court-ready documents.
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }} centered>
        <Tab icon={<Description />} label="Case Input" />
        <Tab icon={<Assessment />} label="Analysis" disabled={!analysis} />
        <Tab icon={<Chat />} label="Chat" disabled={!sessionId} />
        <Tab icon={<Article />} label="Documents" disabled={!sessionId} />
      </Tabs>

      {/* ── Tab 0: Case Input ─────────────────────────────────────────── */}
      {activeTab === 0 && (
        <Box>
          {/* Document Upload */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CloudUpload /> Upload Case Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload FIRs, charge sheets, court orders, evidence photos, or any case-related documents.
                The AI will read and analyze them. Supports PDF, images, Word docs.
              </Typography>

              <input type="file" ref={fileInputRef} multiple hidden
                accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.docx,.txt"
                onChange={handleFileSelect}
              />
              <Button variant="outlined" startIcon={<AttachFile />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ mr: 2 }}
              >
                Select Files
              </Button>
              {files.length > 0 && (
                <Button variant="contained" startIcon={uploading ? <CircularProgress size={18} /> : <Upload />}
                  onClick={handleUploadDocuments} disabled={uploading}
                >
                  {uploading ? "Processing..." : `Process ${files.length} File(s)`}
                </Button>
              )}

              {/* File list */}
              {files.length > 0 && (
                <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {files.map((f, i) => (
                    <Chip key={i} label={f.name} size="small" onDelete={() => removeFile(i)}
                      icon={<Description />} variant="outlined"
                    />
                  ))}
                </Box>
              )}

              {/* Processed documents */}
              {uploadedDocs.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Alert severity="success" sx={{ mb: 1 }}>
                    {uploadedDocs.length} document(s) processed. AI has read all your documents.
                  </Alert>
                  {uploadedDocs.map((doc, i) => (
                    <Accordion key={i} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Description fontSize="small" />
                          <Typography variant="body2" fontWeight={600}>{doc.filename}</Typography>
                          <Chip label={doc.doc_type || doc.file_type} size="small" color="primary" variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            {doc.text_length} chars
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {doc.evidence_description && (
                          <Alert severity="info" sx={{ mb: 1 }}>
                            <strong>Evidence Analysis:</strong> {doc.evidence_description}
                          </Alert>
                        )}
                        {doc.sections_mentioned?.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" fontWeight={600}>Sections Found:</Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                              {doc.sections_mentioned.map((s, j) => (
                                <Chip key={j} label={s} size="small" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        )}
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }}>
                          {doc.text_preview}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Case Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Gavel /> Describe Your Case
              </Typography>
              <TextField fullWidth multiline rows={6} value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your legal situation in detail. Include:&#10;- What happened (facts)&#10;- Who is involved (parties)&#10;- What sections/laws are relevant&#10;- What relief you are seeking&#10;&#10;Example: My client has been charged under Section 302 IPC for murder. There are 2 eyewitnesses but the weapon was not recovered. The prosecution relies on circumstantial evidence. We are seeking bail."
                sx={{ mb: 2 }}
              />
              <Button variant="contained" size="large" fullWidth
                startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                onClick={handleAnalyze}
                disabled={analyzing || !query.trim()}
                sx={{ py: 1.5, fontSize: "1.1rem" }}
              >
                {analyzing ? "AI Lawyer is analyzing..." : "Analyze Case with AI Lawyer"}
              </Button>
              {analyzing && <LinearProgress sx={{ mt: 1 }} />}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ── Tab 1: Analysis Results ───────────────────────────────────── */}
      {activeTab === 1 && analysis && (
        <Box>
          {/* Prediction */}
          <Card sx={{ mb: 3, border: `2px solid ${theme.palette.primary.main}` }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Predicted Outcome</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Chip label={analysis.prediction?.judgment || "Unknown"}
                  color="primary" size="medium"
                  sx={{ fontSize: "1rem", fontWeight: 700, px: 2 }}
                />
                <Typography variant="body1">
                  Confidence: <strong>{((analysis.prediction?.confidence || 0) * 100).toFixed(1)}%</strong>
                </Typography>
              </Box>
              {analysis.understanding && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <Chip icon={<Gavel />} label={analysis.understanding.case_type} size="small" />
                  {analysis.understanding.relevant_acts?.map((act, i) => (
                    <Chip key={i} label={act} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Full Analysis */}
          {analysis.analysis && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6">Legal Analysis</Typography>
                  <IconButton size="small" onClick={() => copyToClipboard(analysis.analysis)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                  {analysis.analysis}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Strategy */}
          {analysis.strategy && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUp /> Strategy Recommendations
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                  {analysis.strategy}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Similar Cases */}
          {analysis.similar_cases?.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Matching Precedents</Typography>
                {analysis.similar_cases.map((c, i) => (
                  <Paper key={i} sx={{ p: 2, mb: 1, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <Typography variant="subtitle2" fontWeight={600}>{c.title}</Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                      <Chip label={c.outcome} size="small" color="secondary" />
                      <Chip label={`Relevance: ${(c.score * 100).toFixed(0)}%`} size="small" variant="outlined" />
                    </Box>
                    {c.snippet && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {c.snippet.slice(0, 200)}...
                      </Typography>
                    )}
                  </Paper>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button variant="contained" startIcon={<Chat />} onClick={() => setActiveTab(2)}>
              Ask Follow-up Questions
            </Button>
            <Button variant="outlined" startIcon={<Article />} onClick={() => setDocGenOpen(true)}>
              Generate Court Document
            </Button>
            <Button variant="outlined" startIcon={<RestartAlt />} onClick={() => {
              setAnalysis(null); setSessionId(null); setMessages([]); setActiveTab(0);
            }}>
              New Case
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Tab 2: Chat ───────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <Card sx={{ height: "70vh", display: "flex", flexDirection: "column" }}>
          <CardContent sx={{ flexGrow: 1, overflow: "auto", pb: 0 }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chat /> Case Discussion
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {messages.map((msg, i) => (
              <Box key={i} sx={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                mb: 2,
              }}>
                <Paper sx={{
                  p: 2, maxWidth: "80%",
                  bgcolor: msg.role === "user"
                    ? alpha(theme.palette.primary.main, 0.1)
                    : msg.isError
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.grey[500], 0.08),
                  borderRadius: 2,
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                    {msg.role === "user" ? "You" : "AI Lawyer"}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                    {msg.content}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {chatLoading && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">AI Lawyer is thinking...</Typography>
              </Box>
            )}
            <div ref={chatEndRef} />
          </CardContent>

          <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField fullWidth size="small" value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                placeholder="Ask a follow-up question about your case..."
                disabled={chatLoading}
              />
              <Button variant="contained" endIcon={<Send />} onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim()}>
                Send
              </Button>
            </Box>
          </Box>
        </Card>
      )}

      {/* ── Tab 3: Generated Documents ────────────────────────────────── */}
      {activeTab === 3 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Article /> Generate Court Documents
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a document type and the AI Lawyer will draft it using your case details, analysis, and uploaded documents.
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Document Type</InputLabel>
                <Select value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value)}
                  label="Document Type">
                  {docTypes.map(dt => (
                    <MenuItem key={dt.id} value={dt.id}>{dt.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField fullWidth multiline rows={3} value={docInstructions}
                onChange={(e) => setDocInstructions(e.target.value)}
                label="Special Instructions (optional)"
                placeholder="E.g., 'Focus on lack of evidence', 'Emphasize client's clean record'"
                sx={{ mb: 2 }}
              />

              <Button variant="contained" startIcon={generatingDoc ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                onClick={handleGenerateDocument}
                disabled={generatingDoc || !selectedDocType}
                fullWidth
              >
                {generatingDoc ? "Drafting Document..." : "Generate Document"}
              </Button>
              {generatingDoc && <LinearProgress sx={{ mt: 1 }} />}
            </CardContent>
          </Card>

          {generatedDoc && (
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6">{generatedDoc.title}</Typography>
                  <Box>
                    <IconButton onClick={() => copyToClipboard(generatedDoc.content)}>
                      <ContentCopy />
                    </IconButton>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1"
                  sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
                  {generatedDoc.content}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* ── Document Generation Dialog ────────────────────────────────── */}
      <Dialog open={docGenOpen} onClose={() => setDocGenOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Court Document</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel>Document Type</InputLabel>
            <Select value={selectedDocType} onChange={(e) => setSelectedDocType(e.target.value)}
              label="Document Type">
              {docTypes.map(dt => (
                <MenuItem key={dt.id} value={dt.id}>{dt.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField fullWidth multiline rows={2} value={docInstructions}
            onChange={(e) => setDocInstructions(e.target.value)}
            label="Special Instructions (optional)"
            placeholder="E.g., focus on self-defense argument"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocGenOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => {
            setDocGenOpen(false);
            setActiveTab(3);
            handleGenerateDocument();
          }} disabled={!selectedDocType}>
            Generate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AILawyer;
