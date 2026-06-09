import { PDFDocument, PDFCheckBox, PDFTextField, PDFDropdown } from 'pdf-lib';
import * as fs from 'fs';
import { FormData, ClaimReason } from './types';

export async function fillPdfForm(
  inputPdfPath: string,
  formData: FormData,
  outputPdfPath: string
): Promise<void> {
  const pdfBytes = fs.readFileSync(inputPdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  function setText(fieldName: string, value: string | undefined): void {
    if (value === undefined) return;
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
    } catch {
      // field not found or wrong type — skip silently
    }
  }

  function setCheckbox(fieldName: string, checked: boolean): void {
    try {
      const field = form.getCheckBox(fieldName);
      checked ? field.check() : field.uncheck();
    } catch {
      // field not found — skip silently
    }
  }

  function setDropdown(fieldName: string, value: string | undefined): void {
    if (value === undefined) return;
    try {
      const field = form.getDropdown(fieldName);
      field.select(value);
    } catch {
      // field not found or invalid option — skip silently
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

  const filledBytes = await pdfDoc.save();
  fs.writeFileSync(outputPdfPath, filledBytes);
}
