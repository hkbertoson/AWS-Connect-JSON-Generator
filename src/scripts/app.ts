import type {
	AppState,
	FormField,
	ContactFlowJSON,
	NotificationState,
	Block,
	MultiBlockTemplate,
	ContactFlowAction,
} from '../types';
import {
	TEMPLATES,
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
		blocksContainer: HTMLElement;
		output: HTMLElement;
		templateSelect: HTMLSelectElement;
		addFieldBtn: HTMLButtonElement;
		addBlockBtn: HTMLButtonElement;
		resetBtn: HTMLButtonElement;
		generateBtn: HTMLButtonElement;
		copyBtn: HTMLButtonElement;
	};

	constructor() {
		this.state = {
			blocks: [{ id: this.generateId(), fields: [{ name: '', value: '' }] }],
			selectedTemplate: '',
			history: [],
			historyIndex: -1,
		};
		this.notification = {
			isVisible: false,
			message: '',
		};

		this.elements = this.initializeElements();
		this.populateTemplateDropdown();
		this.loadStateFromStorage();
		this.setupEventListeners();
		this.renderBlocks();
		this.announceToScreenReader('Amazon Connect JSON Generator loaded');
	}

	private initializeElements() {
		const elements = {
			blocksContainer: this.getElement('blocks'),
			output: this.getElement('output'),
			templateSelect: this.getElement('template') as HTMLSelectElement,
			addFieldBtn: this.getElement('addField') as HTMLButtonElement,
			addBlockBtn: this.getElement('addBlock') as HTMLButtonElement,
			resetBtn: this.getElement('resetFields') as HTMLButtonElement,
			generateBtn: this.getElement('generateJson') as HTMLButtonElement,
			copyBtn: this.getElement('copyJson') as HTMLButtonElement,
		};

		// Add ARIA labels
		elements.addFieldBtn.setAttribute('aria-label', ARIA_LABELS.ADD_FIELD);
		elements.addBlockBtn.setAttribute('aria-label', 'Add new block (Ctrl+B)');
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
		this.elements.addBlockBtn.addEventListener('click', () => this.addBlock());
		this.elements.resetBtn.addEventListener('click', () => this.resetFields());
		this.elements.generateBtn.addEventListener('click', () => this.generateJSON());
		this.elements.copyBtn.addEventListener('click', () => this.copyJSON());
		this.elements.templateSelect.addEventListener('change', () => this.loadTemplate());

		// Keyboard shortcuts
		document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));

		// Auto-save state on changes
		this.elements.blocksContainer.addEventListener('input', () => {
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
				case 'KeyB':
					event.preventDefault();
					this.addBlock();
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
			if (this.state.blocks.length === 0) {
				this.state.blocks.push({ id: this.generateId(), fields: [{ name: '', value: '' }] });
			} else {
				this.state.blocks[this.state.blocks.length - 1].fields.push({ name: '', value: '' });
			}
			this.renderBlocks();
			this.saveStateToStorage();
			this.showNotification(NOTIFICATION_MESSAGES.FIELD_ADDED);
			this.focusLastField();
		} catch (error) {
			console.error('Error adding field:', error);
			this.showNotification('Error adding field');
		}
	}

	private addBlock(): void {
		try {
			this.saveStateToHistory();
			this.state.blocks.push({ id: this.generateId(), fields: [{ name: '', value: '' }] });
			this.renderBlocks();
			this.saveStateToStorage();
			this.showNotification('Block added');
			this.focusLastField();
		} catch (error) {
			console.error('Error adding block:', error);
			this.showNotification('Error adding block');
		}
	}

	private generateId(): string {
		return 'block_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	private generateActionId(): string {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	private populateTemplateDropdown(): void {
		// Clear existing options except the first one
		const select = this.elements.templateSelect;
		select.innerHTML = '<option value="">-- Select a Template --</option>';

		// Group templates by category
		const categories: Record<string, Array<{ key: string; name: string; description: string }>> = {};
		
		Object.entries(TEMPLATES).forEach(([key, templateDef]) => {
			const category = templateDef.metadata.category || 'Other';
			if (!categories[category]) {
				categories[category] = [];
			}
			categories[category].push({
				key,
				name: templateDef.metadata.name,
				description: templateDef.metadata.description,
			});
		});

		// Sort categories and add them to the dropdown
		const sortedCategories = Object.keys(categories).sort();
		
		sortedCategories.forEach(category => {
			const optgroup = document.createElement('optgroup');
			optgroup.label = category;
			
			categories[category].forEach(template => {
				const option = document.createElement('option');
				option.value = template.key;
				option.textContent = template.name;
				option.title = template.description;
				optgroup.appendChild(option);
			});
			
			select.appendChild(optgroup);
		});
	}

	private removeField(blockIndex: number, fieldIndex: number): void {
		try {
			const block = this.state.blocks[blockIndex];
			if (block.fields.length <= 1) return;

			this.saveStateToHistory();
			block.fields.splice(fieldIndex, 1);
			this.renderBlocks();
			this.saveStateToStorage();
			this.showNotification(NOTIFICATION_MESSAGES.FIELD_REMOVED);
		} catch (error) {
			console.error('Error removing field:', error);
			this.showNotification('Error removing field');
		}
	}

	private removeBlock(blockIndex: number): void {
		try {
			if (this.state.blocks.length <= 1) return;

			this.saveStateToHistory();
			this.state.blocks.splice(blockIndex, 1);
			this.renderBlocks();
			this.saveStateToStorage();
			this.showNotification('Block removed');
		} catch (error) {
			console.error('Error removing block:', error);
			this.showNotification('Error removing block');
		}
	}

	private resetFields(): void {
		try {
			this.saveStateToHistory();
			this.state.blocks = [{ id: this.generateId(), fields: [{ name: '', value: '' }] }];
			this.state.selectedTemplate = '';
			this.elements.templateSelect.selectedIndex = 0;
			this.elements.output.textContent = '';
			this.renderBlocks();
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
			const templateDef = TEMPLATES[selectedValue];
			const template = templateDef.template;

			// Check if this is a multi-block template
			if (this.isMultiBlockTemplate(template)) {
				this.state.blocks = template.blocks.map((blockTemplate) => ({
					id: this.generateId(),
					name: blockTemplate.name,
					fields: Object.entries(blockTemplate.fields).map(([name, value]) => ({
						name,
						value,
					})),
				}));
			} else {
				// Single block template (existing behavior)
				const fields = Object.entries(template).map(([name, value]) => ({
					name,
					value,
				}));
				this.state.blocks = [{ id: this.generateId(), fields }];
			}

			this.state.selectedTemplate = selectedValue;
			this.renderBlocks();
			this.saveStateToStorage();
			this.generateJSON(false);
			this.showNotification(NOTIFICATION_MESSAGES.TEMPLATE_LOADED);
		} catch (_error) {
			console.error('Error loading template:', _error);
			this.showNotification('Error loading template');
		}
	}

	private isMultiBlockTemplate(template: unknown): template is MultiBlockTemplate {
		return (
			typeof template === 'object' &&
			template !== null &&
			Array.isArray((template as MultiBlockTemplate).blocks)
		);
	}

	private validateFields(): string[] {
		const errors: string[] = [];
		const seenNames = new Set<string>();

		for (const block of this.state.blocks) {
			for (const field of block.fields) {
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

			const actions: ContactFlowAction[] = [];
			const actionMetadata: Record<
				string,
				{ position: { x: number; y: number }; dynamicParams: unknown[] }
			> = {};

			// Filter out blocks that have no valid fields
			const validBlocks = this.state.blocks.filter((block) =>
				block.fields.some((field) => field.name.trim() && field.value.trim())
			);

			if (validBlocks.length === 0) {
				// If no valid blocks, create a single empty action
				const identifier = this.generateActionId();
				actions.push({
					Parameters: {
						Attributes: {},
						TargetContact: 'Current',
					},
					Identifier: identifier,
					Type: 'UpdateContactAttributes',
					Transitions: {
						NextAction: '',
						Errors: [{ NextAction: '', ErrorType: 'NoMatchingError' }],
					},
				});
				actionMetadata[identifier] = {
					position: { x: 206.4, y: -306.4 },
					dynamicParams: [] as unknown[],
				};
			} else {
				// Generate identifiers for all blocks first
				const identifiers = validBlocks.map(() => this.generateActionId());

				// Create separate actions for each block
				validBlocks.forEach((block, index) => {
					const attributes: Record<string, string> = {};
					for (const field of block.fields) {
						const key = field.name.trim();
						const value = field.value.trim();
						if (key && value) {
							attributes[key] = value;
						}
					}

					const identifier = identifiers[index];
					const nextIdentifier = index < validBlocks.length - 1 ? identifiers[index + 1] : '';

					actions.push({
						Parameters: {
							Attributes: attributes,
							TargetContact: 'Current',
						},
						Identifier: identifier,
						Type: 'UpdateContactAttributes',
						Transitions: {
							NextAction: nextIdentifier,
							Errors: [{ NextAction: nextIdentifier, ErrorType: 'NoMatchingError' }],
						},
					});

					actionMetadata[identifier] = {
						position: { x: 206.4 + index * 250, y: -306.4 + index * 100 },
						dynamicParams: [] as unknown[],
					};
				});
			}

			const contactFlow: ContactFlowJSON = {
				Version: CONTACT_FLOW_VERSION,
				StartAction: actions.length > 0 ? actions[0].Identifier : '',
				Metadata: {
					entryPointPosition: { x: 40, y: 40 },
					ActionMetadata: actionMetadata,
					Annotations: [] as unknown[],
				},
				Actions: actions,
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

	private renderBlocks(): void {
		this.elements.blocksContainer.innerHTML = '';

		this.state.blocks.forEach((block, blockIndex) => {
			const blockElement = this.createBlockElement(block, blockIndex);
			this.elements.blocksContainer.appendChild(blockElement);
		});

		this.updateRemoveButtonVisibility();
	}

	private createBlockElement(block: Block, blockIndex: number): HTMLElement {
		const blockDiv = document.createElement('div');
		blockDiv.className = 'block-container p-4 border rounded-lg bg-gray-50 space-y-3';
		blockDiv.setAttribute('role', 'group');
		blockDiv.setAttribute('aria-label', `Block ${blockIndex + 1}`);

		const blockHeader = document.createElement('div');
		blockHeader.className = 'flex items-center justify-between';

		const blockTitle = document.createElement('h3');
		blockTitle.className = 'text-lg font-semibold text-gray-700';
		blockTitle.textContent = block.name || `Block ${blockIndex + 1}`;

		const blockActions = document.createElement('div');
		blockActions.className = 'flex gap-2';

		const addFieldToBlockBtn = document.createElement('button');
		addFieldToBlockBtn.type = 'button';
		addFieldToBlockBtn.textContent = '+ Field';
		addFieldToBlockBtn.className =
			'px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500';
		addFieldToBlockBtn.setAttribute('aria-label', `Add field to block ${blockIndex + 1}`);
		addFieldToBlockBtn.addEventListener('click', () => {
			this.saveStateToHistory();
			block.fields.push({ name: '', value: '' });
			this.renderBlocks();
			this.saveStateToStorage();
			this.showNotification('Field added to block');
		});

		const removeBlockBtn = document.createElement('button');
		removeBlockBtn.type = 'button';
		removeBlockBtn.textContent = '✕';
		removeBlockBtn.className =
			'px-3 py-1 text-sm text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded';
		removeBlockBtn.setAttribute('aria-label', `Remove block ${blockIndex + 1}`);
		removeBlockBtn.addEventListener('click', () => this.removeBlock(blockIndex));

		blockActions.appendChild(addFieldToBlockBtn);
		blockActions.appendChild(removeBlockBtn);
		blockHeader.appendChild(blockTitle);
		blockHeader.appendChild(blockActions);
		blockDiv.appendChild(blockHeader);

		const fieldsContainer = document.createElement('div');
		fieldsContainer.className = 'space-y-2';

		block.fields.forEach((field, fieldIndex) => {
			const fieldElement = this.createFieldElement(field, blockIndex, fieldIndex);
			fieldsContainer.appendChild(fieldElement);
		});

		blockDiv.appendChild(fieldsContainer);
		return blockDiv;
	}

	private createFieldElement(
		field: FormField,
		blockIndex: number,
		fieldIndex: number
	): HTMLElement {
		const div = document.createElement('div');
		div.className = 'flex gap-2 items-center';
		div.setAttribute('role', 'group');
		div.setAttribute('aria-label', `Attribute field ${fieldIndex + 1} in block ${blockIndex + 1}`);

		const nameInput = document.createElement('input');
		nameInput.type = 'text';
		nameInput.value = field.name;
		nameInput.placeholder = 'Attribute Name';
		nameInput.className =
			'name flex-1 min-w-[200px] px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
		nameInput.setAttribute(
			'aria-label',
			`${ARIA_LABELS.ATTRIBUTE_NAME} ${fieldIndex + 1} in block ${blockIndex + 1}`
		);

		const valueInput = document.createElement('input');
		valueInput.type = 'text';
		valueInput.value = field.value;
		valueInput.placeholder = 'Attribute Value';
		valueInput.className =
			'value flex-1 min-w-[200px] px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
		valueInput.setAttribute(
			'aria-label',
			`${ARIA_LABELS.ATTRIBUTE_VALUE} ${fieldIndex + 1} in block ${blockIndex + 1}`
		);

		const removeBtn = document.createElement('button');
		removeBtn.type = 'button';
		removeBtn.textContent = '✕';
		removeBtn.className =
			'remove px-3 py-2 text-red-600 hover:text-red-800 shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 rounded';
		removeBtn.setAttribute(
			'aria-label',
			`${ARIA_LABELS.REMOVE_FIELD} ${fieldIndex + 1} in block ${blockIndex + 1}`
		);
		removeBtn.addEventListener('click', () => this.removeField(blockIndex, fieldIndex));

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
		const blockContainers =
			this.elements.blocksContainer.querySelectorAll<HTMLElement>('.block-container');
		blockContainers.forEach((blockContainer, blockIndex) => {
			const removeFieldButtons = blockContainer.querySelectorAll<HTMLButtonElement>('.remove');
			const blockRemoveButton = blockContainer.querySelector<HTMLButtonElement>(
				'button[aria-label*="Remove block"]'
			);

			// Hide field remove buttons if only one field in block
			const fieldCount = this.state.blocks[blockIndex]?.fields.length || 0;
			removeFieldButtons.forEach((btn) => {
				btn.style.display = fieldCount === 1 ? 'none' : 'block';
			});

			// Hide block remove button if only one block
			if (blockRemoveButton) {
				blockRemoveButton.style.display = this.state.blocks.length === 1 ? 'none' : 'block';
			}
		});
	}

	private updateStateFromDOM(): void {
		const blockContainers =
			this.elements.blocksContainer.querySelectorAll<HTMLElement>('.block-container');
		this.state.blocks = Array.from(blockContainers).map((blockContainer, blockIndex) => {
			const nameInputs = blockContainer.querySelectorAll<HTMLInputElement>('.name');
			const valueInputs = blockContainer.querySelectorAll<HTMLInputElement>('.value');

			const fields = Array.from(nameInputs).map((nameInput, fieldIndex) => ({
				name: nameInput.value,
				value: valueInputs[fieldIndex]?.value || '',
			}));

			return {
				id: this.state.blocks[blockIndex]?.id || this.generateId(),
				fields,
			};
		});
	}

	private saveStateToHistory(): void {
		if (this.state.historyIndex < this.state.history.length - 1) {
			this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
		}
		this.state.history.push(
			this.state.blocks.map((block) => ({ ...block, fields: [...block.fields] }))
		);
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
			this.state.blocks = this.state.history[this.state.historyIndex].map((block) => ({
				...block,
				fields: [...block.fields],
			}));
			this.renderBlocks();
			this.saveStateToStorage();
			this.showNotification('Undid last action');
		}
	}

	private redo(): void {
		if (this.state.historyIndex < this.state.history.length - 1) {
			this.state.historyIndex++;
			this.state.blocks = this.state.history[this.state.historyIndex].map((block) => ({
				...block,
				fields: [...block.fields],
			}));
			this.renderBlocks();
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
		const nameInputs = this.elements.blocksContainer.querySelectorAll<HTMLInputElement>('.name');
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
