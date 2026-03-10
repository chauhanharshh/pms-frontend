import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { PMSProvider } from "./contexts/PMSContext";

export default function App() {
  return (
    <AuthProvider>
      <PMSProvider>
        <div className="flex flex-col h-screen overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <RouterProvider router={router} />
          </div>
        </div>
      </PMSProvider>
    </AuthProvider>
  );
}
