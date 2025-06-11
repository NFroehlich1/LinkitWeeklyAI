import { Home, Mail, Archive } from "lucide-react";

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
    title: "Archiv Q&A",
    to: "/archive-qa",
    icon: <Archive className="h-4 w-4" />,
  },
];
