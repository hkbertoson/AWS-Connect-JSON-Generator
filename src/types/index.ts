export interface AttributeTemplate {
	[key: string]: string;
}

export interface TemplateCollection {
	[templateName: string]: AttributeTemplate;
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

export interface FormField {
	name: string;
	value: string;
}

export interface AppState {
	fields: FormField[];
	selectedTemplate: string;
	history: FormField[][];
	historyIndex: number;
}

export interface NotificationState {
	isVisible: boolean;
	message: string;
}
