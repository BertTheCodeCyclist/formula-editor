import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormulaEditorComponent } from './components/formula-editor/formula-editor.component';
import { TemplateBuilderComponent } from './components/template-builder/template-builder.component';
import { VIEW_DEFINITIONS, ViewDefinition } from './models/view-columns';
import { Select } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { Tag } from 'primeng/tag';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, FormulaEditorComponent, TemplateBuilderComponent, Select, TabsModule, Tag],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  views = VIEW_DEFINITIONS;
  selectedView: ViewDefinition | null = null;
  activeTab: string = '0';
  formula = '';

  get columns(): string[] {
    return this.selectedView?.columns || [];
  }

  onFormulaFromTemplate(formula: string): void {
    this.formula = formula;
    this.activeTab = '1';
  }
}
