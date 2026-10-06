import { Badge } from "@/components/ui/primitives";
import { STATUS_META, type ReturnStatus } from "@/lib/returns";

export function StatusBadge({ status }: { status: ReturnStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
