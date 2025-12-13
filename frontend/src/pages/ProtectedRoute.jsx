import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/auth";

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
    <div className="flex items-center gap-3 text-lg">
      <Loader2 className="w-6 h-6 animate-spin text-neon-cyan" />
      <span>Loading secure content</span>
    </div>
  </div>
);

const ProtectedRoute = ({ children, demoFallback = null }) => {
  const { user, status } = useAuth();
  if (status === "loading") {
    return <LoadingState />;
  }
  if (user) {
    return children;
  }
  if (demoFallback) {
    return demoFallback;
  }
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
