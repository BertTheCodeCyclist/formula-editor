import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormulaValidatorService, ValidationResult, ValidationError } from '../../services/formula-validator.service';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-formula-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputText, Message],
  templateUrl: './formula-editor.component.html',
  styleUrl: './formula-editor.component.scss'
})
export class FormulaEditorComponent implements OnChanges, AfterViewInit {
  @Input() columns: string[] = [];
  @Input() formula = '';
  @Output() formulaChange = new EventEmitter<string>();
  @ViewChild('editorTextarea') editorTextarea!: ElementRef<HTMLTextAreaElement>;

  validationResult: ValidationResult | null = null;
  showAutocomplete = false;
  autocompleteItems: string[] = [];
  autocompletePosition = { top: 0, left: 0 };
  selectedAutocompleteIndex = 0;
  sidebarColumnSearch = '';

  get filteredSidebarColumns(): string[] {
    if (!this.sidebarColumnSearch) return this.columns;
    const search = this.sidebarColumnSearch.toLowerCase();
    return this.columns.filter(c => c.toLowerCase().includes(search));
  }

  private debounceTimer: any;

  snippets = [
    { label: 'SUM()', insert: 'SUM()', cursor: -1 },
    { label: 'COUNT()', insert: 'COUNT()', cursor: -1 },
    { label: 'AVG()', insert: 'AVG()', cursor: -1 },
    { label: 'CASE WHEN', insert: 'CASE WHEN  THEN  ELSE  END', cursor: -17 },
    { label: 'CAST AS', insert: 'CAST( AS numeric(9,3))', cursor: -18 },
    { label: 'NULLIF', insert: 'NULLIF(, 0)', cursor: -4 },
    { label: 'COALESCE', insert: 'COALESCE(, 0)', cursor: -4 },
    { label: 'ISNULL', insert: 'ISNULL(, 0)', cursor: -4 },
    { label: 'COUNT DISTINCT', insert: 'COUNT(DISTINCT )', cursor: -1 },
  ];

  constructor(private validator: FormulaValidatorService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formula'] && !changes['formula'].firstChange) {
      this.validateFormula();
    }
    if (changes['columns']) {
      this.validateFormula();
    }
  }

  ngAfterViewInit(): void {
    if (this.formula) {
      this.validateFormula();
    }
  }

  onFormulaInput(value: string): void {
    this.formula = value;
    this.formulaChange.emit(value);

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.validateFormula(), 300);

    this.checkAutocomplete();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.showAutocomplete) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.selectedAutocompleteIndex = Math.min(this.selectedAutocompleteIndex + 1, this.autocompleteItems.length - 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.selectedAutocompleteIndex = Math.max(this.selectedAutocompleteIndex - 1, 0);
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        this.insertAutocomplete(this.autocompleteItems[this.selectedAutocompleteIndex]);
      } else if (event.key === 'Escape') {
        this.showAutocomplete = false;
      }
    }
  }

  validateFormula(): void {
    if (!this.formula.trim()) {
      this.validationResult = null;
      return;
    }
    this.validationResult = this.validator.validate(this.formula, this.columns);
  }

  insertSnippet(snippet: { insert: string; cursor: number }): void {
    const el = this.editorTextarea?.nativeElement;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = this.formula.slice(0, start);
    const after = this.formula.slice(end);

    this.formula = before + snippet.insert + after;
    this.formulaChange.emit(this.formula);

    setTimeout(() => {
      const newPos = start + snippet.insert.length + snippet.cursor;
      el.setSelectionRange(newPos, newPos);
      el.focus();
      this.validateFormula();
    });
  }

  insertColumn(col: string): void {
    const el = this.editorTextarea?.nativeElement;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = this.formula.slice(0, start);
    const after = this.formula.slice(end);
    const insert = `[${col}]`;

    this.formula = before + insert + after;
    this.formulaChange.emit(this.formula);

    setTimeout(() => {
      const newPos = start + insert.length;
      el.setSelectionRange(newPos, newPos);
      el.focus();
      this.validateFormula();
    });
  }

  private checkAutocomplete(): void {
    const el = this.editorTextarea?.nativeElement;
    if (!el) return;

    const cursorPos = el.selectionStart;
    const textBefore = this.formula.slice(0, cursorPos);

    const match = textBefore.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    if (match && match[0].length >= 2) {
      const prefix = match[0].toLowerCase();
      this.autocompleteItems = this.columns
        .filter(c => c.toLowerCase().startsWith(prefix))
        .slice(0, 8);

      if (this.autocompleteItems.length > 0) {
        this.showAutocomplete = true;
        this.selectedAutocompleteIndex = 0;
        return;
      }
    }

    this.showAutocomplete = false;
  }

  private insertAutocomplete(item: string): void {
    const el = this.editorTextarea?.nativeElement;
    if (!el) return;

    const cursorPos = el.selectionStart;
    const textBefore = this.formula.slice(0, cursorPos);
    const match = textBefore.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);

    if (match) {
      const replaceStart = cursorPos - match[0].length;
      const before = this.formula.slice(0, replaceStart);
      const after = this.formula.slice(cursorPos);
      const insert = `[${item}]`;

      this.formula = before + insert + after;
      this.formulaChange.emit(this.formula);
      this.showAutocomplete = false;

      setTimeout(() => {
        const newPos = replaceStart + insert.length;
        el.setSelectionRange(newPos, newPos);
        el.focus();
        this.validateFormula();
      });
    }
  }

  formatFormula(): void {
    let formatted = this.formula;
    formatted = formatted.replace(/\s+/g, ' ').trim();
    formatted = formatted.replace(/\b(CASE)\b/gi, '\n$1');
    formatted = formatted.replace(/\b(WHEN)\b/gi, '\n  $1');
    formatted = formatted.replace(/\b(THEN)\b/gi, '\n    $1');
    formatted = formatted.replace(/\b(ELSE)\b/gi, '\n  $1');
    formatted = formatted.replace(/\b(END)\b/gi, '\n$1');
    this.formula = formatted.trim();
    this.formulaChange.emit(this.formula);
    this.validateFormula();
  }
}
