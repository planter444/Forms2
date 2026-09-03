import { formatCountyCoverageEntry } from "./locationCoverage.js";

const escapeXml = (value) =>
  `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const safeJoin = (value, separator = ", ") => {
  if (Array.isArray(value)) return value.filter(Boolean).join(separator) || "-";
  return value || "-";
};

const safeName = (fileName) => fileName || "unnamed-file";

const fileDataUrl = (fileData) => {
  if (!fileData) return null;
  if (typeof fileData === "string" && fileData.startsWith("data:")) return fileData;
  return `data:application/octet-stream;base64,${fileData}`;
};

export const getFileDownloadUrl = (fileData) => fileDataUrl(fileData);

export const formatMarketplaceCoverage = (submission) => {
  if (submission?.coverageMode === "countrywide" || (submission?.coverageDetails || "").toLowerCase().includes("countrywide")) {
    return ["Countrywide delivery — all counties in Kenya"];
  }

  const entries = Array.isArray(submission?.coverageEntries) ? submission.coverageEntries : [];
  const lines = entries
    .filter((entry) => entry?.county)
    .map((entry) => formatCountyCoverageEntry(entry))
    .filter(Boolean);

  return lines.length ? lines : [submission?.coverageDetails || "-"];
};

export const getMarketplaceExportRows = (submissions) =>
  (submissions || []).map((submission) => ({
    id: submission.id || "",
    companyName: submission.companyName || "",
    contactPerson: submission.contactPerson || "",
    phoneNumber: submission.phoneNumber || "",
    email: submission.email || "",
    physicalAddress: submission.physicalAddress || "",
    businessRegNumber: submission.businessRegNumber || "",
    kraPin: submission.kraPin?.number || "",
    certifications: (submission.certifications || []).map((c) => c.name || "Unnamed").join(", "),
    yearsOfOperation: submission.yearsOfOperation || "",
    coverage: Array.isArray(formatMarketplaceCoverage(submission))
      ? formatMarketplaceCoverage(submission).join(" | ")
      : formatMarketplaceCoverage(submission),
    productCategories: safeJoin(submission.productCategories, ", "),
    brandsRepresented: submission.brandsRepresented || "",
    socialMediaLinks: submission.socialMediaLinks || "",
    declaration: submission.declaration || "",
    submitted: submission.createdAt ? new Date(submission.createdAt).toLocaleString() : "-"
  }));

export const getMarketplaceSubmissionText = (submission) => {
  const coverage = formatMarketplaceCoverage(submission);
  const lines = [
    `Company Name: ${submission?.companyName || "-"}`,
    `Contact Person: ${submission?.contactPerson || "-"}`,
    `Phone Number: ${submission?.phoneNumber || "-"}`,
    `Email: ${submission?.email || "-"}`,
    `Physical Address: ${submission?.physicalAddress || "-"}`,
    `Website: ${submission?.website || "-"}`,
    `Company Profile: ${submission?.companyProfile || "-"}`,
    `Business Registration Number: ${submission?.businessRegNumber || "-"}`,
    `KRA PIN: ${submission?.kraPin?.number || "-"}`,
    `KRA PIN File: ${submission?.kraPin?.fileName || "-"}`,
    `Business Registration File: ${submission?.businessRegDocument?.fileName || "-"}`,
    `Years of Operation: ${submission?.yearsOfOperation || "-"}`,
    `Certifications: ${(submission?.certifications || []).map((c) => `${c.name || "Unnamed"}${c.fileName ? ` (${c.fileName})` : ""}`).join(", ") || "-"}`,
    `Coverage: ${Array.isArray(coverage) ? coverage.join("; ") : coverage}`,
    `Product Categories: ${safeJoin(submission?.productCategories, ", ")}`,
    `Brands Represented: ${submission?.brandsRepresented || "-"}`,
    `Social Media Links: ${submission?.socialMediaLinks || "-"}`,
    `Declaration: ${submission?.declaration || "-"}`,
    `Submitted: ${submission?.createdAt ? new Date(submission.createdAt).toLocaleString() : "-"}`
  ];
  return lines.join("\n");
};

export const copyMarketplaceSubmission = async (submission) => {
  const text = getMarketplaceSubmissionText(submission);
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
};

export const downloadMarketplaceSubmissionsJson = (submissions) => {
  const blob = new Blob([JSON.stringify(getMarketplaceExportRows(submissions), null, 2)], {
    type: "application/json;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marketplace-vendor-submissions-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadMarketplaceSubmissionJson = (submission) => {
  const blob = new Blob([JSON.stringify(submission, null, 2)], {
    type: "application/json;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marketplace-vendor-${submission?.companyName?.trim().replace(/\s+/g, "-") || submission?.id || "submission"}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadMarketplaceSubmissionExcel = (submission) => {
  const fields = [
    ["Field", "Value"],
    ["Company Name", submission?.companyName || ""],
    ["Contact Person", submission?.contactPerson || ""],
    ["Phone Number", submission?.phoneNumber || ""],
    ["Email", submission?.email || ""],
    ["Physical Address", submission?.physicalAddress || ""],
    ["Website", submission?.website || ""],
    ["Company Profile", submission?.companyProfile || ""],
    ["Business Registration Number", submission?.businessRegNumber || ""],
    ["KRA PIN", submission?.kraPin?.number || ""],
    ["KRA PIN File", submission?.kraPin?.fileName || ""],
    ["Business Registration File", submission?.businessRegDocument?.fileName || ""],
    ["Years of Operation", submission?.yearsOfOperation || ""],
    [
      "Certifications",
      (submission?.certifications || []).map((c) => `${c.name || "Unnamed"}${c.fileName ? ` (${c.fileName})` : ""}`).join(", ")
    ],
    ["Coverage", Array.isArray(formatMarketplaceCoverage(submission)) ? formatMarketplaceCoverage(submission).join(" | ") : formatMarketplaceCoverage(submission)],
    ["Product Categories", safeJoin(submission?.productCategories, ", ")],
    ["Brands Represented", submission?.brandsRepresented || ""],
    ["Social Media Links", submission?.socialMediaLinks || ""],
    ["Declaration", submission?.declaration || ""],
    ["Submitted", submission?.createdAt ? new Date(submission.createdAt).toLocaleString() : ""]
  ];

  const tableRows = fields
    .map(
      (cells) =>
        `<Row>${cells
          .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
          .join("")}</Row>`
    )
    .join("");

  const workbook = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Submission">
  <Table>
   ${tableRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marketplace-vendor-${submission?.companyName?.trim().replace(/\s+/g, "-") || submission?.id || "submission"}-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const printMarketplaceSubmissionPdf = (submission) => {
  const coverage = formatMarketplaceCoverage(submission);
  const rows = [
    ["Company Name", submission?.companyName || "-"],
    ["Contact Person", submission?.contactPerson || "-"],
    ["Phone Number", submission?.phoneNumber || "-"],
    ["Email", submission?.email || "-"],
    ["Physical Address", submission?.physicalAddress || "-"],
    ["Website", submission?.website || "-"],
    ["Company Profile", submission?.companyProfile || "-"],
    ["Business Registration Number", submission?.businessRegNumber || "-"],
    ["KRA PIN", submission?.kraPin?.number || "-"],
    ["KRA PIN File", submission?.kraPin?.fileName || "-"],
    ["Business Registration File", submission?.businessRegDocument?.fileName || "-"],
    ["Years of Operation", submission?.yearsOfOperation || "-"],
    [
      "Certifications",
      (submission?.certifications || []).map((c) => `${c.name || "Unnamed"}${c.fileName ? ` (${c.fileName})` : ""}`).join(", ") || "-"
    ],
    ["Coverage", Array.isArray(coverage) ? coverage.join(" | ") : coverage],
    ["Product Categories", safeJoin(submission?.productCategories, ", ")],
    ["Brands Represented", submission?.brandsRepresented || "-"],
    ["Social Media Links", submission?.socialMediaLinks || "-"],
    ["Declaration", submission?.declaration || "-"],
    ["Submitted", submission?.createdAt ? new Date(submission.createdAt).toLocaleString() : "-"]
  ];

  const tableRows = rows
    .map(
      (row) => `<tr>
        <th>${escapeXml(row[0])}</th>
        <td>${escapeXml(row[1])}</td>
      </tr>`
    )
    .join("");

  const reportWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!reportWindow) {
    throw new Error("Unable to open the PDF report window. Please allow pop-ups and try again.");
  }

  reportWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>${escapeXml(submission?.companyName || "Marketplace vendor")}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
          h1 { margin: 0; font-size: 24px; }
          p { color: #475569; margin: 8px 0 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #eff6ff; color: #1e3a8a; text-align: left; width: 30%; }
          th, td { border: 1px solid #bfdbfe; padding: 10px; vertical-align: top; white-space: pre-line; }
          @media print { body { margin: 16px; } }
        </style>
      </head>
      <body>
        <h1>${escapeXml(submission?.companyName || "Marketplace vendor")}</h1>
        <p>Exported on ${new Date().toLocaleString()}.</p>
        <table>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>`);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};

