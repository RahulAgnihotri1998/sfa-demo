export type HierarchyLevel = 'headquarters' | 'regional' | 'branch';
export type CreditLimitScope = 'individual' | 'consolidated_parent';

export interface HierarchyBranchNode {
  id: string;
  name: string;
  code: string;
  hierarchy_level: HierarchyLevel;
  credit_limit_scope: CreditLimitScope;
  territory: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  individual_credit_limit: number;
  individual_outstanding: number;
  credit_utilization_pct: number;
  status: 'active' | 'at_risk' | 'dormant';
  is_flagship?: boolean;
}

export interface CorporateGroup {
  group_id: string;
  group_name: string;
  group_code: string;
  group_credit_limit: number;
  group_outstanding: number;
  payment_terms: string;
  hq_address: string;
  hq_contact_name: string;
  hq_contact_phone: string;
  currency: string;
  branches: HierarchyBranchNode[];
}

export const CORPORATE_GROUPS: CorporateGroup[] = [
  {
    group_id: 'grp-al-maya',
    group_name: 'Al Maya Group Holdings (HQ)',
    group_code: 'GRP-ALMAYA-UAE',
    group_credit_limit: 350000,
    group_outstanding: 112400,
    payment_terms: '45 Days Net',
    hq_address: 'Al Maya Headquarters, Al Quoz Industrial 3, Dubai, UAE',
    hq_contact_name: 'Kailash Narwani (Group CFO)',
    hq_contact_phone: '+971 4 347 3500',
    currency: 'AED',
    branches: [
      {
        id: 'c1111111-0000-0000-0000-000000000001',
        name: 'Al Noor Trading LLC (Central Hub / Al Quoz)',
        code: 'AM-DXB-001',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Dubai South & Industrial',
        city: 'Dubai',
        address: 'Al Quoz Industrial Area 3, Dubai',
        latitude: 25.1382,
        longitude: 55.2333,
        contact_name: 'Fatima Al Noor',
        contact_phone: '+971501234567',
        contact_email: 'fatima@alnoor-demo.com',
        individual_credit_limit: 120000,
        individual_outstanding: 45000,
        credit_utilization_pct: 38,
        status: 'at_risk',
        is_flagship: true,
      },
      {
        id: 'c1111111-0000-0000-0000-000000000011',
        name: 'Al Maya Supermarket (Marina Walk Outlet)',
        code: 'AM-DXB-002',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Dubai Marina & JBR',
        city: 'Dubai',
        address: 'Marina Walk, Dubai Marina, Dubai',
        latitude: 25.0772,
        longitude: 55.1394,
        contact_name: 'Ramesh Sharma',
        contact_phone: '+971509876543',
        contact_email: 'marina@almaya.ae',
        individual_credit_limit: 90000,
        individual_outstanding: 38000,
        credit_utilization_pct: 42,
        status: 'active',
      },
      {
        id: 'c1111111-0000-0000-0000-000000000012',
        name: 'Al Maya Hypermarket (Deira City Centre)',
        code: 'AM-DXB-003',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Deira & Old Dubai',
        city: 'Dubai',
        address: '8th St, Port Saeed, Deira, Dubai',
        latitude: 25.2532,
        longitude: 55.3339,
        contact_name: 'Saeed Mansoor',
        contact_phone: '+971504561234',
        contact_email: 'deira@almaya.ae',
        individual_credit_limit: 140000,
        individual_outstanding: 29400,
        credit_utilization_pct: 21,
        status: 'active',
      },
      {
        id: 'c1111111-0000-0000-0000-000000000013',
        name: 'Al Maya Mart (Al Barsha South)',
        code: 'AM-DXB-004',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Barsha & Al Khail',
        city: 'Dubai',
        address: 'Al Barsha South 2, Dubai',
        latitude: 25.0682,
        longitude: 55.2185,
        contact_name: 'Sunil Varma',
        contact_phone: '+971507788990',
        contact_email: 'barsha@almaya.ae',
        individual_credit_limit: 60000,
        individual_outstanding: 18200,
        credit_utilization_pct: 30,
        status: 'active',
      },
    ],
  },
  {
    group_id: 'grp-gulf-fresh',
    group_name: 'Gulf Fresh Global Holdings (HQ)',
    group_code: 'GRP-GULFFRESH-UAE',
    group_credit_limit: 280000,
    group_outstanding: 76800,
    payment_terms: '30 Days Net',
    hq_address: 'Gulf Fresh Tower, Al Rigga, Deira, Dubai, UAE',
    hq_contact_name: 'Tariq Al Hashemi (Commercial Dir.)',
    hq_contact_phone: '+971 4 228 9900',
    currency: 'AED',
    branches: [
      {
        id: 'c1111111-0000-0000-0000-000000000002',
        name: 'Gulf Fresh Distributors (Deira Wholesale Depot)',
        code: 'GF-DXB-001',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Deira & Northern Emirates',
        city: 'Dubai',
        address: 'Deira Wholesale Market, Dubai',
        latitude: 25.2697,
        longitude: 55.3095,
        contact_name: 'Omar Khalid',
        contact_phone: '+971502345678',
        contact_email: 'omar@gulffresh-demo.com',
        individual_credit_limit: 150000,
        individual_outstanding: 42000,
        credit_utilization_pct: 28,
        status: 'active',
        is_flagship: true,
      },
      {
        id: 'c1111111-0000-0000-0000-000000000021',
        name: 'Gulf Fresh Logistics Hub (JAFZA South)',
        code: 'GF-DXB-002',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'JAFZA & Abu Dhabi Border',
        city: 'Dubai',
        address: 'Jebel Ali Freezone South, Dubai',
        latitude: 24.9857,
        longitude: 55.0874,
        contact_name: 'Zubair Ahmed',
        contact_phone: '+971503344556',
        contact_email: 'jafza@gulffresh.ae',
        individual_credit_limit: 80000,
        individual_outstanding: 21800,
        credit_utilization_pct: 27,
        status: 'active',
      },
      {
        id: 'c1111111-0000-0000-0000-000000000022',
        name: 'Gulf Fresh Gourmet Market (Downtown Boulevard)',
        code: 'GF-DXB-003',
        hierarchy_level: 'branch',
        credit_limit_scope: 'individual',
        territory: 'Downtown & Business Bay',
        city: 'Dubai',
        address: 'Sheikh Mohammed bin Rashid Blvd, Downtown Dubai',
        latitude: 25.1972,
        longitude: 55.2744,
        contact_name: 'Maya Tannous',
        contact_phone: '+971508899112',
        contact_email: 'downtown@gulffresh.ae',
        individual_credit_limit: 50000,
        individual_outstanding: 13000,
        credit_utilization_pct: 26,
        status: 'active',
      },
    ],
  },
  {
    group_id: 'grp-emirates-hospitality',
    group_name: 'Emirates Food & Hospitality Consortium (HQ)',
    group_code: 'GRP-EMIRATES-UAE',
    group_credit_limit: 420000,
    group_outstanding: 145600,
    payment_terms: '60 Days Net',
    hq_address: 'Emirates Financial Towers, DIFC, Dubai, UAE',
    hq_contact_name: 'Hassan Al Marzouqi (Procurement VP)',
    hq_contact_phone: '+971 4 362 7700',
    currency: 'AED',
    branches: [
      {
        id: 'c1111111-0000-0000-0000-000000000003',
        name: 'Sharjah Ingredients Co. (Sharjah Central Hub)',
        code: 'EF-SHJ-001',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Sharjah & Industrial Corridors',
        city: 'Sharjah',
        address: 'Industrial Area 6, Sharjah',
        latitude: 25.3573,
        longitude: 55.4033,
        contact_name: 'Layla Hassan',
        contact_phone: '+971503456789',
        contact_email: 'layla@sharjahing-demo.com',
        individual_credit_limit: 160000,
        individual_outstanding: 58000,
        credit_utilization_pct: 36,
        status: 'active',
        is_flagship: true,
      },
      {
        id: 'c1111111-0000-0000-0000-000000000031',
        name: 'Northern Emirates Bakery Supplies (Ajman Free Zone)',
        code: 'EF-AJM-002',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Ajman & Umm Al Quwain',
        city: 'Ajman',
        address: 'Ajman Free Zone Gate 2, Ajman',
        latitude: 25.4111,
        longitude: 55.4462,
        contact_name: 'Ibrahim Al Nuaimi',
        contact_phone: '+971506677889',
        contact_email: 'ajman@emiratesbakery.ae',
        individual_credit_limit: 120000,
        individual_outstanding: 44600,
        credit_utilization_pct: 37,
        status: 'active',
      },
      {
        id: 'c1111111-0000-0000-0000-000000000032',
        name: 'RAK Food & Ingredients Distribution (Al Nakheel)',
        code: 'EF-RAK-003',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Ras Al Khaimah & Fujairah',
        city: 'Ras Al Khaimah',
        address: 'Al Muntasir St, Al Nakheel, RAK',
        latitude: 25.7895,
        longitude: 55.9432,
        contact_name: 'Salim Qasimi',
        contact_phone: '+971509988223',
        contact_email: 'rak@emiratesfood.ae',
        individual_credit_limit: 140000,
        individual_outstanding: 43000,
        credit_utilization_pct: 31,
        status: 'active',
      },
    ],
  },
  {
    group_id: 'grp-lulu-group',
    group_name: 'Lulu Group International (Corporate HQ)',
    group_code: 'GRP-LULU-INTL',
    group_credit_limit: 650000,
    group_outstanding: 198000,
    payment_terms: '45 Days Net',
    hq_address: 'Lulu Regional HQ, Y-Tower, Al Nahyan, Abu Dhabi / Dubai, UAE',
    hq_contact_name: 'V. Nandakumar (Chief Communications Officer)',
    hq_contact_phone: '+971 2 418 4500',
    currency: 'AED',
    branches: [
      {
        id: 'c1111111-0000-0000-0000-000000000041',
        name: 'Lulu Hypermarket (Al Barsha 1 Mega Store)',
        code: 'LU-DXB-001',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Barsha & Sheikh Zayed Road',
        city: 'Dubai',
        address: 'Behind Mall of the Emirates, Al Barsha 1, Dubai',
        latitude: 25.1189,
        longitude: 55.2005,
        contact_name: 'Shafeer Kunhi',
        contact_phone: '+971501122334',
        contact_email: 'barsha@lulugroup.com',
        individual_credit_limit: 250000,
        individual_outstanding: 85000,
        credit_utilization_pct: 34,
        status: 'active',
        is_flagship: true,
      },
      {
        id: 'c1111111-0000-0000-0000-000000000042',
        name: 'Lulu Express Fresh Market (DIFC Gate Avenue)',
        code: 'LU-DXB-002',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'DIFC & Downtown',
        city: 'Dubai',
        address: 'Zone D, Gate Avenue, DIFC, Dubai',
        latitude: 25.2048,
        longitude: 55.2708,
        contact_name: 'George Mathew',
        contact_phone: '+971502233445',
        contact_email: 'difc@lulugroup.com',
        individual_credit_limit: 180000,
        individual_outstanding: 49000,
        credit_utilization_pct: 27,
        status: 'active',
      },
      {
        id: 'c1111111-0000-0000-0000-000000000043',
        name: 'Lulu Supermarket (Al Karama Center)',
        code: 'LU-DXB-003',
        hierarchy_level: 'branch',
        credit_limit_scope: 'consolidated_parent',
        territory: 'Karama & Bur Dubai',
        city: 'Dubai',
        address: 'Zabeel Rd, Al Karama, Dubai',
        latitude: 25.2482,
        longitude: 55.3021,
        contact_name: 'Anas Basheer',
        contact_phone: '+971503344556',
        contact_email: 'karama@lulugroup.com',
        individual_credit_limit: 220000,
        individual_outstanding: 64000,
        credit_utilization_pct: 29,
        status: 'active',
      },
    ],
  },
];

