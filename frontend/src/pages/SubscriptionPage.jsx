import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  CheckCircle,
  Star,
  Bolt,
  Rocket,
  History,
  CreditCard,
  Cancel,
  ArrowBack,
  Gavel,
  Close,
  LocalOffer,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { subscriptionService } from "../services/api";

// Plan icons mapping
const planIcons = {
  FREE: <Star sx={{ fontSize: 48 }} />,
  BASIC: <LocalOffer sx={{ fontSize: 48 }} />,
  PRO: <Bolt sx={{ fontSize: 48 }} />,
  UNLIMITED: <Rocket sx={{ fontSize: 48 }} />,
  PRO_YEARLY: <Bolt sx={{ fontSize: 48 }} />,
  UNLIMITED_YEARLY: <Rocket sx={{ fontSize: 48 }} />,
};

// Plan colors
const planColors = {
  FREE: "#64748b",
  BASIC: "#059669",
  PRO: "#3b82f6",
  UNLIMITED: "#d97706",
  PRO_YEARLY: "#3b82f6",
  UNLIMITED_YEARLY: "#d97706",
};

// Plan badges
const planBadges = {
  FREE: null,
  BASIC: "Pay Per Case",
  PRO: "Most Popular",
  UNLIMITED: "Best Value",
  PRO_YEARLY: "Save 20%",
  UNLIMITED_YEARLY: "Save 20%",
};

