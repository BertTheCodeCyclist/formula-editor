import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormulaEditorComponent } from './components/formula-editor/formula-editor.component';
import { TemplateBuilderComponent } from './components/template-builder/template-builder.component';
import { VIEW_DEFINITIONS, ViewDefinition } from './models/view-columns';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, FormulaEditorComponent, TemplateBuilderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  views = VIEW_DEFINITIONS;
  selectedView: ViewDefinition | null = null;
  activeTab: 'template' | 'freetext' = 'template';
  formula = '';

  get columns(): string[] {
    return this.selectedView?.columns || [];
  }

  onViewChange(viewName: string): void {
    this.selectedView = this.views.find(v => v.name === viewName) || null;
  }

  onFormulaFromTemplate(formula: string): void {
    this.formula = formula;
    this.activeTab = 'freetext';
  }
}
