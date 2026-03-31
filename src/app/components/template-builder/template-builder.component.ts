import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormulaTemplate, FilterCondition, FORMULA_TEMPLATES, COMPARISON_OPERATORS } from '../../models/formula-templates';

@Component({
  selector: 'app-template-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-builder.component.html',
  styleUrl: './template-builder.component.scss'
})
export class TemplateBuilderComponent implements OnChanges {
  @Input() columns: string[] = [];
  @Output() formulaGenerated = new EventEmitter<string>();

  templates = FORMULA_TEMPLATES;
  comparisonOperators = COMPARISON_OPERATORS;

  selectedTemplate: FormulaTemplate | null = null;
  slotValues: Record<string, string> = {};
  filters: FilterCondition[] = [];
  generatedFormula = '';
  columnSearch = '';

  get simpleTemplates(): FormulaTemplate[] {
    return this.templates.filter(t => t.category === 'Simple');
  }

  get advancedTemplates(): FormulaTemplate[] {
    return this.templates.filter(t => t.category === 'Advanced');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.resetSlots();
    }
  }

  get filteredColumns(): string[] {
    if (!this.columnSearch) return this.columns;
    const search = this.columnSearch.toLowerCase();
    return this.columns.filter(c => c.toLowerCase().includes(search));
  }

  selectTemplate(template: FormulaTemplate): void {
    this.selectedTemplate = template;
    this.resetSlots();
  }

  resetSlots(): void {
    this.slotValues = {};
    this.filters = [];
    this.generatedFormula = '';

    if (this.selectedTemplate) {
      for (const slot of this.selectedTemplate.slots) {
        this.slotValues[slot.name] = slot.default || '';
      }
    }
  }

  addFilter(): void {
    this.filters.push({ field: '', operator: '=', value: '' });
  }

  removeFilter(index: number): void {
    this.filters.splice(index, 1);
    this.generateFormula();
  }

  generateFormula(): void {
    if (!this.selectedTemplate) return;

    const hasAllRequired = this.selectedTemplate.slots
      .filter(s => s.type === 'column')
      .every(s => !!this.slotValues[s.name]);

    if (!hasAllRequired) {
      this.generatedFormula = '';
      return;
    }

    this.generatedFormula = this.selectedTemplate.generate(this.slotValues, this.filters);
  }

  useFormula(): void {
    if (this.generatedFormula) {
      this.formulaGenerated.emit(this.generatedFormula);
    }
  }

  onSlotChange(): void {
    this.generateFormula();
  }
}
