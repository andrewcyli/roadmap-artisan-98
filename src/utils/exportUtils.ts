import { Plan } from '@/types/plan';
import { format, differenceInDays, eachMonthOfInterval, startOfMonth, endOfMonth, min, max } from 'date-fns';

interface ExportData {
  plans: Plan[];
  getLabelName: (id: string) => string;
  getLabelTypeName: (id: string) => string;
  labelTypes: { id: string; name: string }[];
}

// Helper to parse HSL string to hex
function hslToHex(hslStr: string): string {
  const match = hslStr.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (!match) return '4472C4';
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  return [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Excel export (for Google Sheets) - fully editable .xlsx
export const exportToCSV = async ({ plans, getLabelName, labelTypes }: ExportData) => {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MarketerOS';
  workbook.created = new Date();

  // --- Sheet 1: Plans Data ---
  const dataSheet = workbook.addWorksheet('Plans', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const labelCols = labelTypes.map(lt => lt.name);
  const columns = [
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Start Date', key: 'startDate', width: 14 },
    { header: 'End Date', key: 'endDate', width: 14 },
    { header: 'Duration (days)', key: 'duration', width: 14 },
    { header: 'Budget', key: 'budget', width: 14 },
    ...labelTypes.map(lt => ({ header: lt.name, key: lt.id, width: 18 })),
    { header: 'Tags', key: 'tags', width: 25 },
  ];
  dataSheet.columns = columns;

  // Style header row
  const headerRow = dataSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4472C4' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;

  plans.forEach((plan, i) => {
    const start = new Date(plan.startDate);
    const end = new Date(plan.endDate);
    const rowData: Record<string, any> = {
      title: plan.title,
      description: plan.description || '',
      startDate: start,
      endDate: end,
      duration: differenceInDays(end, start),
      budget: plan.budget,
      tags: plan.tags.join(', '),
    };
    labelTypes.forEach(lt => {
      rowData[lt.id] = plan.labels[lt.id] ? getLabelName(plan.labels[lt.id]) : '';
    });

    const row = dataSheet.addRow(rowData);
    
    // Alternate row colors
    if (i % 2 === 0) {
      row.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF2F7FB' } };
    }
    
    // Format dates
    row.getCell('startDate').numFmt = 'yyyy-mm-dd';
    row.getCell('endDate').numFmt = 'yyyy-mm-dd';
    row.getCell('budget').numFmt = '$#,##0';
    row.getCell('duration').numFmt = '0';
  });

  // Add autofilter
  dataSheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + columns.length)}1` };

  // Add borders
  dataSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };
    });
  });

  // --- Sheet 2: Timeline (Gantt-style) ---
  const timelineSheet = workbook.addWorksheet('Timeline');

  if (plans.length > 0) {
    const allDates = plans.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
    const minDate = startOfMonth(min(allDates));
    const maxDate = endOfMonth(max(allDates));
    const months = eachMonthOfInterval({ start: minDate, end: maxDate });

    // Header row with months
    const tlCols = [
      { header: 'Plan', key: 'plan', width: 25 },
      ...months.map(m => ({ header: format(m, 'MMM yyyy'), key: format(m, 'yyyy-MM'), width: 12 })),
    ];
    timelineSheet.columns = tlCols;

    const tlHeader = timelineSheet.getRow(1);
    tlHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    tlHeader.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF333333' } };
    tlHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    plans.forEach(plan => {
      const start = new Date(plan.startDate);
      const end = new Date(plan.endDate);
      const hexColor = hslToHex(plan.color);
      const rowData: Record<string, any> = { plan: plan.title };

      months.forEach(m => {
        const mStart = startOfMonth(m);
        const mEnd = endOfMonth(m);
        const key = format(m, 'yyyy-MM');
        // Check if plan overlaps this month
        if (start <= mEnd && end >= mStart) {
          rowData[key] = '█';
        } else {
          rowData[key] = '';
        }
      });

      const row = timelineSheet.addRow(rowData);
      row.getCell('plan').font = { bold: true };
      
      // Color the active month cells
      months.forEach(m => {
        const mStart = startOfMonth(m);
        const mEnd = endOfMonth(m);
        const key = format(m, 'yyyy-MM');
        const cell = row.getCell(key);
        if (start <= mEnd && end >= mStart) {
          cell.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: `FF${hexColor}` } };
          cell.font = { color: { argb: `FF${hexColor}` }, size: 10 };
          cell.alignment = { horizontal: 'center' };
        }
      });
    });
  }

  // --- Sheet 3: Budget Summary ---
  const budgetSheet = workbook.addWorksheet('Budget Summary');
  budgetSheet.columns = [
    { header: 'Plan', key: 'plan', width: 30 },
    { header: 'Budget', key: 'budget', width: 15 },
    { header: '% of Total', key: 'percent', width: 15 },
  ];

  const bHeader = budgetSheet.getRow(1);
  bHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  bHeader.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF2E7D32' } };

  const totalBudget = plans.reduce((sum, p) => sum + p.budget, 0);
  plans.sort((a, b) => b.budget - a.budget).forEach(plan => {
    const row = budgetSheet.addRow({
      plan: plan.title,
      budget: plan.budget,
      percent: totalBudget > 0 ? plan.budget / totalBudget : 0,
    });
    row.getCell('budget').numFmt = '$#,##0';
    row.getCell('percent').numFmt = '0.0%';
  });

  // Total row
  const totalRow = budgetSheet.addRow({ plan: 'TOTAL', budget: totalBudget, percent: 1 });
  totalRow.font = { bold: true };
  totalRow.getCell('budget').numFmt = '$#,##0';
  totalRow.getCell('percent').numFmt = '0.0%';

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roadmap-export.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};

// PDF export
export const exportToPDF = async (timelineElement: HTMLElement) => {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(timelineElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  const isLandscape = imgWidth > imgHeight;
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'px',
    format: [imgWidth / 2, imgHeight / 2],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth / 2, imgHeight / 2);
  pdf.save('roadmap-export.pdf');
};

// PowerPoint export - each plan as an editable shape on a Gantt timeline
export const exportToPowerPoint = async ({ plans, getLabelName, labelTypes }: ExportData) => {
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.addText('Marketing Roadmap', {
    x: 0.5, y: 1.5, w: 12, h: 1.5,
    fontSize: 36, bold: true, color: '333333',
    align: 'center',
  });
  titleSlide.addText(`Exported ${format(new Date(), 'MMMM d, yyyy')}`, {
    x: 0.5, y: 3, w: 12, h: 0.5,
    fontSize: 14, color: '666666',
    align: 'center',
  });

  // --- Slide 2: Gantt Timeline with editable shapes ---
  const ganttSlide = pptx.addSlide();
  ganttSlide.addText('Timeline View', {
    x: 0.3, y: 0.1, w: 5, h: 0.4,
    fontSize: 20, bold: true, color: '333333',
  });

  if (plans.length > 0) {
    const allDates = plans.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
    const minDate = startOfMonth(min(allDates));
    const maxDate = endOfMonth(max(allDates));
    const totalDays = differenceInDays(maxDate, minDate) || 1;
    const months = eachMonthOfInterval({ start: minDate, end: maxDate });

    const chartLeft = 2.2;
    const chartWidth = 10.5;
    const chartTop = 0.7;
    const rowHeight = 0.4;
    const labelWidth = 2.0;

    // Month headers
    months.forEach(m => {
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const xStart = chartLeft + (differenceInDays(mStart < minDate ? minDate : mStart, minDate) / totalDays) * chartWidth;
      const xEnd = chartLeft + (differenceInDays(mEnd > maxDate ? maxDate : mEnd, minDate) / totalDays) * chartWidth;
      const w = xEnd - xStart;

      ganttSlide.addText(format(m, 'MMM yyyy'), {
        x: xStart, y: chartTop, w: w, h: 0.3,
        fontSize: 8, bold: true, color: 'FFFFFF', align: 'center',
        fill: { color: '4472C4' },
      });

      // Alternating column background
      ganttSlide.addShape(pptx.ShapeType.rect, {
        x: xStart, y: chartTop + 0.3, w: w, h: plans.length * rowHeight + 0.1,
        fill: { color: months.indexOf(m) % 2 === 0 ? 'F5F5F5' : 'FFFFFF' },
        line: { color: 'E0E0E0', width: 0.5 },
      });
    });

    // Plan bars - each is an editable shape with text
    plans.forEach((plan, i) => {
      const start = new Date(plan.startDate);
      const end = new Date(plan.endDate);
      const hexColor = hslToHex(plan.color);
      const y = chartTop + 0.35 + i * rowHeight;

      // Plan label on the left
      ganttSlide.addText(plan.title, {
        x: 0.2, y: y, w: labelWidth, h: rowHeight - 0.05,
        fontSize: 8, bold: true, color: '333333',
        valign: 'middle',
      });

      // Gantt bar - editable shape
      const barX = chartLeft + (differenceInDays(start, minDate) / totalDays) * chartWidth;
      const barW = Math.max((differenceInDays(end, start) / totalDays) * chartWidth, 0.2);

      ganttSlide.addShape(pptx.ShapeType.roundRect, {
        x: barX, y: y, w: barW, h: rowHeight - 0.08,
        fill: { color: hexColor },
        rectRadius: 0.05,
        shadow: { type: 'outer', blur: 3, offset: 1, color: '999999', opacity: 0.3 },
      });

      // Text inside bar (date range)
      const dateStr = `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
      if (barW > 1.2) {
        ganttSlide.addText(dateStr, {
          x: barX, y: y, w: barW, h: rowHeight - 0.08,
          fontSize: 7, color: 'FFFFFF', align: 'center', valign: 'middle',
        });
      }
    });
  }

  // --- Slide 3: Editable table with all plan details ---
  const tableSlide = pptx.addSlide();
  tableSlide.addText('Plan Details', {
    x: 0.3, y: 0.1, w: 5, h: 0.5,
    fontSize: 20, bold: true, color: '333333',
  });

  const labelCols = labelTypes.map(lt => lt.name);
  const colHeaders = ['Plan', 'Description', 'Start', 'End', 'Budget', ...labelCols, 'Tags'];
  
  const headerRow = colHeaders.map(text => ({
    text,
    options: { bold: true, fill: { color: '4472C4' }, color: 'FFFFFF', fontSize: 9, align: 'center' as const },
  }));

  const dataRows = plans.map((plan, i) => {
    const fill = i % 2 === 0 ? 'F2F7FB' : 'FFFFFF';
    const opts = { fontSize: 8, fill: { color: fill }, valign: 'middle' as const };
    return [
      { text: plan.title, options: { ...opts, bold: true } },
      { text: plan.description || '', options: opts },
      { text: format(new Date(plan.startDate), 'MMM d, yyyy'), options: opts },
      { text: format(new Date(plan.endDate), 'MMM d, yyyy'), options: opts },
      { text: `$${plan.budget.toLocaleString()}`, options: { ...opts, align: 'right' as const } },
      ...labelTypes.map(lt => ({
        text: plan.labels[lt.id] ? getLabelName(plan.labels[lt.id]) : '',
        options: opts,
      })),
      { text: plan.tags.join(', '), options: opts },
    ];
  });

  const baseCols = 5;
  const extraCols = labelCols.length + 1; // labels + tags
  const totalCols = baseCols + extraCols;
  const availW = 12.5;
  const fixedW = [2.0, 2.5, 1.2, 1.2, 1.0]; // plan, desc, start, end, budget
  const remainW = availW - fixedW.reduce((a, b) => a + b, 0);
  const dynamicW = Array(extraCols).fill(remainW / extraCols);

  tableSlide.addTable([headerRow, ...dataRows] as any, {
    x: 0.3, y: 0.7, w: availW,
    border: { pt: 0.5, color: 'D0D0D0' },
    colW: [...fixedW, ...dynamicW],
    autoPage: true,
    autoPageRepeatHeader: true,
  });

  // --- Slide 4: Budget breakdown ---
  const budgetSlide = pptx.addSlide();
  budgetSlide.addText('Budget Overview', {
    x: 0.3, y: 0.1, w: 5, h: 0.5,
    fontSize: 20, bold: true, color: '333333',
  });

  const totalBudget = plans.reduce((sum, p) => sum + p.budget, 0);
  const budgetHeader = [
    { text: 'Plan', options: { bold: true, fill: { color: '2E7D32' }, color: 'FFFFFF', fontSize: 10 } },
    { text: 'Budget', options: { bold: true, fill: { color: '2E7D32' }, color: 'FFFFFF', fontSize: 10, align: 'right' as const } },
    { text: '% of Total', options: { bold: true, fill: { color: '2E7D32' }, color: 'FFFFFF', fontSize: 10, align: 'center' as const } },
  ];

  const sortedPlans = [...plans].sort((a, b) => b.budget - a.budget);
  const budgetRows = sortedPlans.map((plan, i) => {
    const fill = i % 2 === 0 ? 'F2F2F2' : 'FFFFFF';
    const pct = totalBudget > 0 ? ((plan.budget / totalBudget) * 100).toFixed(1) : '0';
    return [
      { text: plan.title, options: { fontSize: 9, fill: { color: fill } } },
      { text: `$${plan.budget.toLocaleString()}`, options: { fontSize: 9, fill: { color: fill }, align: 'right' as const } },
      { text: `${pct}%`, options: { fontSize: 9, fill: { color: fill }, align: 'center' as const } },
    ];
  });

  budgetRows.push([
    { text: 'TOTAL', options: { fontSize: 10, bold: true, fill: { color: 'E8F5E9' } } as any },
    { text: `$${totalBudget.toLocaleString()}`, options: { fontSize: 10, bold: true, fill: { color: 'E8F5E9' }, align: 'right' as const } as any },
    { text: '100%', options: { fontSize: 10, bold: true, fill: { color: 'E8F5E9' }, align: 'center' as const } as any },
  ]);

  budgetSlide.addTable([budgetHeader, ...budgetRows] as any, {
    x: 2, y: 0.8, w: 9,
    border: { pt: 0.5, color: 'D0D0D0' },
    colW: [4, 2.5, 2.5],
  });

  pptx.writeFile({ fileName: 'roadmap-export.pptx' });
};

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
