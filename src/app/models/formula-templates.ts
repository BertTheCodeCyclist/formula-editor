export interface TemplateSlot {
  name: string;
  label: string;
  type: 'column' | 'number' | 'text' | 'comparison' | 'column-or-expression';
  default?: string;
  hint?: string;
}

export interface FilterCondition {
  field: string;
  operator: string;
  value: string;
}

export interface UseCase {
  label: string;
  formula: string;
}

export interface FormulaTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  useCases: UseCase[];
  slots: TemplateSlot[];
  generate: (values: Record<string, string>, filters?: FilterCondition[]) => string;
  example: string;
  supportsFilters?: boolean;
}

export const COMPARISON_OPERATORS = ['=', '<>', '<', '>', '<=', '>=', 'LIKE', 'IN', 'NOT IN'];

export const FORMULA_TEMPLATES: FormulaTemplate[] = [
  {
    id: 'safe-percentage',
    name: 'Percentage',
    category: 'Advanced',
    description: 'Calculates one field as a percentage of another, returning 0 when the denominator is zero',
    useCases: [
      { label: 'Turnover rate: Leavers as a % of Headcount', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM([LeaverInPeriodValue]) AS numeric(9,3)) * 100.00 / SUM([Headcount]) END' },
      { label: 'Promotion rate: Promotions as a % of Headcount', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM([CountPromotions]) AS numeric(9,3)) * 100.00 / SUM([Headcount]) END' },
      { label: 'BME representation: BME employees as a % of total Headcount', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM([BMEEmployee]) AS numeric(9,3)) * 100.00 / SUM([Headcount]) END' },
      { label: 'Female manager %: Female managers as a % of all managers', formula: 'CASE WHEN SUM([ManagerHeadcount]) = 0 THEN 0 ELSE CAST(SUM([IsFemaleManagerFlag]) AS numeric(9,3)) * 100.00 / SUM([ManagerHeadcount]) END' }
    ],
    slots: [
      { name: 'numerator', label: 'Numerator Field', type: 'column' },
      { name: 'denominator', label: 'Denominator Field', type: 'column' },
      { name: 'precision', label: 'Decimal Precision', type: 'number', default: '3' }
    ],
    generate: (v) =>
      `CASE WHEN SUM(${bracketCol(v['denominator'])}) = 0 THEN 0 ELSE CAST(SUM(${bracketCol(v['numerator'])}) AS numeric(9,${v['precision'] || '3'})) * 100.00 / SUM(${bracketCol(v['denominator'])}) END`,
    example: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE cast(SUM([VoluntaryLeaverValue]) ...) * 100.00 / SUM([Headcount]) END'
  },
  {
    id: 'annualized-percentage',
    name: 'Annualized Percentage',
    category: 'Advanced',
    description: 'Percentage multiplied by a factor (typically 12) to annualize monthly data',
    useCases: [
      { label: 'Annualized turnover: Monthly leavers projected to a full year rate', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM([LeaverInPeriodValue]) AS numeric(9,3)) * 12 * 100.00 / SUM([Headcount]) END' },
      { label: 'Annualized voluntary turnover: Monthly voluntary leavers as a yearly %', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM([VoluntaryLeaverValue]) AS numeric(9,3)) * 12 * 100.00 / SUM([Headcount]) END' },
      { label: 'Annualized transfer rate: Monthly transfers as a yearly %', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM([CountTransfers]) AS numeric(9,3)) * 12 * 100.00 / SUM([Headcount]) END' }
    ],
    slots: [
      { name: 'numerator', label: 'Numerator Field', type: 'column' },
      { name: 'denominator', label: 'Denominator Field', type: 'column' },
      { name: 'multiplier', label: 'Annualization Factor', type: 'number', default: '12', hint: 'Typically 12 for monthly-to-annual' },
      { name: 'precision', label: 'Decimal Precision', type: 'number', default: '3' }
    ],
    generate: (v) =>
      `CASE WHEN SUM(${bracketCol(v['denominator'])}) = 0 THEN 0 ELSE CAST(SUM(${bracketCol(v['numerator'])}) AS numeric(9,${v['precision'] || '3'})) * ${v['multiplier'] || '12'} * 100.00 / SUM(${bracketCol(v['denominator'])}) END`,
    example: 'cast(SUM([LeaverInPeriodValue]) as numeric(9,3)) * 12 * 100.00 / SUM([Headcount])'
  },
  {
    id: 'inverse-percentage',
    name: 'Inverse Percentage (Retention)',
    category: 'Advanced',
    description: 'Calculates 100% minus a percentage — e.g. retention rate from turnover',
    useCases: [
      { label: 'Retention rate: 100% minus annualized turnover rate', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE 100.00 - (CAST(SUM([LeaverInPeriodValue]) AS numeric(9,3)) * 12 * 100.00 / SUM([Headcount])) END' },
      { label: 'Stability index: 100% minus % of staff with < 1 year service', formula: 'CASE WHEN SUM([FTEActual]) = 0 THEN 0 ELSE 100.00 - (CAST(SUM(CASE WHEN [ServiceLengthValue] >= 1 THEN [FTEActual] ELSE 0 END) AS numeric(9,3)) * 100.00 / SUM([FTEActual])) END' }
    ],
    slots: [
      { name: 'numerator', label: 'Numerator Field (the loss/turnover)', type: 'column' },
      { name: 'denominator', label: 'Denominator Field (the total)', type: 'column' },
      { name: 'multiplier', label: 'Annualization Factor (or 1 for none)', type: 'number', default: '1' },
      { name: 'precision', label: 'Decimal Precision', type: 'number', default: '3' }
    ],
    generate: (v) => {
      const mult = v['multiplier'] && v['multiplier'] !== '1' ? ` * ${v['multiplier']}` : '';
      return `CASE WHEN SUM(${bracketCol(v['denominator'])}) = 0 THEN 0 ELSE 100.00 - (CAST(SUM(${bracketCol(v['numerator'])}) AS numeric(9,${v['precision'] || '3'}))${mult} * 100.00 / SUM(${bracketCol(v['denominator'])})) END`;
    },
    example: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE 100.00 - (cast(sum([LeaverInPeriodValue]) as numeric(9,3)) * 12 * 100.00 / sum([Headcount])) END'
  },
  {
    id: 'weighted-average',
    name: 'Weighted Average',
    category: 'Advanced',
    description: 'Calculates a weighted average: SUM(value) / SUM(weight), returning 0 if weight is zero',
    useCases: [
      { label: 'Average salary: Total salary spend divided by headcount', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE SUM([SalaryTotal]) / SUM([Headcount]) END' },
      { label: 'Average contracted hours per employee', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE SUM([ContractedHours]) / SUM([Headcount]) END' },
      { label: 'Cost per hour: Total cost divided by hours worked', formula: 'CASE WHEN SUM([CWFS_val_Hours]) = 0 THEN 0 ELSE SUM([CWFS_val_TotalCost]) / SUM([CWFS_val_Hours]) END' },
      { label: 'Span of control: Headcount per manager', formula: 'CASE WHEN SUM([ManagerHeadcount]) = 0 THEN 0 ELSE SUM([Headcount]) / SUM([ManagerHeadcount]) END' }
    ],
    slots: [
      { name: 'value', label: 'Value Field (numerator)', type: 'column', hint: 'e.g. SalaryTotal, ContractedHours' },
      { name: 'weight', label: 'Weight Field (denominator)', type: 'column', hint: 'e.g. Headcount, FTEActual' }
    ],
    generate: (v) =>
      `CASE WHEN SUM(${bracketCol(v['weight'])}) = 0 THEN 0 ELSE SUM(${bracketCol(v['value'])}) / SUM(${bracketCol(v['weight'])}) END`,
    example: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE SUM([SalaryTotal]) / SUM([Headcount]) END'
  },
  {
    id: 'conditional-percentage',
    name: 'Filtered Percentage',
    category: 'Advanced',
    description: 'Percentage calculated only for rows matching a condition (e.g. turnover for permanent staff only)',
    useCases: [
      { label: 'Early leavers %: Leavers with < 1 year service as a % of headcount', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM(CASE WHEN [ServiceLengthValue] < 1 THEN [LeaverInPeriodValue] END) AS numeric(9,3)) * 100.00 / SUM([Headcount]) END' },
      { label: 'Voluntary resignation by reason: Leavers for a reason as a % of all voluntary leavers', formula: "CASE WHEN SUM([VoluntaryLeaverValue]) = 0 THEN 0 ELSE CAST(SUM(CASE WHEN [LeaveReasonCategory] = 'Better Opportunity Elsewhere' THEN [VoluntaryLeaverValue] END) AS numeric(9,3)) * 100.00 / SUM([VoluntaryLeaverValue]) END" },
      { label: 'Non-junior-doctor turnover: Turnover excluding junior doctors and bank staff', formula: "CASE WHEN SUM(CASE WHEN [ContractType] <> 'Bank' AND [JuniorDoctorText] = 'No' THEN [Headcount] END) = 0 THEN 0 ELSE CAST(SUM(CASE WHEN [ContractType] <> 'Bank' AND [JuniorDoctorText] = 'No' THEN [LeaverInPeriodValue] END) AS numeric(9,3)) * 100.00 / SUM(CASE WHEN [ContractType] <> 'Bank' AND [JuniorDoctorText] = 'No' THEN [Headcount] END) END" }
    ],
    slots: [
      { name: 'numerator', label: 'Numerator Field', type: 'column' },
      { name: 'denominator', label: 'Denominator Field', type: 'column' },
      { name: 'precision', label: 'Decimal Precision', type: 'number', default: '3' }
    ],
    supportsFilters: true,
    generate: (v, filters) => {
      const cond = buildFilterCondition(filters);
      if (!cond) {
        return `CASE WHEN SUM(${bracketCol(v['denominator'])}) = 0 THEN 0 ELSE CAST(SUM(${bracketCol(v['numerator'])}) AS numeric(9,${v['precision'] || '3'})) * 100.00 / SUM(${bracketCol(v['denominator'])}) END`;
      }
      return `CASE WHEN SUM(CASE WHEN ${cond} THEN ${bracketCol(v['denominator'])} END) = 0 THEN 0 ELSE CAST(SUM(CASE WHEN ${cond} THEN ${bracketCol(v['numerator'])} END) AS numeric(9,${v['precision'] || '3'})) * 100.00 / SUM(CASE WHEN ${cond} THEN ${bracketCol(v['denominator'])} END) END`;
    },
    example: 'CASE WHEN SUM(CASE WHEN ContractType = \'Permanent\' THEN Headcount END) = 0 THEN 0 ELSE ... END'
  },
  {
    id: 'simple-count',
    name: 'COUNT',
    category: 'Simple',
    description: 'Count of rows',
    useCases: [
      { label: 'Total assignments: Count of employee records', formula: 'COUNT([EmployeeID])' },
      { label: 'Number of sickness events in a period', formula: 'COUNT([SicknessEvents])' }
    ],
    slots: [
      { name: 'field', label: 'Field to Count', type: 'column' }
    ],
    generate: (v) =>
      `COUNT(${bracketCol(v['field'])})`,
    example: 'COUNT([EmployeeID])'
  },
  {
    id: 'net-change',
    name: 'Net Change',
    category: 'Advanced',
    description: 'Difference between two summed fields — e.g. starters minus leavers',
    useCases: [
      { label: 'Net headcount movement: Starters minus leavers in a period', formula: 'SUM([StarterInPeriodValue] - [LeaverInPeriodValue])' },
      { label: 'Vacancy gap: Establishment FTE minus actual FTE', formula: 'SUM([TotalSubstantiveFTE] - [ActualSubstantiveFTE])' },
      { label: 'Available workforce: Actual FTE minus absence FTE', formula: 'SUM([ActualTotalFTE] - [AbsenceFTE])' }
    ],
    slots: [
      { name: 'positive', label: 'Additions Field', type: 'column', hint: 'e.g. StarterInPeriodValue' },
      { name: 'negative', label: 'Subtractions Field', type: 'column', hint: 'e.g. LeaverInPeriodValue' }
    ],
    generate: (v) =>
      `SUM(${bracketCol(v['positive'])} - ${bracketCol(v['negative'])})`,
    example: 'SUM(StarterInPeriodValue - [LeaverInPeriodValue])'
  },
  {
    id: 'net-change-ratio',
    name: 'Net Change Ratio',
    category: 'Advanced',
    description: 'Difference between two fields divided by a third — e.g. (starters - leavers) / starting headcount',
    useCases: [
      { label: 'Replacement ratio: Starters minus leavers divided by leavers', formula: 'CASE WHEN SUM([LeaverInPeriodValue]) = 0 THEN 0 ELSE SUM([StarterInPeriodValue] - [LeaverInPeriodValue]) / SUM([LeaverInPeriodValue]) END' },
      { label: 'Workforce growth factor: Net change relative to starting headcount', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE SUM([StarterInPeriodValue] - [LeaverInPeriodValue]) / SUM([Headcount]) END' }
    ],
    slots: [
      { name: 'positive', label: 'Additions Field', type: 'column', hint: 'e.g. StarterInPeriodValue' },
      { name: 'negative', label: 'Subtractions Field', type: 'column', hint: 'e.g. LeaverInPeriodValue' },
      { name: 'denominator', label: 'Denominator Field', type: 'column', hint: 'e.g. Headcount' }
    ],
    generate: (v) =>
      `CASE WHEN SUM(${bracketCol(v['denominator'])}) = 0 THEN 0 ELSE SUM(${bracketCol(v['positive'])} - ${bracketCol(v['negative'])}) / SUM(${bracketCol(v['denominator'])}) END`,
    example: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE SUM([StarterInPeriodValue] - [LeaverInPeriodValue]) / SUM([Headcount]) END'
  },
  {
    id: 'net-change-percentage',
    name: 'Net Change Percentage',
    category: 'Advanced',
    description: 'Difference between two fields as a percentage of a third — e.g. (starters - leavers) as % of headcount',
    useCases: [
      { label: 'Workforce growth %: Net headcount change as a % of starting headcount', formula: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM([StarterInPeriodValue] - [LeaverInPeriodValue]) AS numeric(9,3)) * 100.00 / SUM([Headcount]) END' },
      { label: 'Vacancy rate change: Change in vacancies as a % of establishment FTE', formula: 'CASE WHEN SUM([TotalSubstantiveFTE]) = 0 THEN 0 ELSE CAST(SUM([WTEVacancies] - [SicknessFTE]) AS numeric(9,3)) * 100.00 / SUM([TotalSubstantiveFTE]) END' }
    ],
    slots: [
      { name: 'positive', label: 'Additions Field', type: 'column', hint: 'e.g. StarterInPeriodValue' },
      { name: 'negative', label: 'Subtractions Field', type: 'column', hint: 'e.g. LeaverInPeriodValue' },
      { name: 'denominator', label: 'Denominator Field', type: 'column', hint: 'e.g. Headcount' },
      { name: 'precision', label: 'Decimal Precision', type: 'number', default: '3' }
    ],
    generate: (v) =>
      `CASE WHEN SUM(${bracketCol(v['denominator'])}) = 0 THEN 0 ELSE CAST(SUM(${bracketCol(v['positive'])} - ${bracketCol(v['negative'])}) AS numeric(9,${v['precision'] || '3'})) * 100.00 / SUM(${bracketCol(v['denominator'])}) END`,
    example: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE CAST(SUM([StarterInPeriodValue] - [LeaverInPeriodValue]) AS numeric(9,3)) * 100.00 / SUM([Headcount]) END'
  },
  {
    id: 'count-distinct',
    name: 'COUNT DISTINCT',
    category: 'Simple',
    description: 'Count of unique values in a field',
    useCases: [
      { label: 'Unique employee count: Distinct employees across multiple records', formula: 'COUNT(DISTINCT [EmployeeNumber])' },
      { label: 'Number of unique job codes or positions', formula: 'COUNT(DISTINCT [JobCode])' }
    ],
    slots: [
      { name: 'field', label: 'Field to Count', type: 'column' }
    ],
    generate: (v) =>
      `COUNT(DISTINCT ${bracketCol(v['field'])})`,
    example: 'COUNT(DISTINCT [EmployeeNumber])'
  },
  {
    id: 'simple-sum',
    name: 'SUM',
    category: 'Simple',
    description: 'Sum of a single field',
    useCases: [
      { label: 'Total headcount across a group', formula: 'SUM([Headcount])' },
      { label: 'Total FTE: Sum of full-time equivalent values', formula: 'SUM([FTEActual])' },
      { label: 'Total sickness days in a period', formula: 'SUM([SicknessDays])' }
    ],
    slots: [
      { name: 'field', label: 'Field to Sum', type: 'column' }
    ],
    generate: (v) =>
      `SUM(${bracketCol(v['field'])})`,
    example: 'SUM([Headcount])'
  },
  {
    id: 'simple-avg',
    name: 'AVG',
    category: 'Simple',
    description: 'Average of a single field',
    useCases: [
      { label: 'Average compliance target across training courses', formula: 'AVG([ComplianceTarget])' },
      { label: 'Average margin percentage for contractors', formula: 'AVG([EMPCON_val_Marginpc])' }
    ],
    slots: [
      { name: 'field', label: 'Field to Average', type: 'column' }
    ],
    generate: (v) =>
      `AVG(${bracketCol(v['field'])})`,
    example: 'AVG([ComplianceTarget])'
  },
  {
    id: 'simple-min',
    name: 'MIN',
    category: 'Simple',
    description: 'Minimum value of a field',
    useCases: [
      { label: 'Lowest salary in a group or department', formula: 'MIN([SalaryFTE])' },
      { label: 'Shortest service length in a team', formula: 'MIN([ServiceLengthValue])' }
    ],
    slots: [
      { name: 'field', label: 'Field', type: 'column' }
    ],
    generate: (v) =>
      `MIN(${bracketCol(v['field'])})`,
    example: 'MIN([SalaryFTE])'
  },
  {
    id: 'simple-max',
    name: 'MAX',
    category: 'Simple',
    description: 'Maximum value of a field',
    useCases: [
      { label: 'Highest salary in a group or department', formula: 'MAX([SalaryFTE])' },
      { label: 'Longest service length in a team', formula: 'MAX([ServiceLengthValue])' }
    ],
    slots: [
      { name: 'field', label: 'Field', type: 'column' }
    ],
    generate: (v) =>
      `MAX(${bracketCol(v['field'])})`,
    example: 'MAX([SalaryFTE])'
  },
];

function bracketCol(col: string): string {
  if (!col) return '[]';
  if (col.startsWith('[')) return col;
  return `[${col}]`;
}

function buildFilterCondition(filters?: FilterCondition[]): string {
  if (!filters || filters.length === 0) return '';
  return filters
    .filter(f => f.field && f.operator && f.value)
    .map(f => {
      const field = bracketCol(f.field);
      if (f.operator === 'IN' || f.operator === 'NOT IN') {
        return `${field} ${f.operator} (${f.value})`;
      }
      if (f.operator === 'LIKE') {
        return `${field} LIKE '${f.value}'`;
      }
      const isNumeric = !isNaN(Number(f.value));
      const val = isNumeric ? f.value : `'${f.value}'`;
      return `${field} ${f.operator} ${val}`;
    })
    .join(' AND ');
}
