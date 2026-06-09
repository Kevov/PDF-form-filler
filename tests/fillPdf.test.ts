import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PDFDocument } from 'pdf-lib';
import { fillPdfForm } from '../src/fillPdf';
import { FormData } from '../src/types';

const INPUT_PDF = path.join(__dirname, '..', 'notice-of-small-claim-september-2025.pdf');

const baseFormData: FormData = {
  clerk: 'Jane Smith',
  division: 'West Division, Seattle Courthouse, 516 3rd Ave, Room E-327 Seattle WA 98104',
  smallClaimNumber: 'SC-2025-001',
  plaintiffs: [
    {
      name: 'Alice Johnson',
      address: '123 Main St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      phone: '206-555-1234',
      email: 'alice@example.com',
    },
  ],
  defendants: [
    {
      name: "Bob's Auto Repair",
      address: '456 Mechanic Ave',
      city: 'Seattle',
      state: 'WA',
      zip: '98104',
      phone: '206-555-5678',
      email: 'bobs@example.com',
    },
  ],
  interpreterPlaintiff: { required: false },
  claimantName: 'Alice Johnson',
  claimAmount: '$3,500.00',
  incidentDate: '2025-03-15',
  claim: {
    reasons: ['Faulty_Workmanship'],
    explanation: 'Defendant performed faulty repairs.',
  },
  serviceMemberCivilRelief: {
    status: 'no',
    reasonIfNotCovered: 'Defendant is a business entity.',
  },
  signature: {
    city: 'Seattle',
    state: 'WA',
    date: '2025-06-09',
    plaintiffName: 'Alice Johnson',
  },
};

async function fillAndRead(data: FormData): Promise<ReturnType<PDFDocument['getForm']>> {
  const tmp = path.join(os.tmpdir(), `test-output-${Date.now()}.pdf`);
  await fillPdfForm(INPUT_PDF, data, tmp);
  const bytes = fs.readFileSync(tmp);
  const doc = await PDFDocument.load(bytes);
  fs.unlinkSync(tmp);
  return doc.getForm();
}

