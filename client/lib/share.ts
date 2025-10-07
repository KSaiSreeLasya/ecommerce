import { toast } from "sonner";

export async function shareOrCopy(title: string, url: string, text?: string) {
  try {
    if (navigator.share) {
      await navigator.share({ title, url, text });
      return;
    }
  } catch (err) {
    // fallthrough to copy
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  } catch {
    const promptUrl = window.prompt("Copy this link", url);
    if (promptUrl) {
      toast.success("Link ready to share");
    }
  }
}
