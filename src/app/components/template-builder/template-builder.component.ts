import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormulaTemplate, FilterCondition, FORMULA_TEMPLATES, COMPARISON_OPERATORS } from '../../models/formula-templates';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
@Component({
  selector: 'app-template-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, Select, InputText, InputNumber, ButtonModule],
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

  columnOptions: { label: string; value: string }[] = [];

  get simpleTemplates(): FormulaTemplate[] {
    return this.templates.filter(t => t.category === 'Simple');
  }

  get advancedTemplates(): FormulaTemplate[] {
    return this.templates.filter(t => t.category === 'Advanced');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.columnOptions = this.columns.map(c => ({ label: c, value: c }));
      this.resetSlots();
    }
  }

  get filteredColumns(): { label: string; value: string }[] {
    if (!this.columnSearch) return this.columnOptions;
    const search = this.columnSearch.toLowerCase();
    return this.columnOptions.filter(c => c.label.toLowerCase().includes(search));
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
