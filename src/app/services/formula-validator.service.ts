import { Injectable } from '@angular/core';

export interface ValidationError {
  message: string;
  position: number;
  length: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

interface Token {
  type: TokenType;
  value: string;
  position: number;
}

type TokenType =
  | 'NUMBER' | 'STRING' | 'IDENTIFIER' | 'BRACKET_IDENTIFIER'
  | 'LPAREN' | 'RPAREN' | 'COMMA' | 'DOT'
  | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH'
  | 'EQ' | 'NEQ' | 'LT' | 'GT' | 'LTE' | 'GTE'
  | 'KEYWORD' | 'EOF' | 'UNKNOWN';

const KEYWORDS = new Set([
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'IS', 'NULL', 'AS',
  'SUM', 'COUNT', 'AVG', 'MIN', 'MAX',
  'CAST', 'CONVERT', 'COALESCE', 'NULLIF', 'ISNULL',
  'DISTINCT', 'CONCAT', 'DATEDIFF',
  'NUMERIC', 'DECIMAL', 'INT', 'FLOAT', 'BIGINT',
  'VARCHAR', 'NVARCHAR', 'CHAR',
  'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
  'Y', 'M', 'D'
]);

const AGGREGATE_FUNCTIONS = new Set(['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']);
const SCALAR_FUNCTIONS = new Set(['CAST', 'CONVERT', 'COALESCE', 'NULLIF', 'ISNULL', 'CONCAT', 'DATEDIFF']);

@Injectable({ providedIn: 'root' })
export class FormulaValidatorService {
  private tokens: Token[] = [];
  private pos = 0;
  private errors: ValidationError[] = [];
  private warnings: string[] = [];
  private availableColumns: Set<string> = new Set();

