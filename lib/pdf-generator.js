import html2canvas from "html2canvas-pro"; 
import jsPDF from "jspdf";

// Pass in the ref, the loading state function, and the timeRange
export const generatePDF = async (reportRef, setIsLoading, timeRange) => {
  if (!reportRef.current) return;
  
  setIsLoading(true); // Matches the name in your terminal error

  try {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: reportRef.current.offsetWidth,
      height: reportRef.current.offsetHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    
    const dateStamp = new Date().toISOString().split('T')[0];
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZipSure_Report_${timeRange}_${dateStamp}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (e) {
    console.error("PDF Export failed:", e);
  } finally {
    setIsLoading(false); // Reset the state
  }
};