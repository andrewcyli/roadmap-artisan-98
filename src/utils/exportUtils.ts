import { Plan } from '@/types/plan';
import { format } from 'date-fns';

interface ExportData {
  plans: Plan[];
  getLabelName: (id: string) => string;
  getLabelTypeName: (id: string) => string;
  labelTypes: { id: string; name: string }[];
}

// CSV export (for Google Sheets)
export const exportToCSV = ({ plans, getLabelName, labelTypes }: ExportData) => {
  const labelCols = labelTypes.map(lt => lt.name);
  const headers = ['Title', 'Description', 'Start Date', 'End Date', 'Budget', ...labelCols, 'Tags'];
  
  const rows = plans.map(plan => {
    const labelValues = labelTypes.map(lt => {
      const labelId = plan.labels[lt.id];
      return labelId ? getLabelName(labelId) : '';
    });
    return [
      `"${(plan.title || '').replace(/"/g, '""')}"`,
      `"${(plan.description || '').replace(/"/g, '""')}"`,
      format(new Date(plan.startDate), 'yyyy-MM-dd'),
      format(new Date(plan.endDate), 'yyyy-MM-dd'),
      plan.budget.toString(),
      ...labelValues.map(v => `"${v}"`),
      `"${plan.tags.join(', ')}"`,
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, 'roadmap-export.csv', 'text/csv');
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

// PowerPoint export
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

  // Plans table slide
  const tableSlide = pptx.addSlide();
  tableSlide.addText('Plan Overview', {
    x: 0.5, y: 0.3, w: 12, h: 0.6,
    fontSize: 24, bold: true, color: '333333',
  });

  const labelCols = labelTypes.map(lt => lt.name);
  const headerRow = [
    { text: 'Plan', options: { bold: true, fill: { color: '4472C4' }, color: 'FFFFFF', fontSize: 10 } },
    { text: 'Start', options: { bold: true, fill: { color: '4472C4' }, color: 'FFFFFF', fontSize: 10 } },
    { text: 'End', options: { bold: true, fill: { color: '4472C4' }, color: 'FFFFFF', fontSize: 10 } },
    { text: 'Budget', options: { bold: true, fill: { color: '4472C4' }, color: 'FFFFFF', fontSize: 10 } },
    ...labelCols.map(name => ({ text: name, options: { bold: true, fill: { color: '4472C4' }, color: 'FFFFFF', fontSize: 10 } })),
  ];

  const dataRows = plans.map((plan, i) => {
    const fill = i % 2 === 0 ? 'F2F2F2' : 'FFFFFF';
    const opts = { fontSize: 9, fill: { color: fill } };
    return [
      { text: plan.title, options: opts },
      { text: format(new Date(plan.startDate), 'MMM d, yyyy'), options: opts },
      { text: format(new Date(plan.endDate), 'MMM d, yyyy'), options: opts },
      { text: `$${plan.budget.toLocaleString()}`, options: opts },
      ...labelTypes.map(lt => ({
        text: plan.labels[lt.id] ? getLabelName(plan.labels[lt.id]) : '',
        options: opts,
      })),
    ];
  });

  tableSlide.addTable([headerRow, ...dataRows] as any, {
    x: 0.3, y: 1.0, w: 12.5,
    border: { pt: 0.5, color: 'CCCCCC' },
    colW: [2.5, 1.5, 1.5, 1.2, ...labelCols.map(() => (12.5 - 6.7) / labelCols.length)],
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
