import { useParams } from "react-router-dom";
import FileBrowser from "@/components/file-browser";

export default function ExtensionFilesPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <FileBrowser
      apiBase={`/admin/api/extensions/${slug}/files`}
      title={slug || "Extension"}
      backUrl="/admin/extensions"
      backLabel="Extensions"
    />
  );
}
