import { ReportDataResult } from './report.types';
import { auditLogService } from '../audit/audit-log.service';

export class ReportExportService {
  /**
   * 1. EXPORT TO CSV (UTF-8 with BOM for perfect Excel Vietnamese display)
   */
  exportToCSV(data: ReportDataResult): { content: string; filename: string; mimeType: string } {
    const BOM = '\uFEFF';
    const lines: string[] = [];

    // Header metadata
    lines.push(`"${data.title}"`);
    lines.push(`"Thời gian xuất báo cáo: ${data.generatedAt}"`);
    lines.push(`"Tổng số bản ghi: ${data.totalRows}"`);
    lines.push(''); // Empty line

    // Column Headers
    const headers = data.columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
    lines.push(headers);

    // Data Rows
    for (const row of data.rows) {
      const line = data.columns
        .map((c) => {
          const val = row[c.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
      lines.push(line);
    }

    // Summary Rows if available
    if (data.summary) {
      lines.push('');
      lines.push('"--- TỔNG KẾT ---"');
      for (const [key, val] of Object.entries(data.summary)) {
        lines.push(`"${key.replace(/"/g, '""')}","${String(val).replace(/"/g, '""')}"`);
      }
    }

    const content = BOM + lines.join('\r\n');
    const filename = `Bao_Cao_${data.type}_${Date.now()}.csv`;

    return {
      content,
      filename,
      mimeType: 'text/csv; charset=utf-8',
    };
  }

  /**
   * 2. EXPORT TO EXCEL (XML Spreadsheet compatible with Microsoft Excel)
   */
  exportToExcel(data: ReportDataResult): { content: string; filename: string; mimeType: string } {
    const escapeXml = (str: any) =>
      String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Segoe UI" ss:Size="16" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="Subtitle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCell">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F1F5F9"/>
   </Borders>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#334155"/>
  </Style>
  <Style ss:ID="Summary">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="BaoCao">
  <Table ss:DefaultColumnWidth="120">
   <Row ss:Height="30">
    <Cell ss:StyleID="Title"><Data ss:Type="String">${escapeXml(data.title)}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Subtitle"><Data ss:Type="String">Thời gian xuất: ${escapeXml(data.generatedAt)} | Tổng số dòng: ${data.totalRows}</Data></Cell>
   </Row>
   <Row></Row>
   <Row ss:Height="24">
`;

    // Header cells
    for (const col of data.columns) {
      xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>\n`;
    }
    xml += `   </Row>\n`;

    // Rows
    for (const row of data.rows) {
      xml += `   <Row ss:Height="20">\n`;
      for (const col of data.columns) {
        xml += `    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row[col.key])}</Data></Cell>\n`;
      }
      xml += `   </Row>\n`;
    }

    // Summary if any
    if (data.summary) {
      xml += `   <Row></Row>\n`;
      xml += `   <Row ss:Height="22"><Cell ss:StyleID="Summary"><Data ss:Type="String">TỔNG KẾT BÁO CÁO</Data></Cell></Row>\n`;
      for (const [k, v] of Object.entries(data.summary)) {
        xml += `   <Row ss:Height="20">
    <Cell ss:StyleID="Summary"><Data ss:Type="String">${escapeXml(k)}</Data></Cell>
    <Cell ss:StyleID="Summary"><Data ss:Type="String">${escapeXml(v)}</Data></Cell>
   </Row>\n`;
      }
    }

    xml += `  </Table>
 </Worksheet>
</Workbook>`;

    const filename = `Bao_Cao_${data.type}_${Date.now()}.xls`;
    return {
      content: xml,
      filename,
      mimeType: 'application/vnd.ms-excel',
    };
  }

  /**
   * 3. EXPORT TO PDF (HTML Print Template ready for PDF download or window.print)
   */
  exportToPDF(data: ReportDataResult): { content: string; filename: string; mimeType: string } {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${data.title} - K-Home</title>
  <style>
    body { font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1F2937; }
    .header { border-bottom: 2px solid #0F6B4F; padding-bottom: 15px; margin-bottom: 20px; }
    .system-title { font-size: 13px; font-weight: bold; color: #0F6B4F; text-transform: uppercase; letter-spacing: 1px; }
    .report-title { font-size: 22px; font-weight: bold; margin: 6px 0; color: #0F6B4F; }
    .meta { font-size: 11px; color: #6B7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
    th { background-color: #E8F5ED; color: #0F6B4F; font-weight: 600; text-align: left; padding: 8px 10px; border: 1px solid #c2e5d0; }
    td { padding: 8px 10px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .summary-box { margin-top: 25px; padding: 15px; background: #E8F5ED; border: 1px solid #c2e5d0; border-radius: 8px; font-size: 12px; color: #0F6B4F; }
    .footer { margin-top: 40px; font-size: 10px; color: #6B7280; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="system-title">K-HOME - HỆ THỐNG QUẢN LÝ CHUNG CƯ THÔNG MINH | SMART LIVING, BETTER TOGETHER</div>
    <div class="report-title">${data.title}</div>
    <div class="meta">Ngày xuất: ${data.generatedAt} | Tổng số bản ghi: ${data.totalRows} | Định dạng chuẩn A4</div>
  </div>

  <table>
    <thead>
      <tr>
        ${data.columns.map((c) => `<th>${c.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.rows
        .map(
          (row) => `<tr>${data.columns.map((c) => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>`
        )
        .join('')}
    </tbody>
  </table>

  ${
    data.summary
      ? `<div class="summary-box">
          <strong>TỔNG KẾT SỐ LIỆU:</strong><br/>
          ${Object.entries(data.summary)
            .map(([k, v]) => `• ${k}: <strong>${v}</strong>`)
            .join('<br/>')}
        </div>`
      : ''
  }

  <div class="footer">
    Báo cáo điện tử được trích xuất tự động từ hệ thống K-Home (Smart Living, Better Together). Trang 1 / 1
  </div>
</body>
</html>`;

    const filename = `Bao_Cao_${data.type}_${Date.now()}.html`;
    return {
      content: html,
      filename,
      mimeType: 'text/html; charset=utf-8',
    };
  }

  /**
   * Log export event
   */
  async logExport(reportType: string, format: string, actor?: { id?: string; email?: string; role?: string }) {
    await auditLogService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorRole: actor?.role,
      action: 'REPORT_EXPORTED',
      entity: 'REPORT',
      metadata: { reportType, format },
    });
  }
}

export const reportExportService = new ReportExportService();
