import { ArrowLeft, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";

interface TitlebarProps {
	title: string;
	onTitleChange: (v: string) => void;
	titleLabel?: string;
	titlePlaceholder?: string;
	slug?: string;
	onSlugChange?: (v: string) => void;
	slugLabel?: string;
	slugPrefix?: string;
	autoSlug?: boolean;
	onAutoSlugToggle?: () => void;
	id?: string | number;
	viewHref?: string;
	onBack?: () => void;
	actions?: ReactNode;
}

/**
 * Titlebar — the v2 editor header. A single rounded card with a back button,
 * a label-over-input title segment, optional slug segment with auto-pill,
 * and a trailing actions area (id pill, view button, custom).
 */
export function Titlebar({
	title,
	onTitleChange,
	titleLabel = "Title",
	titlePlaceholder,
	slug,
	onSlugChange,
	slugLabel = "Slug",
	slugPrefix = "/",
	autoSlug,
	onAutoSlugToggle,
	viewHref,
	onBack,
	actions,
}: TitlebarProps) {
	return (
		<div data-slot="titlebar">
			<div data-slot="titlebar-bar">
				{onBack && (
					<button
						type="button"
						data-slot="titlebar-back"
						onClick={onBack}
						aria-label="Back"
					>
						<ArrowLeft size={17} />
					</button>
				)}

				<div data-slot="titlebar-title">
					<span
						style={{
							fontSize: 12,
							fontWeight: 500,
							color: "var(--fg-subtle)",
						}}
					>
						{titleLabel}
					</span>
					<input
						value={title}
						onChange={(e) => onTitleChange(e.target.value)}
						placeholder={titlePlaceholder}
						style={{
							background: "transparent",
							border: "none",
							outline: "none",
							fontFamily: "var(--font-body)",
							fontSize: 15,
							fontWeight: 600,
							color: "var(--fg)",
							padding: 0,
							minWidth: 0,
							letterSpacing: "-0.015em",
							width: "100%",
						}}
					/>
				</div>

				{slug !== undefined && onSlugChange && (
					<>
						<div data-slot="titlebar-sep" aria-hidden />
						<div data-slot="titlebar-slug">
							<div
								className="flex items-center justify-between"
								style={{ minWidth: 0 }}
							>
								<span
									style={{
										fontSize: 12,
										fontWeight: 500,
										color: "var(--fg-subtle)",
									}}
								>
									{slugLabel}
								</span>
								{onAutoSlugToggle && (
									<button
										type="button"
										onClick={onAutoSlugToggle}
										style={{
											fontSize: 11.5,
											fontWeight: 600,
											padding: "1px 7px",
											borderRadius: 999,
											border: "none",
											cursor: "pointer",
											lineHeight: 1.2,
											transition: "background 0.12s, color 0.12s",
											background: autoSlug
												? "var(--accent-weak)"
												: "var(--hover-bg)",
											color: autoSlug
												? "var(--accent-strong)"
												: "var(--fg-muted)",
										}}
									>
										{autoSlug ? "Auto" : "Edit"}
									</button>
								)}
							</div>
							<div
								className="flex items-center"
								style={{ gap: 5, minWidth: 0 }}
							>
								<span
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: 13,
										color: "var(--fg-subtle)",
										flexShrink: 0,
									}}
								>
									{slugPrefix}
								</span>
								<input
									value={slug}
									onChange={(e) => onSlugChange(e.target.value)}
									disabled={autoSlug}
									style={{
										flex: 1,
										background: "transparent",
										border: "none",
										outline: "none",
										fontFamily: "var(--font-mono)",
										fontSize: 13,
										color: "var(--fg)",
										padding: 0,
										minWidth: 0,
										opacity: autoSlug ? 0.6 : 1,
									}}
								/>
							</div>
						</div>
					</>
				)}

				{(viewHref || actions) && (
					<div data-slot="titlebar-actions">
						{viewHref && (
							<a
								href={viewHref}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center"
								style={{
									height: 32,
									padding: "0 12px",
									fontSize: 13,
									fontWeight: 500,
									color: "var(--fg)",
									background: "var(--card-bg)",
									borderRadius: "var(--radius-md)",
									gap: 6,
									boxShadow:
										"0 0 0 1px var(--border-input), 0 1px 2px rgba(15,23,42,0.05)",
									letterSpacing: "-0.005em",
								}}
							>
								<ExternalLink size={14} /> View
							</a>
						)}
						{actions}
					</div>
				)}
			</div>
		</div>
	);
}
