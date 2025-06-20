import type { AppState, FormField, ContactFlowJSON, NotificationState } from '../types';
import {
	TEMPLATES,
	ACTION_IDENTIFIER,
	CONTACT_FLOW_VERSION,
	LOCAL_STORAGE_KEY,
	DEBOUNCE_DELAY,
	KEYBOARD_SHORTCUTS,
	ARIA_LABELS,
	NOTIFICATION_MESSAGES,
} from '../constants';

class AWSConnectGenerator {
	private state: AppState;
	private notification: NotificationState;
	private debounceTimer: number | null = null;
	private elements: {
		fieldsContainer: HTMLElement;
		output: HTMLElement;
		templateSelect: HTMLSelectElement;
		addFieldBtn: HTMLButtonElement;
		resetBtn: HTMLButtonElement;
		generateBtn: HTMLButtonElement;
		copyBtn: HTMLButtonElement;
	};

	constructor() {
		this.state = {
			fields: [{ name: '', value: '' }],
			selectedTemplate: '',
			history: [],
			historyIndex: -1,
		};
		this.notification = {
			isVisible: false,
			message: '',
		};

		this.elements = this.initializeElements();
		this.loadStateFromStorage();
		this.setupEventListeners();
		this.renderFields();
		this.announceToScreenReader('Amazon Connect JSON Generator loaded');
	}

	private initializeElements() {
		const elements = {
			fieldsContainer: this.getElement('fields'),
			output: this.getElement('output'),
			templateSelect: this.getElement('template') as HTMLSelectElement,
			addFieldBtn: this.getElement('addField') as HTMLButtonElement,
			resetBtn: this.getElement('resetFields') as HTMLButtonElement,
			generateBtn: this.getElement('generateJson') as HTMLButtonElement,
			copyBtn: this.getElement('copyJson') as HTMLButtonElement,
		};

		// Add ARIA labels
		elements.addFieldBtn.setAttribute('aria-label', ARIA_LABELS.ADD_FIELD);
		elements.resetBtn.setAttribute('aria-label', ARIA_LABELS.RESET_FIELDS);
		elements.generateBtn.setAttribute('aria-label', ARIA_LABELS.GENERATE_JSON);
		elements.copyBtn.setAttribute('aria-label', ARIA_LABELS.COPY_JSON);
		elements.templateSelect.setAttribute('aria-label', ARIA_LABELS.TEMPLATE_SELECT);

		return elements;
	}

	private getElement<T extends HTMLElement = HTMLElement>(id: string): T {
		const element = document.getElementById(id) as T;
		if (!element) {
			throw new Error(`Element with id "${id}" not found`);
		}
		return element;
	}

	private setupEventListeners(): void {
		// Button event listeners
		this.elements.addFieldBtn.addEventListener('click', () => this.addField());
		this.elements.resetBtn.addEventListener('click', () => this.resetFields());
		this.elements.generateBtn.addEventListener('click', () => this.generateJSON());
		this.elements.copyBtn.addEventListener('click', () => this.copyJSON());
		this.elements.templateSelect.addEventListener('change', () => this.loadTemplate());

		// Keyboard shortcuts
		document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

		// Auto-save state on changes
		this.elements.fieldsContainer.addEventListener('input', () => {
			this.updateStateFromDOM();
			this.saveStateToStorage();
			this.debouncedAutoGenerate();
		});
	}

	private handleKeyboardShortcuts(event: KeyboardEvent): void {
		if (event.ctrlKey || event.metaKey) {
			switch (event.code) {
				case KEYBOARD_SHORTCUTS.GENERATE:
					event.preventDefault();
					this.generateJSON();
					break;
				case KEYBOARD_SHORTCUTS.COPY:
					event.preventDefault();
					this.copyJSON();
					break;
				case KEYBOARD_SHORTCUTS.ADD_FIELD:
					event.preventDefault();
					this.addField();
					break;
				case KEYBOARD_SHORTCUTS.RESET:
					event.preventDefault();
					this.resetFields();
					break;
			}
		}
	}

