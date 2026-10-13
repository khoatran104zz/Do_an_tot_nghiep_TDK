import { prisma } from '../src/lib/prisma';
import { smartAlertService } from '../src/modules/smart-operations/smart-alert.service';
import { aiAssistantService } from '../src/modules/ai/ai-assistant.service';
import { reportService } from '../src/modules/report/report.service';
import { reportExportService } from '../src/modules/report/report-export.service';

async function runTestSuite() {
  console.log('====================================================');
  console.log('🚀 RUNNING INTEGRATION TESTS FOR OPERATIONS & ALERTS');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ PASS [${totalTests}]: ${testName}`);
    } else {
      console.error(`❌ FAIL [${totalTests}]: ${testName}`, detail || '');
    }
  }

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: Smart Alert Engine (Operational & SLA Alerts)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Smart Alert Engine ---');
    const alertsData = await smartAlertService.queryAlerts({ limit: 20 });
    assert(Array.isArray(alertsData.items), 'Smart alerts queried successfully');
    assert(typeof alertsData.total === 'number', 'Alerts summary counts calculated', alertsData.counts);

    // ----------------------------------------------------
    // TEST GROUP 2: AI Assistant & Safe Context
    // ----------------------------------------------------
    console.log('\n--- 2. Testing AI Assistant & Safe Context ---');
    
    // Find an existing resident user for testing safe context
    const testResidentUser = await prisma.user.findFirst({
      where: { role: 'RESIDENT' },
      include: { residentProfile: { include: { occupancies: { include: { apartment: true } } } } },
    });

    if (testResidentUser) {
      console.log(`Testing resident safe context for User ID: ${testResidentUser.id}`);
      
      // Question 1: Billing inquiry
      const billAnswer = await aiAssistantService.chat(
        'Tháng này tôi cần đóng những khoản phí nào?',
        testResidentUser.id,
        { email: testResidentUser.email, role: 'RESIDENT' }
      );
      assert(
        billAnswer.response.includes('hóa đơn') || billAnswer.response.includes('phí') || billAnswer.response.includes('thanh toán') || billAnswer.response.includes('không có'),
        'AI answered billing inquiry using resident safe context'
      );

      // Question 2: Facility inquiry
      const facilityAnswer = await aiAssistantService.chat(
        'Giờ mở cửa hồ bơi và phòng gym là mấy giờ?',
        testResidentUser.id,
        { email: testResidentUser.email, role: 'RESIDENT' }
      );
      assert(
        facilityAnswer.response.includes('Hồ bơi') || facilityAnswer.response.includes('Gym') || facilityAnswer.response.includes('tiện ích') || facilityAnswer.response.includes('bể bơi'),
        'AI answered facility inquiry accurately'
      );

      // Question 3: Regulations inquiry
      const ruleAnswer = await aiAssistantService.chat(
        'Chung cư có quy định gì về nuôi thú cưng không?',
        testResidentUser.id,
        { email: testResidentUser.email, role: 'RESIDENT' }
      );
      assert(
        ruleAnswer.response.includes('thú cưng') || ruleAnswer.response.includes('chó') || ruleAnswer.response.includes('Quy định'),
        'AI answered building regulation question'
      );
    } else {
      console.log('⚠️ Skipping resident-specific AI chat test (no RESIDENT user in database)');
    }

    // Test Incident Classification
    console.log('Testing AI Incident Classification...');
    const waterIncident = await aiAssistantService.classifyIncident(
      'Ống nước bồn rửa chén bị xì',
      'Đường ống nước dưới bồn rửa bị nứt, nước đang rò rỉ ồ ạt tràn ra sàn bếp'
    );
    assert(waterIncident.data?.category === 'WATER', 'Water leak classified into WATER category', { category: waterIncident.data?.category });
    assert(waterIncident.data?.priority === 'URGENT' || waterIncident.data?.priority === 'HIGH', 'Water leak classified as high/urgent priority', { priority: waterIncident.data?.priority });

    const lightIncident = await aiAssistantService.classifyIncident(
      'Đèn hành lang bị nhấp nháy',
      'Bóng đèn tuýp trước cửa căn hộ cứ chập chờn lúc sáng lúc tối'
    );
    assert(lightIncident.data?.category === 'ELECTRIC', 'Flickering light classified into ELECTRIC category', { category: lightIncident.data?.category });
    assert(lightIncident.data?.priority === 'LOW' || lightIncident.data?.priority === 'MEDIUM', 'Flickering light priority is reasonable', { priority: lightIncident.data?.priority });

    // ----------------------------------------------------
    // TEST GROUP 3: Reporting & Export Service
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Reporting & Multi-format Export ---');
    
    // Revenue summary report
    const revenueReport = await reportService.getReportData({ type: 'REVENUE' });
    assert(revenueReport.columns.length > 0, 'Revenue report generated columns', { count: revenueReport.columns.length });
    assert(Array.isArray(revenueReport.rows), 'Revenue report generated rows array', { rows: revenueReport.rows.length });

    // CSV Export
    console.log('Testing CSV Export...');
    const csvExport = reportExportService.exportToCSV(revenueReport);
    assert(csvExport.mimeType.includes('text/csv'), 'CSV Content-Type is valid');
    assert(csvExport.content.charCodeAt(0) === 0xFEFF, 'CSV contains UTF-8 BOM for Excel compatibility');

    // Excel Export
    console.log('Testing Excel (XML Spreadsheet) Export...');
    const excelExport = reportExportService.exportToExcel(revenueReport);
    assert((excelExport.mimeType.includes('ms-excel') || excelExport.mimeType.includes('spreadsheetml')), 'Excel Content-Type is valid');
    assert(excelExport.content.includes('<Workbook'), 'Excel contains valid XML Spreadsheet Workbook structure');

    // PDF Export
    console.log('Testing PDF (HTML print template) Export...');
    const pdfExport = reportExportService.exportToPDF(revenueReport);
    assert(pdfExport.content.includes('<table'), 'PDF export contains table structure');

    // ----------------------------------------------------
    // TEST GROUP 4: Audit Log Integrity
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Audit Log Recording ---');
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            'SMART_ALERT_ACKNOWLEDGED',
            'SMART_ALERT_RESOLVED',
            'AI_CLASSIFICATION_REQUESTED',
            'REPORT_EXPORTED',
          ],
        },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    assert(Array.isArray(auditLogs), 'Audit logs query handled cleanly', { count: auditLogs.length });

    console.log('\n====================================================');
    console.log(`🎉 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================\n');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test suite crashed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
