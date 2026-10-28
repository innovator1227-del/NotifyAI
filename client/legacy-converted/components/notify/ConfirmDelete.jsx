import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirm = "Delete",
  onConfirm,
}) {
  return _jsx(AlertDialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(AlertDialogContent, {
      children: [
        _jsxs(AlertDialogHeader, {
          children: [
            _jsx(AlertDialogTitle, { children: title }),
            _jsx(AlertDialogDescription, { children: body }),
          ],
        }),
        _jsxs(AlertDialogFooter, {
          children: [
            _jsx(AlertDialogCancel, { children: "Cancel" }),
            _jsx(AlertDialogAction, {
              className:
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              onClick: onConfirm,
              children: confirm,
            }),
          ],
        }),
      ],
    }),
  });
}
