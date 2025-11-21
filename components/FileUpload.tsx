"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import * as XLSX from "xlsx";

interface FileUploadProps {
  onUpload: (data: any) => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    processFiles(files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);

    for (const file of files) {
      try {
        await processFile(file);
      } catch (error) {
        console.error("Error processing file:", error);
        alert(`Error processing file ${file.name}: ${error}`);
      }
    }

    setIsProcessing(false);
  };

  const processFile = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }

          // Check file type
          const fileExtension = file.name.split(".").pop()?.toLowerCase();
          const isExcel = ["xlsx", "xls", "xlsm", "xlsb"].includes(
            fileExtension || ""
          );
          const isGoogleSheets = file.type.includes("spreadsheet") ||
                                 file.type.includes("google-apps");

          if (!isExcel && !isGoogleSheets) {
            reject(new Error("Unsupported file type. Please upload Excel or Google Sheets files."));
            return;
          }

          // Parse the Excel/Google Sheets file
          const workbook = XLSX.read(data, { type: "array" });

          // Extract sheet information
          const sheets = workbook.SheetNames.map((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            });

            // Get range info
            const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
            const rowCount = range.e.r - range.s.r + 1;
            const colCount = range.e.c - range.s.c + 1;

            return {
              name: sheetName,
              rowCount,
              colCount,
              preview: jsonData,
            };
          });

          // Format file size
          const formatFileSize = (bytes: number): string => {
            if (bytes < 1024) return bytes + " bytes";
            else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
            else return (bytes / 1048576).toFixed(2) + " MB";
          };

          const fileData = {
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            fileType: isGoogleSheets ? "Google Sheets" : "Excel",
            sheets,
            uploadedAt: new Date().toISOString(),
          };

          onUpload(fileData);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
          }
          ${isProcessing ? "opacity-50 cursor-wait" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.xlsm,.xlsb,.csv,application/vnd.google-apps.spreadsheet,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {isProcessing
                ? "Processing files..."
                : isDragging
                ? "Drop files here"
                : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Excel (.xlsx, .xls, .xlsm, .xlsb) or Google Sheets files
            </p>
          </div>

          {!isProcessing && (
            <button
              type="button"
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              onClick={handleClick}
            >
              Select Files
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
