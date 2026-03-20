import jsPDF from "jspdf";
import html2canvasPro from "html2canvas-pro";

// Ensure this file is ONLY called from an event handler (button click)
export const generateReport = async (ids) => {
  // Import only when the function is called
  const { default: jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas-pro");

  const pdf = new jsPDF("p", "pt", "a4");

  for (let i = 0; i < ids.length; i++) {
    const element = document.getElementById(ids[i]);
    if (!element) continue;

    const canvas = await html2canvas(element, { 
      scale: 1.5, // Reduced scale for faster processing and lower memory
      useCORS: true,
      logging: false 
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
    if (i < ids.length - 1) pdf.addPage();
  }

  pdf.save("Zipsure_Full_Report.pdf");
};