describe('fillPdfForm', () => {
  it('writes the output file', async () => {
    const tmp = path.join(os.tmpdir(), `test-exists-${Date.now()}.pdf`);
    await fillPdfForm(INPUT_PDF, baseFormData, tmp);
    expect(fs.existsSync(tmp)).toBe(true);
    fs.unlinkSync(tmp);
  });

  it('fills plaintiff name and address', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getTextField('plaintiff_name_1').getText()).toBe('Alice Johnson');
    expect(form.getTextField('plaintiff_Address_1').getText()).toBe('123 Main St');
    expect(form.getTextField('plaintiff_City_1').getText()).toBe('Seattle');
    expect(form.getTextField('plaintiff_State_1').getText()).toBe('WA');
    expect(form.getTextField('plaintiff_Zip_1').getText()).toBe('98101');
  });

  it('fills plaintiff contact info', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getTextField('plaintiff_Phone').getText()).toBe('206-555-1234');
    expect(form.getTextField('plaintiff_Email').getText()).toBe('alice@example.com');
  });

  it('fills defendant name and address', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getTextField('defendant_name_1').getText()).toBe("Bob's Auto Repair");
    expect(form.getTextField('defendant_Address_1').getText()).toBe('456 Mechanic Ave');
    expect(form.getTextField('defendant_City_1').getText()).toBe('Seattle');
    expect(form.getTextField('defedant_State_1').getText()).toBe('WA');
    expect(form.getTextField('defendant_Zip_1').getText()).toBe('98104');
  });

  it('fills claim amount and incident date', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getTextField('small_claim_amount').getText()).toBe('$3,500.00');
    expect(form.getTextField('incident_date').getText()).toBe('2025-03-15');
  });

  it('fills claim explanation', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getTextField('reason_Explaination').getText()).toBe(
      'Defendant performed faulty repairs.'
    );
  });

  it('checks correct claim reason checkboxes', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getCheckBox('reason_Faulty_Workmanship').isChecked()).toBe(true);
    expect(form.getCheckBox('reason_Merchandise').isChecked()).toBe(false);
    expect(form.getCheckBox('reason_Auto_damages').isChecked()).toBe(false);
  });

  it('handles multiple claim reasons', async () => {
    const data: FormData = {
      ...baseFormData,
      claim: {
        ...baseFormData.claim,
        reasons: ['Auto_damages', 'Property_Damage'],
        autoDamagesAccidentDate: '2025-01-10',
      },
    };
    const form = await fillAndRead(data);
    expect(form.getCheckBox('reason_Auto_damages').isChecked()).toBe(true);
    expect(form.getCheckBox('reason_Property_Damage').isChecked()).toBe(true);
    expect(form.getCheckBox('reason_Faulty_Workmanship').isChecked()).toBe(false);
    expect(form.getTextField('reason_Auto_Damages_accident_date').getText()).toBe('2025-01-10');
  });

  it('handles Other reason with name', async () => {
    const data: FormData = {
      ...baseFormData,
      claim: {
        ...baseFormData.claim,
        reasons: ['Other'],
        otherReasonName: 'Contract Dispute',
      },
    };
    const form = await fillAndRead(data);
    expect(form.getCheckBox('reason_Other').isChecked()).toBe(true);
    expect(form.getTextField('reason_Other_Name').getText()).toBe('Contract Dispute');
  });

  it('sets servicemember civil relief to no', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getCheckBox('service_member_civil_relief_no').isChecked()).toBe(true);
    expect(form.getCheckBox('service_member_civil_relief_yes').isChecked()).toBe(false);
    expect(form.getCheckBox('service_member_civil_relief_unknown').isChecked()).toBe(false);
    expect(
      form.getTextField('service_member_civil_relief_law_not_covered_reason').getText()
    ).toBe('Defendant is a business entity.');
  });

  it('sets servicemember civil relief to yes', async () => {
    const data: FormData = {
      ...baseFormData,
      serviceMemberCivilRelief: {
        status: 'yes',
        factsIfCovered: 'Defendant is on active duty.',
      },
    };
    const form = await fillAndRead(data);
    expect(form.getCheckBox('service_member_civil_relief_yes').isChecked()).toBe(true);
    expect(form.getTextField('service_member_civil_relief_law').getText()).toBe(
      'Defendant is on active duty.'
    );
  });

  it('sets servicemember civil relief to unknown', async () => {
    const data: FormData = {
      ...baseFormData,
      serviceMemberCivilRelief: { status: 'unknown' },
    };
    const form = await fillAndRead(data);
    expect(form.getCheckBox('service_member_civil_relief_unknown').isChecked()).toBe(true);
  });

  it('fills signature block', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getTextField('signed_city').getText()).toBe('Seattle');
    expect(form.getTextField('signed_State').getText()).toBe('WA');
    expect(form.getTextField('signed_Date').getText()).toBe('2025-06-09');
    expect(form.getTextField('signed_plaintiff_name').getText()).toBe('Alice Johnson');
  });

  it('fills second plaintiff when provided', async () => {
    const data: FormData = {
      ...baseFormData,
      plaintiffs: [
        baseFormData.plaintiffs[0],
        {
          name: 'Bob Plaintiff',
          address: '789 Second St',
          city: 'Bellevue',
          state: 'WA',
          zip: '98004',
          phone: '425-555-9999',
          email: 'bob@example.com',
        },
      ],
    };
    const form = await fillAndRead(data);
    expect(form.getTextField('plaintiff_name_2').getText()).toBe('Bob Plaintiff');
    expect(form.getTextField('plaintiff_Address_2').getText()).toBe('789 Second St');
  });

  it('fills second defendant when provided', async () => {
    const data: FormData = {
      ...baseFormData,
      defendants: [
        baseFormData.defendants[0],
        {
          name: 'Second Defendant LLC',
          address: '999 Corp Blvd',
          city: 'Renton',
          state: 'WA',
          zip: '98057',
        },
      ],
    };
    const form = await fillAndRead(data);
    expect(form.getTextField('defendant_name_2').getText()).toBe('Second Defendant LLC');
    expect(form.getTextField('defendant_City_2').getText()).toBe('Renton');
  });

  it('marks interpreter not required when set to false', async () => {
    const form = await fillAndRead(baseFormData);
    expect(form.getCheckBox('intepreter_no').isChecked()).toBe(true);
    expect(form.getCheckBox('Intepreter_yes').isChecked()).toBe(false);
  });

  it('marks interpreter required with name and language', async () => {
    const data: FormData = {
      ...baseFormData,
      interpreterPlaintiff: {
        required: true,
        name: 'Carlos Interpreter',
        language: 'Spanish',
      },
    };
    const form = await fillAndRead(data);
    expect(form.getCheckBox('Intepreter_yes').isChecked()).toBe(true);
    expect(form.getTextField('intepreter_Name_1').getText()).toBe('Carlos Interpreter');
    expect(form.getTextField('intepreter_Language_1').getText()).toBe('Spanish');
  });
});
