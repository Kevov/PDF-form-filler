import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import { FormData, ClaimReason } from './types';

export async function fillPdfForm(
  inputPdfPath: string,
  formData: FormData,
  outputPdfPath: string
): Promise<void> {
  if (!inputPdfPath) {
    throw new Error('Input PDF path is required');
  }

  if (!outputPdfPath) {
    throw new Error('Output PDF path is required');
  }

  if (!formData) {
    throw new Error('Form data is required');
  }

  validateFormData(formData);

  let pdfBytes: Buffer;
  try {
    pdfBytes = fs.readFileSync(inputPdfPath);
  } catch (err: any) {
    throw new Error(`Failed to read input PDF "${inputPdfPath}": ${err.message}`);
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes);
  } catch (err: any) {
    throw new Error(`Failed to parse PDF "${inputPdfPath}": ${err.message}`);
  }

  const form = pdfDoc.getForm();

  function setText(fieldName: string, value: string | undefined): void {
    if (value === undefined) return;
    try {
      form.getTextField(fieldName).setText(value);
    } catch (err: any) {
      throw new Error(`Failed to set text field "${fieldName}": ${err.message}`);
    }
  }

  function setCheckbox(fieldName: string, checked: boolean): void {
    try {
      const field = form.getCheckBox(fieldName);
      checked ? field.check() : field.uncheck();
    } catch (err: any) {
      throw new Error(`Failed to set checkbox "${fieldName}": ${err.message}`);
    }
  }

  function setDropdown(fieldName: string, value: string | undefined): void {
    if (value === undefined) return;
    try {
      form.getDropdown(fieldName).select(value);
    } catch (err: any) {
      throw new Error(`Failed to set dropdown "${fieldName}": ${err.message}`);
    }
  }

  // Clerk and division
  setText('Clerk', formData.clerk);
  setDropdown('cmbdivision', formData.division);

  // Small claim number
  setText('small_claim_number', formData.smallClaimNumber);

  // Plaintiffs
  const [p1, p2] = formData.plaintiffs;
  setText('plaintiff_name_1', p1.name);
  setText('plaintiff_Address_1', p1.address);
  setText('plaintiff_City_1', p1.city);
  setText('plaintiff_State_1', p1.state);
  setText('plaintiff_Zip_1', p1.zip);
  setText('plaintiff_Phone', p1.phone);
  setText('plaintiff_Email', p1.email);

  if (p2) {
    setText('plaintiff_name_2', p2.name);
    setText('plaintiff_Address_2', p2.address);
    setText('plaintiff_City_2', p2.city);
    setText('plaintiff_State_2', p2.state);
    setText('plaintiff_Zip_2', p2.zip);
    setText('plaintiff_Phone_2', p2.phone);
    setText('plaintiff_Email_2', p2.email);
  }

  // Defendants
  const [d1, d2] = formData.defendants;
  setText('defendant_name_1', d1.name);
  setText('defendant_Address_1', d1.address);
  setText('defendant_City_1', d1.city);
  setText('defedant_State_1', d1.state);
  setText('defendant_Zip_1', d1.zip);
  setText('defendant_Phone_1', d1.phone);
  setText('defendant_Email_1', d1.email);

  if (d2) {
    setText('defendant_name_2', d2.name);
    setText('defendant_Address_2', d2.address);
    setText('defendant_City_2', d2.city);
    setText('defendant_State_2', d2.state);
    setText('defendant_Zip_2', d2.zip);
    setText('defendant_Phone_2', d2.phone);
    setText('defendant_Email_2', d2.email);
  }

  // Interpreter for plaintiff
  const ip = formData.interpreterPlaintiff;
  if (ip) {
    setCheckbox('Intepreter_yes', ip.required);
    setCheckbox('intepreter_no', !ip.required);
    setText('intepreter_Name_1', ip.name);
    setText('intepreter_Language_1', ip.language);
  }

  // Interpreter for defendant
  const id_ = formData.interpreterDefendant;
  if (id_) {
    setText('intepreter_Name_2', id_.name);
    setText('intepreter_Language_2', id_.language);
  }

  // Claim details
  setText('plaintiff_Name_1', formData.claimantName);
  setText('small_claim_amount', formData.claimAmount);
  setText('incident_date', formData.incidentDate);

  const allReasons: ClaimReason[] = [
    'Faulty_Workmanship',
    'Merchandise',
    'Auto_damages',
    'wages',
    'Loan',
    'Return_of_Deposit',
    'Rent',
    'Property_Damage',
    'Other',
  ];

  for (const reason of allReasons) {
    setCheckbox(`reason_${reason}`, formData.claim.reasons.includes(reason));
  }

  if (formData.claim.reasons.includes('Auto_damages')) {
    setText('reason_Auto_Damages_accident_date', formData.claim.autoDamagesAccidentDate);
  }
  if (formData.claim.reasons.includes('Other')) {
    setText('reason_Other_Name', formData.claim.otherReasonName);
  }
  setText('reason_Explaination', formData.claim.explanation);

  // Servicemember civil relief
  const smcr = formData.serviceMemberCivilRelief;
  setCheckbox('service_member_civil_relief_yes', smcr.status === 'yes');
  setCheckbox('service_member_civil_relief_no', smcr.status === 'no');
  setCheckbox('service_member_civil_relief_unknown', smcr.status === 'unknown');

  if (smcr.status === 'yes') {
    setText('service_member_civil_relief_law', smcr.factsIfCovered);
  } else if (smcr.status === 'no') {
    setText('service_member_civil_relief_law_not_covered_reason', smcr.reasonIfNotCovered);
  }

  // Signature block
  setText('signed_city', formData.signature.city);
  setText('signed_State', formData.signature.state);
  setText('signed_Date', formData.signature.date);
  setText('signed_plaintiff_name', formData.signature.plaintiffName);

  let filledBytes: Uint8Array;
  try {
    filledBytes = await pdfDoc.save();
  } catch (err: any) {
    throw new Error(`Failed to serialise filled PDF: ${err.message}`);
  }

  try {
    fs.writeFileSync(outputPdfPath, filledBytes);
  } catch (err: any) {
    throw new Error(`Failed to write output PDF "${outputPdfPath}": ${err.message}`);
  }
}

