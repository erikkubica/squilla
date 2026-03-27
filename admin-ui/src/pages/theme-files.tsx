import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getTheme, type Theme } from "@/api/client";
import FileBrowser from "@/components/file-browser";
import { Loader2 } from "lucide-react";

export default function ThemeFilesPage() {
  const { id } = useParams<{ id: string }>();
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    if (id) {
      getTheme(Number(id)).then(setTheme).catch(() => {});
    }
  }, [id]);

  if (!theme) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;

  return (
    <FileBrowser
      apiBase={`/admin/api/themes/${theme.id}/files`}
      title={theme.name}
      backUrl="/admin/themes"
      backLabel="Themes"
    />
  );
}
