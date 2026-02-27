
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ZohoProgram } from '@/types/types';

export interface ProgramsPdfOptions {
  organizationName: string;
  organizationLogo?: string;
  loggedInName: string;
  loggedInEmail?: string;
  loggedInPhone?: string;
  programs: ZohoProgram[];
  dateRangeText?: string;
  // Optional rendering options inspired by existing demo
  scale?: number; // html2canvas scale
  orientation?: "p" | "l"; // portrait | landscape
  pageSize?: "a4" | "a3"; // PDF page size
  imageFormat?: "PNG" | "JPEG" | "JPG"; // jsPDF image format
  imageQuality?: number; // 0..1 for JPEG quality
}

export async function exportProgramsToPDF(options: ProgramsPdfOptions) {
  const {
    organizationName,
    organizationLogo,
    loggedInName,
    loggedInEmail = "",
    loggedInPhone = "",
    programs,
    dateRangeText,
    scale = 1.4, // Reduced scale for smaller file size
    orientation = "p",
    pageSize = "a4",
    imageFormat = "JPEG", // Use JPEG for smaller file size
    imageQuality = 0.9, // Reduced quality for smaller file size
  } = options;

  // Helper functions
  const formatNumber = (num: number | string | null | undefined): string => {
    if (!num) return "-";
    return new Intl.NumberFormat().format(Number(num));
  };

  const formatDate = (date?: string): string => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const safe = (v?: any) => (v === undefined || v === null ? "-" : String(v));

  // Generate program cards HTML matching programs-cards.tsx exactly
  const generateProgramCard = (program: ZohoProgram) => `
    <div style="border: 1px solid #e2e8f0; border-radius: 8px; background-color: white; margin-bottom: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
      
      <!-- Cover image section -->
      <div style="height: 112px; width: 100%; background-color: #f1f5f9; position: relative;">
        ${program.zoho_universities?.profile_image ? `
          <img 
            src="${program.zoho_universities.profile_image}" 
            alt="${program.zoho_universities?.name || 'University'}"
            style="width: 100%; height: 100%; object-fit: cover;"
          />
        ` : ''}
      </div>
      
      <!-- Card content -->
      <div style="padding: 16px;">
        <!-- Header with university logo and name -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background-color: #f1f5f9;">
            ${program?.zoho_universities?.logo ? `
              <img 
                src="${program.zoho_universities.logo}" 
                alt="${program.zoho_universities?.name || ''}"
                style="width: 100%; height: 100%; object-fit: cover;"
              />
            ` : `
              <div style="width: 60px; height: 60px; background-color:  #f1f5f9; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
              </div>
            `}
          </div>
          <div style="flex: 1; min-width: 0; position: relative; top: -7px;">
            <h3 style="font-size: 16px; font-weight: 600; margin: 0; color: #1e293b; line-height: 1.2;">
              ${safe(program.name)}
            </h3>
            <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0; line-height: 1.2;">
              ${safe(program.zoho_universities?.name)}
            </p>
          </div>
        </div>

        <!-- Program details matching the exact layout -->
        <div style="display: grid; grid-template-columns: 1fr; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              🎓 Degree
            </span>
            <span style="font-weight: 500; color: #1e293b; font-size: 14px;">
              ${safe(program.zoho_degrees?.name)}
            </span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              📍 Location
            </span>
            <span style="font-weight: 500; color: #1e293b; font-size: 14px;">
              ${program.zoho_cities?.name && program.zoho_countries?.name
                ? `${program.zoho_cities.name}, ${program.zoho_countries.name}`
                : safe(program.zoho_cities?.name || program.zoho_countries?.name)}
            </span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              🏢 Faculty
            </span>
            <span style="font-weight: 500; color: #1e293b; font-size: 14px;">
              ${safe(program.zoho_faculty?.name)}
            </span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              🌐 Language
            </span>
            <span style="font-weight: 500; color: #1e293b; font-size: 14px;">
              ${safe(program.zoho_languages?.name)}
            </span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              💰 Tuition
            </span>
            <div style="text-align: right;">
              <div style="font-weight: 500; color: #1e293b; font-size: 14px;">
                ${program.official_tuition
                  ? `${formatNumber(program.official_tuition)} ${program.tuition_currency || ''}`
                  : '-'}
              </div>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              💰 Discounted Tuition
            </span>
            <div style="text-align: right;">
              <div style="font-weight: 500; color: #1e293b; font-size: 14px;">
                ${program.discounted_tuition
                  ? `${formatNumber(program.discounted_tuition)} ${program.tuition_currency || ''}`
                  : '-'}
              </div>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              ✅ Status
            </span>
            <span style="font-weight: 500; color: ${program.active ? '#059669' : '#dc2626'}; font-size: 14px;">
              ${program.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #64748b; font-size: 14px; display: flex; align-items: center; gap: 4px;">
              📅 Created
            </span>
            <span style="font-weight: 500; color: #1e293b; font-size: 14px;">
              ${formatDate(program.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
  // Generate page HTML with pagination (4 cards per page)
  const generatePageHTML = (pagePrograms: ZohoProgram[], pageNumber: number, totalPages: number) => `
    <div style="font-family: Arial, sans-serif; margin: 0; padding: 0; width: 1200px; background-color: white; min-height: 100vh;">
      
      <!-- Header Section -->
      <div style="padding-bottom: 16px; border-bottom: 1px solid #ddd; background-color: #f8f9fa;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding-left: 16px; padding-right: 16px; padding-top: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${organizationLogo ? `
              <img 
                src="${organizationLogo}" 
                alt="${organizationName}" 
                style="height: 60px; width: 60px; object-fit: contain; border-radius: 4px; border: 1px solid #ddd;"
              />
            ` : ''}
            <div style="position: relative; top: -10px;">
              <h1 style="font-size: 18px; font-weight: bold; margin: 0; color: #1e293b;">
                ${organizationName}
              </h1>
              <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">
                Programs Report - Page ${pageNumber} of ${totalPages}
              </p>
            </div>
          </div>
          ${dateRangeText ? `
            <div style="text-align: right;">
              <p style="font-size: 12px; color: #64748b; margin: 0;">
                ${dateRangeText}
              </p>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Programs Content -->
      <div style="padding-top: 16px; padding-bottom: 16px; padding-left: 16px; padding-right: 16px;">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
          ${pagePrograms.map(program => generateProgramCard(program)).join('')}
        </div>
      </div>

      <!-- Footer Section -->
      <div style="position: absolute; bottom: -25px; left: 0; right: 0; padding: 12px 16px; border-top: 1px solid #ddd; background-color: #f8f9fa;">
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; position: relative; top: -5px;">
          <div>
            <span>Generated by: ${loggedInName}</span>
            ${loggedInEmail ? `<span> | ${loggedInEmail}</span>` : ''}
            ${loggedInPhone ? `<span> | ${loggedInPhone}</span>` : ''}
          </div>
         
          </div>
        </div>
      </div>
    </div>
  `;

  // Split programs into pages (4 per page to accommodate larger cards)
  const programsPerPage = 6;
  const totalPages = Math.ceil(programs.length / programsPerPage);
  const programPages: ZohoProgram[][] = [];
  
  for (let i = 0; i < programs.length; i += programsPerPage) {
    programPages.push(programs.slice(i, i + programsPerPage));
  }

  // Create PDF with multiple pages
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: pageSize,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  try {
    // Generate each page
    for (let pageIndex = 0; pageIndex < programPages.length; pageIndex++) {
      const pagePrograms = programPages[pageIndex];
      const pageNumber = pageIndex + 1;
      
      // Create container for this page
      const container = document.createElement('div');
      container.innerHTML = generatePageHTML(pagePrograms, pageNumber, totalPages);
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '1200px';
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';

      // Append to body temporarily
      document.body.appendChild(container);

      try {
        // Generate canvas for this page
        const canvas = await html2canvas(container, {
          scale: scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 1200,
          height: container.scrollHeight ,
          scrollX: 0,
          scrollY: 0,
          logging: false,
        });

        // Generate image data (force JPEG for smaller file size)
        let imgData: string;
        try {
          imgData = canvas.toDataURL('image/jpeg', imageQuality);
        } catch (jpegError) {
          console.warn('JPEG generation failed, trying with lower quality:', jpegError);
          imgData = canvas.toDataURL('image/jpeg', 0.6);
        }

        // Validate image data
        if (!imgData || imgData === 'data:,') {
          throw new Error(`Failed to generate image data for page ${pageNumber}`);
        }

        // Add new page if not the first page
        if (pageIndex > 0) {
          pdf.addPage();
        }

        // Calculate dimensions and add image to PDF
        const imgWidth = canvas.width;
        const imgHeight = canvas.height +150;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;

        try {
          pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        } catch (addImageError) {
          console.warn(`Failed to add image for page ${pageNumber}:`, addImageError);
          // Try with even lower quality
          imgData = canvas.toDataURL('image/jpeg', 0.5);
          pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        }

        // console.log(`Page ${pageNumber} generated successfully`);

      } finally {
        // Clean up container for this page
        document.body.removeChild(container);
      }
    }

    // Save the PDF
    pdf.save(`programs_${Date.now()}.pdf`);
    // console.log(`PDF generated successfully with ${totalPages} pages`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}


