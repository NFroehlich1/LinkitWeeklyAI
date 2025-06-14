
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import NewsletterSubscribeForm from "@/components/NewsletterSubscribeForm";
import AdminLoginForm from "@/components/AdminLoginForm";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewsletterSubscribeCardProps {
  onAdminLogin: () => void;
}

const NewsletterSubscribeCard = ({ onAdminLogin }: NewsletterSubscribeCardProps) => {
  const { t } = useLanguage();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3 w-fit">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t('newsletter.subscribe_title')}</CardTitle>
        <CardDescription>
          {t('newsletter.subscribe_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showAdminLogin ? (
          <AdminLoginForm
            onCancel={() => setShowAdminLogin(false)}
            onSuccessfulLogin={onAdminLogin}
          />
        ) : (
          <NewsletterSubscribeForm />
        )}
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground">
        <p className="text-center mb-2">
          {t('newsletter.weekly_delivery')}
        </p>
        <p className="text-center">
          {t('newsletter.unsubscribe_info')}
        </p>
        {!showAdminLogin && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-xs text-muted-foreground"
            onClick={() => setShowAdminLogin(true)}
          >
            {t('newsletter.admin_access')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NewsletterSubscribeCard;
