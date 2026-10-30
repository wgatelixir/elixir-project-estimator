// The estimator's icon set: Lucide line icons (one consistent 1.75px stroke,
// rounded ends) instead of emoji, which render differently per OS and clash
// with the Elixir look. Icons take the text colour, so they follow the
// indigo/grey of the element they sit in.

import type { LucideIcon, LucideProps } from "lucide-react";

export {
  ArrowLeft,
  Blocks,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  FileJson,
  FileSpreadsheet,
  FileText,
  GripVertical,
  History,
  LayoutDashboard,
  Link2,
  Pencil,
  Plug,
  Plus,
  Presentation,
  Printer,
  Receipt,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
export type { LucideIcon };

/** Default size/stroke for inline icons next to text. */
export const iconProps: LucideProps = { size: 16, strokeWidth: 1.75, "aria-hidden": true };
