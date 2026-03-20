import jsPDF from "jspdf";
import html2canvasPro from "html2canvas-pro";

export const exportFullSystemPDF = async (reportName = "Zipsure_Full_Report") => {
  // 1. Define the sections we want to "stitch" together
  const sections = [
    { id: "dashboard-area", title: "Executive Dashboard" },
    { id: "analytics-report-area", title: "Technical Telemetry" },
    { id: "reports-area", title: "Financial Performance" }
  ];

  const pdf = new jsPDF("p", "pt", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < sections.length; i++) {
    const element = document.getElementById(sections[i].id);
    
    if (!element) {
      console.warn(`Section ${sections[i].id} not found in DOM. Skipping...`);
      continue;
    }

    // Capture the current element
    const canvas = await html2canvasPro(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f8fafc",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add image to the current page
    // If the image is longer than one A4 page, it will scale to fit the width
    pdf.addImage(imgData, "PNG", 0, 40, pdfWidth, imgHeight);

    // Header/Footer branding
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    pdf.text(`Zipsure AI - ${sections[i].title}`, 40, 25);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pdfWidth - 140, 25);

    // 2. ONLY add a new page if there's another section coming
    if (i < sections.length - 1) {
      pdf.addPage();
    }
  }

  pdf.save(`${reportName}_${new Date().toISOString().split('T')[0]}.pdf`);
};