import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { usePMS } from "../contexts/PMSContext";
import { ArrowLeft, FileText, Download, Printer } from "lucide-react";

export function Billing() {
  const { currentHotelId } = useAuth();
  const { hotels } = usePMS();
  const navigate = useNavigate();
  const currentHotel = hotels.find((h) => h.id === currentHotelId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/hotel")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Billing & Invoices
            </h1>
            <p className="text-sm text-gray-500">{currentHotel?.name}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Billing Module
          </h2>
          <p className="text-gray-600 mb-6">
            Generate invoices and manage billing
          </p>
          <div className="flex gap-3 justify-center">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
              <Download className="w-4 h-4" />
              Download Invoice
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition">
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
