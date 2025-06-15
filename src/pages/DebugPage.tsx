import { DebugPanel } from "@/components/DebugPanel";
import { EdgeFunctionsTroubleshoot } from "@/components/EdgeFunctionsTroubleshoot";

const DebugPage = () => {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">🔍 System Debug</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Hier kannst du die gesamte Hybrid-Architektur testen und wichtige Debug-Informationen sammeln.
          Die Tests zeigen dir genau, wo eventuelle Probleme auftreten.
        </p>
      </div>
      
      {/* Edge Functions Troubleshooting - prominently placed first */}
      <EdgeFunctionsTroubleshoot />
      
      {/* Main Debug Panel */}
      <DebugPanel />
    </div>
  );
};

export default DebugPage; 