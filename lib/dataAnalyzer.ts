/**
 * DataAnalyzer - AI-powered data analysis engine
 *
 * Automatically detects patterns, generates insights, and provides
 * healthcare-specific analytics for ED providers
 */

import { groupBy, mean, median, max, min, sortBy } from 'lodash';
import { parseISO, differenceInMinutes, format } from 'date-fns';

export interface DataInsight {
  type: 'trend' | 'anomaly' | 'summary' | 'recommendation' | 'alert';
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'low';
  value?: string | number;
  metric?: string;
}

export interface ColumnInfo {
  name: string;
  type: 'numeric' | 'date' | 'time' | 'text' | 'categorical' | 'boolean';
  sampleValues: any[];
  uniqueCount: number;
  nullCount: number;
}

export interface DataSummary {
  totalRows: number;
  totalColumns: number;
  columns: ColumnInfo[];
  insights: DataInsight[];
  healthcareMetrics?: HealthcareMetrics;
}

export interface HealthcareMetrics {
  patientVolume?: number;
  averageWaitTime?: number;
  peakHours?: string[];
  departmentUtilization?: number;
  criticalAlerts?: number;
}

export class DataAnalyzer {
  /**
   * Analyze uploaded spreadsheet data and generate insights
   */
  static analyzeData(data: any[][], sheetName: string): DataSummary {
    if (!data || data.length === 0) {
      return {
        totalRows: 0,
        totalColumns: 0,
        columns: [],
        insights: [],
      };
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Analyze columns
    const columns = this.analyzeColumns(headers, rows);

    // Generate insights
    const insights = this.generateInsights(columns, rows, sheetName);

    // Detect healthcare-specific metrics
    const healthcareMetrics = this.detectHealthcareMetrics(columns, rows);

    return {
      totalRows: rows.length,
      totalColumns: headers.length,
      columns,
      insights,
      healthcareMetrics,
    };
  }

  /**
   * Analyze each column to determine type and statistics
   */
  private static analyzeColumns(headers: any[], rows: any[][]): ColumnInfo[] {
    return headers.map((header, colIndex) => {
      const values = rows.map(row => row[colIndex]).filter(v => v !== null && v !== undefined && v !== '');
      const uniqueValues = new Set(values);

      return {
        name: String(header || `Column ${colIndex + 1}`),
        type: this.detectColumnType(values),
        sampleValues: values.slice(0, 5),
        uniqueCount: uniqueValues.size,
        nullCount: rows.length - values.length,
      };
    });
  }

  /**
   * Detect column type based on values
   */
  private static detectColumnType(values: any[]): ColumnInfo['type'] {
    if (values.length === 0) return 'text';

    // Check if numeric
    const numericCount = values.filter(v => !isNaN(Number(v)) && v !== '').length;
    if (numericCount / values.length > 0.8) return 'numeric';

    // Check if date
    const datePatterns = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/;
    const dateCount = values.filter(v => datePatterns.test(String(v))).length;
    if (dateCount / values.length > 0.8) return 'date';

    // Check if time
    const timePattern = /^\d{1,2}:\d{2}(:\d{2})?(\s?[AP]M)?$/i;
    const timeCount = values.filter(v => timePattern.test(String(v))).length;
    if (timeCount / values.length > 0.8) return 'time';

    // Check if boolean
    const boolValues = values.map(v => String(v).toLowerCase());
    const boolCount = boolValues.filter(v => ['true', 'false', 'yes', 'no', '1', '0'].includes(v)).length;
    if (boolCount / values.length > 0.8) return 'boolean';

    // Check if categorical (low unique count)
    const uniqueCount = new Set(values).size;
    if (uniqueCount < values.length * 0.5 && uniqueCount < 20) return 'categorical';

    return 'text';
  }

  /**
   * Generate intelligent insights from data
   */
  private static generateInsights(columns: ColumnInfo[], rows: any[][], sheetName: string): DataInsight[] {
    const insights: DataInsight[] = [];

    // Data quality insights
    const highNullColumns = columns.filter(col => col.nullCount / rows.length > 0.3);
    if (highNullColumns.length > 0) {
      insights.push({
        type: 'alert',
        severity: 'medium',
        title: 'Missing Data Detected',
        description: `${highNullColumns.length} column(s) have >30% missing values: ${highNullColumns.map(c => c.name).join(', ')}`,
      });
    }

    // Numeric column analysis
    const numericColumns = columns.filter(col => col.type === 'numeric');
    numericColumns.forEach(col => {
      const colIndex = columns.indexOf(col);
      const values = rows.map(row => Number(row[colIndex])).filter(v => !isNaN(v));

      if (values.length > 0) {
        const avg = mean(values);
        const med = median(values);
        const maxVal = max(values);
        const minVal = min(values);

        // Check for outliers
        const stdDev = Math.sqrt(mean(values.map(v => Math.pow(v - avg, 2))));
        const outliers = values.filter(v => Math.abs(v - avg) > 3 * stdDev);

        if (outliers.length > 0) {
          insights.push({
            type: 'anomaly',
            severity: 'low',
            title: `Outliers in ${col.name}`,
            description: `Found ${outliers.length} outlier(s). Range: ${minVal?.toFixed(2)} - ${maxVal?.toFixed(2)}, Avg: ${avg.toFixed(2)}`,
            metric: col.name,
            value: outliers.length,
          });
        }
      }
    });

    // Data volume summary
    insights.push({
      type: 'summary',
      title: 'Data Overview',
      description: `${rows.length.toLocaleString()} records across ${columns.length} columns`,
      value: rows.length,
    });

    return insights;
  }

  /**
   * Detect healthcare-specific metrics from column names and data
   */
  private static detectHealthcareMetrics(columns: ColumnInfo[], rows: any[][]): HealthcareMetrics | undefined {
    const columnNames = columns.map(c => c.name.toLowerCase());

    // Look for healthcare-related columns
    const hasPatientData = columnNames.some(name =>
      name.includes('patient') || name.includes('admission') || name.includes('discharge')
    );

    const hasWaitTime = columnNames.some(name =>
      name.includes('wait') || name.includes('time') || name.includes('duration')
    );

    const hasTimestamp = columns.some(col => col.type === 'date' || col.type === 'time');

    if (!hasPatientData && !hasWaitTime && !hasTimestamp) {
      return undefined;
    }

    const metrics: HealthcareMetrics = {};

    // Calculate patient volume
    metrics.patientVolume = rows.length;

    // Calculate average wait time if applicable
    const waitTimeCol = columns.find(col =>
      col.name.toLowerCase().includes('wait') && col.type === 'numeric'
    );

    if (waitTimeCol) {
      const colIndex = columns.indexOf(waitTimeCol);
      const waitTimes = rows.map(row => Number(row[colIndex])).filter(v => !isNaN(v));
      if (waitTimes.length > 0) {
        metrics.averageWaitTime = mean(waitTimes);
      }
    }

    // Detect peak hours if timestamp data exists
    const timeCol = columns.find(col => col.type === 'time' || col.name.toLowerCase().includes('time'));
    if (timeCol) {
      const colIndex = columns.indexOf(timeCol);
      const hours = rows.map(row => {
        const timeStr = String(row[colIndex]);
        const match = timeStr.match(/(\d{1,2}):(\d{2})/);
        return match ? parseInt(match[1]) : null;
      }).filter(h => h !== null);

      if (hours.length > 0) {
        const hourGroups = groupBy(hours);
        const peakHour = Object.entries(hourGroups)
          .sort((a, b) => b[1].length - a[1].length)[0];

        if (peakHour) {
          const hour = parseInt(peakHour[0]);
          metrics.peakHours = [`${hour}:00 - ${hour + 1}:00`];
        }
      }
    }

    return metrics;
  }

  /**
   * Search data using natural language query
   */
  static searchData(data: any[][], query: string): any[][] {
    if (!query || !data || data.length === 0) return data;

    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 0);

    return data.filter(row => {
      const rowText = row.join(' ').toLowerCase();
      return searchTerms.some(term => rowText.includes(term));
    });
  }