  validate(formula: string, columns?: string[]): ValidationResult {
    this.errors = [];
    this.warnings = [];
    this.pos = 0;
    this.availableColumns = new Set((columns || []).map(c => c.toUpperCase()));

    if (!formula || formula.trim().length === 0) {
      return { valid: false, errors: [{ message: 'Formula cannot be empty', position: 0, length: 0 }], warnings: [] };
    }

    try {
      this.tokens = this.tokenize(formula);
      this.parseExpression();

      if (!this.isAtEnd()) {
        const tok = this.peek();
        this.addError(`Unexpected token '${tok.value}'`, tok.position, tok.value.length);
      }
    } catch (e: any) {
      if (!this.errors.length) {
        this.addError(e.message || 'Parse error', 0, formula.length);
      }
    }

    // Check for unprotected division by zero
    this.checkDivisionByZero(formula);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  // ---- Tokenizer ----

  private tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < input.length) {
      // Skip whitespace
      if (/\s/.test(input[i])) { i++; continue; }

      // Bracketed identifier [ColumnName]
      if (input[i] === '[') {
        const start = i;
        i++;
        while (i < input.length && input[i] !== ']') i++;
        if (i >= input.length) {
          this.addError('Unclosed bracket identifier', start, i - start);
          tokens.push({ type: 'BRACKET_IDENTIFIER', value: input.slice(start + 1), position: start });
        } else {
          tokens.push({ type: 'BRACKET_IDENTIFIER', value: input.slice(start + 1, i), position: start });
          i++; // skip ]
        }
        continue;
      }

      // String literal
      if (input[i] === "'") {
        const start = i;
        i++;
        while (i < input.length && input[i] !== "'") i++;
        if (i >= input.length) {
          this.addError('Unclosed string literal', start, i - start);
        }
        tokens.push({ type: 'STRING', value: input.slice(start, i + 1), position: start });
        i++;
        continue;
      }

      // Number
      if (/[0-9]/.test(input[i]) || (input[i] === '.' && i + 1 < input.length && /[0-9]/.test(input[i + 1]))) {
        const start = i;
        while (i < input.length && /[0-9]/.test(input[i])) i++;
        if (i < input.length && input[i] === '.') {
          i++;
          while (i < input.length && /[0-9]/.test(input[i])) i++;
        }
        tokens.push({ type: 'NUMBER', value: input.slice(start, i), position: start });
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(input[i])) {
        const start = i;
        while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) i++;
        const word = input.slice(start, i);
        const upper = word.toUpperCase();
        if (KEYWORDS.has(upper)) {
          tokens.push({ type: 'KEYWORD', value: upper, position: start });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: word, position: start });
        }
        continue;
      }

      // Operators and punctuation
      const start = i;
      switch (input[i]) {
        case '(': tokens.push({ type: 'LPAREN', value: '(', position: start }); i++; break;
        case ')': tokens.push({ type: 'RPAREN', value: ')', position: start }); i++; break;
        case ',': tokens.push({ type: 'COMMA', value: ',', position: start }); i++; break;
        case '.': tokens.push({ type: 'DOT', value: '.', position: start }); i++; break;
        case '+': tokens.push({ type: 'PLUS', value: '+', position: start }); i++; break;
        case '-': tokens.push({ type: 'MINUS', value: '-', position: start }); i++; break;
        case '*': tokens.push({ type: 'STAR', value: '*', position: start }); i++; break;
        case '/': tokens.push({ type: 'SLASH', value: '/', position: start }); i++; break;
        case '=': tokens.push({ type: 'EQ', value: '=', position: start }); i++; break;
        case '!':
          if (i + 1 < input.length && input[i + 1] === '=') {
            tokens.push({ type: 'NEQ', value: '!=', position: start }); i += 2;
          } else {
            tokens.push({ type: 'UNKNOWN', value: '!', position: start }); i++;
          }
          break;
        case '<':
          if (i + 1 < input.length && input[i + 1] === '=') {
            tokens.push({ type: 'LTE', value: '<=', position: start }); i += 2;
          } else if (i + 1 < input.length && input[i + 1] === '>') {
            tokens.push({ type: 'NEQ', value: '<>', position: start }); i += 2;
          } else {
            tokens.push({ type: 'LT', value: '<', position: start }); i++;
          }
          break;
        case '>':
          if (i + 1 < input.length && input[i + 1] === '=') {
            tokens.push({ type: 'GTE', value: '>=', position: start }); i += 2;
          } else {
            tokens.push({ type: 'GT', value: '>', position: start }); i++;
          }
          break;
        default:
          this.addError(`Unexpected character '${input[i]}'`, start, 1);
          i++;
      }
    }

    tokens.push({ type: 'EOF', value: '', position: input.length });
    return tokens;
  }

  // ---- Parser helpers ----

  private peek(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', position: 0 };
  }

  private advance(): Token {
    const tok = this.tokens[this.pos];
    this.pos++;
    return tok;
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private expect(type: TokenType, value?: string): Token {
    const tok = this.peek();
    if (tok.type !== type || (value !== undefined && tok.value.toUpperCase() !== value.toUpperCase())) {
      const expected = value ? `'${value}'` : type;
      this.addError(`Expected ${expected} but found '${tok.value || 'end of formula'}'`, tok.position, tok.value.length || 1);
      return tok;
    }
    return this.advance();
  }

  private match(type: TokenType, value?: string): boolean {
    const tok = this.peek();
    if (tok.type === type && (value === undefined || tok.value.toUpperCase() === value.toUpperCase())) {
      this.advance();
      return true;
    }
    return false;
  }

  private matchKeyword(kw: string): boolean {
    return this.match('KEYWORD', kw);
  }

  private isKeyword(kw: string): boolean {
    const tok = this.peek();
    return tok.type === 'KEYWORD' && tok.value.toUpperCase() === kw;
  }

  private addError(message: string, position: number, length: number) {
    this.errors.push({ message, position, length });
  }

  // ---- Recursive descent parser ----

  private parseExpression(): void {
    this.parseOr();
  }

  private parseOr(): void {
    this.parseAnd();
    while (this.isKeyword('OR')) {
      this.advance();
      this.parseAnd();
    }
  }

  private parseAnd(): void {
    this.parseNot();
    while (this.isKeyword('AND')) {
      this.advance();
      this.parseNot();
    }
  }

  private parseNot(): void {
    if (this.isKeyword('NOT')) {
      this.advance();
    }
    this.parseComparison();
  }

  private parseComparison(): void {
    this.parseAddSub();

    const tok = this.peek();

    // IS [NOT] NULL
    if (this.isKeyword('IS')) {
      this.advance();
      if (this.isKeyword('NOT')) this.advance();
      this.expect('KEYWORD', 'NULL');
      return;
    }

    // IN (list)
    if (this.isKeyword('IN') || this.isKeyword('NOT')) {
      if (this.isKeyword('NOT')) {
        this.advance();
        if (!this.isKeyword('IN')) {
          this.addError("Expected 'IN' after 'NOT'", this.peek().position, this.peek().value.length);
          return;
        }
      }
      if (this.isKeyword('IN')) {
        this.advance();
        this.expect('LPAREN');
        this.parseExpressionList();
        this.expect('RPAREN');
        return;
      }
    }

    // LIKE
    if (this.isKeyword('LIKE')) {
      this.advance();
      this.parseAddSub();
      return;
    }

    // BETWEEN x AND y
    if (this.isKeyword('BETWEEN')) {
      this.advance();
      this.parseAddSub();
      this.expect('KEYWORD', 'AND');
      this.parseAddSub();
      return;
    }

    // Standard comparison operators
    if (['EQ', 'NEQ', 'LT', 'GT', 'LTE', 'GTE'].includes(tok.type)) {
      this.advance();
      this.parseAddSub();
    }
  }

  private parseAddSub(): void {
    this.parseMulDiv();
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      this.advance();
      this.parseMulDiv();
    }
  }

  private parseMulDiv(): void {
    this.parseUnary();
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      this.advance();
      this.parseUnary();
    }
  }

  private parseUnary(): void {
    if (this.peek().type === 'MINUS' || this.peek().type === 'PLUS') {
      this.advance();
    }
    this.parsePrimary();
  }

  private parsePrimary(): void {
    const tok = this.peek();

    // Number literal
    if (tok.type === 'NUMBER') {
      this.advance();
      return;
    }

    // String literal
    if (tok.type === 'STRING') {
      this.advance();
      return;
    }

    // NULL keyword
    if (this.isKeyword('NULL')) {
      this.advance();
      return;
    }

    // CASE expression
    if (this.isKeyword('CASE')) {
      this.parseCaseExpression();
      return;
    }

    // CAST(expr AS type)
    if (this.isKeyword('CAST')) {
      this.parseCast();
      return;
    }

    // CONVERT(type, expr)
    if (this.isKeyword('CONVERT')) {
      this.parseConvert();
      return;
    }

    // Aggregate / scalar functions
    if (tok.type === 'KEYWORD' && (AGGREGATE_FUNCTIONS.has(tok.value) || SCALAR_FUNCTIONS.has(tok.value))) {
      this.parseFunctionCall();
      return;
    }

    // Bracketed identifier
    if (tok.type === 'BRACKET_IDENTIFIER') {
      this.advance();
      this.validateColumn(tok.value, tok.position);
      return;
    }

    // Plain identifier (column name or unrecognized keyword used as identifier)
    if (tok.type === 'IDENTIFIER') {
      this.advance();
      // Check if it's a function call (identifier followed by paren)
      if (this.peek().type === 'LPAREN') {
        this.warnings.push(`Unknown function '${tok.value}' at position ${tok.position}. Did you mean one of: SUM, COUNT, AVG, MIN, MAX, CAST, COALESCE, NULLIF, ISNULL?`);
        this.advance(); // (
        if (this.peek().type !== 'RPAREN') {
          this.parseExpressionList();
        }
        this.expect('RPAREN');
        return;
      }
      this.validateColumn(tok.value, tok.position);
      return;
    }

    // Parenthesized expression
    if (tok.type === 'LPAREN') {
      this.advance();
      this.parseExpression();
      this.expect('RPAREN');
      return;
    }

    // If we hit a keyword that shouldn't be here, give a helpful error
    if (tok.type === 'KEYWORD') {
      // Allow data type keywords used as identifiers in some contexts
      this.advance();
      return;
    }

    if (tok.type === 'EOF') {
      this.addError('Unexpected end of formula', tok.position, 1);
    } else {
      this.addError(`Unexpected token '${tok.value}'`, tok.position, tok.value.length);
      this.advance(); // skip to prevent infinite loop
    }
  }

  private parseCaseExpression(): void {
    this.expect('KEYWORD', 'CASE');
    let hasWhen = false;

    while (this.isKeyword('WHEN')) {
      hasWhen = true;
      this.advance();
      this.parseExpression(); // condition
      this.expect('KEYWORD', 'THEN');
      this.parseExpression(); // result
    }

    if (!hasWhen) {
      this.addError("CASE requires at least one WHEN clause", this.peek().position, 1);
    }

    if (this.isKeyword('ELSE')) {
      this.advance();
      this.parseExpression();
    }

    this.expect('KEYWORD', 'END');
  }

  private parseCast(): void {
    this.expect('KEYWORD', 'CAST');
    this.expect('LPAREN');
    this.parseExpression();
    this.expect('KEYWORD', 'AS');
    this.parseDataType();
    this.expect('RPAREN');
  }

  private parseConvert(): void {
    this.expect('KEYWORD', 'CONVERT');
    this.expect('LPAREN');
    this.parseDataType();
    this.expect('COMMA');
    this.parseExpression();
    this.expect('RPAREN');
  }

  private parseDataType(): void {
    const tok = this.peek();
    if (tok.type === 'KEYWORD' || tok.type === 'IDENTIFIER') {
      this.advance();
      // Optional precision (9,3)
      if (this.peek().type === 'LPAREN') {
        this.advance();
        this.expect('NUMBER');
        if (this.match('COMMA')) {
          this.expect('NUMBER');
        }
        this.expect('RPAREN');
      }
    } else {
      this.addError('Expected data type', tok.position, tok.value.length || 1);
    }
  }

  private parseFunctionCall(): void {
    const funcTok = this.advance();
    const funcName = funcTok.value.toUpperCase();
    this.expect('LPAREN');

    if (funcName === 'COUNT') {
      // COUNT(*) or COUNT(DISTINCT expr) or COUNT(expr)
      if (this.peek().type === 'STAR') {
        this.advance();
      } else {
        if (this.isKeyword('DISTINCT')) {
          this.advance();
        }
        this.parseExpression();
      }
    } else if (AGGREGATE_FUNCTIONS.has(funcName)) {
      // SUM, AVG, MIN, MAX
      if (this.isKeyword('DISTINCT')) {
        this.advance();
      }
      this.parseExpression();
    } else if (funcName === 'COALESCE' || funcName === 'CONCAT') {
      this.parseExpressionList();
    } else if (funcName === 'NULLIF' || funcName === 'ISNULL') {
      this.parseExpression();
      this.expect('COMMA');
      this.parseExpression();
    } else if (funcName === 'DATEDIFF') {
      // DATEDIFF(interval, start, end)
      // interval can be a keyword like M, MONTH, Y, etc.
      const intervalTok = this.peek();
      if (intervalTok.type === 'KEYWORD' || intervalTok.type === 'IDENTIFIER') {
        this.advance();
      } else {
        this.addError('Expected date interval (e.g. M, MONTH, DAY)', intervalTok.position, intervalTok.value.length || 1);
      }
      this.expect('COMMA');
      this.parseExpression();
      this.expect('COMMA');
      this.parseExpression();
    } else {
      // Generic function
      if (this.peek().type !== 'RPAREN') {
        this.parseExpressionList();
      }
    }

    this.expect('RPAREN');
  }

  private parseExpressionList(): void {
    this.parseExpression();
    while (this.match('COMMA')) {
      this.parseExpression();
    }
  }

  private validateColumn(name: string, position: number): void {
    if (this.availableColumns.size > 0 && !this.availableColumns.has(name.toUpperCase())) {
      this.warnings.push(`Column '${name}' not found in the selected view (position ${position}). Check spelling or select a different view.`);
    }
  }

  // ---- Division by zero analysis ----

  private checkDivisionByZero(formula: string): void {
    const upper = formula.toUpperCase();

    for (let i = 0; i < this.tokens.length; i++) {
      const tok = this.tokens[i];
      if (tok.type !== 'SLASH') continue;

      const slashPos = tok.position;

      // Extract the divisor expression (everything after the slash until end of that sub-expression)
      const divisorExpr = this.extractDivisorText(i + 1);
      const divisorUpper = divisorExpr.toUpperCase().trim();

      // Check if the divisor is wrapped in NULLIF(..., 0)
      if (this.isDivisorNullifProtected(divisorUpper)) continue;

      // Check if the entire division is inside a CASE WHEN that guards against zero
      if (this.isDivisionInsideCaseGuard(slashPos, upper)) continue;

      // Check if the divisor is a non-zero literal constant
      if (this.isNonZeroConstant(divisorUpper)) continue;

      // Check if the entire expression is wrapped in COALESCE/ISNULL (handles NULL from NULLIF, but not div-by-zero itself)
      // This is still unprotected — COALESCE doesn't prevent the divide

      this.addError(
        `Possible division by zero at position ${slashPos}. Wrap the divisor in NULLIF(..., 0) or add a CASE WHEN guard to check for zero before dividing.`,
        slashPos,
        1
      );
    }
  }

  private extractDivisorText(startTokenIndex: number): string {
    // Walk tokens to extract the divisor sub-expression text.
    // The divisor is the next primary expression after the slash.
    // We need to handle parenthesised expressions and function calls.
    let depth = 0;
    let started = false;
    let startPos = -1;
    let endPos = -1;

    for (let i = startTokenIndex; i < this.tokens.length; i++) {
      const t = this.tokens[i];
      if (t.type === 'EOF') break;

      if (!started) {
        startPos = t.position;
        started = true;
      }

      if (t.type === 'LPAREN') {
        depth++;
      } else if (t.type === 'RPAREN') {
        if (depth === 0) {
          // This paren closes something outer — divisor ends before it
          endPos = t.position;
          break;
        }
        depth--;
        if (depth === 0) {
          // Closing paren of the divisor expression (e.g. SUM(...) or NULLIF(...))
          endPos = t.position + 1;
          break;
        }
      } else if (depth === 0) {
        // At top level, stop at operators that would end the divisor
        if (['PLUS', 'MINUS', 'STAR', 'SLASH', 'COMMA',
             'EQ', 'NEQ', 'LT', 'GT', 'LTE', 'GTE'].includes(t.type)) {
          endPos = t.position;
          break;
        }
        if (t.type === 'KEYWORD' && ['THEN', 'ELSE', 'END', 'WHEN', 'AND', 'OR', 'AS'].includes(t.value)) {
          endPos = t.position;
          break;
        }
      }

      endPos = t.position + t.value.length;
    }

    if (startPos === -1 || endPos === -1) return '';

    // Reconstruct from original token values
    const parts: string[] = [];
    for (let i = startTokenIndex; i < this.tokens.length; i++) {
      const t = this.tokens[i];
      if (t.position >= endPos || t.type === 'EOF') break;
      parts.push(t.value);
    }
    return parts.join(' ');
  }

  private isDivisorNullifProtected(divisorUpper: string): boolean {
    // Check if divisor starts with NULLIF(
    return /^NULLIF\s*\(/.test(divisorUpper);
  }

  private isDivisionInsideCaseGuard(slashPos: number, formulaUpper: string): boolean {
    // Look backwards from the slash position for a CASE WHEN pattern that checks = 0
    // Strategy: find the innermost CASE..END block containing this slash,
    // then check if any WHEN clause tests for = 0 on a similar expression.

    // Find all CASE positions before the slash
    const casePositions: number[] = [];
    let searchFrom = 0;
    while (true) {
      const idx = formulaUpper.indexOf('CASE', searchFrom);
      if (idx === -1 || idx >= slashPos) break;
      // Make sure it's a word boundary (not part of another word)
      const before = idx > 0 ? formulaUpper[idx - 1] : ' ';
      const after = idx + 4 < formulaUpper.length ? formulaUpper[idx + 4] : ' ';
      if (/\W/.test(before) && /\W/.test(after)) {
        casePositions.push(idx);
      }
      searchFrom = idx + 4;
    }

    // For each CASE (innermost first), check if it has a zero-guard WHEN
    for (let c = casePositions.length - 1; c >= 0; c--) {
      const caseStart = casePositions[c];
      // Find the matching END
      let depth = 1;
      let endPos = caseStart + 4;
      while (endPos < formulaUpper.length && depth > 0) {
        const caseMatch = formulaUpper.indexOf('CASE', endPos);
        const endMatch = formulaUpper.indexOf('END', endPos);

        if (endMatch === -1) break;

        if (caseMatch !== -1 && caseMatch < endMatch) {
          // Check word boundary
          const cb = caseMatch > 0 ? formulaUpper[caseMatch - 1] : ' ';
          const ca = caseMatch + 4 < formulaUpper.length ? formulaUpper[caseMatch + 4] : ' ';
          if (/\W/.test(cb) && /\W/.test(ca)) {
            depth++;
          }
          endPos = caseMatch + 4;
        } else {
          const eb = endMatch > 0 ? formulaUpper[endMatch - 1] : ' ';
          const ea = endMatch + 3 < formulaUpper.length ? formulaUpper[endMatch + 3] : ' ';
          if (/\W/.test(eb) && /\W/.test(ea)) {
            depth--;
          }
          endPos = endMatch + 3;
        }
      }

      if (depth !== 0) continue;

      // Check if the slash is inside this CASE..END
      if (slashPos < caseStart || slashPos >= endPos) continue;

      // Extract the CASE block content
      const caseBlock = formulaUpper.slice(caseStart, endPos);

      // Check for zero-guard patterns: = 0 THEN 0, != 0, <> 0
      if (/WHEN\s+.*(?:=\s*0(?:\.0+)?|!=\s*0(?:\.0+)?|<>\s*0(?:\.0+)?)\s+THEN/s.test(caseBlock)) {
        return true;
      }

      break; // Only check innermost CASE
    }

    return false;
  }

  private isNonZeroConstant(divisorUpper: string): boolean {
    const num = parseFloat(divisorUpper);
    return !isNaN(num) && num !== 0;
  }
}
