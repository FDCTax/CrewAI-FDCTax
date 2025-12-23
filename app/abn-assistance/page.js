'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  FileText, User, Phone, Building2, Briefcase, Receipt, CheckSquare,
  CreditCard, CheckCircle, ArrowRight, ArrowLeft, Loader2, MessageCircle,
  X, Send, HelpCircle, DollarSign, Calendar, MapPin
} from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Stripe Card Element styling
const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#dc2626',
      iconColor: '#dc2626'
    }
  }
};

// Separate PaymentForm component that uses Stripe hooks
function PaymentForm({ formData, userId, submitting, setSubmitting, setError, updateField, submitForm, setStage }) {
  const stripe = useStripe();
  const elements = useElements();
  
  const handlePayment = async () => {
    if (!stripe || !elements) {
      setError('Payment system not loaded. Please refresh and try again.');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Create payment intent
      const res = await fetch('/api/abn-assistance/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: userId,
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`
        })
      });
      
      const data = await res.json();
      
      if (!data.clientSecret) {
        throw new Error(data.error || 'Failed to create payment');
      }
      
      const { clientSecret, paymentIntentId } = data;
      
      // Confirm payment with card element
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email
          }
        }
      });
      
      if (paymentError) {
        throw new Error(paymentError.message);
      }
      
      if (paymentIntent.status === 'succeeded') {
        updateField('paymentComplete', true);
        updateField('paymentIntentId', paymentIntentId);
        await submitForm();
        setStage(9);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Test card: 4242 4242 4242 4242, any future date, any CVC
        </p>
      </div>
      
      <button
        onClick={handlePayment}
        disabled={submitting || !stripe}
        className="w-full py-3 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay $99.00
          </>
        )}
      </button>
    </div>
  );
}

const STAGES = [
  { id: 1, title: 'Welcome', icon: FileText },
  { id: 2, title: 'Personal Details', icon: User },
  { id: 3, title: 'Contact Information', icon: Phone },
  { id: 4, title: 'Business Structure', icon: Building2 },
  { id: 5, title: 'Business Details', icon: Briefcase },
  { id: 6, title: 'GST Registration', icon: Receipt },
  { id: 7, title: 'Declaration', icon: CheckSquare },
  { id: 8, title: 'Payment', icon: CreditCard },
  { id: 9, title: 'Complete', icon: CheckCircle }
];

export default function ABNAssistancePage() {
  // Hardcoded for Sandbox - will be dynamic with auth later
  const [userId] = useState(143000);
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Luna Chat
  const [showLunaChat, setShowLunaChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    // Stage 1: Welcome
    wantsAssistance: null, // true = $99 service, false = guide free
    
    // Stage 2: Personal
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    tfn: '',
    
    // Stage 3: Contact
    email: '',
    mobile: '',
    addressLine1: '',
    addressLine2: '',
    suburb: '',
    state: '',
    postcode: '',
    
    // Stage 4: Structure
    businessStructure: 'sole_trader', // sole_trader, partnership, trust, company
    
    // Stage 5: Business Details
    tradingName: '',
    businessStartDate: '',
    businessLocation: '',
    anzsicCode: '8710', // Family Day Care Services
    
    // Stage 6: GST
    registerForGST: null, // 'yes', 'no', 'unsure'
    estimatedTurnover: '',
    gstStartDate: '',
    gstBasis: 'quarterly', // quarterly, monthly, annual
    
    // Stage 7: Declaration
    declarationAccepted: false,
    
    // Stage 8: Payment
    paymentComplete: false,
    paymentIntentId: ''
  });
  
  // Pre-fill from database
  useEffect(() => {
    loadClientData();
  }, [userId]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const loadClientData = async () => {
    try {
      const res = await fetch(`/api/clients/${userId}`);
      const data = await res.json();
      
      if (data.client) {
        const c = data.client;
        setFormData(prev => ({
          ...prev,
          firstName: c.first_name || '',
          middleName: c.middle_name || '',
          lastName: c.last_name || '',
          dateOfBirth: c.birth_date || '',
          tfn: c.tfn || '',
          email: c.email || '',
          mobile: c.mobile || '',
          addressLine1: c.residential_address_line_1 || c.business_address_line_1 || '',
          addressLine2: c.residential_address_line_2 || c.business_address_line_2 || '',
          suburb: c.residential_address_location || c.business_address_location || '',
          state: c.residential_address_state || c.business_address_state || '',
          postcode: c.residential_address_postcode || c.business_address_postcode || '',
          tradingName: c.trading_name || c.business_name || '',
          businessStructure: c.is_sole_trader === 'true' ? 'sole_trader' : (c.type?.toLowerCase() || 'sole_trader'),
          businessLocation: c.business_address_line_1 ? 
            `${c.business_address_line_1}, ${c.business_address_location} ${c.business_address_state} ${c.business_address_postcode}` : ''
        }));
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };
  
  const validateStage = () => {
    switch (stage) {
      case 1:
        if (formData.wantsAssistance === null) {
          setError('Please select an option');
          return false;
        }
        break;
      case 2:
        if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 3:
        if (!formData.email || !formData.mobile || !formData.addressLine1 || !formData.suburb || !formData.state || !formData.postcode) {
          setError('Please fill in all required fields');
          return false;
        }
        break;
      case 4:
        if (!formData.businessStructure) {
          setError('Please select a business structure');
          return false;
        }
        break;
      case 5:
        if (!formData.businessStartDate) {
          setError('Please enter your business start date');
          return false;
        }
        break;
      case 6:
        if (formData.registerForGST === null) {
          setError('Please select a GST option');
          return false;
        }
        if (formData.registerForGST === 'yes' && (!formData.estimatedTurnover || !formData.gstStartDate)) {
          setError('Please fill in GST details');
          return false;
        }
        break;
      case 7:
        if (!formData.declarationAccepted) {
          setError('Please accept the declaration');
          return false;
        }
        break;
      case 8:
        if (formData.wantsAssistance && !formData.paymentComplete) {
          setError('Please complete payment');
          return false;
        }
        break;
    }
    return true;
  };
  
  const nextStage = async () => {
    if (!validateStage()) return;
    
    // Skip payment stage if user doesn't want assistance
    if (stage === 7 && !formData.wantsAssistance) {
      await submitForm();
      setStage(9);
      return;
    }
    
    if (stage < 9) {
      setStage(stage + 1);
    }
  };
  
  const prevStage = () => {
    if (stage > 1) {
      // Skip payment stage when going back if no assistance
      if (stage === 9 && !formData.wantsAssistance) {
        setStage(7);
        return;
      }
      setStage(stage - 1);
    }
  };
  
  const submitForm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/abn-assistance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: userId,
          ...formData
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Luna Chat Functions
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const res = await fetch('/api/luna-rag/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          session_id: `abn-${userId}`,
          mode: 'educator',
          user_id: userId
        })
      });
      
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.response || 'I apologize, I could not process that request.' }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };
  
  const askLunaAboutGST = () => {
    setShowLunaChat(true);
    setChatMessages([{ role: 'assistant', content: 'I can help explain GST registration for Family Day Care educators. What would you like to know?' }]);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#15ADC2]/10 via-white to-[#6366F1]/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#6366F1] animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#15ADC2]/10 via-white to-[#6366F1]/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">ABN & GST Registration Assistance</h1>
              <p className="text-white/80 text-sm mt-1">Let Luna help you register your ABN</p>
            </div>
            <button
              onClick={() => setShowLunaChat(!showLunaChat)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Ask Luna</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {stage} of 9</span>
            <span className="text-sm text-gray-600">{STAGES[stage - 1].title}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#15ADC2] to-[#6366F1] transition-all duration-300"
              style={{ width: `${(stage / 9) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          
          {/* Stage 1: Welcome */}
          {stage === 1 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#15ADC2] to-[#6366F1] rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to ABN Registration</h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                I can help you lodge your ABN application for <strong className="text-[#6366F1]">$99</strong> (we handle everything), 
                or guide you through the free self-lodgement process.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => updateField('wantsAssistance', true)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    formData.wantsAssistance === true 
                      ? 'border-[#6366F1] bg-[#6366F1]/5' 
                      : 'border-gray-200 hover:border-[#6366F1]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-[#6366F1]" />
                    </div>
                    <span className="font-semibold text-gray-900">Full Assistance - $99</span>
                  </div>
                  <p className="text-sm text-gray-600">We handle everything. Just provide your details and we'll lodge your ABN application for you.</p>
                </button>
                
                <button
                  onClick={() => updateField('wantsAssistance', false)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    formData.wantsAssistance === false 
                      ? 'border-[#15ADC2] bg-[#15ADC2]/5' 
                      : 'border-gray-200 hover:border-[#15ADC2]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#15ADC2]/10 rounded-full flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-[#15ADC2]" />
                    </div>
                    <span className="font-semibold text-gray-900">Free Self-Guided</span>
                  </div>
                  <p className="text-sm text-gray-600">I'll guide you step-by-step to lodge your ABN yourself for free on the ATO website.</p>
                </button>
              </div>
            </div>
          )}
          
          {/* Stage 2: Personal Details */}
          {stage === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
                  <p className="text-gray-600 text-sm">We've pre-filled what we know</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => updateField('middleName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax File Number (TFN)</label>
                  <input
                    type="text"
                    value={formData.tfn}
                    onChange={(e) => updateField('tfn', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                    placeholder="Optional - helps speed up processing"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your TFN is kept confidential and only used for ABN registration.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Stage 3: Contact Information */}
          {stage === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
                  <p className="text-gray-600 text-sm">How can we reach you?</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => updateField('mobile', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => updateField('addressLine1', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) => updateField('addressLine2', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Suburb *</label>
                  <input
                    type="text"
                    value={formData.suburb}
                    onChange={(e) => updateField('suburb', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      value={formData.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                    >
                      <option value="">Select</option>
                      <option value="NSW">NSW</option>
                      <option value="VIC">VIC</option>
                      <option value="QLD">QLD</option>
                      <option value="WA">WA</option>
                      <option value="SA">SA</option>
                      <option value="TAS">TAS</option>
                      <option value="NT">NT</option>
                      <option value="ACT">ACT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode *</label>
                    <input
                      type="text"
                      value={formData.postcode}
                      onChange={(e) => updateField('postcode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Stage 4: Business Structure */}
          {stage === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Business Structure</h2>
                  <p className="text-gray-600 text-sm">Most FDC educators are Sole Traders</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { value: 'sole_trader', label: 'Sole Trader', desc: 'Recommended for most FDC educators - simplest structure' },
                  { value: 'partnership', label: 'Partnership', desc: 'Two or more people running the business together' },
                  { value: 'trust', label: 'Trust', desc: 'Business held by a trustee for beneficiaries' },
                  { value: 'company', label: 'Company', desc: 'Separate legal entity - more complex structure' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateField('businessStructure', option.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      formData.businessStructure === option.value
                        ? 'border-[#6366F1] bg-[#6366F1]/5'
                        : 'border-gray-200 hover:border-[#6366F1]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-gray-900">{option.label}</span>
                        {option.value === 'sole_trader' && (
                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Recommended</span>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{option.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        formData.businessStructure === option.value
                          ? 'border-[#6366F1] bg-[#6366F1]'
                          : 'border-gray-300'
                      }`}>
                        {formData.businessStructure === option.value && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Stage 5: Business Details */}
          {stage === 5 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Business Details</h2>
                  <p className="text-gray-600 text-sm">Tell us about your FDC business</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name</label>
                  <input
                    type="text"
                    value={formData.tradingName}
                    onChange={(e) => updateField('tradingName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                    placeholder="e.g., Sarah's Family Day Care"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - you can operate under your own name</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Start Date *</label>
                  <input
                    type="date"
                    value={formData.businessStartDate}
                    onChange={(e) => updateField('businessStartDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">When did you start (or plan to start) your FDC business?</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Location</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.businessLocation || `${formData.addressLine1}, ${formData.suburb} ${formData.state} ${formData.postcode}`}
                      onChange={(e) => updateField('businessLocation', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Usually your home address for FDC</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry Code (ANZSIC)</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-2 bg-[#6366F1]/10 text-[#6366F1] font-mono rounded">{formData.anzsicCode}</span>
                    <span className="text-gray-600">Family Day Care Services</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">This is automatically set for FDC educators</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Stage 6: GST Registration */}
          {stage === 6 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">GST Registration</h2>
                  <p className="text-gray-600 text-sm">Required if turnover exceeds $75,000/year</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-600">Do you want to register for GST?</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'yes', label: 'Yes', desc: 'I want to register' },
                    { value: 'no', label: 'No', desc: 'Not at this time' },
                    { value: 'unsure', label: 'Unsure', desc: 'I need help deciding' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateField('registerForGST', option.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        formData.registerForGST === option.value
                          ? 'border-[#6366F1] bg-[#6366F1]/5'
                          : 'border-gray-200 hover:border-[#6366F1]/50'
                      }`}
                    >
                      <span className="font-semibold text-gray-900 block">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.desc}</span>
                    </button>
                  ))}
                </div>
                
                {/* GST Details if Yes */}
                {formData.registerForGST === 'yes' && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                    <h4 className="font-medium text-green-800">GST Registration Details</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Annual Turnover *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.estimatedTurnover}
                          onChange={(e) => updateField('estimatedTurnover', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                          placeholder="75000"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Start Date *</label>
                      <input
                        type="date"
                        value={formData.gstStartDate}
                        onChange={(e) => updateField('gstStartDate', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Period</label>
                      <select
                        value={formData.gstBasis}
                        onChange={(e) => updateField('gstBasis', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
                      >
                        <option value="quarterly">Quarterly (Recommended)</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Help if Unsure */}
                {formData.registerForGST === 'unsure' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Need help deciding?</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      GST registration is required when your annual turnover exceeds $75,000. 
                      Most new FDC educators don't need to register immediately.
                    </p>
                    <button
                      onClick={askLunaAboutGST}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Ask Luna about GST
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Stage 7: Declaration */}
          {stage === 7 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                  <CheckSquare className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Declaration</h2>
                  <p className="text-gray-600 text-sm">Please review and confirm</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Summary of Your Application</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Name:</dt>
                    <dd className="text-gray-900 font-medium">{formData.firstName} {formData.lastName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Business Structure:</dt>
                    <dd className="text-gray-900 font-medium capitalize">{formData.businessStructure.replace('_', ' ')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Trading Name:</dt>
                    <dd className="text-gray-900 font-medium">{formData.tradingName || 'Using personal name'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">GST Registration:</dt>
                    <dd className="text-gray-900 font-medium capitalize">{formData.registerForGST || 'No'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Service:</dt>
                    <dd className="text-gray-900 font-medium">
                      {formData.wantsAssistance ? 'Full Assistance ($99)' : 'Self-Guided (Free)'}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.declarationAccepted}
                  onChange={(e) => updateField('declarationAccepted', e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-[#6366F1] rounded"
                />
                <span className="text-sm text-gray-600">
                  I declare that the information provided is true and correct. I understand that providing false information 
                  may result in penalties. I authorise FDC Tax to {formData.wantsAssistance ? 'lodge my ABN application on my behalf' : 'guide me through the ABN registration process'}.
                </span>
              </label>
            </div>
          )}
          
          {/* Stage 8: Payment */}
          {stage === 8 && formData.wantsAssistance && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-[#6366F1]/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment</h2>
                  <p className="text-gray-600 text-sm">Secure payment via Stripe</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#6366F1]/10 to-[#15ADC2]/10 p-6 rounded-xl mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-700">ABN Registration Assistance</span>
                  <span className="text-2xl font-bold text-[#6366F1]">$99.00</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Full ABN application lodgement</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> GST registration (if required)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Email confirmation with ABN</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> FDC Tax Fact Sheet included</li>
                </ul>
              </div>
              
              {/* Stripe Card Element */}
              <Elements stripe={stripePromise}>
                <PaymentForm 
                  formData={formData}
                  userId={userId}
                  submitting={submitting}
                  setSubmitting={setSubmitting}
                  setError={setError}
                  updateField={updateField}
                  submitForm={submitForm}
                  setStage={setStage}
                />
              </Elements>
            </div>
          )}
          
          {/* Stage 9: Complete */}
          {stage === 9 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {formData.wantsAssistance ? 'Application Submitted!' : 'Guide Ready!'}
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {formData.wantsAssistance 
                  ? "We've received your ABN application. You'll receive a confirmation email shortly with next steps and your FDC Tax Fact Sheet."
                  : "We've prepared your self-guided ABN registration instructions. Check your email for the step-by-step guide and your FDC Tax Fact Sheet."}
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto mb-6">
                <p className="text-sm text-blue-700">
                  <strong>What's next?</strong><br/>
                  {formData.wantsAssistance 
                    ? "We'll process your application within 1-2 business days. Most ABNs are issued immediately."
                    : "Follow the instructions in your email to complete your ABN registration on the ATO website."}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/myfdc"
                  className="px-6 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5]"
                >
                  Go to MyFDC Dashboard
                </a>
                <a
                  href="/"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Chat with Luna
                </a>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {/* Navigation Buttons */}
          {stage !== 9 && !(stage === 8 && formData.wantsAssistance) && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={prevStage}
                disabled={stage === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={nextStage}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <>{stage === 7 && !formData.wantsAssistance ? 'Submit' : 'Continue'} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Luna Chat Sidebar */}
      {showLunaChat && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
          <div className="bg-gradient-to-r from-[#15ADC2] to-[#6366F1] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Ask Luna</span>
            </div>
            <button onClick={() => setShowLunaChat(false)} className="p-1 hover:bg-white/20 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Ask Luna anything about ABN or GST registration</p>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-[#6366F1] text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type your question..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent"
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="p-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
