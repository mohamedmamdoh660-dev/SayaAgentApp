import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ZohoApplication } from '@/types/types';

export interface PDFGenerationOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

export const generateApplicationPDF = async (
  application: ZohoApplication,
  options: PDFGenerationOptions = {}
): Promise<void> => {
  const {
    filename = `application-${application.id}.pdf`,
    quality = 0.98,
    scale = 2
  } = options;

  // Helper functions
  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const safe = (v?: any) => (v === undefined || v === null ? "N/A" : String(v));

  const studentFullName = `${application?.zoho_students?.first_name || ""} ${application?.zoho_students?.last_name || ""}`.trim();
  const universityName = application?.zoho_universities?.name || "";
  const programName = application?.zoho_programs?.name || "";

  // Create comprehensive HTML content matching the print page design
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; width: 1190px; background-color: white;">
      
      <!-- Header Section -->
      <div style="padding: 32px; border-bottom: 2px solid #e2e8f0; background-color: #f8fafc;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 80px; height: 80px; border-radius: 8px; border: 2px solid #e2e8f0; overflow: hidden; background-color: #f1f5f9;">
            <img 
              src="${application?.zoho_students?.photo_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjFGNUY5Ii8+CjxjaXJjbGUgY3g9IjQwIiBjeT0iMzIiIHI9IjEyIiBmaWxsPSIjNjM3Mzg4Ii8+CjxwYXRoIGQ9Ik0yMCA2NEMyMCA1Ni4yNjggMjYuMjY4IDUwIDM0IDUwSDQ2QzUzLjczMiA1MCA2MCA1Ni4yNjggNjAgNjRWNjBIMjBWNjRaIiBmaWxsPSIjNjM3Mzg4Ii8+Cjwvc3ZnPgo='}"
              alt="${studentFullName || 'Student'}"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
          </div>
          <div style="position: relative; top: -10px;">
            <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #1e293b;">${application.application_name ? application.application_name : `Application #${application.id}`}</h1>
            <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">
              Printed on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <!-- Application Details Section -->
      <div style="padding: 32px;">
        <section style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b; padding-bottom: 8px;">
            Application Details
          </h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Online Application ID</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.online_application_id)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Program</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(programName)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">University</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(universityName)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Country</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_countries?.name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Academic Year</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_academic_years?.name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Semester</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_semesters?.name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Degree</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_degrees?.name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Stage</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.stage)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Created At</div>
              <div style="font-weight: 500; color: #1e293b;">${formatDate(application?.created_at)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Updated At</div>
              <div style="font-weight: 500; color: #1e293b;">${formatDate(application?.updated_at)}</div>
            </div>
          </div>
        </section>

        <!-- Student Information Section -->
        <section style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b; padding-bottom: 8px;">
            Student Information
          </h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">First Name</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_students?.first_name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Last Name</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_students?.last_name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Passport No</div>
              <div style="font-weight: 500; color: #1e293b; font-family: monospace;">${safe(application?.zoho_students?.passport_number)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Issue Date</div>
              <div style="font-weight: 500; color: #1e293b;">${formatDate(application?.zoho_students?.passport_issue_date || "")}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Expiry Date</div>
              <div style="font-weight: 500; color: #1e293b;">${formatDate(application?.zoho_students?.passport_expiry_date || "")}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Gender</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_students?.gender)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Nationality</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_students?.nationality_record?.name || application?.zoho_students?.nationality)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">City of Residence</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_students?.address_country_record?.name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Mobile</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_students?.mobile)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Email</div>
              <div style="font-weight: 500; color: #1e293b; word-break: break-all;">${safe(application?.zoho_students?.email)}</div>
            </div>
          </div>
        </section>

        <!-- University Information Section -->
        <section style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b; padding-bottom: 8px;">
            University Information
          </h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Name</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_universities?.name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Sector</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_universities?.sector)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Country</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_universities?.zoho_countries?.name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">City</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_universities?.zoho_cities?.name)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Year Founded</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_universities?.year_founded)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">QS Rank</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_universities?.qs_rank)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Times Higher Education Rank</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_universities?.times_higher_education_rank)}</div>
            </div>
            <div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Shanghai Ranking</div>
              <div style="font-weight: 500; color: #1e293b;">${safe(application?.zoho_universities?.shanghai_ranking)}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  // Create a temporary container element
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1190px';
  container.style.backgroundColor = 'white';
  
  // Append to body temporarily
  document.body.appendChild(container);

  try {
    // Generate canvas from HTML
    const canvas = await html2canvas(container, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1190,
      height: container.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    // Try different image formats to avoid PNG signature issues
    let imgData: string;
    let format: 'PNG' | 'JPEG' = 'PNG';
    
    try {
      // First try PNG
      imgData = canvas.toDataURL('image/png', quality);
      format = 'PNG';
    } catch (pngError) {
      console.warn('PNG generation failed, trying JPEG:', pngError);
      try {
        // Fallback to JPEG
        imgData = canvas.toDataURL('image/jpeg', quality);
        format = 'JPEG';
      } catch (jpegError) {
        console.warn('JPEG generation failed, trying with lower quality:', jpegError);
        // Last resort with lower quality
        imgData = canvas.toDataURL('image/jpeg', 0.8);
        format = 'JPEG';
      }
    }

    // Validate image data
    if (!imgData || imgData === 'data:,') {
      throw new Error('Failed to generate image data from canvas');
    }

    // Add image to PDF with error handling
    try {
      pdf.addImage(imgData, format, imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    } catch (addImageError) {
      console.warn('Failed to add image with format', format, 'trying JPEG:', addImageError);
      // Force JPEG format if PNG fails
      if (format === 'PNG') {
        imgData = canvas.toDataURL('image/jpeg', quality);
        pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      } else {
        throw addImageError;
      }
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
};