export default function SubscriptionPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [access, setAccess] = useState(null);
  const [history, setHistory] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [detailDialog, setDetailDialog] = useState(null);

  // Fetch plans and access status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [plansRes, accessRes] = await Promise.all([
          subscriptionService.getPlans(),
          subscriptionService.checkAccess(),
        ]);
        
        setPlans(plansRes.data.plans || []);
        setAccess(accessRes.data);
      } catch (err) {
        console.error("Error fetching subscription data:", err);
        setError("Failed to load subscription plans");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch subscription history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await subscriptionService.getHistory();
      setHistory(res.data.subscriptions || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  }, []);

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory, fetchHistory]);

  // Handle plan selection
  const handleSelectPlan = (plan) => {
    if (plan.id === "FREE") return;
    setSelectedPlan(plan);
    setConfirmDialog(true);
  };

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle subscription purchase
  const handlePurchase = async () => {
    if (!selectedPlan) return;
    
    setConfirmDialog(false);
    setProcessing(true);
    setError(null);
    
    try {
      const orderRes = await subscriptionService.createOrder(selectedPlan.id);
      const orderData = orderRes.data;
      
      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }
      
      if (orderData.mode === "development") {
        const verifyRes = await subscriptionService.verifyPayment({
          orderId: orderData.orderId,
          paymentId: "pay_dev_" + Date.now(),
          signature: "dev_signature",
          paymentMethod: "test",
        });
        
        if (verifyRes.data.success) {
          setSuccess(`Subscription activated! ${selectedPlan.isSingleCase ? 'You can now analyze 1 case.' : `Valid until ${new Date(verifyRes.data.validUntil).toLocaleDateString()}`}`);
          const accessRes = await subscriptionService.checkAccess();
          setAccess(accessRes.data);
        } else {
          throw new Error(verifyRes.data.error || "Verification failed");
        }
        setProcessing(false);
        return;
      }
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }
      
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AI Courtroom",
        description: `${orderData.planName} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await subscriptionService.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              paymentMethod: "razorpay",
            });
            
            if (verifyRes.data.success) {
              setSuccess(`Subscription activated!`);
              const accessRes = await subscriptionService.checkAccess();
              setAccess(accessRes.data);
            } else {
              throw new Error(verifyRes.data.error);
            }
          } catch (err) {
            setError(err.message || "Payment verification failed");
          }
          setProcessing(false);
        },
        prefill: { email: localStorage.getItem("userEmail") || "" },
        theme: { color: "#1e3a8a" },
        modal: { ondismiss: () => setProcessing(false) },
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Purchase error:", err);
      setError(err.message || "Failed to process subscription");
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <CircularProgress size={60} sx={{ color: "#1e3a8a" }} />
      </Box>
    );
  }

  const mainPlans = plans.filter((p) => ["FREE", "BASIC", "PRO", "UNLIMITED"].includes(p.id));
  const yearlyPlans = plans.filter((p) => p.isYearly);

  return (
    <Box sx={{ maxWidth: 1400, margin: "0 auto", p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2, color: "#64748b" }}>
          Back
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Gavel sx={{ fontSize: 48, color: "#1e3a8a" }} />
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: "#1e3a8a", fontFamily: "serif" }}>
              AI Courtroom Plans
            </Typography>
            <Typography variant="h6" sx={{ color: "#64748b" }}>
              Choose the perfect plan for your legal AI needs
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Current Access Status */}
      {access && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            background: access.hasAccess
              ? `linear-gradient(135deg, ${alpha("#22c55e", 0.1)} 0%, ${alpha("#16a34a", 0.05)} 100%)`
              : `linear-gradient(135deg, ${alpha("#ef4444", 0.1)} 0%, ${alpha("#dc2626", 0.05)} 100%)`,
            border: `1px solid ${access.hasAccess ? alpha("#22c55e", 0.2) : alpha("#ef4444", 0.2)}`,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: access.hasAccess ? "#16a34a" : "#dc2626" }}>
                {access.hasAccess ? "Active Access" : "No Active Subscription"}
              </Typography>
              {access.accessType === "SUBSCRIPTION" && (
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Plan: {access.plan} | Expires: {formatDate(access.expiresAt)} |{" "}
                  {access.isUnlimited ? "Unlimited queries" : `${access.queriesRemaining} queries remaining`}
                </Typography>
              )}
              {access.accessType === "FREE_TRIAL" && (
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Free trial: {access.freeTrialsRemaining} consultations remaining
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={() => setShowHistory(!showHistory)}
              sx={{ borderColor: "#1e3a8a", color: "#1e3a8a" }}
            >
              {showHistory ? "Hide History" : "View History"}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Subscription History */}
      {showHistory && (
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: `1px solid ${alpha("#1e3a8a", 0.1)}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e3a8a", mb: 2 }}>
            Subscription History
          </Typography>
          {history.length === 0 ? (
            <Typography variant="body2" sx={{ color: "#64748b" }}>No subscription history found</Typography>
          ) : (
            <List>
              {history.map((sub, index) => (
                <ListItem key={sub.id || index} sx={{ borderRadius: 2, mb: 1, backgroundColor: alpha("#1e3a8a", 0.03), border: `1px solid ${alpha("#1e3a8a", 0.1)}` }}>
                  <ListItemIcon><CreditCard sx={{ color: "#1e3a8a" }} /></ListItemIcon>
                  <ListItemText primary={sub.plan} secondary={`${formatDate(sub.startDate)} - ${formatDate(sub.endDate)} | ${formatPrice(sub.amount)}`} />
                  <Chip label={sub.status} size="small" sx={{ backgroundColor: sub.isActive ? "#22c55e" : "#64748b", color: "white" }} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Plan Tabs */}
      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 4, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Monthly Plans" />
        <Tab label="Yearly Plans (Save 20%)" />
        <Tab label="Compare Features" />
      </Tabs>

      {/* Monthly Plans */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {mainPlans.map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: plan.id === "PRO" ? `3px solid ${planColors[plan.id]}` : `2px solid ${alpha(planColors[plan.id] || "#1e3a8a", 0.2)}`,
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "visible",
                  "&:hover": { transform: "translateY(-8px)", boxShadow: `0 12px 40px ${alpha(planColors[plan.id] || "#1e3a8a", 0.2)}` },
                }}
              >
                {planBadges[plan.id] && (
                  <Chip label={planBadges[plan.id]} size="small" sx={{ position: "absolute", top: -12, right: 20, backgroundColor: planColors[plan.id], color: "white", fontWeight: 700, fontSize: "0.75rem" }} />
                )}
                
                <CardContent sx={{ p: 3, textAlign: "center", height: "100%", display: "flex", flexDirection: "column" }}>
                  <Box sx={{ color: planColors[plan.id] || "#1e3a8a", mb: 2 }}>{planIcons[plan.id] || <Star sx={{ fontSize: 48 }} />}</Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>{plan.name}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: planColors[plan.id] || "#1e3a8a", mb: 0.5 }}>{plan.priceDisplay || formatPrice(plan.price)}</Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 3, minHeight: 40 }}>{plan.description}</Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ flexGrow: 1, mb: 2 }}>
                    <List dense>
                      {(plan.features || []).slice(0, 5).map((feature, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle sx={{ fontSize: 16, color: "#22c55e" }} /></ListItemIcon>
                          <ListItemText primary={feature} primaryTypographyProps={{ variant: "body2", fontSize: "0.85rem" }} />
                        </ListItem>
                      ))}
                    </List>
                    {(plan.features || []).length > 5 && (
                      <Button size="small" onClick={() => setDetailDialog(plan)} sx={{ mt: 1, color: planColors[plan.id] }}>
                        +{plan.features.length - 5} more features
                      </Button>
                    )}
                  </Box>
                  
                  <Button
                    fullWidth
                    variant={plan.id === "FREE" ? "outlined" : "contained"}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={processing || plan.id === "FREE"}
                    sx={{
                      background: plan.id === "FREE" ? "transparent" : `linear-gradient(135deg, ${planColors[plan.id]} 0%, ${alpha(planColors[plan.id], 0.8)} 100%)`,
                      borderColor: plan.id === "FREE" ? planColors[plan.id] : undefined,
                      color: plan.id === "FREE" ? planColors[plan.id] : "white",
                      fontWeight: 600,
                      py: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    {plan.id === "FREE" ? "Current Plan" : processing ? <CircularProgress size={24} color="inherit" /> : "Get Started"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Yearly Plans */}
      {tabValue === 1 && (
        <Grid container spacing={3} justifyContent="center">
          {yearlyPlans.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card
                elevation={0}
                sx={{ height: "100%", borderRadius: 3, border: `2px solid ${alpha(planColors[plan.id] || "#1e3a8a", 0.2)}`, transition: "all 0.3s ease", position: "relative", "&:hover": { transform: "translateY(-8px)", boxShadow: `0 12px 40px ${alpha(planColors[plan.id] || "#1e3a8a", 0.2)}` } }}
              >
                <Chip label="Save 20%" size="small" sx={{ position: "absolute", top: -12, right: 20, backgroundColor: "#22c55e", color: "white", fontWeight: 700 }} />
                
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <Box sx={{ color: planColors[plan.id] || "#1e3a8a", mb: 2 }}>{planIcons[plan.id] || <Star sx={{ fontSize: 48 }} />}</Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>{plan.name}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: planColors[plan.id] || "#1e3a8a", mb: 0.5 }}>{plan.priceDisplay || formatPrice(plan.price)}</Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>{plan.description}</Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <List dense sx={{ mb: 2 }}>
                    {(plan.features || []).map((feature, idx) => (
                      <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle sx={{ fontSize: 16, color: "#22c55e" }} /></ListItemIcon>
                        <ListItemText primary={feature} primaryTypographyProps={{ variant: "body2" }} />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Button fullWidth variant="contained" onClick={() => handleSelectPlan(plan)} disabled={processing} sx={{ background: `linear-gradient(135deg, ${planColors[plan.id] || "#1e3a8a"} 0%, ${alpha(planColors[plan.id] || "#1e3a8a", 0.8)} 100%)`, fontWeight: 600, py: 1.5, borderRadius: 2 }}>
                    {processing ? <CircularProgress size={24} color="inherit" /> : "Subscribe Yearly"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Feature Comparison Table */}
      {tabValue === 2 && (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha("#1e3a8a", 0.1)}` }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha("#1e3a8a", 0.05) }}>
                <TableCell sx={{ fontWeight: 700, fontSize: "1rem" }}>Feature</TableCell>
                {mainPlans.map((plan) => (
                  <TableCell key={plan.id} align="center" sx={{ fontWeight: 700, fontSize: "1rem", color: planColors[plan.id] }}>
                    {plan.name}
                    <Typography variant="body2" sx={{ fontWeight: 400, color: "#64748b" }}>{plan.priceDisplay}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>AI Case Analyses</TableCell>
                <TableCell align="center">3 trials</TableCell>
                <TableCell align="center">1 per purchase</TableCell>
                <TableCell align="center">50/month</TableCell>
                <TableCell align="center"><b>Unlimited</b></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Case Prediction</TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Context Level</TableCell>
                <TableCell align="center">Basic</TableCell>
                <TableCell align="center">Full</TableCell>
                <TableCell align="center">Full</TableCell>
                <TableCell align="center"><b>Maximum</b></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Similar Case References</TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Document Review</TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Analytics Dashboard</TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Download Reports</TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>API Access</TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bulk Analysis</TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><Close sx={{ color: "#ef4444" }} /></TableCell>
                <TableCell align="center"><CheckCircle sx={{ color: "#22c55e" }} /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Support</TableCell>
                <TableCell align="center">Email</TableCell>
                <TableCell align="center">Email</TableCell>
                <TableCell align="center">Priority</TableCell>
                <TableCell align="center"><b>24/7 Premium</b></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Plan Detail Dialog */}
      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="sm" fullWidth>
        {detailDialog && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ color: planColors[detailDialog.id] }}>{planIcons[detailDialog.id]}</Box>
              {detailDialog.name} - All Features
            </DialogTitle>
            <DialogContent>
              <List>
                {(detailDialog.features || []).map((feature, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon><CheckCircle sx={{ color: "#22c55e" }} /></ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailDialog(null)}>Close</Button>
              <Button variant="contained" onClick={() => { setDetailDialog(null); handleSelectPlan(detailDialog); }} sx={{ background: `linear-gradient(135deg, ${planColors[detailDialog.id]} 0%, ${alpha(planColors[detailDialog.id], 0.8)} 100%)` }}>
                Get {detailDialog.name}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirm Subscription</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>You are about to subscribe to:</Typography>
              <Paper sx={{ p: 2, backgroundColor: alpha("#1e3a8a", 0.05), borderRadius: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Box sx={{ color: planColors[selectedPlan.id] }}>{planIcons[selectedPlan.id]}</Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e3a8a" }}>{selectedPlan.name}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: planColors[selectedPlan.id] }}>{selectedPlan.priceDisplay || formatPrice(selectedPlan.price)}</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: "#64748b" }}>{selectedPlan.description}</Typography>
                {selectedPlan.isSingleCase && (
                  <Alert severity="info" sx={{ mt: 2 }}>This is a one-time purchase for analyzing a single case. Valid for 30 days.</Alert>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialog(false)} startIcon={<Cancel />}>Cancel</Button>
          <Button onClick={handlePurchase} variant="contained" startIcon={<CreditCard />} sx={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)" }}>
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: "100%" }}>{success}</Alert>
      </Snackbar>
    </Box>
  );
}
