import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Notify {
  info(message: string, description?: string): void;
  success(message: string, description?: string): void;
  warning(message: string, description?: string): void;
  error(message: string, description?: string): void;
}

export const notify: Notify = {
  info: (title: string, description?: string) => {
    toast(title, {
      description: description,
    });
  },
  success: (title: string, description?: string) => {
    toast(title, {
      icon: <CheckCircle2 className="text-green-400" />,
      description: description,
    });
  },
  warning: (title: string, description?: string) => {
    toast(title, {
      icon: <AlertTriangle className="text-yellow-400" />,
      description: description,
    });
  },
  error: (title: string, description?: string) => {
    toast(title, {
      icon: <XCircle className="text-red-400" />,
      description: description,
    });
  },
};
