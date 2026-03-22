import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Certificate } from "@/lib/types";
import { oliAssetUrl, oliGetJson, oliRequest, oliUrl } from "@/lib/oliApi";

type CertificateType = "LAB_TEST" | "FSSAI";

export default function AdminCertificates() {
  const { toast } = useToast();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const [labTitle, setLabTitle] = useState("Lab Tested Products");
  const [labFile, setLabFile] = useState<File | null>(null);
  const [fssaiTitle, setFssaiTitle] = useState("FSSAI Certified");
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);

  const queryKey = useMemo(() => [oliUrl("/api/certificates")], []);

  const { data: items = [], isLoading } = useQuery<Certificate[]>({
    queryKey,
    queryFn: () => oliGetJson<Certificate[]>("/api/certificates"),
  });

  const byType = useMemo(() => {
    const m = new Map<string, Certificate>();
    for (const c of items) m.set(String(c.type || ""), c);
    return m;
  }, [items]);

  const uploadMutation = useMutation({
    mutationFn: async (payload: { type: CertificateType; title: string; file: File }) => {
      const fd = new FormData();
      fd.append("type", payload.type);
      fd.append("title", payload.title);
      fd.append("file", payload.file);
      const res = await oliRequest("POST", "/api/certificates", fd);
      return (await res.json()) as Certificate;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      setLabFile(null);
      setFssaiFile(null);
      toast({ title: "Certificate uploaded" });
    },
    onError: (e) => {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    },
  });

  const renderExisting = (type: CertificateType) => {
    const c = byType.get(type);
    if (!c?.fileUrl) {
      return <p className="text-sm text-muted-foreground">No PDF uploaded yet.</p>;
    }
    const url = oliAssetUrl(c.fileUrl);
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{c.title || type}</p>
          <p className="text-xs text-muted-foreground">Updated: {c.lastUpdated || "-"}</p>
        </div>
        {url ? (
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => {
              setPreviewTitle(c.title || type);
              setPreviewUrl(url);
              setPreviewOpen(true);
            }}
          >
            <FileText className="h-4 w-4" />
            Preview
          </Button>
        ) : null}
      </div>
    );
  };

  const canUploadLab = !!labFile && labTitle.trim().length > 0;
  const canUploadFssai = !!fssaiFile && fssaiTitle.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Certificates</h1>
        <p className="text-sm text-muted-foreground">
          Upload your Lab Test report and FSSAI certificate PDFs to display on the Home page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Lab Test PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : renderExisting("LAB_TEST")}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={labTitle} onChange={(e) => setLabTitle(e.target.value)} placeholder="Lab Tested Products" />
            </div>
            <div className="space-y-2">
              <Label>PDF File</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setLabFile(e.target.files?.[0] ?? null)} />
            </div>

            <Button
              disabled={!canUploadLab || uploadMutation.isPending}
              onClick={() => {
                if (!labFile) return;
                uploadMutation.mutate({ type: "LAB_TEST", title: labTitle.trim(), file: labFile });
              }}
            >
              Upload
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              FSSAI PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : renderExisting("FSSAI")}

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={fssaiTitle} onChange={(e) => setFssaiTitle(e.target.value)} placeholder="FSSAI Certified" />
            </div>
            <div className="space-y-2">
              <Label>PDF File</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setFssaiFile(e.target.files?.[0] ?? null)} />
            </div>

            <Button
              disabled={!canUploadFssai || uploadMutation.isPending}
              onClick={() => {
                if (!fssaiFile) return;
                uploadMutation.mutate({ type: "FSSAI", title: fssaiTitle.trim(), file: fssaiFile });
              }}
            >
              Upload
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewUrl(null);
            setPreviewTitle("");
          }
        }}
      >
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle>{previewTitle || "Certificate"}</DialogTitle>
              <DialogDescription>Preview only</DialogDescription>
            </DialogHeader>
          </div>
          <div className="h-[75vh] w-full bg-muted relative">
            {/* Transparent overlay to prevent right-click and some interactions */}
            <div 
              className="pdf-overlay" 
              onContextMenu={(e) => e.preventDefault()}
            />
            {previewUrl ? (
              <iframe
                title={previewTitle || "Certificate"}
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="h-full w-full relative z-0"
                style={{ border: 'none' }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
