import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import { ProjectSelection } from "@/components/ProjectSelection";

type UploadFile = {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
};

export default function Home() {
  // Folder (project) state
  const [folder, setFolder] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const { addToast } = useToast();

  // Local uploads state
  const [selectedFiles, setSelectedFiles] = useState<UploadFile[]>([]);
  // Remote files and selection
  const [remoteFiles, setRemoteFiles] = useState<string[]>([]);
  const [selectedRemoteFiles, setSelectedRemoteFiles] = useState<Set<string>>(
    new Set()
  );

  // Fetch available projects/folders from the backend
  const fetchFolders = async () => {
    try {
      const response = await fetch("http://localhost:8080/folders");
      if (!response.ok) throw new Error("Error fetching folders");
      const data = await response.json();
      setFolders(data || []);
    } catch (error) {
      console.error("Error fetching folders:", error);
      addToast({
        title: "Error",
        description: "Failed to fetch folders",
        variant: "destructive",
      });
    }
  };

  // Fetch remote files for the selected folder
  const fetchFiles = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/list?folder=${encodeURIComponent(folder)}`
      );
      if (!response.ok) throw new Error("Error fetching files");
      const data = await response.json();
      setRemoteFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      addToast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [folder]);

  // Handler to create a new project (folder)
  const handleCreateFolder = async (newFolder: string) => {
    try {
      const response = await fetch("http://localhost:8080/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: newFolder }),
      });
      if (!response.ok) throw new Error("Failed to create folder");
      addToast({
        title: "Success",
        description: `Project "${newFolder}" created`,
      });
      await fetchFolders();
    } catch (error) {
      console.error("Create folder error:", error);
      addToast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  // react-dropzone for file uploads
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploads = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setSelectedFiles(uploads);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  const updateFileProgress = (
    index: number,
    progress: number,
    status: UploadFile["status"]
  ) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], progress, status };
      return updated;
    });
  };

  // Upload all selected files.
  const handleUpload = async () => {
    const uploads = selectedFiles.map(async (upload, index) => {
      updateFileProgress(index, 0, "uploading");
      const formData = new FormData();
      formData.append("folder", folder);
      formData.append("file", upload.file);
      try {
        await axios.post("http://localhost:8080/upload", formData, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentage = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              updateFileProgress(index, percentage, "uploading");
            }
          },
        });
        updateFileProgress(index, 100, "done");
        addToast({
          title: "Success",
          description: `${upload.file.name} uploaded successfully`,
        });
      } catch (error) {
        updateFileProgress(index, 0, "error");
        addToast({
          title: "Error",
          description: `Failed to upload ${upload.file.name}`,
          variant: "destructive",
        });
      }
    });
    await Promise.all(uploads);
    setSelectedFiles([]);
    fetchFiles();
  };

  // Toggle selection for remote files.
  const toggleRemoteFile = (filename: string) => {
    setSelectedRemoteFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(filename)) {
        newSet.delete(filename);
      } else {
        newSet.add(filename);
      }
      return newSet;
    });
  };

  // Batch delete selected remote files.
  const handleDeleteSelected = async () => {
    const filesToDelete = Array.from(selectedRemoteFiles);
    if (filesToDelete.length === 0) {
      addToast({
        title: "Warning",
        description: "No files selected for deletion",
        variant: "destructive",
      });
      return;
    }
    try {
      const encodedFiles = filesToDelete.map((f) => encodeURIComponent(f));
      const response = await fetch(
        `http://localhost:8080/delete?folder=${encodeURIComponent(folder)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(encodedFiles),
        }
      );
      if (!response.ok) throw new Error("Delete failed");
      const result = await response.json();
      addToast({
        title: "Success",
        description: `Deleted: ${result.deleted.join(", ")}`,
      });
      setSelectedRemoteFiles(new Set());
      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
      addToast({
        title: "Error",
        description: "Failed to delete selected files",
        variant: "destructive",
      });
    }
  };

  // Batch download selected remote files.
  const handleDownloadSelected = () => {
    const filesToDownload = Array.from(selectedRemoteFiles);
    if (filesToDownload.length === 0) {
      addToast({
        title: "Warning",
        description: "No files selected for download",
        variant: "destructive",
      });
      return;
    }
    const encodedFiles = filesToDownload
      .map((f) => encodeURIComponent(f))
      .join(",");
    const url = `http://localhost:8080/download?folder=${encodeURIComponent(
      folder
    )}&filename=${encodedFiles}`;
    const link = document.createElement("a");
    link.href = url;
    if (filesToDownload.length > 1) {
      link.download = "files.zip";
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 space-y-8">
      {/* Project (Folder) Selection */}
      <ProjectSelection
        folders={folders}
        value={folder}
        onChange={setFolder}
        onCreateFolder={handleCreateFolder}
      />

      {/* Upload Section */}
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Upload Files to "{folder || "root"}"
        </h2>
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <p>Drag & drop files here, or click to select files</p>
          )}
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-4">
            {selectedFiles.map((upload, index) => (
              <div key={index} className="border p-4 rounded shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{upload.file.name}</span>
                  <span>{upload.progress}%</span>
                </div>
                <Progress value={upload.progress} className="w-full" />
              </div>
            ))}
            <div className="mt-4">
              <Button onClick={handleUpload}>Upload All</Button>
            </div>
          </div>
        )}
      </div>

      {/* Remote Files Section */}
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Files in "{folder || "root"}"
        </h2>
        {remoteFiles.length === 0 ? (
          <p className="text-gray-500">No files uploaded yet.</p>
        ) : (
          <>
            <div className="mb-4">
              {remoteFiles.map((filename) => (
                <div
                  key={filename}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedRemoteFiles.has(filename)}
                      onChange={() => toggleRemoteFile(filename)}
                      className="h-4 w-4"
                    />
                    <a
                      href={`http://localhost:8080/download?folder=${encodeURIComponent(
                        folder
                      )}&filename=${encodeURIComponent(filename)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {filename}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-4">
              <Button onClick={handleDownloadSelected}>
                Download Selected
              </Button>
              <Button onClick={handleDeleteSelected} variant="destructive">
                Delete Selected
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