export interface AccountHierarchyContext {
  group: CorporateGroup;
  currentBranch: HierarchyBranchNode;
  allBranches: HierarchyBranchNode[];
  isHQ: boolean;
  groupCreditLimit: number;
  groupOutstanding: number;
  groupAvailableCredit: number;
  groupUtilizationPct: number;
  branchCreditLimit: number;
  branchOutstanding: number;
  branchAvailableCredit: number;
  branchUtilizationPct: number;
}

export function getAccountHierarchy(customerId: string): AccountHierarchyContext {
  for (const group of CORPORATE_GROUPS) {
    const matchedBranch = group.branches.find((b) => b.id === customerId);
    if (matchedBranch) {
      const groupAvail = Math.max(0, group.group_credit_limit - group.group_outstanding);
      const branchAvail = Math.max(0, matchedBranch.individual_credit_limit - matchedBranch.individual_outstanding);
      return {
        group,
        currentBranch: matchedBranch,
        allBranches: group.branches,
        isHQ: false,
        groupCreditLimit: group.group_credit_limit,
        groupOutstanding: group.group_outstanding,
        groupAvailableCredit: groupAvail,
        groupUtilizationPct: Math.round((group.group_outstanding / group.group_credit_limit) * 100),
        branchCreditLimit: matchedBranch.individual_credit_limit,
        branchOutstanding: matchedBranch.individual_outstanding,
        branchAvailableCredit: branchAvail,
        branchUtilizationPct: Math.round((matchedBranch.individual_outstanding / matchedBranch.individual_credit_limit) * 100),
      };
    }
  }

  const defaultGroup = CORPORATE_GROUPS[0];
  const defaultBranch = defaultGroup.branches[0];
  return {
    group: defaultGroup,
    currentBranch: {
      ...defaultBranch,
      id: customerId,
      name: 'Corporate Partner Outlet',
    },
    allBranches: defaultGroup.branches,
    isHQ: false,
    groupCreditLimit: defaultGroup.group_credit_limit,
    groupOutstanding: defaultGroup.group_outstanding,
    groupAvailableCredit: defaultGroup.group_credit_limit - defaultGroup.group_outstanding,
    groupUtilizationPct: Math.round((defaultGroup.group_outstanding / defaultGroup.group_credit_limit) * 100),
    branchCreditLimit: 120000,
    branchOutstanding: 45000,
    branchAvailableCredit: 75000,
    branchUtilizationPct: 38,
  };
}

