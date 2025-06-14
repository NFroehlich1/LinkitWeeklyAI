import { Home, Mail, Database } from "lucide-react";

export const getNavItems = (t: (key: string) => string) => [
  {
    title: "Home",
    titleKey: "nav.home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Newsletter",
    titleKey: "nav.newsletter",
    to: "/newsletter",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    title: "KI-Datenbank",
    titleKey: "nav.database",
    to: "/interactive-database",
    icon: <Database className="h-4 w-4" />,
  },
];
