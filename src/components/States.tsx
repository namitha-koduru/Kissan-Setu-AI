import type { ReactNode } from "react";

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-box">
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading decision data…" }: { label?: string }) {
  return (
    <div className="state-box">
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  text,
  onRetry,
}: {
  title?: string;
  text: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-box">
      <h3>{title}</h3>
      <p>{text}</p>
      {onRetry && (
        <button className="btn btn-secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