	private debouncedAutoGenerate(): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = window.setTimeout(() => {
			this.generateJSON(false); // Silent generation
		}, DEBOUNCE_DELAY);
	}

	private addField(): void {
		try {
			this.saveStateToHistory();
			this.state.fields.push({ name: '', value: '' });
			this.renderFields();
			this.saveStateToStorage();
			this.showNotification(NOTIFICATION_MESSAGES.FIELD_ADDED);
			this.focusLastField();
		} catch (error) {
			console.error('Error adding field:', error);
			this.showNotification('Error adding field');
		}
	}

	private removeField(index: number): void {
		try {
			if (this.state.fields.length <= 1) return;

			this.saveStateToHistory();
			this.state.fields.splice(index, 1);
			this.renderFields();
			this.saveStateToStorage();
			this.showNotification(NOTIFICATION_MESSAGES.FIELD_REMOVED);
		} catch (error) {
			console.error('Error removing field:', error);
			this.showNotification('Error removing field');
		}
	}

	private resetFields(): void {
		try {
			this.saveStateToHistory();
			this.state.fields = [{ name: '', value: '' }];
			this.state.selectedTemplate = '';
			this.elements.templateSelect.selectedIndex = 0;
			this.elements.output.textContent = '';
			this.renderFields();
			this.saveStateToStorage();
			this.showNotification(NOTIFICATION_MESSAGES.FIELDS_RESET);
		} catch (error) {
			console.error('Error resetting fields:', error);
			this.showNotification('Error resetting fields');
		}
	}

	private loadTemplate(): void {
		try {
			const selectedValue = this.elements.templateSelect.value;
			if (!selectedValue || !TEMPLATES[selectedValue]) return;

			this.saveStateToHistory();
			const template = TEMPLATES[selectedValue];
			this.state.fields = Object.entries(template).map(([name, value]) => ({
				name,
				value,
			}));
			this.state.selectedTemplate = selectedValue;
			this.renderFields();
			this.saveStateToStorage();
			this.generateJSON(false);
			this.showNotification(NOTIFICATION_MESSAGES.TEMPLATE_LOADED);
		} catch (_error) {
			console.error('Error loading template:', _error);
			this.showNotification('Error loading template');
		}
	}

	private validateFields(): string[] {
		const errors: string[] = [];
		const seenNames = new Set<string>();

		for (const field of this.state.fields) {
			if (field.name.trim() && field.value.trim()) {
				if (seenNames.has(field.name.trim())) {
					errors.push(NOTIFICATION_MESSAGES.DUPLICATE_NAME);
				}
				seenNames.add(field.name.trim());
			} else if (field.name.trim() && !field.value.trim()) {
				errors.push(`Value required for "${field.name}"`);
			} else if (!field.name.trim() && field.value.trim()) {
				errors.push(NOTIFICATION_MESSAGES.EMPTY_NAME);
			}
		}

		return [...new Set(errors)]; // Remove duplicates
	}

	private generateJSON(showNotification = true): void {
		try {
			this.updateStateFromDOM();
			const validationErrors = this.validateFields();

			if (validationErrors.length > 0) {
				if (showNotification) {
					this.showNotification(validationErrors[0]);
				}
				return;
			}

			const attributes: Record<string, string> = {};
			for (const field of this.state.fields) {
				const key = field.name.trim();
				const value = field.value.trim();
				if (key && value) {
					attributes[key] = value;
				}
			}

			const contactFlow: ContactFlowJSON = {
				Version: CONTACT_FLOW_VERSION,
				StartAction: '',
				Metadata: {
					entryPointPosition: { x: 40, y: 40 },
					ActionMetadata: {
						[ACTION_IDENTIFIER]: {
							position: { x: 206.4, y: -306.4 },
							dynamicParams: [] as unknown[],
						},
					},
					Annotations: [] as unknown[],
				},
				Actions: [
					{
						Parameters: {
							Attributes: attributes,
							TargetContact: 'Current',
						},
						Identifier: ACTION_IDENTIFIER,
						Type: 'UpdateContactAttributes',
						Transitions: {
							NextAction: '',
							Errors: [{ NextAction: '', ErrorType: 'NoMatchingError' }],
						},
					},
				],
			};

			this.elements.output.textContent = JSON.stringify(contactFlow, null, 2);
		} catch (error) {
			console.error('Error generating JSON:', error);
			if (showNotification) {
				this.showNotification('Error generating JSON');
			}
		}
	}

	private async copyJSON(): Promise<void> {
		try {
			const json = this.elements.output.textContent?.trim();
			if (!json) {
				this.showNotification('No JSON to copy');
				return;
			}

			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(json);
				this.showNotification(NOTIFICATION_MESSAGES.COPIED);
			} else {
				// Fallback for older browsers
				this.fallbackCopyToClipboard(json);
			}
		} catch (error) {
			console.error('Error copying to clipboard:', error);
			this.showNotification(NOTIFICATION_MESSAGES.COPY_FAILED);
		}
	}

	private fallbackCopyToClipboard(text: string): void {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		textArea.style.top = '-999999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			navigator.clipboard.writeText(text); // Fallback to clipboard API
			this.showNotification(NOTIFICATION_MESSAGES.COPIED);
		} catch {
			this.showNotification(NOTIFICATION_MESSAGES.COPY_FAILED);
		} finally {
			document.body.removeChild(textArea);
		}
	}

	private renderFields(): void {
		this.elements.fieldsContainer.innerHTML = '';

		this.state.fields.forEach((field, index) => {
			const fieldElement = this.createFieldElement(field, index);
			this.elements.fieldsContainer.appendChild(fieldElement);
		});

		this.updateRemoveButtonVisibility();
	}

	private createFieldElement(field: FormField, index: number): HTMLElement {
		const div = document.createElement('div');
		div.className = 'flex gap-2 items-center';
		div.setAttribute('role', 'group');
		div.setAttribute('aria-label', `Attribute field ${index + 1}`);

		const nameInput = document.createElement('input');
		nameInput.type = 'text';
		nameInput.value = field.name;
		nameInput.placeholder = 'Attribute Name';
		nameInput.className =
			'name flex-1 min-w-[200px] px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
		nameInput.setAttribute('aria-label', `${ARIA_LABELS.ATTRIBUTE_NAME} ${index + 1}`);

		const valueInput = document.createElement('input');
		valueInput.type = 'text';
		valueInput.value = field.value;
		valueInput.placeholder = 'Attribute Value';
		valueInput.className =
			'value flex-1 min-w-[200px] px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
		valueInput.setAttribute('aria-label', `${ARIA_LABELS.ATTRIBUTE_VALUE} ${index + 1}`);

		const removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.textContent = '✕';
		removeBtn.className =
			'remove px-3 py-2 text-red-600 hover:text-red-800 shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 rounded';
		removeBtn.setAttribute('aria-label', `${ARIA_LABELS.REMOVE_FIELD} ${index + 1}`);
		removeBtn.addEventListener('click', () => this.removeField(index));

		// Keyboard navigation
		nameInput.addEventListener('keydown', (e) => {
			if (e.key === 'Tab' && !e.shiftKey) {
				e.preventDefault();
				valueInput.focus();
			}
		});

		valueInput.addEventListener('keydown', (e) => {
			if (e.key === 'Tab' && e.shiftKey) {
				e.preventDefault();
				nameInput.focus();
			} else if (e.key === 'Enter') {
				e.preventDefault();
				this.addField();
			}
		});

		div.appendChild(nameInput);
		div.appendChild(valueInput);
		div.appendChild(removeBtn);

		return div;
	}

	private updateRemoveButtonVisibility(): void {
		const removeButtons =
			this.elements.fieldsContainer.querySelectorAll<HTMLButtonElement>('.remove');
		removeButtons.forEach((btn) => {
			btn.style.display = this.state.fields.length === 1 ? 'none' : 'block';
		});
	}

	private updateStateFromDOM(): void {
		const nameInputs = this.elements.fieldsContainer.querySelectorAll<HTMLInputElement>('.name');
		const valueInputs = this.elements.fieldsContainer.querySelectorAll<HTMLInputElement>('.value');

		this.state.fields = Array.from(nameInputs).map((nameInput, index) => ({
			name: nameInput.value,
			value: valueInputs[index]?.value || '',
		}));
	}

	private saveStateToHistory(): void {
		if (this.state.historyIndex < this.state.history.length - 1) {
			this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
		}
		this.state.history.push([...this.state.fields]);
		this.state.historyIndex = this.state.history.length - 1;

		// Limit history size
		if (this.state.history.length > 50) {
			this.state.history.shift();
			this.state.historyIndex--;
		}
	}

	private undo(): void {
		if (this.state.historyIndex > 0) {
			this.state.historyIndex--;
			this.state.fields = [...this.state.history[this.state.historyIndex]];
			this.renderFields();
			this.saveStateToStorage();
			this.showNotification('Undid last action');
		}
	}

	private redo(): void {
		if (this.state.historyIndex < this.state.history.length - 1) {
			this.state.historyIndex++;
			this.state.fields = [...this.state.history[this.state.historyIndex]];
			this.renderFields();
			this.saveStateToStorage();
			this.showNotification('Redid action');
		}
	}

	private saveStateToStorage(): void {
		try {
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state));
		} catch (error) {
			console.warn('Failed to save state to localStorage:', error);
		}
	}

	private loadStateFromStorage(): void {
		try {
			const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (saved) {
				const parsedState = JSON.parse(saved);
				this.state = { ...this.state, ...parsedState };
				if (this.state.selectedTemplate) {
					this.elements.templateSelect.value = this.state.selectedTemplate;
				}
			}
		} catch (error) {
			console.warn('Failed to load state from localStorage:', error);
		}
	}

	private focusLastField(): void {
		const nameInputs = this.elements.fieldsContainer.querySelectorAll<HTMLInputElement>('.name');
		const lastInput = nameInputs[nameInputs.length - 1];
		if (lastInput) {
			lastInput.focus();
		}
	}

	private showNotification(message: string): void {
		// This integrates with Alpine.js notification system
		const event = new CustomEvent('show-notification', {
			detail: { message },
		});
		document.dispatchEvent(event);
	}

	private announceToScreenReader(message: string): void {
		const announcement = document.createElement('div');
		announcement.setAttribute('aria-live', 'polite');
		announcement.setAttribute('aria-atomic', 'true');
		announcement.className = 'sr-only';
		announcement.textContent = message;
		document.body.appendChild(announcement);

		setTimeout(() => {
			document.body.removeChild(announcement);
		}, 1000);
	}

	// Public methods for undo/redo functionality
	public handleUndo(): void {
		this.undo();
	}

	public handleRedo(): void {
		this.redo();
	}
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	const app = new AWSConnectGenerator();

	// Make undo/redo available globally for keyboard shortcuts
	document.addEventListener('keydown', (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
			e.preventDefault();
			app.handleUndo();
		} else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
			e.preventDefault();
			app.handleRedo();
		}
	});

	// Listen for custom notification events
	document.addEventListener('show-notification', (e) => {
		const event = e as CustomEvent<{ message: string }>;
		// Trigger Alpine.js notification
		const alpineElement = document.querySelector('[x-data]') as Element & {
			_x_dataStack?: Array<{ show?: (msg: string) => void }>;
		};
		if (alpineElement && alpineElement._x_dataStack?.[0]?.show) {
			alpineElement._x_dataStack[0].show(event.detail.message);
		}
	});
});