export const copyMarketplaceSubmissions = async (submissions) => {
  const text = (submissions || [])
    .map((submission, index) => `--- Response ${index + 1} ---\n${getMarketplaceSubmissionText(submission)}`)
    .join("\n\n");
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
};

export const downloadMarketplaceSubmissionsExcel = (submissions) => {
  const headers = [
    "ID",
    "Company Name",
    "Contact Person",
    "Phone Number",
    "Email",
    "Physical Address",
    "Business Registration Number",
    "KRA PIN",
    "Years of Operation",
    "Certifications",
    "Coverage",
    "Product Categories",
    "Brands Represented",
    "Social Media Links",
    "Declaration",
    "Submitted"
  ];

  const rows = (submissions || []).map((submission) => [
    submission.id || "",
    submission.companyName || "",
    submission.contactPerson || "",
    submission.phoneNumber || "",
    submission.email || "",
    submission.physicalAddress || "",
    submission.businessRegNumber || "",
    submission.kraPin?.number || `${submission.kraPin || ""}`,
    submission.yearsOfOperation || "",
    (submission.certifications || []).map((c) => `${c.name || "Unnamed"}${c.fileName ? ` (${c.fileName})` : ""}`).join(", "),
    formatMarketplaceCoverage(submission).join(" | "),
    safeJoin(submission.productCategories, ", "),
    submission.brandsRepresented || "",
    submission.socialMediaLinks || "",
    submission.declaration || "",
    submission.createdAt ? new Date(submission.createdAt).toLocaleString() : ""
  ]);

  const tableRows = [headers, ...rows]
    .map(
      (cells) =>
        `<Row>${cells
          .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`)
          .join("")}</Row>`
    )
    .join("");

  const workbook = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Marketplace Submissions">
  <Table>
   ${tableRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marketplace-vendor-submissions-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const printMarketplaceSubmissionsPdf = (submissions) => {
  const headers = [
    "Company",
    "Contact",
    "Phone",
    "Email",
    "Coverage",
    "Categories",
    "Submitted"
  ];

  const rows = (submissions || []).map((submission) => `
    <tr>
      <td>${escapeXml(submission.companyName || "-")}</td>
      <td>${escapeXml(submission.contactPerson || "-")}</td>
      <td>${escapeXml(submission.phoneNumber || "-")}</td>
      <td>${escapeXml(submission.email || "-")}</td>
      <td>${escapeXml(formatMarketplaceCoverage(submission).join(" | "))}</td>
      <td>${escapeXml(safeJoin(submission.productCategories, ", "))}</td>
      <td>${escapeXml(submission.createdAt ? new Date(submission.createdAt).toLocaleString() : "-")}</td>
    </tr>`
  ).join("");

  const reportWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!reportWindow) {
    throw new Error("Unable to open the PDF report window. Please allow pop-ups and try again.");
  }

  reportWindow.document.write(`<!doctype html>
    <html>
      <head>
        <title>Marketplace vendor submissions</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
          h1 { margin: 0; font-size: 24px; }
          p { color: #475569; margin: 8px 0 24px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #eff6ff; color: #1e3a8a; text-align: left; }
          th, td { border: 1px solid #bfdbfe; padding: 8px; vertical-align: top; white-space: pre-line; }
          @media print { body { margin: 16px; } }
        </style>
      </head>
      <body>
        <h1>Marketplace Vendor Submissions</h1>
        <p>${submissions.length} response${submissions.length === 1 ? "" : "s"} exported on ${new Date().toLocaleString()}.</p>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${escapeXml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
};
