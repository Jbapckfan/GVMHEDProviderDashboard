"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import Card from "@/components/Card";
import InsightsPanel from "@/components/InsightsPanel";
import DataVisualization from "@/components/DataVisualization";
import SearchBar from "@/components/SearchBar";
import { DataAnalyzer, DataSummary } from "@/lib/dataAnalyzer";

interface UploadedFile {
  fileName: string;
  fileSize: string;
  fileType: string;
  sheets: any[];
  uploadedAt: string;
  analysis?: DataSummary;
  chartData?: any[];
}

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState<any>(null);

  const handleFileUpload = (data: any) => {
    // Analyze each sheet for insights
    const filesWithAnalysis = {
      ...data,
      analysis: data.sheets[0] ? DataAnalyzer.analyzeData(data.sheets[0].preview, data.sheets[0].name) : undefined,
      chartData: data.sheets[0] ? DataAnalyzer.prepareChartData(
        DataAnalyzer.analyzeData(data.sheets[0].preview, data.sheets[0].name).columns,
        data.sheets[0].preview.slice(1)
      ) : [],
    };

    setUploadedFiles((prev) => [...prev, filesWithAnalysis]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredData(null);
      return;
    }

    // Search across all uploaded files
    const results = uploadedFiles.map(file => ({
      ...file,
      sheets: file.sheets.map(sheet => ({
        ...sheet,
        preview: DataAnalyzer.searchData(sheet.preview, query),
      })),
    }));

    setFilteredData(results);
  };

  const displayFiles = filteredData || uploadedFiles;

  return (
    <div className="min-h-screen relative">
      {/* Layered ambient background system */}
      <BackgroundBlobs />

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          {/* Header with gradient typography */}
          <header className="mb-16 sm:mb-20 text-center">
            <div className="inline-block mb-4">
              <span className="px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase bg-white/[0.05] border border-white/[0.10] text-[#8A8F98]">
                ED Provider Tools
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 gradient-text">
              GVMHED Provider Dashboard
            </h1>
            <p className="text-lg sm:text-xl text-[#8A8F98] max-w-2xl mx-auto leading-relaxed">
              Upload and analyze <span className="text-[#5E6AD2] font-medium">Excel</span> and{" "}
              <span className="text-[#5E6AD2] font-medium">Google Sheets</span> files to access critical
              information quickly and efficiently
            </p>
          </header>

          {/* Main content grid */}
          <div className="grid gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Upload section */}
            <Card variant="gradient" hover={false} spotlight={false} className="p-8 sm:p-10">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEDEF] mb-2">
                  Upload Files
                </h2>
                <p className="text-[#8A8F98]">
                  Drag and drop or click to upload spreadsheet files for instant AI-powered analysis
                </p>
              </div>
              <FileUpload onUpload={handleFileUpload} />
            </Card>

            {/* Search bar - Only show when files are uploaded */}
            {uploadedFiles.length > 0 && (
              <Card variant="glass" className="p-6">
                <SearchBar onSearch={handleSearch} />
              </Card>
            )}

            {/* AI Insights and Healthcare Metrics */}
            {uploadedFiles.length > 0 && uploadedFiles.some(f => f.analysis) && (
              <InsightsPanel
                insights={uploadedFiles.flatMap(f => f.analysis?.insights || [])}
                healthcareMetrics={uploadedFiles[0]?.analysis?.healthcareMetrics}
              />
            )}

            {/* Data Visualizations */}
            {uploadedFiles.length > 0 && uploadedFiles.some(f => f.chartData && f.chartData.length > 0) && (
              <div className="grid gap-6 lg:grid-cols-2">
                {uploadedFiles
                  .filter(f => f.chartData && f.chartData.length > 0)
                  .slice(0, 2)
                  .map((file, index) => (
                    <DataVisualization
                      key={index}
                      data={file.chartData!}
                      title={`Data from ${file.fileName}`}
                      description="Auto-generated visualization"
                    />
                  ))}
              </div>
            )}

            {/* Uploaded files section */}
            {displayFiles.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-[#EDEDEF]">
                    Uploaded Files
                  </h2>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#5E6AD2]/20 text-[#5E6AD2] border border-[#5E6AD2]/30">
                    {displayFiles.length} {displayFiles.length === 1 ? 'file' : 'files'}
                    {searchQuery && <span className="ml-1 text-xs">• filtered</span>}
                  </span>
                </div>

                <div className="space-y-4">
                  {displayFiles.map((file, index) => (
                    <Card key={index} variant="default" className="p-6">
                      {/* File header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-[#5E6AD2]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#EDEDEF]">
                              {file.fileName}
                            </h3>
                            <p className="text-sm text-[#8A8F98]">
                              {file.fileType} • {file.fileSize}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Sheets preview */}
                      {file.sheets && file.sheets.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-gradient-to-r from-white/[0.06] to-transparent" />
                            <span className="text-xs font-mono tracking-wider uppercase text-[#8A8F98]">
                              {file.sheets.length} {file.sheets.length === 1 ? 'Sheet' : 'Sheets'}
                            </span>
                            <div className="h-px flex-1 bg-gradient-to-l from-white/[0.06] to-transparent" />
                          </div>

                          <div className="space-y-3">
                            {file.sheets.map((sheet: any, sheetIndex: number) => (
                              <div
                                key={sheetIndex}
                                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] transition-colors duration-200"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-[#EDEDEF]">{sheet.name}</h4>
                                  <span className="text-xs text-[#8A8F98] font-mono">
                                    {sheet.rowCount} × {sheet.colCount}
                                  </span>
                                </div>

                                {/* Data preview table */}
                                {sheet.preview && sheet.preview.length > 0 && (
                                  <div className="overflow-x-auto">
                                    <div className="inline-block min-w-full">
                                      <table className="min-w-full text-sm">
                                        <tbody className="divide-y divide-white/[0.06]">
                                          {sheet.preview.slice(0, 5).map((row: any[], rowIndex: number) => (
                                            <tr key={rowIndex} className="divide-x divide-white/[0.06]">
                                              {row.slice(0, 5).map((cell: any, cellIndex: number) => (
                                                <td
                                                  key={cellIndex}
                                                  className="px-3 py-2 text-[#8A8F98] bg-[#0a0a0c]/50 first:rounded-l last:rounded-r"
                                                >
                                                  {cell !== null && cell !== undefined ? String(cell) : "—"}
                                                </td>
                                              ))}
                                              {row.length > 5 && (
                                                <td className="px-3 py-2 text-[#8A8F98] italic">
                                                  +{row.length - 5} more
                                                </td>
                                              )}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                      {sheet.preview.length > 5 && (
                                        <div className="mt-2 text-center text-xs text-[#8A8F98] italic">
                                          +{sheet.preview.length - 5} more rows
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
