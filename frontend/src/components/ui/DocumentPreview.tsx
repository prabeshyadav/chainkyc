import { FileText } from "lucide-react";
import { buildImage } from "../../helper/fileHelper";

export default function DocumentPreview({
  label,
  data,
}: {
  label: string;
  data: string;
}) {
  const mime = buildImage(data);
  const href = `data:${mime ?? "application/octet-stream"};base64,${data}`;

  return (
    <div>
      <p className="text-xs font-medium text-ink-900 mb-1.5">{label}</p>
      {mime?.startsWith("image/") ? (
        <a href={href} target="_blank" rel="noreferrer">
          <img
            src={href}
            alt={label}
            className="rounded-lg border border-line max-h-72 w-full object-contain bg-gray-50"
          />
        </a>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          download={mime === "application/pdf" ? `${label}.pdf` : undefined}
          className="flex items-center gap-2 border border-line rounded-lg px-4 py-3 text-sm text-accent-600 hover:bg-gray-50"
        >
          <FileText size={16} />
          {mime === "application/pdf" ? "Open PDF" : "Download file"}
        </a>
      )}
    </div>
  );
}
