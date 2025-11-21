"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  const handleFileUpload = (data: any) => {
    setUploadedFiles((prev) => [...prev, data]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            GVMHED Provider Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Dashboard for ED Providers to access information quickly
          </p>
        </header>

        <div className="grid gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Upload Files
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Upload Excel (.xlsx, .xls) or Google Sheets files to view and analyze data
            </p>
            <FileUpload onUpload={handleFileUpload} />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                Uploaded Files ({uploadedFiles.length})
              </h2>
              <div className="space-y-4">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {file.fileName}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {file.fileSize}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Type: {file.fileType}
                    </p>
                    {file.sheets && file.sheets.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Sheets found: {file.sheets.length}
                        </p>
                        <div className="space-y-2">
                          {file.sheets.map((sheet: any, sheetIndex: number) => (
                            <div
                              key={sheetIndex}
                              className="bg-gray-50 dark:bg-gray-700 rounded p-3"
                            >
                              <p className="font-medium text-gray-800 dark:text-white">
                                {sheet.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {sheet.rowCount} rows × {sheet.colCount} columns
                              </p>
                              {sheet.preview && sheet.preview.length > 0 && (
                                <div className="mt-2 overflow-x-auto">
                                  <table className="min-w-full text-sm">
                                    <tbody>
                                      {sheet.preview.slice(0, 5).map((row: any[], rowIndex: number) => (
                                        <tr key={rowIndex}>
                                          {row.slice(0, 5).map((cell: any, cellIndex: number) => (
                                            <td
                                              key={cellIndex}
                                              className="border border-gray-300 dark:border-gray-600 px-2 py-1"
                                            >
                                              {cell !== null && cell !== undefined ? String(cell) : ""}
                                            </td>
                                          ))}
                                          {row.length > 5 && (
                                            <td className="px-2 py-1 text-gray-500">
                                              ... {row.length - 5} more
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                      {sheet.preview.length > 5 && (
                                        <tr>
                                          <td
                                            colSpan={Math.min(row.length, 5)}
                                            className="px-2 py-1 text-center text-gray-500"
                                          >
                                            ... {sheet.preview.length - 5} more rows
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
