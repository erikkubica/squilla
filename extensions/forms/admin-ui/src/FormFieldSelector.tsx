import { List } from "@squilla/icons";
import { useEffect, useState } from "react";

interface FormItem {
	id: number | string;
	name: string;
	slug: string;
}

interface FormFieldSelectorProps {
	value?: string;
	onChange?: (val: string) => void;
}

const { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } = (
	window as unknown as {
		__SQUILLA_SHARED__: { ui: Record<string, React.ElementType> };
	}
).__SQUILLA_SHARED__.ui;

export default function FormFieldSelector({
	value,
	onChange,
}: FormFieldSelectorProps) {
	const [forms, setForms] = useState<FormItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/admin/api/ext/forms/", { credentials: "include" })
			.then((res) => res.json())
			.then((data: { rows?: FormItem[] }) => {
				setForms(data.rows || []);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, []);

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-full bg-card border-border">
				<SelectValue
					placeholder={loading ? "Loading forms..." : "Select a form"}
				/>
			</SelectTrigger>
			<SelectContent>
				{forms.map((form) => (
					<SelectItem key={form.slug} value={form.slug}>
						<div className="flex items-center gap-2">
							<List className="h-4 w-4 text-muted-foreground" />
							<span>{form.name}</span>
							<span className="text-xs text-muted-foreground font-mono">
								({form.slug})
							</span>
						</div>
					</SelectItem>
				))}
				{forms.length === 0 && !loading && (
					<div className="p-2 text-sm text-muted-foreground text-center">
						No forms found. Create one first!
					</div>
				)}
			</SelectContent>
		</Select>
	);
}