export function validateFormData(formData: FormData): void {
  if (!formData.plaintiffs?.[0]) {
    throw new Error('At least one plaintiff is required');
  }

  if (!formData.plaintiffs[0].name?.trim()) {
    throw new Error('Plaintiff 1 name is required');
  }

  if (!formData.defendants?.[0]) {
    throw new Error('At least one defendant is required');
  }

  if (!formData.defendants[0].name?.trim()) {
    throw new Error('Defendant 1 name is required');
  }

  if (!formData.claimAmount?.trim()) {
    throw new Error('Claim amount is required');
  }

  if (!formData.incidentDate?.trim()) {
    throw new Error('Incident date is required');
  }

  if (!formData.claim) {
    throw new Error('Claim details are required');
  }

  if (!formData.claim.reasons || formData.claim.reasons.length === 0) {
    throw new Error('At least one claim reason is required');
  }

  if (!formData.claim.explanation?.trim()) {
    throw new Error('Claim explanation is required');
  }

  if (!formData.serviceMemberCivilRelief?.status) {
    throw new Error('Servicemember civil relief status is required');
  }

  const validStatuses = ['yes', 'no', 'unknown'];
  if (!validStatuses.includes(formData.serviceMemberCivilRelief.status)) {
    throw new Error(
      `Invalid servicemember civil relief status: "${formData.serviceMemberCivilRelief.status}". Must be "yes", "no", or "unknown"`
    );
  }

  if (!formData.signature) {
    throw new Error('Signature block is required');
  }

  if (!formData.signature.city?.trim()) {
    throw new Error('Signature city is required');
  }

  if (!formData.signature.state?.trim()) {
    throw new Error('Signature state is required');
  }

  if (!formData.signature.date?.trim()) {
    throw new Error('Signature date is required');
  }

  if (!formData.signature.plaintiffName?.trim()) {
    throw new Error('Signature plaintiff name is required');
  }
}
