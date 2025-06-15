
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/TranslationContext";

interface AdminLoginFormProps {
  onCancel: () => void;
  onSuccessfulLogin: () => void;
}

const AdminLoginForm = ({ onCancel, onSuccessfulLogin }: AdminLoginFormProps) => {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  
  // The admin password - hardcoded for simplicity
  const ADMIN_PASSWORD = "linkit20kit25";
  
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simple password check
    if (password === ADMIN_PASSWORD) {
      onSuccessfulLogin();
      toast.success(t('admin.modeActivated'));
    } else {
      toast.error(t('admin.wrongPassword'));
    }
    
    setPassword("");
    setIsSubmitting(false);
  };
  
  return (
    <form onSubmit={handleAdminLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-password">{t('admin.password')}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
            placeholder={t('admin.passwordPlaceholder')}
            autoFocus
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('general.cancel')}
        </Button>
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isSubmitting || !password.trim()}
        >
          {isSubmitting ? t('admin.checking') : t('admin.login')}
        </Button>
      </div>
    </form>
  );
};

export default AdminLoginForm;
