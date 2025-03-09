import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderSelect } from "@/components/FolderSelect"; // Reuse the searchable dropdown for existing projects
import { ChevronDown, ChevronUp } from "lucide-react";

type ProjectSelectionProps = {
  folders: string[];
  value: string;
  onChange: (value: string) => void;
  onCreateFolder: (folder: string) => void;
};

export const ProjectSelection: React.FC<ProjectSelectionProps> = ({
  folders,
  value,
  onChange,
  onCreateFolder,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newFolder, setNewFolder] = useState("");

  return (
    <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
      {isExpanded ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-700">
              Upload Destination
            </h2>
            <Button variant="outline" onClick={() => setIsExpanded(false)}>
              Collapse <ChevronUp size={16} className="ml-1" />
            </Button>
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Existing Project:
            </label>
            <FolderSelect
              folders={folders}
              value={value}
              onChange={(selected) => {
                onChange(selected);
                setIsExpanded(false);
              }}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Or Create New Project:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="New project name"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                className="w-full border p-2 rounded"
              />
              <Button
                className="h-10"
                onClick={() => {
                  if (newFolder.trim()) {
                    onCreateFolder(newFolder.trim());
                    onChange(newFolder.trim());
                    setNewFolder("");
                    setIsExpanded(false);
                  }
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-700">
            Destination: {value || "root"}
          </span>
          <Button variant="outline" onClick={() => setIsExpanded(true)}>
            Change <ChevronDown size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
