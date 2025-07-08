import { formatDateTime } from "@cronicorn/ui/lib/utils";

interface DateTimeDisplayProps {
	date: Date | string;
	className?: string;
}

export function DateTimeDisplay({ date, className }: DateTimeDisplayProps) {
	return <span className={className}>{formatDateTime(date)}</span>;
}