export function validateOrderCredit(
  customerId: string,
  orderTotal: number,
  useConsolidatedCredit: boolean = true
) {
  const context = getAccountHierarchy(customerId);
  const creditLimit = useConsolidatedCredit ? context.groupCreditLimit : context.branchCreditLimit;
  const currentOutstanding = useConsolidatedCredit ? context.groupOutstanding : context.branchOutstanding;
  const newOutstanding = currentOutstanding + orderTotal;
  const availableCreditBeforeOrder = Math.max(0, creditLimit - currentOutstanding);
  const availableCreditAfterOrder = creditLimit - newOutstanding;
  const isApproved = newOutstanding <= creditLimit;
  const utilizationPctAfter = Math.min(100, Math.round((newOutstanding / creditLimit) * 100));

  return {
    isApproved,
    creditLimit,
    currentOutstanding,
    orderTotal,
    newOutstanding,
    availableCreditBeforeOrder,
    availableCreditAfterOrder,
    utilizationPctAfter,
    exceededAmount: isApproved ? 0 : Math.abs(availableCreditAfterOrder),
    scopeLabel: useConsolidatedCredit ? 'Consolidated Group Limit' : 'Individual Branch Limit',
    groupName: context.group.group_name,
    paymentTerms: context.group.payment_terms,
  };
}

export function getAllHierarchyAccounts(): (HierarchyBranchNode & { group_name: string; group_id: string })[] {
  const result: (HierarchyBranchNode & { group_name: string; group_id: string })[] = [];
  for (const g of CORPORATE_GROUPS) {
    for (const b of g.branches) {
      result.push({
        ...b,
        group_name: g.group_name,
        group_id: g.group_id,
      });
    }
  }
  return result;
}