  /**
   * Generate chart-ready data for visualization
   */
  static prepareChartData(columns: ColumnInfo[], rows: any[][]): any[] {
    // Find the best columns for charting
    const numericColumns = columns.filter(col => col.type === 'numeric');
    const categoricalColumns = columns.filter(col => col.type === 'categorical');
    const dateColumns = columns.filter(col => col.type === 'date');

    if (numericColumns.length === 0) return [];

    // If we have dates and numeric, create time series
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      const dateColIndex = columns.indexOf(dateColumns[0]);
      const numColIndex = columns.indexOf(numericColumns[0]);

      return rows
        .map(row => ({
          date: row[dateColIndex],
          value: Number(row[numColIndex]),
        }))
        .filter(item => item.value && !isNaN(item.value))
        .slice(0, 50); // Limit for performance
    }

    // If we have categorical and numeric, create bar chart data
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const catColIndex = columns.indexOf(categoricalColumns[0]);
      const numColIndex = columns.indexOf(numericColumns[0]);

      const grouped = groupBy(rows, row => row[catColIndex]);

      return Object.entries(grouped)
        .map(([category, items]) => ({
          category,
          value: mean(items.map(row => Number(row[numColIndex])).filter(v => !isNaN(v))),
          count: items.length,
        }))
        .slice(0, 20); // Limit categories
    }

    return [];
  }
}
