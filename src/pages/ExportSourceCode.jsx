import React, { useState, useMemo, useCallback } from "react";
import { sourceFiles } from "@/data/sourceCodeSnapshot";
import {
  APP_NAME, APP_DESCRIPTION, TECH_STACK, buildFileTree, formatTree,
  formatFileSize, generateReadme, generateDatabaseInfo, generateEnvExample,
  generateGitignore,
} from "@/lib/sourceCodeExport";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  FileArchive, Download, Loader2, CheckCircle2, FolderTree,
  Code2, Database, ShieldCheck, FileText, Package, AlertCircle, Info,
} from "lucide-react";

export default function ExportSourceCode() {
  const { toast } = useToast();
  const [zipLoading, setZipLoading] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipPhase, setZipPhase] = useState("");
  const [zipResult, setZipResult] = useState(null);

  const filePaths = useMemo(() => Object.keys(sourceFiles).sort(), []);
  const totalSize = useMemo(
    () => Object.values(sourceFiles).reduce((s, c) => s + c.length, 0),
    []
  );
  const dirCount = useMemo(() => {
    const dirs = new Set();
    filePaths.forEach((p) => {
      const parts = p.split("/");
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join("/"));
      }
    });
    return dirs.size;
  }, [filePaths]);

  const treeText = useMemo(() => formatTree(buildFileTree(filePaths)), [filePaths]);

  const handleExport = useCallback(async () => {
    setZipLoading(true);
    setZipProgress(0);
    setZipPhase("Menyiapkan struktur ZIP...");
    setZipResult(null);

    try {
      const zip = new JSZip();
      const projectRoot = zip.folder(APP_NAME + "-source-code");
      const today = new Date().toISOString().slice(0, 10);
      const allFiles = Object.entries(sourceFiles);
      let added = 0;

      // Add source files
      for (const [filePath, content] of allFiles) {
        projectRoot.file(filePath, content);
        added++;
        setZipProgress(Math.round((added / allFiles.length) * 70));
        setZipPhase(`Menambahkan file ${added}/${allFiles.length}...`);
      }

      // Add generated documentation
      setZipPhase("Membuat dokumentasi...");
      setZipProgress(75);
      projectRoot.file("README.md", generateReadme(filePaths, totalSize));
      projectRoot.file("DATABASE_EXPORT_INFO.md", generateDatabaseInfo());
      projectRoot.file(".env.example", generateEnvExample());
      projectRoot.file(".gitignore", generateGitignore());

      // Generate ZIP
      setZipPhase("Mengompres file ZIP...");
      const zipBlob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        },
        (meta) => {
          setZipProgress(75 + Math.round(meta.percent * 0.25));
        }
      );

      setZipProgress(100);
      setZipPhase("ZIP berhasil dibuat");

      const zipName = `${APP_NAME.toLowerCase()}-source-code-${today}.zip`;
      const result = { zipName, zipBlob, zipSize: zipBlob.size, fileCount: allFiles.length + 4 };
      setZipResult(result);

      saveAs(zipBlob, zipName);
      toast({ title: "Source code ZIP berhasil dibuat dan diunduh" });
    } catch (err) {
      toast({ title: "Gagal membuat ZIP: " + (err.message || ""), variant: "destructive" });
      setZipPhase("");
    } finally {
      setZipLoading(false);
    }
  }, [filePaths, totalSize, toast]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Export Source Code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unduh seluruh source code proyek sebagai file ZIP dengan struktur direktori asli
        </p>
      </div>

      {/* Project Info */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{APP_NAME}</h2>
                  <p className="text-xs text-muted-foreground">Platform Administrasi Sekolah Digital</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{APP_DESCRIPTION}</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button
                onClick={handleExport}
                disabled={zipLoading}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                {zipLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <FileArchive className="mr-2 h-5 w-5" />
                )}
                {zipLoading ? "Membuat ZIP..." : "Download Source Code (.zip)"}
              </Button>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {TECH_STACK.map((t) => (
              <span
                key={t.name}
                className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground"
              >
                {t.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total File</p>
              <p className="text-xl font-bold text-foreground">{filePaths.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Direktori</p>
              <p className="text-xl font-bold text-foreground">{dirCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Ukuran</p>
              <p className="text-xl font-bold text-foreground">{formatFileSize(totalSize)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Entity Schema</p>
              <p className="text-xl font-bold text-foreground">
                {filePaths.filter((p) => p.startsWith("base44/entities/")).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {zipLoading && (
        <Card className="border-primary/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-semibold text-foreground">{zipPhase}</p>
            </div>
            <Progress value={zipProgress} className="h-2" />
            <p className="mt-1 text-right text-xs text-muted-foreground">{zipProgress}%</p>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {zipResult && !zipLoading && (
        <Card className="border-green-500/30 bg-green-50/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">{zipResult.zipName}</p>
                  <p className="text-xs text-muted-foreground">
                    {zipResult.fileCount} file • {formatFileSize(zipResult.zipSize)}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => saveAs(zipResult.zipBlob, zipResult.zipName)}
                className="bg-primary hover:bg-primary/90 shrink-0"
              >
                <Download className="mr-1.5 h-4 w-4" />
                Download ZIP
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Card className="border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Keamanan & Eksklusi File
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5 pt-0">
          <p className="flex items-start gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            Termasuk: semua source code frontend, komponen, halaman, entity schema, konfigurasi
          </p>
          <p className="flex items-start gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
            Termasuk: README.md, DATABASE_EXPORT_INFO.md, .env.example (auto-generated)
          </p>
          <p className="flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            Dikecualikan: .npmrc (mungkin berisi token otentikasi npm)
          </p>
          <p className="flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            Dikecualikan: package-lock.json (dapat dibuat ulang dengan npm install)
          </p>
          <p className="flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            Dikecualikan: file .env (JANGAN commit secrets — gunakan .env.example)
          </p>
          <p className="flex items-start gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            Tidak termasuk: data database, akun pengguna, file upload (lihat DATABASE_EXPORT_INFO.md)
          </p>
        </CardContent>
      </Card>

      {/* Directory Tree */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FolderTree className="h-4 w-4 text-primary" />
            Struktur Direktori Proyek
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-96 overflow-auto rounded-lg bg-muted/50 p-4">
            <pre className="text-xs leading-relaxed text-muted-foreground font-mono whitespace-pre">
              {treeText}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Base44 Limitation Info */}
      <Card className="border-blue-200 bg-blue-50/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2.5">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-foreground">Informasi Penting tentang Base44</p>
              <p>
                Aplikasi ini berjalan di platform <strong>Base44 BaaS</strong> yang mengelola
                database, autentikasi, dan infrastructure secara terpusat. Source code yang
                diekspor berisi semua kode aplikasi (frontend + schema + config), namun
                <strong> data database aktual, akun pengguna, dan file upload</strong> tidak
                dapat diekspor sebagai source code.
              </p>
              <p>
                Untuk backup resmi, gunakan fitur <strong>GitHub Sync</strong> di pengaturan
                Base44 atau export data melalui Base44 API. Lihat file
                <strong> DATABASE_EXPORT_INFO.md</strong> di dalam ZIP untuk panduan migrasi
                lengkap.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}