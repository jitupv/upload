"use client";

import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1048576).toFixed(1) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
}

function fmtDate(d) {
  return new Date(d).toLocaleString();
}

function prettyName(pathname) {
  // strip the random suffix Blob adds: report-Xh3kd9.pdf -> report.pdf
  const dot = pathname.lastIndexOf(".");
  const base = dot === -1 ? pathname : pathname.slice(0, dot);
  const ext = dot === -1 ? "" : pathname.slice(dot);
  return base.replace(/-[A-Za-z0-9]{20,}$/, "") + ext;
}

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  async function refresh() {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFiles(data.files || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleFiles(fileList) {
    const arr = Array.from(fileList || []);
    if (!arr.length) return;
    setError("");

    for (const file of arr) {
      setUploading(file.name);
      setProgress(0);
      try {
        await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          onUploadProgress: ({ percentage }) => setProgress(percentage),
        });
      } catch (e) {
        setError(`${file.name}: ${e.message}`);
      }
    }

    setUploading(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
    refresh();
  }

  async function handleDelete(url, name) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied");
    } catch {
      prompt("Copy this link:", url);
    }
  }

  const box = {
    maxWidth: 820,
    margin: "0 auto",
    padding: "48px 20px 80px",
  };

  return (
    <main style={box}>
      <h1 style={{ fontSize: 30, margin: "0 0 6px", letterSpacing: -0.5 }}>
        FileBox
      </h1>
      <p style={{ color: "#8b949e", margin: "0 0 28px", fontSize: 14 }}>
        Drop files here to upload. They stay available at a permanent link.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#58a6ff" : "#30363d"}`,
          background: dragging ? "#0f2740" : "#12181f",
          borderRadius: 12,
          padding: "44px 20px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all .15s",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>
          {uploading ? `Uploading ${uploading}...` : "Click or drag files here"}
        </div>
        <div style={{ color: "#8b949e", fontSize: 13, marginTop: 6 }}>
          Any file type · up to 500 MB each
        </div>
        {uploading && (
          <div
            style={{
              marginTop: 18,
              height: 6,
              background: "#21262d",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#238636",
                transition: "width .2s",
              }}
            />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "#2d1214",
            border: "1px solid #6e2731",
            borderRadius: 8,
            color: "#ff8189",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <h2 style={{ fontSize: 15, margin: "36px 0 12px", color: "#8b949e" }}>
        {loading ? "Loading..." : `${files.length} file${files.length === 1 ? "" : "s"}`}
      </h2>

      <div
        style={{
          border: "1px solid #30363d",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {!loading && files.length === 0 && (
          <div
            style={{ padding: "32px 16px", textAlign: "center", color: "#8b949e", fontSize: 14 }}
          >
            Nothing uploaded yet.
          </div>
        )}

        {files.map((f, i) => (
          <div
            key={f.url}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderTop: i === 0 ? "none" : "1px solid #21262d",
              background: "#0d1117",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {prettyName(f.pathname)}
              </div>
              <div style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>
                {fmtSize(f.size)} · {fmtDate(f.uploadedAt)}
              </div>
            </div>

            <a
              href={f.downloadUrl || f.url}
              style={{
                fontSize: 13,
                color: "#58a6ff",
                textDecoration: "none",
                padding: "5px 10px",
                border: "1px solid #30363d",
                borderRadius: 6,
                whiteSpace: "nowrap",
              }}
            >
              Download
            </a>
            <button
              onClick={() => copyLink(f.url)}
              style={{
                fontSize: 13,
                color: "#e6edf3",
                background: "transparent",
                padding: "5px 10px",
                border: "1px solid #30363d",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Copy link
            </button>
            <button
              onClick={() => handleDelete(f.url, prettyName(f.pathname))}
              style={{
                fontSize: 13,
                color: "#ff8189",
                background: "transparent",
                padding: "5px 10px",
                border: "1px solid #30363d",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
