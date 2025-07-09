export interface AttributeTemplate {
	[key: string]: string;
}

export interface BlockTemplate {
	name?: string;
	fields: AttributeTemplate;
}

export interface MultiBlockTemplate {
	blocks: BlockTemplate[];
}

export interface TemplateMetadata {
	name: string;
	description: string;
	category?: string;
}

export interface TemplateDefinition {
	template: AttributeTemplate | MultiBlockTemplate;
	metadata: TemplateMetadata;
}

export interface TemplateCollection {
	[templateName: string]: TemplateDefinition;
}

export interface ContactFlowAction {
	Parameters: {
		Attributes: AttributeTemplate;
		TargetContact: string;
	};
	Identifier: string;
	Type: string;
	Transitions: {
		NextAction: string;
		Errors: Array<{ NextAction: string; ErrorType: string }>;
	};
}

export interface ContactFlowJSON {
	Version: string;
	StartAction: string;
	Metadata: {
		entryPointPosition: { x: number; y: number };
		ActionMetadata: {
			[identifier: string]: {
				position: { x: number; y: number };
				dynamicParams: unknown[];
			};
		};
		Annotations: unknown[];
	};
	Actions: ContactFlowAction[];
}

export interface Block {
	id: string;
	name?: string;
	fields: FormField[];
}

export interface FormField {
	name: string;
	value: string;
}

export interface AppState {
	blocks: Block[];
	selectedTemplate: string;
	history: Block[][];
	historyIndex: number;
}

export interface NotificationState {
	isVisible: boolean;
	message: string;
}
