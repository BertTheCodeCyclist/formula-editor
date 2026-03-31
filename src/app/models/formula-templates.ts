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

export interface FormulaTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  slots: TemplateSlot[];
  generate: (values: Record<string, string>, filters?: FilterCondition[]) => string;
  example: string;
  supportsFilters?: boolean;
}

export const COMPARISON_OPERATORS = ['=', '<>', '<', '>', '<=', '>=', 'LIKE', 'IN', 'NOT IN'];

export const FORMULA_TEMPLATES: FormulaTemplate[] = [
  {
    id: 'percentage',
    name: 'Percentage of Total',
    category: 'Advanced',
    description: 'Calculates one field as a percentage of another: numerator / denominator * 100',
    slots: [
      { name: 'numerator', label: 'Numerator Field', type: 'column', hint: 'The field to divide (top of fraction)' },
      { name: 'denominator', label: 'Denominator Field', type: 'column', hint: 'The field to divide by (bottom of fraction)' },
      { name: 'precision', label: 'Decimal Precision', type: 'number', default: '3', hint: 'Number of decimal places (e.g. 3)' }
    ],
    generate: (v) =>
      `CASE WHEN SUM(${bracketCol(v['denominator'])}) = 0 THEN 0 ELSE CAST(SUM(${bracketCol(v['numerator'])}) AS numeric(9,${v['precision'] || '3'})) * 100.00 / SUM(${bracketCol(v['denominator'])}) END`,
    example: 'CASE WHEN SUM([Headcount]) = 0 THEN 0 ELSE cast(SUM([CountPromotions]) as numeric(9,3)) * 100.00 / SUM([Headcount]) END'
  },
  {
    id: 'safe-percentage',
    name: 'Safe Percentage (Division-by-zero Protected)',
    category: 'Advanced',
    description: 'Percentage calculation that returns 0 when the denominator is zero',
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
    id: 'safe-percentage-nullif',
    name: 'Safe Percentage (NULLIF Style)',
    category: 'Advanced',
    description: 'Percentage using NULLIF to protect against division by zero — returns NULL instead of 0',
    slots: [
      { name: 'numerator', label: 'Numerator Field', type: 'column' },
      { name: 'denominator', label: 'Denominator Field', type: 'column' },
      { name: 'precision', label: 'Decimal Precision', type: 'number', default: '3' }
    ],
    generate: (v) =>
      `CAST(SUM(${bracketCol(v['numerator'])}) AS numeric(9,${v['precision'] || '3'})) * 100.00 / NULLIF(SUM(${bracketCol(v['denominator'])}), 0)`,
    example: 'cast(SUM([IsFemaleManagerFlag]) as numeric(9,3)) * 100.00 / NULLIF(SUM([ManagerHeadcount]), 0)'
  },
  {
    id: 'annualized-percentage',
    name: 'Annualized Percentage',
    category: 'Advanced',
    description: 'Percentage multiplied by a factor (typically 12) to annualize monthly data',
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
    id: 'simple-ratio',
    name: 'Simple Ratio',
    category: 'Advanced',
    description: 'One aggregate divided by another (not a percentage)',
    slots: [
      { name: 'numerator', label: 'Numerator Field', type: 'column' },
      { name: 'denominator', label: 'Denominator Field', type: 'column' }
    ],
    generate: (v) =>
      `CASE WHEN SUM(${bracketCol(v['denominator'])}) = 0 THEN 0 ELSE CAST(SUM(${bracketCol(v['numerator'])}) AS numeric(9,3)) / SUM(${bracketCol(v['denominator'])}) END`,
    example: 'CASE WHEN SUM([ManagerHeadcount]) = 0 THEN 0 ELSE cast(SUM(Headcount) as numeric(9,3)) / SUM([ManagerHeadcount]) END'
  },
  {
    id: 'simple-count',
    name: 'COUNT',
    category: 'Simple',
    description: 'Count of rows',
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
    slots: [
      { name: 'positive', label: 'Additions Field', type: 'column', hint: 'e.g. StarterInPeriodValue' },
      { name: 'negative', label: 'Subtractions Field', type: 'column', hint: 'e.g. LeaverInPeriodValue' }
    ],
    generate: (v) =>
      `SUM(${bracketCol(v['positive'])} - ${bracketCol(v['negative'])})`,
    example: 'SUM(StarterInPeriodValue - [LeaverInPeriodValue])'
  },
  {
    id: 'count-distinct',
    name: 'COUNT DISTINCT',
    category: 'Simple',
    description: 'Count of unique values in a field',
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
    slots: [
      { name: 'field', label: 'Field', type: 'column' }
    ],
    generate: (v) =>
      `MAX(${bracketCol(v['field'])})`,
    example: 'MAX([SalaryFTE])'
  },
  {
    id: 'cost-per-unit',
    name: 'Cost Per Unit (e.g. Cost Per Hour)',
    category: 'Advanced',
    description: 'Total cost divided by total units, protected against zero division',
    slots: [
      { name: 'cost', label: 'Cost Field', type: 'column' },
      { name: 'units', label: 'Units Field', type: 'column', hint: 'e.g. Hours, Shifts' }
    ],
    generate: (v) =>
      `CASE WHEN SUM(${bracketCol(v['units'])}) = 0.00 THEN 0.00 ELSE SUM(${bracketCol(v['cost'])}) / SUM(${bracketCol(v['units'])}) END`,
    example: 'CASE WHEN SUM(CWFS_val_Hours) = 0.00 THEN 0.00 ELSE SUM(CWFS_val_TotalCost)/SUM(CWFS_val_Hours) END'
  }
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
