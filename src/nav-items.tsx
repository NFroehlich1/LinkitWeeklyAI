import { Home, Mail, Database } from "lucide-react";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Newsletter",
    to: "/newsletter",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    title: "KI-Datenbank",
    to: "/interactive-database",
    icon: <Database className="h-4 w-4" />,
  },
];
