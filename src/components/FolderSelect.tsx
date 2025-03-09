import React, { useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Check } from "lucide-react";

type FolderSelectProps = {
  folders: string[];
  value: string;
  onChange: (value: string) => void;
};

export const FolderSelect: React.FC<FolderSelectProps> = ({
  folders,
  value,
  onChange,
}) => {
  const [search, setSearch] = useState("");

  // Filter folders based on search text.
  const filteredFolders = folders.filter((folder) =>
    folder.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      <Command className="w-full">
        <CommandInput
          placeholder="Search projects..."
          value={search}
          onValueChange={(val) => setSearch(val)}
        />
        <CommandList>
          <CommandGroup heading="Projects">
            {/* Hardcoded root option */}
            <CommandItem
              onSelect={() => {
                onChange("");
                setSearch("");
              }}
              className={`flex items-center justify-between ${
                value === "" ? "border rounded bg-blue-100" : ""
              }`}
            >
              <span>root</span>
              {value === "" && <Check size={16} className="text-green-600" />}
            </CommandItem>
            {filteredFolders.map((folderItem) => (
              <CommandItem
                key={folderItem}
                onSelect={() => {
                  onChange(folderItem);
                  setSearch("");
                }}
                className={`flex items-center justify-between ${
                  folderItem === value ? "border rounded bg-blue-100" : ""
                }`}
              >
                <span>{folderItem}</span>
                {folderItem === value && (
                  <Check size={16} className="text-green-600" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          {filteredFolders.length === 0 && (
            <CommandEmpty>No projects found.</CommandEmpty>
          )}
        </CommandList>
      </Command>
    </div>
  );
};
