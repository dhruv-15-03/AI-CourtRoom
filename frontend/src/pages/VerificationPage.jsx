import { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Collapse,
} from "@mui/material";
import {
  Email,
  PhoneAndroid,
  CheckCircle,
  ArrowForward,
  Refresh,
  Gavel,
  Verified,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:8081") + "/api";

export default function VerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.email || localStorage.getItem("pendingVerificationEmail") || "";
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Email OTP
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  
  // Mobile OTP
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileVerified, setMobileVerified] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(true);
  const [mobileOtp, setMobileOtp] = useState(["", "", "", "", "", ""]);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  
  // Verification status
  const [verificationStatus, setVerificationStatus] = useState(null);
  
  const emailOtpRefs = useRef([]);
  const mobileOtpRefs = useRef([]);

  // Check verification status on load
  useEffect(() => {
    if (userEmail) {
      localStorage.setItem("pendingVerificationEmail", userEmail);
      checkVerificationStatus();
    } else {
      navigate("/login");
    }
  }, [userEmail]);

  // Email resend cooldown timer
  useEffect(() => {
    if (emailResendCooldown > 0) {
      const timer = setTimeout(() => setEmailResendCooldown(emailResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailResendCooldown]);

  const checkVerificationStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}/verification/status?email=${encodeURIComponent(userEmail)}`);
      setVerificationStatus(res.data);
      setEmailVerified(res.data.emailVerified);
      setMobileVerified(res.data.mobileVerified);
      
      if (res.data.emailVerified) {
        setActiveStep(1);
      }
      if (res.data.emailVerified && res.data.mobileVerified) {
        setSuccess("All verifications complete! Redirecting...");
        setTimeout(() => navigate("/login", { state: { verified: true } }), 2000);
      }
    } catch (err) {
      console.error("Error checking verification status:", err);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value, type) => {
    if (!/^\d*$/.test(value)) return;
    
    const otpArray = type === "email" ? [...emailOtp] : [...mobileOtp];
    const refs = type === "email" ? emailOtpRefs : mobileOtpRefs;
    
    otpArray[index] = value.slice(-1);
    
    if (type === "email") {
      setEmailOtp(otpArray);
    } else {
      setMobileOtp(otpArray);
    }
    
    // Auto-focus next input
    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e, type) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    
    const otpArray = pastedData.split("");
    while (otpArray.length < 6) otpArray.push("");
    
    if (type === "email") {
      setEmailOtp(otpArray);
    } else {
      setMobileOtp(otpArray);
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e, type) => {
    const refs = type === "email" ? emailOtpRefs : mobileOtpRefs;
    const otpArray = type === "email" ? emailOtp : mobileOtp;
    
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // Send email OTP
  const sendEmailOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/verification/send-email-otp`, { email: userEmail });
      setSuccess("OTP sent to your email!");
      setEmailResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify email OTP
  const verifyEmailOtp = async () => {
    const otp = emailOtp.join("");
    if (otp.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/verification/verify-email-otp`, {
        email: userEmail,
        otp: otp,
      });
      
      if (res.data.success) {
        setEmailVerified(true);
        setSuccess("Email verified successfully!");
        setActiveStep(1);
      } else {
        setError(res.data.error || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Send mobile OTP (Firebase)
  const sendMobileOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      setError("Please enter a valid mobile number");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // For development, we'll simulate OTP sent
      // In production, integrate with Firebase Phone Auth
      setMobileOtpSent(true);
      setShowMobileInput(false);
      setSuccess("OTP sent to your mobile!");
    } catch (err) {
      setError("Failed to send mobile OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify mobile OTP
  const verifyMobileOtp = async () => {
    const otp = mobileOtp.join("");
    if (otp.length !== 6) {
      setError("Please enter complete 6-digit OTP");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/verification/verify-mobile`, {
        email: userEmail,
        mobile: `+91${mobileNumber}`,
        firebaseToken: otp, // Development mode accepts any 6-digit code
      });
      
      if (res.data.success) {
        setMobileVerified(true);
        setSuccess("Mobile verified! Redirecting to login...");
        localStorage.removeItem("pendingVerificationEmail");
        setTimeout(() => navigate("/login", { state: { verified: true } }), 2000);
      } else {
        setError(res.data.error || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Skip mobile verification (optional)
  const skipMobileVerification = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/verification/skip-mobile`, { email: userEmail });
      if (res.data.success) {
        setSuccess("Redirecting to login...");
        localStorage.removeItem("pendingVerificationEmail");
        setTimeout(() => navigate("/login", { state: { verified: true } }), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to skip");
    } finally {
      setLoading(false);
    }
  };

  const OtpInput = ({ value, onChange, onPaste, onKeyDown, refs, disabled }) => (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
      {value.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(el) => (refs.current[index] = el)}
          value={digit}
          onChange={(e) => onChange(index, e.target.value)}
          onPaste={onPaste}
          onKeyDown={(e) => onKeyDown(index, e)}
          disabled={disabled}
          inputProps={{
            maxLength: 1,
            style: { textAlign: "center", fontSize: "1.5rem", fontWeight: 700, padding: "12px" },
          }}
          sx={{ width: 48, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      ))}
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e293b 100%)",
        p: 2,
      }}
    >
      <Paper
        elevation={24}
        sx={{
          maxWidth: 500,
          width: "100%",
          p: 4,
          borderRadius: 4,
          background: "rgba(255, 255, 255, 0.98)",
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Gavel sx={{ fontSize: 48, color: "#1e3a8a", mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e3a8a", fontFamily: "serif" }}>
            Verify Your Account
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
            Complete verification to access AI Courtroom
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step completed={emailVerified}>
            <StepLabel
              StepIconComponent={() => (
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: emailVerified ? "#22c55e" : activeStep === 0 ? "#1e3a8a" : "#e2e8f0" }}>
                  {emailVerified ? <CheckCircle sx={{ color: "white", fontSize: 20 }} /> : <Email sx={{ color: activeStep === 0 ? "white" : "#64748b", fontSize: 20 }} />}
                </Box>
              )}
            >
              Email
            </StepLabel>
          </Step>
          <Step completed={mobileVerified}>
            <StepLabel
              StepIconComponent={() => (
                <Box sx={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: mobileVerified ? "#22c55e" : activeStep === 1 ? "#1e3a8a" : "#e2e8f0" }}>
                  {mobileVerified ? <CheckCircle sx={{ color: "white", fontSize: 20 }} /> : <PhoneAndroid sx={{ color: activeStep === 1 ? "white" : "#64748b", fontSize: 20 }} />}
                </Box>
              )}
            >
              Mobile
            </StepLabel>
          </Step>
        </Stepper>

        {/* Alerts */}
        <Collapse in={!!error}>
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>
        </Collapse>
        <Collapse in={!!success}>
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>{success}</Alert>
        </Collapse>

        {/* Email Verification Step */}
        {activeStep === 0 && !emailVerified && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, textAlign: "center" }}>
              Verify Your Email
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 3, textAlign: "center" }}>
              Enter the 6-digit OTP sent to <strong>{userEmail}</strong>
            </Typography>

            <OtpInput
              value={emailOtp}
              onChange={(i, v) => handleOtpChange(i, v, "email")}
              onPaste={(e) => handleOtpPaste(e, "email")}
              onKeyDown={(i, e) => handleKeyDown(i, e, "email")}
              refs={emailOtpRefs}
              disabled={loading}
            />

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
              <Button
                onClick={sendEmailOtp}
                disabled={loading || emailResendCooldown > 0}
                startIcon={<Refresh />}
                sx={{ color: "#64748b" }}
              >
                {emailResendCooldown > 0 ? `Resend in ${emailResendCooldown}s` : "Resend OTP"}
              </Button>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={verifyEmailOtp}
              disabled={loading || emailOtp.join("").length !== 6}
              endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
              sx={{ mt: 3, py: 1.5, background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", fontWeight: 600, borderRadius: 2 }}
            >
              Verify Email
            </Button>
          </Box>
        )}

        {/* Mobile Verification Step */}
        {activeStep === 1 && !mobileVerified && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, textAlign: "center" }}>
              Verify Your Mobile
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 3, textAlign: "center" }}>
              Enter your mobile number to receive OTP
            </Typography>

            {showMobileInput ? (
              <Box>
                <TextField
                  fullWidth
                  label="Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                  }}
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={sendMobileOtp}
                  disabled={loading || mobileNumber.length < 10}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                  sx={{ py: 1.5, background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", fontWeight: 600, borderRadius: 2 }}
                >
                  Send OTP
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 2, textAlign: "center" }}>
                  OTP sent to <strong>+91 {mobileNumber}</strong>
                </Typography>
                
                <OtpInput
                  value={mobileOtp}
                  onChange={(i, v) => handleOtpChange(i, v, "mobile")}
                  onPaste={(e) => handleOtpPaste(e, "mobile")}
                  onKeyDown={(i, e) => handleKeyDown(i, e, "mobile")}
                  refs={mobileOtpRefs}
                  disabled={loading}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={verifyMobileOtp}
                  disabled={loading || mobileOtp.join("").length !== 6}
                  endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Verified />}
                  sx={{ mt: 3, py: 1.5, background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)", fontWeight: 600, borderRadius: 2 }}
                >
                  Verify Mobile
                </Button>
              </Box>
            )}

            <Button
              fullWidth
              variant="text"
              onClick={skipMobileVerification}
              disabled={loading}
              sx={{ mt: 2, color: "#64748b" }}
            >
              Skip for now (can verify later)
            </Button>
          </Box>
        )}

        {/* All Verified */}
        {emailVerified && mobileVerified && (
          <Box sx={{ textAlign: "center" }}>
            <CheckCircle sx={{ fontSize: 80, color: "#22c55e", mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, color: "#1e3a8a" }}>
              All Verifications Complete!
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
              Redirecting to login...
            </Typography>
            <CircularProgress sx={{ mt: 3 }} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
