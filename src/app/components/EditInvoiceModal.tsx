import { useState, useEffect } from "react";
import { X, Save, Calculator, User, Home, Receipt } from "lucide-react";
import { usePMS } from "../contexts/PMSContext";
import { formatCurrency } from "../utils/format";
import { toast } from "sonner";

interface EditInvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

const GOLD = "#475569";
const DARKGOLD = "#1e293b";

export function EditInvoiceModal({ invoice, onClose }: EditInvoiceModalProps) {
  const { updateInvoice } = usePMS();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state with existing invoice data (merged with booking/bill if needed)
  const [formData, setFormData] = useState({
    // Guest Overrides
    guestName: invoice.guestName || invoice.bill?.booking?.guestName || "",
    phone: invoice.phone || invoice.bill?.booking?.guestPhone || "",
    email: invoice.email || invoice.bill?.booking?.guestEmail || "",
    address: invoice.address || invoice.bill?.booking?.addressLine || "",
    company: invoice.company || invoice.bill?.booking?.companyName || "",
    idProofType: invoice.idProofType || invoice.bill?.booking?.idProof || "",
    idProofNumber: invoice.idProofNumber || "",

    // Stay Overrides
    checkInDate: invoice.checkInDate ? new Date(invoice.checkInDate).toISOString().split('T')[0] : (invoice.bill?.booking?.checkInDate || ""),
    checkInTime: invoice.checkInTime || invoice.bill?.booking?.checkInTime || "12:00",
    checkOutDate: invoice.checkOutDate ? new Date(invoice.checkOutDate).toISOString().split('T')[0] : (invoice.bill?.booking?.checkOutDate || ""),
    checkOutTime: invoice.checkOutTime || invoice.bill?.booking?.checkOutTime || "11:00",
    roomNumber: invoice.roomNumber || invoice.bill?.booking?.roomNumber || "",
    plan: invoice.plan || invoice.bill?.booking?.plan || "EP",
    adults: invoice.adults || invoice.bill?.booking?.adults || 1,
    children: invoice.children || invoice.bill?.booking?.children || 0,

    // Billing Overrides
    roomRent: Number(invoice.roomRent || invoice.bill?.roomCharges || 0),
    otherCharges: Number(invoice.otherCharges || invoice.bill?.restaurantCharges || 0),
    miscCharges: Number(invoice.miscCharges || invoice.bill?.miscCharges || 0),
    advancePaid: Number(invoice.advancePaid || invoice.bill?.booking?.advanceAmount || 0),
    discount: Number(invoice.discount || 0),
    remarks: invoice.remarks || "",

    // Totals (managed/calculated)
    cgst: Number(invoice.cgst || 0),
    sgst: Number(invoice.sgst || 0),
    totalAmount: Number(invoice.totalAmount || 0),
    netPayable: Number(invoice.netPayable || 0),
    paymentMethod: invoice.paymentMethod || invoice.modeOfPayment || "CASH",
  });

  // Re-calculate totals whenever billing fields change
  useEffect(() => {
    const subtotal = formData.roomRent + formData.otherCharges + formData.miscCharges;
    
    // Calculate GST (12% of Room Rent)
    const gstTotal = formData.roomRent * 0.12;
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;
    
    const totalAmount = subtotal + gstTotal;
    const netPayable = totalAmount - formData.discount - formData.advancePaid;

    setFormData(prev => ({
      ...prev,
      cgst,
      sgst,
      totalAmount,
      netPayable
    }));
  }, [formData.roomRent, formData.otherCharges, formData.miscCharges, formData.discount, formData.advancePaid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateInvoice(invoice.id, {
        ...formData,
        paymentMethod: formData.paymentMethod,
        modeOfPayment: formData.paymentMethod,
        isModified: true,
        modifiedAt: new Date().toISOString() as any,
      } as any);
      toast.success("Invoice modified successfully");
      onClose();
    } catch (err: any) {
      toast.error("Failed to modify invoice: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-none flex flex-col overflow-hidden" style={{ fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif" }}>
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-none">
              <Receipt className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800" style={{ color: DARKGOLD }}>
                Modify Invoice — {invoice.invoiceNumber}
              </h2>
              <p className="text-xs text-gray-500 font-medium">Invoice Number is read-only and will never change.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-none transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section 1: Guest Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <User className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">Guest Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Guest Name</label>
                <input name="guestName" value={formData.guestName} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" placeholder="Guest Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" placeholder="Phone Status" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                <input name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" placeholder="Email" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                <input name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" placeholder="Full Address" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Company/GST</label>
                <input name="company" value={formData.company} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" placeholder="Company Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">ID Proof Type</label>
                <select name="idProofType" value={formData.idProofType} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none bg-white">
                    <option value="Aadhar">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">ID No</label>
                <input name="idProofNumber" value={formData.idProofNumber} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" placeholder="ID Number" />
              </div>
            </div>
          </div>

          {/* Section 2: Stay Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Home className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">Stay Details</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Check-In Date</label>
                <input type="date" name="checkInDate" value={formData.checkInDate} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Check-In Time</label>
                <input type="time" name="checkInTime" value={formData.checkInTime} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Check-Out Date</label>
                <input type="date" name="checkOutDate" value={formData.checkOutDate} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Check-Out Time</label>
                <input type="time" name="checkOutTime" value={formData.checkOutTime} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Room No</label>
                <input name="roomNumber" value={formData.roomNumber} onChange={handleInputChange} className="w-full px-3 py-1.5 border rounded-none focus:ring-0 outline-none font-bold text-slate-700" placeholder="Room No" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Plan</label>
                <select name="plan" value={formData.plan} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none bg-white">
                    <option value="EP">EP (Only Room)</option>
                    <option value="CP">CP (Room + Breakfast)</option>
                    <option value="MAP">MAP (Room + BF + Lunch/Dinner)</option>
                    <option value="AP">AP (All Meals)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Adults</label>
                <input type="number" name="adults" value={formData.adults} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Children</label>
                <input type="number" name="children" value={formData.children} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-none focus:ring-0 outline-none" />
              </div>
            </div>
          </div>

          {/* Section 3: Billing Details */}
          <div className="p-6 bg-slate-50 border border-slate-200 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <Calculator className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700">Billing & Calculations</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Room Rent (Total)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input type="number" name="roomRent" value={formData.roomRent} onChange={handleInputChange} className="w-full pl-7 pr-3 py-2.5 border-2 border-slate-200 rounded-none focus:ring-0 outline-none font-bold text-gray-800" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Other Charges</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input type="number" name="otherCharges" value={formData.otherCharges} onChange={handleInputChange} className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-none focus:ring-0 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Misc Charges</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                    <input type="number" name="miscCharges" value={formData.miscCharges} onChange={handleInputChange} className="w-full pl-7 pr-3 py-2.5 border-2 border-gray-200 rounded-none focus:ring-0 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Advance Paid</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">(-)₹</span>
                    <input type="number" name="advancePaid" value={formData.advancePaid} onChange={handleInputChange} className="w-full pl-11 pr-3 py-2.5 border-2 border-slate-200 rounded-none focus:ring-0 outline-none text-slate-700" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Discount</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">(-)₹</span>
                    <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} className="w-full pl-11 pr-3 py-2.5 border-2 border-slate-200 rounded-none focus:ring-0 outline-none text-slate-700 font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Payment Mode</label>
                <select 
                  name="paymentMethod" 
                  value={formData.paymentMethod} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-none focus:ring-0 outline-none bg-white font-bold"
                >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CARD">Card</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="NEFT">NEFT / RTGS</option>
                    <option value="CREDIT">Company Credit</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-200 items-end justify-between">
              <div className="flex gap-6">
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">CGST (6%)</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(formData.cgst)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">SGST (6%)</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(formData.sgst)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">GST Total (12%)</p>
                    <p className="text-lg font-bold text-slate-600">{formatCurrency(formData.cgst + formData.sgst)}</p>
                </div>
              </div>
              <div className="bg-slate-900 px-6 py-4 rounded-none text-right md:min-w-[240px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Net Payable (Auto)</p>
                <p className="text-3xl font-black text-white">{formatCurrency(formData.netPayable)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Remarks / Internal Notes</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-100 rounded-none focus:ring-0 outline-none h-24 italic text-sm" placeholder="Add any reasons for modification or other notes..." />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t-2 border-gray-100 bg-white flex items-center justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-none font-bold text-gray-500 hover:bg-gray-100 transition-all border border-transparent"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 rounded-none font-bold text-white flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${GOLD}, ${DARKGOLD})` }}
          >
            {isSaving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <Save className="w-5 h-5" />
            )}
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}
