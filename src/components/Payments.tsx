import React, { useEffect, useState, useRef } from "react";
import {
  CreditCard,
  Clock,
  Check,
  Receipt,
  AlertCircle,
  CheckCircle,
  Shield,
  Wallet,
  GraduationCap,
  ChevronDown,
  Info,
  BookOpen,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  getEnrolledBatches,
  getTransactions,
  fetchCourseFees,
  fetchCourseFeesByEnrollment,
  fetchPaymentLockStatus,
  lockPaymentType,
  createRazorpayOrder,
  verifyPayment,
} from "../services/api";
import { Enrollment, PaymentTransaction } from "../types/auth";
import Sidebar from "./parts/Sidebar";
import toast from "react-hot-toast";

// 🔹 Load Razorpay JS dynamically
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PaymentsProps {
  isEmbedded?: boolean;
}

const Payments: React.FC<PaymentsProps> = ({ isEmbedded = false }) => {
  const { token, studentDetails } = useAuth();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [paymentType, setPaymentType] = useState<"full" | "emi">("full");
  const [emiMonths, setEmiMonths] = useState(1);
  const [totalFees, setTotalFees] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [finalFees, setFinalFees] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [statusApproved, setStatusApproved] = useState(false);
  const [paidMonths, setPaidMonths] = useState<number[]>([]);
  const [isPaying, setIsPaying] = useState(false); // for disabling buttons during payment
  const [isVerifying, setIsVerifying] = useState(false); // for Razorpay verification state
  const [verificationSuccess, setVerificationSuccess] = useState<{
    amount: number;
    paymentId: string;
    orderId: string;
    paymentType: "full" | "emi";
    currentEmi?: number | null;
  } | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const registrationNumber = studentDetails?.registration_number || "";

  // Listen for sidebar toggle events (only for standalone version)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (isEmbedded) return '0';
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studentSidebarCollapsed');
      return saved === 'true' ? '6rem' : '18rem';
    }
    return '18rem';
  });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (isEmbedded) return;
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, [isEmbedded]);

  useEffect(() => {
    if (isEmbedded) return;
    const handleSidebarToggle = () => {
      const saved = localStorage.getItem('studentSidebarCollapsed');
      setSidebarWidth(saved === 'true' ? '6rem' : '18rem');
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    handleSidebarToggle();
    
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, [isEmbedded]);

  // 🔹 Computed: Check if student has multiple enrollments
  const hasMultipleEnrollments = enrollments.length > 1;

  // 🔹 Computed: Selected enrollment details
  const selectedEnrollment = enrollments.find(
    (e) => e.enrollment_id === selectedEnrollmentId
  );

  // 🔹 Free courses that don't require payment
  const FREE_COURSES = ['ON-GR-FL-A1', 'ON-FR-FL-A1'];
  
  // 🔹 Computed: Check if selected enrollment is a free course
  const isFreeCourse = selectedEnrollment 
    ? FREE_COURSES.includes(selectedEnrollment.batches.courses.course_name)
    : false;

  // 🔹 Computed: Filter transactions by selected enrollment
  const filteredTransactions = selectedEnrollmentId
    ? transactions.filter((t) => t.enrollment_id === selectedEnrollmentId)
    : transactions;

  // ✅ Payment Success Handler
  const handlePaymentSuccess = async (orderId: string, response: any) => {
    const verifyRes = await verifyPayment({
      razorpay_order_id: orderId,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    });

    if (!verifyRes.success) {
      throw new Error(verifyRes.message || "Payment verification failed");
    }

    await fetchTransactions(false);
    localStorage.removeItem("pending_payment");
  };

  // ✅ Fetch Course Fees - Triggers when enrollment is selected
  useEffect(() => {
    if (!registrationNumber || enrollments.length === 0) {
      return;
    }

    // For single enrollment - use backend API
    if (enrollments.length === 1 && enrollments[0]) {
      fetchCourseFeesData(registrationNumber);
    }
    // For multiple enrollments - use selected enrollment data and transactions
    else if (enrollments.length > 1) {
      if (selectedEnrollmentId) {
        const selectedEnrollment = enrollments.find(
          (e) => e.enrollment_id === selectedEnrollmentId
        );
        if (selectedEnrollment) {
          // Use enrollment data and transaction data to get course fees
          fetchCourseFeesFromEnrollment(selectedEnrollment);
        }
      } else {
        // No batch selected - clear payment details
        setResult(null);
        setError("Please select a batch to view payment details");
      }
    }
  }, [
    registrationNumber,
    selectedEnrollmentId,
    enrollments,
    transactions,
  ]);

  const fetchCourseFeesData = async (regNum: string) => {
    try {
      // Only show loading on initial fetch, not on updates
      if (!result) {
        setLoading(true);
      }
      const res = await fetchCourseFees(regNum);
      console.log("✅ Course fees fetched:", res);
      setResult(res);
      const fees = res.total_fees || 0;
      const discount = res.discount_percentage || 0;
      const final =
        res.final_fees || Math.round(fees - fees * (discount / 100));
      setTotalFees(fees);
      setDiscountPercentage(discount);
      setFinalFees(final);
      if (res.duration) setEmiMonths(res.duration);
      setError("");
    } catch (err: any) {
      console.error("❌ Error fetching course fees:", err);
      setResult(null);
      setError(
        err.message || "Failed to load payment details. Please try again."
      );
    } finally {
      if (!result) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (verificationSuccess) {
      setSuccessVisible(true);
      const hideTimer = setTimeout(() => setSuccessVisible(false), 2500);
      const clearTimer = setTimeout(() => setVerificationSuccess(null), 3000);
      return () => {
        clearTimeout(hideTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [verificationSuccess]);

  // Fetch fees based on course linked to selected batch
  const fetchCourseFeesFromEnrollment = async (enrollment: Enrollment) => {
    try {
      // Only show loading on initial fetch, not on updates
      if (!result) {
        setLoading(true);
      }

      const selectedCourseName = enrollment.batches.courses.course_name;
      const selectedProgram = enrollment.batches.courses.program;
      const selectedDuration = parseInt(enrollment.batches.duration) || 1;

      // Strategy: Find fees for this specific COURSE (not enrollment)
      // Step 1: Check if there are ANY transactions for this COURSE NAME
      const courseTransactions = transactions.filter(
        (txn) => txn.course_name === selectedCourseName
      );

      if (courseTransactions.length > 0) {
        // ✅ Found fees for this course from transaction history
        const latestCourseTransaction = courseTransactions[0]; // Most recent

        // ⚠️ IMPORTANT: Use original_fees from transaction, NOT final_fees
        // final_fees in transaction is the EMI amount paid (e.g., ₹2,945), not total course fees (₹17,670)
        const originalFees = latestCourseTransaction.original_fees || 0;
        const discountPercent = latestCourseTransaction.discount_percentage || 0;
        
        // Calculate final_fees from original_fees and discount (not from transaction's final_fees)
        const calculatedFinalFees = Math.round(originalFees - (originalFees * discountPercent / 100));

        console.log(
          `✅ Course fees found for "${selectedCourseName}" from transaction history:`,
          {
            original_fees: originalFees,
            discount: discountPercent + "%",
            calculated_final_fees: calculatedFinalFees,
            note: "Using calculated final_fees (not transaction's final_fees which is EMI amount)",
          }
        );

        const enrollmentResult = {
          registration_number: registrationNumber,
          course_name: selectedCourseName,
          batch_name: enrollment.batches.batch_name,
          total_fees: originalFees,
          discount_percentage: discountPercent,
          final_fees: calculatedFinalFees, // ✅ Use calculated value, not transaction's final_fees
          duration: selectedDuration,
        };

        setResult(enrollmentResult);
        setTotalFees(enrollmentResult.total_fees);
        setDiscountPercentage(enrollmentResult.discount_percentage);
        setFinalFees(enrollmentResult.final_fees);
        setEmiMonths(selectedDuration);
        setError(""); // Clear errors
      } else {
        // Step 2: No transaction for this course - use enrollment-specific API
        try {
          // ✅ Use new endpoint that supports enrollment_id
          const res = await fetchCourseFeesByEnrollment(
            registrationNumber,
            enrollment.enrollment_id
          );

          console.log(
            `✅ Course fees loaded from enrollment-specific API for ${selectedCourseName}:`,
            {
              original_fees: res.total_fees,
              discount: res.discount_percentage + "%",
              final_fees: res.final_fees,
            }
          );

          const enrollmentResult = {
            registration_number: registrationNumber,
            course_name: res.course_name,
            batch_name: enrollment.batches.batch_name,
            total_fees: res.total_fees || 0,
            discount_percentage: res.discount_percentage || 0,
            final_fees: res.final_fees || 0,
            duration: res.duration || selectedDuration,
          };

          setResult(enrollmentResult);
          setTotalFees(enrollmentResult.total_fees);
          setDiscountPercentage(enrollmentResult.discount_percentage);
          setFinalFees(enrollmentResult.final_fees);
          setEmiMonths(enrollmentResult.duration);
          setError(""); // Clear errors
        } catch (apiError: any) {
          // Step 3: API still failed - fallback error handling
          console.error(
            `❌ Failed to fetch course fees for "${selectedCourseName}":`,
            apiError
          );

          const enrollmentInfo = {
            registration_number: registrationNumber,
            course_name: selectedCourseName,
            batch_name: enrollment.batches.batch_name,
            duration: selectedDuration,
            program: selectedProgram,
            total_fees: 0,
            discount_percentage: 0,
            final_fees: 0,
          };

          setResult(enrollmentInfo);
          setEmiMonths(selectedDuration);
          setError(
            `Unable to load fee information for "${selectedCourseName}". ` +
              `Please contact your center administrator for assistance.`
          );
        }
      }
    } catch (err: any) {
      setResult(null);
      setError(
        err.message || "Failed to load payment details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Payment Lock Check - Now handled in the selectedEnrollmentId useEffect
  // This ensures payment lock is checked independently for each batch

  const handleLockPayment = async () => {
    if (registrationNumber && selectedEnrollmentId) {
      try {
        // ✅ Pass enrollment_id to lock payment type for THIS batch only
        await lockPaymentType(registrationNumber, paymentType, selectedEnrollmentId);
        setIsLocked(true);
        toast.success("Payment type locked successfully for this batch.");
        // console.log("🔒 Payment locked for batch:", selectedEnrollmentId, "Type:", paymentType);
      } catch (error) {
        console.error("Failed to lock payment type:", error);
        toast.error("Failed to lock payment type.");
      }
    } else if (!selectedEnrollmentId) {
      toast.error("Please select a batch first.");
    }
  };

  // ✅ Razorpay Payment
  const handlePayment = async (amount: number, currentEmi: number = 0) => {
    try {
      const res = await loadRazorpayScript();
      if (!res) return toast.error("❌ Failed to load Razorpay SDK.");

      const data = await createRazorpayOrder({
        amount,
        registration_number: registrationNumber,
        student_name: studentDetails?.name || "Unknown",
        email: studentDetails?.email || "student@example.com",
        contact: studentDetails?.phone || "9999999999",
        enrollment_id: selectedEnrollmentId,
        course_name: result?.course_name || "Unknown Course",
        course_duration: result?.duration || 0,
        original_fees: result?.total_fees || 0,
        discount_percentage: result?.discount_percentage || 0,
        final_fees: paymentType === "emi" ? amount : finalFees,
        payment_type: paymentType,
        emi_duration: paymentType === "emi" ? emiMonths : null,
        current_emi: paymentType === "emi" ? currentEmi : null,
      });

      if (!data?.success || !data.order || !data.key)
        return toast.error("❌ Order creation failed.");

      let rzpInstance: any;

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "ISML",
        description: "Course Fee Payment",
        order_id: data.order.id,
        prefill: {
          name: studentDetails?.name || "Student",
          email: studentDetails?.email || "student@example.com",
          contact: studentDetails?.phone || "9999999999",
        },
        handler: async (response: any) => {
          // Close modal immediately on success
          if (rzpInstance) {
            rzpInstance.close();
          }

          // Prevent accidental navigation while verification runs
          window.onbeforeunload = (e) => {
            e.preventDefault();
            e.returnValue = "⚠️ Payment is processing, please wait...";
            return "⚠️ Payment is processing, please wait...";
          };

          setIsVerifying(true);
          const toastId = toast.loading("Verifying payment...");

          try {
            await handlePaymentSuccess(data.order.id, response);
            setVerificationSuccess({
              amount: (data.order.amount || 0) / 100,
              paymentId: response.razorpay_payment_id,
              orderId: data.order.id,
              paymentType,
              currentEmi,
            });
            toast.dismiss(toastId);
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error(
              "⚠️ Payment verification failed. We'll retry automatically.",
              { id: toastId }
            );
            localStorage.setItem(
              "pending_payment",
              JSON.stringify({
                orderId: data.order.id,
                response,
                amount: (data.order.amount || 0) / 100,
                paymentType,
                currentEmi,
              })
            );
          } finally {
            setIsVerifying(false);
            window.onbeforeunload = null;
          }
        },
        modal: {
          ondismiss: () => toast("ℹ️ Payment popup closed without completing."),
          escape: true,
        },
        theme: { color: "#3399cc" },
      };

      rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.open();

      rzpInstance.on("payment.failed", (response: any) => {
        console.error("Payment Failed:", response.error);
        toast.error("❌ Payment failed. Please try again.");
      });
    } catch (err) {
      console.error("Razorpay error:", err);
      toast.error("❌ Something went wrong while initiating payment.");
    }
  };

  // ✅ Fetch Enrollments
  useEffect(() => {
    if (!token) return;
    
    const fetchEnrollments = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        const response = await getEnrolledBatches(token);
        const newEnrollments = response.enrollments ?? [];
        
        // Only update if data actually changed (silent background refresh)
        setEnrollments(prevEnrollments => {
          // Check if enrollments actually changed
          const hasChanged = JSON.stringify(prevEnrollments) !== JSON.stringify(newEnrollments);
          if (hasChanged || isInitialLoad) {
            return newEnrollments;
          }
          return prevEnrollments; // No change, keep previous state
        });
        
        // Only set selected enrollment on initial load
        if (isInitialLoad && newEnrollments.length > 0 && !selectedEnrollmentId) {
          setSelectedEnrollmentId(newEnrollments[0].enrollment_id);
        }
      } catch (error) {
        console.error("Failed to fetch enrollments:", error);
        // Only show error on initial load, not during polling
        if (isInitialLoad) {
          toast.error("Failed to load enrolled batches.");
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };
    
    fetchEnrollments(true);
    
    // Set up polling for real-time updates every 5 seconds (silent background refresh)
    const interval = setInterval(() => {
      fetchEnrollments(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [token]); // Removed selectedEnrollmentId from dependencies to prevent unnecessary re-fetches

  // ✅ Fetch Transactions (Only fetches data, state calculation happens in useEffect)
  const fetchTransactions = async (isInitialLoad = false) => {
    if (!token || !registrationNumber) return;
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const response = await getTransactions(token);
      const txns = response.transactions ?? [];
      
      // Only update if data actually changed (silent background refresh)
      setTransactions(prevTransactions => {
        // Check if transactions actually changed
        const hasChanged = JSON.stringify(prevTransactions) !== JSON.stringify(txns);
        if (hasChanged || isInitialLoad) {
          return txns;
        }
        return prevTransactions; // No change, keep previous state
      });
      
      // Payment states (statusApproved, paidMonths) are now calculated 
      // in the useEffect that watches selectedEnrollmentId changes
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      // Only show error on initial load, not during polling
      if (isInitialLoad) {
        toast.error("Failed to load transactions.");
      }
      // Don't clear transactions on polling errors, keep existing data
      if (isInitialLoad) {
        setTransactions([]);
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!token || !registrationNumber) return;
    
    fetchTransactions(true);
    
    // Set up polling for real-time updates every 5 seconds
    const interval = setInterval(() => {
      fetchTransactions(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [token, registrationNumber]);

  useEffect(() => {
    const pendingRaw = localStorage.getItem("pending_payment");
    if (!pendingRaw || !registrationNumber || isVerifying) return;

    try {
      const pending = JSON.parse(pendingRaw);
      if (!pending?.orderId || !pending?.response) {
        localStorage.removeItem("pending_payment");
        return;
      }

      (async () => {
        setIsVerifying(true);
        const toastId = toast.loading("Completing your previous payment...");
        try {
          await handlePaymentSuccess(pending.orderId, pending.response);
          toast.dismiss(toastId);
          setVerificationSuccess({
            amount: pending.amount ?? 0,
            paymentId: pending.response?.razorpay_payment_id ?? "",
            orderId: pending.orderId,
            paymentType: pending.paymentType ?? "full",
            currentEmi: pending.currentEmi,
          });
        } catch (error) {
          console.error("Pending payment verification failed:", error);
          toast.error("We could not verify the previous payment. We'll keep trying automatically.", {
            id: toastId,
          });
        } finally {
          setIsVerifying(false);
        }
      })();
    } catch (error) {
      console.error("Failed to parse pending payment payload:", error);
      localStorage.removeItem("pending_payment");
    }
  }, [registrationNumber, isVerifying]);

  // ✅ Reset and recalculate payment states when selected enrollment changes
  // Use ref to track previous enrollment to detect actual changes
  const prevEnrollmentRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Skip if no enrollment selected
    if (!selectedEnrollmentId) return;

    const isEnrollmentChange = prevEnrollmentRef.current !== selectedEnrollmentId;
    prevEnrollmentRef.current = selectedEnrollmentId;

    // ✅ Always check payment lock status, even if no transactions yet
    // This ensures lock status is recognized after page refresh
    const checkAndSetPaymentLock = async () => {
      try {
        const json = await fetchPaymentLockStatus(registrationNumber, selectedEnrollmentId);
        if (json.success && json.data?.payment_type) {
          setPaymentType(json.data.payment_type);
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } catch (error) {
        setIsLocked(false);
      }
    };

    // If no transactions loaded yet, just check lock and return
    if (transactions.length === 0) {
      checkAndSetPaymentLock();
      return;
    }

    // Filter transactions for the currently selected enrollment ONLY
    const relevantTxns = transactions.filter(
      (txn) => txn.enrollment_id === selectedEnrollmentId
    );

    // Check if full payment is completed for THIS batch ONLY
    // Must be payment_type='full' AND status=true
    const fullPaid = relevantTxns.some(
      (txn) => txn.payment_type === "full" && txn.status === true
    );
    
    // Get paid EMI months for THIS batch ONLY
    const emiPaid = relevantTxns.filter(
      (txn) => txn.payment_type === "emi" && txn.status === true
    );
    const paidEmiMonths = emiPaid.map((e) => e.current_emi || 0);

    // If enrollment changed, reset all states (clean slate for new batch)
    if (isEnrollmentChange) {
      setStatusApproved(fullPaid);
      setPaidMonths(paidEmiMonths);
      setIsLocked(false);
      setPaymentType("full");
      setIsPaying(false);
      checkAndSetPaymentLock();
    } else {
      // Silent background update - only update if values actually changed
      setStatusApproved(prev => prev !== fullPaid ? fullPaid : prev);
      setPaidMonths(prev => {
        const prevStr = JSON.stringify([...prev].sort());
        const newStr = JSON.stringify([...paidEmiMonths].sort());
        return prevStr !== newStr ? paidEmiMonths : prev;
      });
      // Only check lock on enrollment change, not on every transaction update
      // This prevents unnecessary API calls during polling
    }
  }, [selectedEnrollmentId, transactions, registrationNumber]); // Removed enrollments.length to prevent unnecessary re-runs

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderSuccessOverlay = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6 transition-opacity duration-500 ${
        verificationSuccess && successVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {verificationSuccess && (
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-blue-100 animate-[slideUp_0.5s_ease-out]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-blue-500/10" />
          <div className="relative px-8 pt-10 pb-8 sm:px-10 sm:pt-12">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 shadow-lg">
                <CheckCircle className="h-12 w-12 text-white drop-shadow" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold text-gray-900">
              Payment Verified Successfully!
            </h2>
            <p className="mt-3 text-center text-sm sm:text-base text-gray-600">
              Thank you for completing your payment. The transaction has been verified and saved securely.
            </p>

            <div className="mt-6 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="font-semibold text-blue-800">Amount</span>
                <span className="text-blue-900 font-bold">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                  }).format(verificationSuccess.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                <span>Payment ID</span>
                <span className="font-mono text-gray-800">
                  {verificationSuccess.paymentId.slice(0, 10)}…
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                <span>Order ID</span>
                <span className="font-mono text-gray-800">
                  {verificationSuccess.orderId.slice(0, 10)}…
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                <span>Payment Mode</span>
                <span className="font-semibold text-gray-800 uppercase">
                  {verificationSuccess.paymentType}
                  {verificationSuccess.paymentType === "emi" &&
                  verificationSuccess.currentEmi
                    ? ` • EMI ${verificationSuccess.currentEmi}`
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // When embedded in Dashboard, render only content without sidebar/navbar
  if (isEmbedded) {
    return (
      <div className="w-full">
        {renderSuccessOverlay}
        {/* Enhanced Header with Blue Gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-2xl overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute transform rotate-45 -top-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute transform -rotate-45 -bottom-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-lg sm:rounded-xl">
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                  Payment Center
                </h2>
                <p className="text-xs sm:text-sm text-blue-100">
                  Manage your course fees and payments
                </p>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">
                      Total Transactions
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                      {filteredTransactions.length}
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                    <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">
                      Verified
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                      {filteredTransactions.filter((t) => t.status).length}
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Pending</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white mt-1">
                      {filteredTransactions.filter((t) => !t.status).length}
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 sm:p-3 rounded-lg">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🔹 Batch Selector or Selected Batch Info */}
        {isVerifying && (
          <div className="mb-4 sm:mb-6 rounded-lg border border-blue-200 bg-blue-50 px-3 sm:px-4 py-3 sm:py-3.5 text-blue-700 font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 sm:w-5 sm:h-5 animate-spin" />
            <span>Verifying your recent payment. Please stay on this page…</span>
          </div>
        )}

        {hasMultipleEnrollments ? (
          <div className="mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200 shadow-md">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-blue-600 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                    Select Batch to View Payments
                  </label>
                  <div className="relative">
                    <select
                      value={selectedEnrollmentId}
                      onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                      className="w-full appearance-none bg-white border-2 border-blue-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-400"
                    >
                      <option value="">-- Select a Batch --</option>
                      {enrollments.map((enrollment) => (
                        <option
                          key={enrollment.enrollment_id}
                          value={enrollment.enrollment_id}
                        >
                          {enrollment.batches.batch_name} -{" "}
                          {enrollment.batches.courses.course_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                  </div>
                  {selectedEnrollment && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white/60 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">
                        Selected Course:
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-blue-700 break-words">
                        {selectedEnrollment.batches.courses.course_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : enrollments.length === 1 ? (
          <div className="mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-blue-100 text-xs sm:text-sm font-medium">
                    Currently Enrolled In
                  </p>
                  <p className="text-white text-sm sm:text-base md:text-lg font-bold mt-0.5 break-words">
                    {enrollments[0].batches.batch_name} -{" "}
                    {enrollments[0].batches.courses.course_name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modern Tabs - Blue Theme */}
        <div className="mb-6 sm:mb-8">
          <div className="sm:hidden">
            <select
              className="block w-full rounded-lg sm:rounded-xl border-gray-200 py-2.5 sm:py-3 pl-3 sm:pl-4 pr-10 text-sm sm:text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              <option value="current">💳 Make Payment</option>
              <option value="history">📊 Transaction History</option>
            </select>
          </div>

          <div className="hidden sm:block">
            <div className="flex gap-2 sm:gap-4 bg-gradient-to-r from-blue-50 to-blue-100 p-2 rounded-xl border border-blue-100">
              <button
                onClick={() => setActiveTab("current")}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-6 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 ${
                  activeTab === "current"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50"
                    : "text-gray-600 hover:text-blue-700 hover:bg-white/50"
                }`}
              >
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Make Payment</span>
                <span className="sm:hidden">Payment</span>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-6 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50"
                    : "text-gray-600 hover:text-blue-700 hover:bg-white/50"
                }`}
              >
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Transaction History</span>
                <span className="sm:hidden">History</span>
              </button>
            </div>
          </div>

          {/* Payment & Transaction Content */}
          <div className="w-full mt-4 sm:mt-6">
            {activeTab === "current" && (
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {isFreeCourse ? (
                  // Free Course - No Payment Required
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border-2 border-green-300">
                    <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                      <div className="bg-green-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-800 mb-2 sm:mb-3">
                        Already Paid - No Payment Required
                      </h3>
                      <p className="text-green-700 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                        Payment has already been completed for this course ({selectedEnrollment?.batches.courses.course_name}). 
                        You have been automatically enrolled and have full access to the course content.
                      </p>
                      <div className="bg-white/60 rounded-lg p-4 sm:p-5 border border-green-200 max-w-md mx-auto">
                        <p className="text-sm sm:text-base text-green-800 font-medium">
                          ✅ Enrollment Status: <span className="font-bold">Active</span>
                        </p>
                        <p className="text-sm sm:text-base text-green-800 font-medium mt-2">
                          ✅ Access Type: <span className="font-bold">Permanent</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular Course - Payment Required
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                  {/* BERRY Style Header */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-blue-500">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-2.5 rounded-xl flex-shrink-0 shadow-lg">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wide">
                          Make Payment
                        </h3>
                        <p className="text-blue-100 text-xs sm:text-sm mt-1">
                          Complete your course fee payment securely
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-white">
                    {/* 🎯 Instructions Card - Prominently at Top */}
                    <div className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-blue-200 shadow-lg">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-2.5 sm:p-3 rounded-xl flex-shrink-0 shadow-md">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            Payment Instructions
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-start gap-2 sm:gap-3 bg-white/60 rounded-lg p-2.5 sm:p-3 border-l-4 border-blue-500">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                                <span className="font-bold text-blue-700">Step 1:</span> Select your payment type (Full Fees or Monthly Fees) and click <span className="font-bold text-blue-700">"Confirm Selection"</span>
                              </p>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 bg-white/60 rounded-lg p-2.5 sm:p-3 border-l-4 border-blue-500">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                                <span className="font-bold text-blue-700">Step 2:</span> Review the payment details and click <span className="font-bold text-blue-700">"Pay Now"</span> to proceed
                              </p>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 bg-white/60 rounded-lg p-2.5 sm:p-3 border-l-4 border-blue-500">
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                                <span className="font-bold text-blue-700">Important:</span> After payment success in Razorpay, <strong>do not close or refresh</strong> the window. Wait for automatic verification (5-10 seconds).
                              </p>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 bg-white/60 rounded-lg p-2.5 sm:p-3 border-l-4 border-green-500">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                                <span className="font-bold text-green-700">Stay on this page</span> until you see the green "Payment Verified" message. Your payment is safe and secure!
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {result || selectedEnrollment ? (
                      <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 mb-4 sm:mb-6">
                        {/* Registration & Course Info - BERRY Style Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
                            <label className="block text-xs sm:text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-blue-600" />
                              Registration Number
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={result?.registration_number || registrationNumber}
                              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-blue-300 rounded-lg shadow-sm bg-white text-gray-800 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            />
                          </div>

                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
                            <label className="block text-xs sm:text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                              Course Name
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={result?.course_name || selectedEnrollment?.batches.courses.course_name || ""}
                              className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-blue-300 rounded-lg shadow-sm bg-white text-gray-800 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            />
                          </div>
                        </div>

                        {/* Payment Type Selection - BERRY Style Prominent Section */}
                        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
                          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                            <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-2.5 sm:p-3 rounded-xl shadow-md">
                              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                              <label className="block text-base sm:text-lg md:text-xl font-bold text-gray-800">
                                Select Payment Type
                              </label>
                              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                                Choose how you want to pay for this course
                              </p>
                            </div>
                          </div>
                          
                          {!isLocked && result && (
                            <div className="mb-4 sm:mb-5 p-3 sm:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-r-xl shadow-sm">
                              <div className="flex items-start gap-2 sm:gap-3">
                                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs sm:text-sm text-yellow-800 font-semibold">
                                  ⚠️ Please select your payment type and confirm before proceeding to payment
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                            <label className={`flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex-1 sm:flex-initial ${
                              paymentType === "full" && isLocked
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700 shadow-xl scale-105"
                                : paymentType === "full"
                                ? "bg-gradient-to-r from-blue-400 to-blue-500 border-blue-500 shadow-lg"
                                : "bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md"
                            } ${isLocked ? "opacity-100" : ""}`}>
                              <input
                                type="radio"
                                name="paymentType"
                                value="full"
                                checked={paymentType === "full"}
                                disabled={isLocked}
                                onChange={() => {
                                  setPaymentType("full");
                                  setPaidMonths([]);
                                }}
                                className="w-4 h-4 sm:w-5 sm:h-5 text-white focus:ring-blue-400 flex-shrink-0"
                              />
                              <div className="ml-3 sm:ml-4 flex items-center gap-2 sm:gap-3">
                                <Wallet className={`w-5 h-5 sm:w-6 sm:h-6 ${paymentType === "full" && isLocked ? "text-white" : paymentType === "full" ? "text-white" : "text-blue-600"}`} />
                                <span className={`font-bold text-sm sm:text-base md:text-lg ${
                                  paymentType === "full" && isLocked ? "text-white" : paymentType === "full" ? "text-white" : "text-gray-700"
                                }`}>
                                  Full Fees
                                </span>
                                {paymentType === "full" && isLocked && (
                                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                )}
                              </div>
                            </label>

                            {(result?.duration || selectedEnrollment?.batches.duration) && (parseInt(result?.duration || selectedEnrollment?.batches.duration || "1") > 1) && (
                              <label className={`flex items-center px-4 sm:px-5 py-3 sm:py-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex-1 sm:flex-initial ${
                                paymentType === "emi" && isLocked
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-700 shadow-xl scale-105"
                                  : paymentType === "emi"
                                  ? "bg-gradient-to-r from-blue-400 to-blue-500 border-blue-500 shadow-lg"
                                  : "bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md"
                              } ${isLocked ? "opacity-100" : ""}`}>
                                <input
                                  type="radio"
                                  name="paymentType"
                                  value="emi"
                                  checked={paymentType === "emi"}
                                  disabled={isLocked}
                                  onChange={() => {
                                    setPaymentType("emi");
                                    setPaidMonths([]);
                                  }}
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-white focus:ring-blue-400 flex-shrink-0"
                                />
                                <div className="ml-3 sm:ml-4 flex items-center gap-2 sm:gap-3">
                                  <CreditCard className={`w-5 h-5 sm:w-6 sm:h-6 ${paymentType === "emi" && isLocked ? "text-white" : paymentType === "emi" ? "text-white" : "text-blue-600"}`} />
                                  <span className={`font-bold text-sm sm:text-base md:text-lg ${
                                    paymentType === "emi" && isLocked ? "text-white" : paymentType === "emi" ? "text-white" : "text-gray-700"
                                  }`}>
                                    Monthly Fees
                                  </span>
                                  {paymentType === "emi" && isLocked && (
                                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                  )}
                                </div>
                              </label>
                            )}
                          </div>
                          
                          {/* Confirm Selection Button - BERRY Style */}
                          {!isLocked && result && (totalFees > 0 || finalFees > 0) && (
                            <div className="mt-4 sm:mt-5">
                              <button
                                onClick={handleLockPayment}
                                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 transform hover:scale-[1.02]"
                              >
                                <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                                Confirm Selection
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Full Fees Section - BERRY Style */}
                        {paymentType === "full" && (
                          <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 mb-3 sm:mb-4">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b-2 border-gray-200">
                              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 sm:p-3 rounded-xl shadow-md">
                                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                                Payment Details
                              </h4>
                            </div>

                            {!result && loading ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600">Loading payment details...</span>
                              </div>
                            ) : (
                              <div className="space-y-4 sm:space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
                                    <label className="block text-xs sm:text-sm font-semibold text-blue-700 mb-2">
                                      Original Fees
                                    </label>
                                    <div className="text-xl sm:text-2xl font-bold text-blue-900">
                                      ₹{totalFees || 0}
                                    </div>
                                  </div>

                                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
                                    <label className="block text-xs sm:text-sm font-semibold text-blue-700 mb-2">
                                      Discount Percentage
                                    </label>
                                    <div className="text-xl sm:text-2xl font-bold text-blue-900">
                                      {discountPercentage || 0}%
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-xl">
                                  <label className="block text-xs sm:text-sm font-semibold text-blue-100 mb-2 sm:mb-3">
                                    Final Amount to Pay
                                  </label>
                                  <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center">
                                    ₹{finalFees || 0}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Pay Button - BERRY Style */}
                            {isLocked && result && finalFees > 0 && (
                              <div className="mt-5 sm:mt-6">
                                <button
                                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl sm:rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 ${
                                    statusApproved
                                      ? "bg-gradient-to-r from-green-500 to-emerald-600 cursor-not-allowed"
                                      : isPaying || isVerifying
                                      ? "bg-gradient-to-r from-blue-500 to-blue-600 cursor-wait"
                                      : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-2xl transform hover:scale-[1.02]"
                                  } text-white`}
                                  onClick={async () => {
                                    if (!isLocked) {
                                      toast.error("Please confirm your payment type selection first");
                                      return;
                                    }
                                    setIsPaying(true);
                                    await handlePayment(finalFees);
                                    setIsPaying(false);
                                  }}
                                  disabled={statusApproved || isPaying || isVerifying || !result || finalFees === 0 || !isLocked}
                                  title={!isLocked ? "Please confirm your payment type selection first" : ""}
                                >
                                  {statusApproved ? (
                                    <>
                                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                                      <span className="text-sm sm:text-base">Payment Completed</span>
                                    </>
                                  ) : isVerifying ? (
                                    <>
                                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                      <span className="text-sm sm:text-base">Verifying payment...</span>
                                    </>
                                  ) : isPaying ? (
                                    <>
                                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                      <span className="text-sm sm:text-base">Processing Payment...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
                                      <span className="text-sm sm:text-base">Pay Now</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                          </div>
                        )}

                        {/* EMI Section */}
                        {paymentType === "emi" && (
                          <div className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-md border border-blue-200 mb-3 sm:mb-4">
                            <h4 className="text-base sm:text-lg font-bold text-blue-700 mb-3 sm:mb-4 flex items-center gap-2">
                              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
                              Monthly Payment Plan
                            </h4>

                            {/* Calculate EMI amount - equal division across all cycles */}
                            {(() => {
                              // Calculate EMI amount: total_fees / total_months (equal for all cycles)
                              const emiAmount = Math.round(finalFees / emiMonths);
                              // Calculate total with this EMI amount
                              const totalWithEmi = emiAmount * emiMonths;
                              // Calculate remainder/difference
                              const difference = finalFees - totalWithEmi;
                              
                              return (
                                <>
                                  {/* EMI Summary Card */}
                                  <div className="mb-4 sm:mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
                                      <p className="text-xs sm:text-sm text-blue-600 font-semibold mb-1">
                                        Course Full Fees
                                      </p>
                                      <p className="text-lg sm:text-xl font-bold text-blue-900">
                                        ₹{totalFees}
                                      </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 shadow-sm">
                                      <p className="text-xs sm:text-sm text-blue-600 font-semibold mb-1">
                                        Course Duration
                                      </p>
                                      <p className="text-lg sm:text-xl font-bold text-blue-900">
                                        {emiMonths} Month{emiMonths !== 1 ? 's' : ''}
                                      </p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200 shadow-sm">
                                      <p className="text-xs sm:text-sm text-green-600 font-semibold mb-1">
                                        Split Amount (EMI)
                                      </p>
                                      <p className="text-lg sm:text-xl font-bold text-green-900">
                                        ₹{emiAmount}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Monthly Amount Display */}
                                  <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-100 rounded-lg border border-blue-200">
                                    <p className="text-xs sm:text-sm text-blue-700">
                                      <span className="font-semibold">Monthly Payment Amount:</span>{" "}
                                      <span className="text-lg sm:text-xl font-bold text-blue-900">
                                        ₹{emiAmount}
                                      </span>
                                    </p>
                                    {difference !== 0 && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        Note: {difference > 0 ? 'Last' : 'First'} payment will be ₹{emiAmount + difference} to ensure total equals ₹{finalFees}
                                      </p>
                                    )}
                                  </div>

                                  {/* EMI Month Buttons */}
                                  <div className="space-y-2 sm:space-y-3">
                                    {Array.from({ length: emiMonths }).map((_, idx) => {
                                      const month = idx + 1;
                                      // Calculate EMI amount for this specific month
                                      // Adjust first or last payment to include difference to ensure total = finalFees
                                      let monthlyAmount = emiAmount;
                                      if (difference !== 0) {
                                        if (difference > 0) {
                                          // Add difference to last payment
                                          monthlyAmount = month === emiMonths ? emiAmount + difference : emiAmount;
                                        } else {
                                          // Subtract difference from first payment (difference is negative)
                                          monthlyAmount = month === 1 ? emiAmount + difference : emiAmount;
                                        }
                                      }
                                const isPaid = paidMonths.includes(month);
                                const lastPaid =
                                  paidMonths.length > 0
                                    ? Math.max(...paidMonths)
                                    : 0;
                                const isNextPayMonth = month === lastPaid + 1;
                                const isDisabled = isPaid || !isNextPayMonth;

                                return (
                                  <div
                                    key={month}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-3 sm:px-5 py-3 sm:py-4 border-2 border-blue-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                  >
                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0 ${
                                        isPaid 
                                          ? "bg-green-500 text-white" 
                                          : isNextPayMonth
                                          ? "bg-blue-600 text-white"
                                          : "bg-gray-300 text-gray-600"
                                      }`}>
                                        {month}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-700">
                                          Month {month}
                                        </p>
                                        <p className="text-base sm:text-lg font-bold text-blue-700">
                                          ₹{emiAmount}
                                        </p>
                                        {difference !== 0 && ((difference > 0 && month === emiMonths) || (difference < 0 && month === 1)) && (
                                          <p className="text-xs text-blue-600 mt-0.5">
                                            Actual: ₹{monthlyAmount}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      className={`w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 flex-shrink-0 ${
                                        isPaid
                                          ? "bg-green-500 text-white cursor-not-allowed"
                                          : !isLocked
                                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                          : isNextPayMonth
                                          ? isVerifying || isPaying
                                            ? "bg-blue-500 text-white cursor-wait"
                                            : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg"
                                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                      }`}
                                      onClick={async () => {
                                        if (!isLocked) {
                                          toast.error("Please confirm your payment type selection first");
                                          return;
                                        }
                                        if (isNextPayMonth && !isPaid) {
                                          setIsPaying(true);
                                          await handlePayment(
                                            monthlyAmount,
                                            month
                                          );
                                          setIsPaying(false);
                                        }
                                      }}
                                      disabled={isDisabled || isPaying || isVerifying || !isLocked}
                                      title={!isLocked ? "Please confirm your payment type selection first" : ""}
                                    >
                                      {isPaid ? (
                                        <>
                                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                          <span>Paid</span>
                                        </>
                                      ) : isNextPayMonth ? (
                                        isVerifying ? (
                                          <>
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                            <span>Verifying...</span>
                                          </>
                                        ) : isPaying ? (
                                          <>
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                            <span>Processing...</span>
                                          </>
                                        ) : (
                                          <>
                                            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            <span>Pay Now</span>
                                          </>
                                        )
                                      ) : (
                                        <span>Upcoming</span>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                                </>
                              );
                            })()}

                            {/* Next EMI Due Date Display */}
                            {(() => {
                              // Find the latest approved EMI payment for this enrollment
                              const latestEmiPayment = filteredTransactions
                                .filter(txn => txn.payment_type === "emi" && txn.status === true)
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                              
                              if (latestEmiPayment?.next_emi_due_date) {
                                const dueDate = new Date(latestEmiPayment.next_emi_due_date);
                                const today = new Date();
                                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                
                                return (
                                  <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="bg-green-500 p-2 rounded-full">
                                        <Clock className="h-5 w-5 text-white" />
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-bold text-green-800 mb-1">
                                          Next EMI Due Date
                                        </h5>
                                        <p className="text-sm text-green-700">
                                          <span className="font-semibold">
                                            {dueDate.toLocaleDateString('en-US', { 
                                              weekday: 'long', 
                                              year: 'numeric', 
                                              month: 'long', 
                                              day: 'numeric' 
                                            })}
                                          </span>
                                          {daysUntilDue > 0 && (
                                            <span className="ml-2 text-green-600">
                                              ({daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} remaining)
                                            </span>
                                          )}
                                          {daysUntilDue === 0 && (
                                            <span className="ml-2 text-orange-600 font-semibold">
                                              (Due today!)
                                            </span>
                                          )}
                                          {daysUntilDue < 0 && (
                                            <span className="ml-2 text-red-600 font-semibold">
                                              (Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''})
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Payment Instructions */}
                            <div className="mt-4 bg-blue-100 border-2 border-blue-300 rounded-lg p-4">
                              <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                  <div className="bg-blue-600 p-2 rounded-full">
                                    <AlertCircle className="h-5 w-5 text-white" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-bold text-blue-800 mb-2">
                                    Important Payment Instructions
                                  </h5>
                                  <ul className="text-sm text-blue-700 space-y-1.5">
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 font-bold">•</span>
                                      <span>When you see the "Payment Successful" message in Razorpay, <strong>do not refresh or close the window</strong>. Wait about 5 seconds - the payment window will close automatically, then wait for the confirmation on this page.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 font-bold">•</span>
                                      <span>Please <strong>stay on this page</strong> and wait for the green success message that confirms your payment was received.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 font-bold">•</span>
                                      <span>You'll see a loading animation while we confirm your payment. This usually takes just a few seconds.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 font-bold">•</span>
                                      <span>Don't worry if it takes a moment - we're making sure your payment is recorded correctly. Your money is safe and secure!</span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : loading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600 font-medium">
                          Loading payment details...
                        </p>
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4">
                        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />

                        {/* Show selected batch info if available */}
                        {selectedEnrollment && result && (
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4 max-w-md">
                            <p className="text-sm font-semibold text-blue-900 mb-1">
                              Selected Batch
                            </p>
                            <p className="text-lg font-bold text-blue-700">
                              {result.batch_name}
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                              {result.course_name}
                            </p>
                          </div>
                        )}

                        <p className="text-gray-700 font-medium mb-3 text-center max-w-lg">
                          {error}
                        </p>

                        {hasMultipleEnrollments && !selectedEnrollmentId ? (
                          <p className="text-sm text-gray-500">
                            Select a batch from the dropdown above
                          </p>
                        ) : (
                          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md">
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Next Steps:</strong>
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                              <li>Contact your center administrator</li>
                              <li>Or reach out to support for assistance</li>
                              <li>Payment can be processed manually</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 mt-4 text-center py-8">
                        No payment details available
                      </p>
                    )}
                  </div>
                </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-blue-100">
                {/* Header - Blue Background */}
                <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-blue-500">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-white/20 backdrop-blur-sm p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                      <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-wide">
                        Transaction History
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                        View all your payment transactions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 md:p-6">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-600">
                        No transactions found
                      </p>
                      <p className="mt-1 text-xs sm:text-sm text-gray-500">
                        {hasMultipleEnrollments && !selectedEnrollmentId
                          ? "Please select a batch to view its payment history"
                          : "Submit a payment to see it appear here"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="block md:hidden space-y-3">
                        {filteredTransactions.map((txn) => (
                          <div
                            key={txn.payment_id}
                            className="bg-white rounded-lg border border-blue-200 shadow-sm p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-1">Date</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatDate(txn.created_at)}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg whitespace-nowrap ${
                                  txn.status
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-blue-100 text-blue-700 border border-blue-300"
                                }`}
                              >
                                {txn.status ? "✓ Verified" : "⏳ Pending"}
                              </span>
                            </div>
                            
                            <div className="border-t border-blue-100 pt-3">
                              <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                              <p className="text-xs text-blue-600 font-mono break-all">
                                {txn.payment_id}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Course</p>
                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {txn.course_name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Amount</p>
                                <p className="text-sm font-bold text-gray-900">
                                  ₹{txn.final_fees}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Type</p>
                                <span className="inline-block px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-200">
                                  {txn.payment_type}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">EMI</p>
                                <p className="text-sm font-medium text-gray-700">
                                  {txn.current_emi || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto rounded-lg sm:rounded-xl shadow-sm -mx-3 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full divide-y divide-blue-100">
                            <thead className="bg-blue-100">
                              <tr>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                                  Date
                                </th>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                                  Trans. ID
                                </th>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                                  Course
                                </th>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                                  Amount
                                </th>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                                  Type
                                </th>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                                  EMI
                                </th>
                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider whitespace-nowrap">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-blue-50">
                              {filteredTransactions.map((txn) => (
                                <tr
                                  key={txn.payment_id}
                                  className="hover:bg-blue-50 transition-colors duration-200"
                                >
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 font-medium whitespace-nowrap">
                                    {formatDate(txn.created_at)}
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center text-blue-600 font-mono whitespace-nowrap">
                                    <span className="inline-block max-w-[120px] truncate" title={txn.payment_id}>
                                      {txn.payment_id}
                                    </span>
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700">
                                    <span className="line-clamp-2">{txn.course_name}</span>
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-900 font-semibold whitespace-nowrap">
                                    ₹{txn.final_fees}
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-200 whitespace-nowrap">
                                      {txn.payment_type}
                                    </span>
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center text-gray-700 whitespace-nowrap">
                                    {txn.current_emi || "-"}
                                  </td>
                                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                                    <span
                                      className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-lg whitespace-nowrap inline-block ${
                                        txn.status
                                          ? "bg-blue-600 text-white shadow-sm"
                                          : "bg-blue-100 text-blue-700 border border-blue-300"
                                      }`}
                                    >
                                      {txn.status ? "✓ Verified" : "⏳ Pending"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Standalone version with Sidebar and Navbar
  return (
    <>
      {renderSuccessOverlay}
      <div 
        className="min-h-screen bg-gradient-to-br from-gray-50 to-white transition-all duration-300"
        style={{ marginLeft: isDesktop ? sidebarWidth : '0' }}
      >
        <Sidebar />

        {/* Navbar - BERRY Style */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(to bottom right, #2196f3, #1976d2)' }}>
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Payment Management</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Welcome, {studentDetails?.name || 'Student'}</p>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Payment Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto py-4 sm:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-600">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 mr-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Payments
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {filteredTransactions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-600">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 mr-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Approved
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {filteredTransactions.filter((t) => t.status).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-600">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100 mr-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Pending
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {filteredTransactions.filter((t) => !t.status).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isVerifying && (
            <div className="mb-4 sm:mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700 font-medium flex items-center gap-2">
              <Clock className="w-5 h-5 animate-spin" />
              <span>Verifying your recent payment. Please stay on this page…</span>
            </div>
          )}

          {/* 🔹 Batch Selector (Standalone Version) */}
          {hasMultipleEnrollments ? (
            <div className="mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-200 shadow-md">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="bg-blue-600 p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                    <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                      Select Batch to View Payments
                    </label>
                    <div className="relative">
                      <select
                        value={selectedEnrollmentId}
                        onChange={(e) =>
                          setSelectedEnrollmentId(e.target.value)
                        }
                        className="w-full appearance-none bg-white border-2 border-blue-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-gray-800 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-400"
                      >
                        <option value="">-- Select a Batch --</option>
                        {enrollments.map((enrollment) => (
                          <option
                            key={enrollment.enrollment_id}
                            value={enrollment.enrollment_id}
                          >
                            {enrollment.batches.batch_name} -{" "}
                            {enrollment.batches.courses.course_name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                    </div>
                    {selectedEnrollment && (
                      <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-white/60 rounded-lg border border-blue-200">
                        <p className="text-xs text-gray-600 mb-1">
                          Selected Course:
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-blue-700 break-words">
                          {selectedEnrollment.batches.courses.course_name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : enrollments.length === 1 ? (
            <div className="mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-2.5 rounded-lg flex-shrink-0">
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">
                      Currently Enrolled In
                    </p>
                    <p className="text-white text-sm sm:text-base md:text-lg font-bold mt-0.5 break-words">
                      {enrollments[0].batches.batch_name} -{" "}
                      {enrollments[0].batches.courses.course_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Tabs */}
          <div className="mb-6">
            <div className="sm:hidden">
              <select
                className="block w-full rounded-md border-gray-200 py-2 pl-3 pr-10 text-base focus:border-blue-600 focus:outline-none focus:ring-blue-600 sm:text-sm"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                <option value="current">Make Payment</option>
                <option value="history">Transaction History</option>
              </select>
            </div>

            <div className="hidden sm:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab("current")}
                    className={`${
                      activeTab === "current"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Make Payment
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`${
                      activeTab === "history"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Receipt className="h-5 w-5 mr-2" />
                    Transaction History
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "current" && (
              <div className="bg-blue-50 rounded-2xl shadow-xl overflow-hidden border border-blue-200">
                {/* Gradient Blue Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-400">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-wide">
                        Make Payment
                      </h3>
                      <p className="text-blue-100 text-sm mt-0.5">
                        Complete your course fee payment securely
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {!result && (
                    <div className="flex items-center justify-center p-8 bg-white rounded-xl shadow-md border border-blue-100">
                      <div className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-blue-400" />
                        <p className="mt-2 text-sm text-gray-600 font-medium">
                          No course fee data available
                        </p>
                      </div>
                    </div>
                  )}

                  {result && (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
                      {/* Course Information Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            Course Name
                          </p>
                          <p className="mt-1 text-lg font-bold text-blue-900">
                            {result.course_name}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            Duration
                          </p>
                          <p className="mt-1 text-lg font-bold text-blue-900">
                            {result.duration} Months
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            Total Fees
                          </p>
                          <p className="mt-1 text-lg font-bold text-blue-900">
                            ₹{totalFees}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            Discount
                          </p>
                          <p className="mt-1 text-lg font-bold text-blue-900">
                            {discountPercentage}%
                          </p>
                        </div>
                      </div>

                      {/* Final Amount Display */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-6 shadow-lg mb-6">
                        <p className="text-sm font-semibold opacity-90">
                          Final Payable Amount
                        </p>
                        <p className="mt-2 text-4xl font-bold">₹{finalFees}</p>
                      </div>

                      {/* Divider */}
                      <div className="my-6 border-t-2 border-blue-200"></div>

                      {/* Payment Type Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-semibold text-blue-700 mb-3">
                          Select Payment Type
                        </label>
                        <div className="flex flex-wrap gap-4 items-center">
                          <label className="flex items-center bg-blue-50 px-4 py-3 rounded-lg border-2 border-blue-300 cursor-pointer hover:bg-blue-100 transition-all duration-200">
                            <input
                              type="radio"
                              name="paymentType"
                              value="full"
                              checked={paymentType === "full"}
                              onChange={() => setPaymentType("full")}
                              disabled={isLocked}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-400"
                            />
                            <span className="ml-3 font-semibold text-gray-700">
                              Full Payment
                            </span>
                          </label>
                          <label className="flex items-center bg-blue-50 px-4 py-3 rounded-lg border-2 border-blue-300 cursor-pointer hover:bg-blue-100 transition-all duration-200">
                            <input
                              type="radio"
                              name="paymentType"
                              value="emi"
                              checked={paymentType === "emi"}
                              onChange={() => setPaymentType("emi")}
                              disabled={isLocked}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-400"
                            />
                            <span className="ml-3 font-semibold text-gray-700">
                              EMI
                            </span>
                          </label>
                        </div>
                      </div>

                      {!isLocked && (
                        <button
                          onClick={handleLockPayment}
                          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          Confirm Selection
                        </button>
                      )}

                      {isLocked && paymentType === "full" && (
                        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-md border border-blue-200">
                          <button
                            onClick={() => {
                              if (!isLocked) {
                                toast.error("Please confirm your payment type selection first");
                                return;
                              }
                              handlePayment(finalFees, 0);
                            }}
                            disabled={isPaying || statusApproved || !isLocked}
                            className={`w-full px-6 py-4 text-lg font-bold rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                              statusApproved || isPaying || !isLocked
                                ? "bg-green-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 hover:shadow-xl"
                            } text-white`}
                            title={!isLocked ? "Please confirm your payment type selection first" : ""}
                          >
                            {statusApproved ? (
                              <>
                                <CheckCircle className="w-6 h-6" />
                                Payment Completed
                              </>
                            ) : isPaying ? (
                              <>
                                <Clock className="w-6 h-6 animate-spin" />
                                Processing Payment...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-6 h-6" />
                                Pay Full Amount: ₹{finalFees}
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {isLocked && paymentType === "emi" && (
                        <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-md border border-blue-200">
                          <h4 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2">
                            <Receipt className="w-5 h-5" />
                            Monthly Payment Plan
                          </h4>

                          {/* Calculate EMI amount - equal division across all cycles */}
                          {(() => {
                            // Calculate EMI amount: total_fees / total_months (equal for all cycles)
                            const emiAmount = Math.round(finalFees / emiMonths);
                            // Calculate total with this EMI amount
                            const totalWithEmi = emiAmount * emiMonths;
                            // Calculate remainder/difference
                            const difference = finalFees - totalWithEmi;
                            
                            return (
                              <>
                                {/* EMI Summary Card */}
                                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-md">
                                    <p className="text-sm text-blue-600 font-semibold mb-2">
                                      Course Full Fees
                                    </p>
                                    <p className="text-2xl font-bold text-blue-900">
                                      ₹{totalFees}
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-md">
                                    <p className="text-sm text-blue-600 font-semibold mb-2">
                                      Course Duration
                                    </p>
                                    <p className="text-2xl font-bold text-blue-900">
                                      {emiMonths} Month{emiMonths !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 shadow-md">
                                    <p className="text-sm text-green-600 font-semibold mb-2">
                                      Split Amount (EMI)
                                    </p>
                                    <p className="text-2xl font-bold text-green-900">
                                      ₹{emiAmount}
                                    </p>
                                  </div>
                                </div>

                                {/* Monthly Amount Display */}
                                <div className="mb-4 p-4 bg-blue-100 rounded-lg border border-blue-200">
                                  <p className="text-sm text-blue-700">
                                    <span className="font-semibold">Monthly Payment Amount:</span>{" "}
                                    <span className="text-xl font-bold text-blue-900">
                                      ₹{emiAmount}
                                    </span>
                                  </p>
                                  {difference !== 0 && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      Note: {difference > 0 ? 'Last' : 'First'} payment will be ₹{emiAmount + difference} to ensure total equals ₹{finalFees}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-3">
                                  {Array.from({ length: emiMonths }).map((_, index) => {
                                    const month = index + 1;
                                    // Calculate EMI amount for this specific month
                                    // Adjust first or last payment to include difference to ensure total = finalFees
                                    let monthlyAmount = emiAmount;
                                    if (difference !== 0) {
                                      if (difference > 0) {
                                        // Add difference to last payment
                                        monthlyAmount = month === emiMonths ? emiAmount + difference : emiAmount;
                                      } else {
                                        // Subtract difference from first payment (difference is negative)
                                        monthlyAmount = month === 1 ? emiAmount + difference : emiAmount;
                                      }
                                    }
                              const isPaid = paidMonths.includes(month);
                              const lastPaid = paidMonths.length > 0 ? Math.max(...paidMonths) : 0;
                              const isNextPayMonth = month === lastPaid + 1;
                              const isDisabled = isPaid || !isNextPayMonth;

                              return (
                                <div
                                  key={month}
                                  className="flex items-center justify-between px-5 py-4 border-2 border-blue-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                      isPaid 
                                        ? "bg-green-500 text-white" 
                                        : isNextPayMonth
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-300 text-gray-600"
                                    }`}>
                                      {month}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-700">
                                        EMI {month} of {emiMonths}
                                      </p>
                                      <p className="text-lg font-bold text-blue-700">
                                        ₹{emiAmount}
                                      </p>
                                      {difference !== 0 && ((difference > 0 && month === emiMonths) || (difference < 0 && month === 1)) && (
                                        <p className="text-xs text-blue-600 mt-0.5">
                                          Actual: ₹{monthlyAmount}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    className={`px-5 py-2.5 text-sm font-bold rounded-lg shadow-md transition-all duration-200 flex items-center gap-2 ${
                                      isPaid
                                        ? "bg-green-500 text-white cursor-not-allowed"
                                        : isNextPayMonth
                                        ? isPaying
                                          ? "bg-blue-400 text-white cursor-not-allowed"
                                          : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg"
                                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                    }`}
                                    onClick={async () => {
                                      if (isNextPayMonth && !isPaid) {
                                        setIsPaying(true);
                                        await handlePayment(monthlyAmount, month);
                                        setIsPaying(false);
                                      }
                                    }}
                                    disabled={isDisabled || isPaying}
                                  >
                                    {isPaid ? (
                                      <>
                                        <CheckCircle className="w-4 h-4" />
                                        Paid
                                      </>
                                    ) : isNextPayMonth ? (
                                      isPaying ? (
                                        <>
                                          <Clock className="w-4 h-4 animate-spin" />
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <CreditCard className="w-4 h-4" />
                                          Pay Now
                                        </>
                                      )
                                    ) : (
                                      "Upcoming"
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-blue-100">
                {/* Header - Blue Background */}
                <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-500">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-wide">
                        Transaction History
                      </h3>
                      <p className="text-sm text-blue-100 mt-0.5">
                        View all your payment transactions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center p-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-sm text-gray-600">
                          Loading transactions...
                        </p>
                      </div>
                    </div>
                  ) : filteredTransactions.length === 0 ? (
                    <div className="flex items-center justify-center p-12">
                      <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                          <Receipt className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-600">
                          No transactions found
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {hasMultipleEnrollments && !selectedEnrollmentId
                            ? "Please select a batch to view its payment history"
                            : "Submit a payment to see it appear here"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="block md:hidden p-4 space-y-3">
                        {filteredTransactions.map((txn) => (
                          <div
                            key={txn.transaction_id || txn.payment_id}
                            className="bg-white rounded-lg border border-blue-200 shadow-sm p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-1">Date</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {formatDate(txn.created_at)}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg whitespace-nowrap ${
                                  txn.status
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-blue-100 text-blue-700 border border-blue-300"
                                }`}
                              >
                                {txn.status ? "✓ Verified" : "⏳ Pending"}
                              </span>
                            </div>
                            
                            <div className="border-t border-blue-100 pt-3">
                              <p className="text-xs text-gray-500 mb-1">Payment ID</p>
                              <p className="text-xs text-blue-600 font-mono break-all">
                                {txn.payment_id}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Course</p>
                                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {txn.course_name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Amount</p>
                                <p className="text-sm font-bold text-gray-900">
                                  ₹{txn.final_fees}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Type</p>
                                <span className="inline-block px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-200">
                                  {txn.payment_type}
                                </span>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">EMI</p>
                                <p className="text-sm font-medium text-gray-700">
                                  {txn.current_emi || "-"}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block p-4 sm:p-6">
                        <div className="rounded-xl shadow-sm overflow-hidden">
                          <table className="min-w-full divide-y divide-blue-100">
                            <thead className="bg-blue-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  Payment ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  Course
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  Type
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  EMI
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-blue-50">
                              {filteredTransactions.map((txn) => (
                                <tr
                                  key={txn.transaction_id || txn.payment_id}
                                  className="hover:bg-blue-50 transition-colors duration-200"
                                >
                                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                    {formatDate(txn.created_at)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center text-blue-600 font-mono">
                                    {txn.payment_id}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {txn.course_name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-gray-900 font-semibold">
                                    ₹{txn.final_fees}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-full border border-blue-200">
                                      {txn.payment_type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-center text-gray-700">
                                    {txn.current_emi || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span
                                      className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                                        txn.status
                                          ? "bg-blue-600 text-white shadow-sm"
                                          : "bg-blue-100 text-blue-700 border border-blue-300"
                                      }`}
                                    >
                                      {txn.status ? "✓ Verified" : "⏳ Pending"}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};

export default Payments;
