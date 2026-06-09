export type Division =
  | ' '
  | 'East Division, Redmond Courthouse, 8601 160th Ave. N.E. Redmond, WA 98052'
  | 'South Division, Burien Courthouse, 601 SW 149th St. Burien WA 98166'
  | 'South Division, MRJC Courthouse, 401 4th Ave N., Kent, WA 98032'
  | 'Vashon Courthouse, 10011 S.W. Bank Road, Vashon 98070'
  | 'West Division, Seattle Courthouse, 516 3rd Ave, Room E-327 Seattle WA 98104'
  | 'West Division, Shoreline Courthouse,  18050 Meridian Ave N shoreline WA 98133';

export type ClaimReason =
  | 'Faulty_Workmanship'
  | 'Merchandise'
  | 'Auto_damages'
  | 'wages'
  | 'Loan'
  | 'Return_of_Deposit'
  | 'Rent'
  | 'Property_Damage'
  | 'Other';

export type ServiceMemberCivilReliefStatus = 'yes' | 'no' | 'unknown';

export interface Party {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
}

export interface Interpreter {
  required: boolean;
  name?: string;
  language?: string;
}

export interface ClaimDetails {
  reasons: ClaimReason[];
  autoDamagesAccidentDate?: string;
  otherReasonName?: string;
  explanation: string;
}

export interface FormData {
  clerk?: string;
  division?: Division;
  smallClaimNumber?: string;
  plaintiffs: [Party, Party?];
  defendants: [Party, Party?];
  interpreterPlaintiff?: Interpreter;
  interpreterDefendant?: Interpreter;
  claimantName?: string;
  claimAmount: string;
  incidentDate: string;
  claim: ClaimDetails;
  serviceMemberCivilRelief: {
    status: ServiceMemberCivilReliefStatus;
    factsIfCovered?: string;
    reasonIfNotCovered?: string;
  };
  signature: {
    city: string;
    state: string;
    date: string;
    plaintiffName: string;
  };
}
