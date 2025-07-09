import type { TemplateCollection, MultiBlockTemplate } from '../types';

export const CONTACT_FLOW_VERSION = '2019-10-30';
export const ACTION_IDENTIFIER = 'bf2340c7-f41b-4997-8b1d-9756291b26d1';
export const LOCAL_STORAGE_KEY = 'aws-connect-generator-state';
export const DEBOUNCE_DELAY = 500;

export const KEYBOARD_SHORTCUTS = {
	GENERATE: 'Enter',
	COPY: 'KeyC',
	ADD_FIELD: 'KeyN',
	RESET: 'KeyR',
} as const;

export const ARIA_LABELS = {
	ADD_FIELD: 'Add new attribute field',
	REMOVE_FIELD: 'Remove this attribute field',
	RESET_FIELDS: 'Reset all fields to empty state',
	GENERATE_JSON: 'Generate Amazon Connect JSON from current fields',
	COPY_JSON: 'Copy generated JSON to clipboard',
	TEMPLATE_SELECT: 'Select a predefined template to populate fields',
	ATTRIBUTE_NAME: 'Enter attribute name',
	ATTRIBUTE_VALUE: 'Enter attribute value',
} as const;

export const NOTIFICATION_MESSAGES = {
	COPIED: 'JSON copied to clipboard!',
	COPY_FAILED: 'Failed to copy to clipboard',
	VALIDATION_ERROR: 'Please fix validation errors',
	TEMPLATE_LOADED: 'Template loaded successfully',
	FIELDS_RESET: 'All fields have been reset',
	FIELD_ADDED: 'New field added',
	FIELD_REMOVED: 'Field removed',
	DUPLICATE_NAME: 'Duplicate attribute names are not allowed',
	EMPTY_NAME: 'Attribute name cannot be empty',
} as const;

export const TEMPLATES: TemplateCollection = {
	cti: {
		metadata: {
			name: 'CTI – Pin Only Lookup',
			description: 'CTI Pin Lookup using ServiceNow API and employee number',
			category: 'Authentication',
		},
		template: {
			CTILookupMethod: 'pin_only',
			CTIPrompt: '<speak>Please enter your user ID.</speak>',
			CTI_V2_param_store: '/example.service-now.com',
			CTI_V2_apiUrl: '/api/now/table/sys_user',
			CTI_V2_urlParams:
				'?sysparm_query=employee_number={pin}^active=true&sysparm_display_value=true',
			CTITryAgain: '<speak>Invalid user ID. Please try again.</speak>',
		},
	},
	genericNoCBANoEWT: {
		metadata: {
			name: 'Generic – No Callback, No EWT',
			description: 'No callback and no expected wait time messaging',
			category: 'Queue Management',
		},
		template: {
			NoAgentStaffedMessage: '<speak>There are no agents available at this time.</speak>',
			InitialWaitMessage:
				'<speak>All of our agents are currently busy. Please hold, and your call will be answered, as soon as an agent becomes available.</speak>',
			SecondWaitMessage:
				'<speak>Our agents are still busy assisting other callers. Please continue to hold, and your call will be answered as soon as possible.</speak>',
		},
	},
	genericCBANoEWT: {
		metadata: {
			name: 'Generic – Callback Only',
			description: 'Allows callback option, but no expected wait time announced',
			category: 'Queue Management',
		},
		template: {
			NoAgentStaffedMessage: '<speak>There are no agents available at this time.</speak>',
			InitialWaitMessage: '<speak>Please hold while we connect you to an agent.</speak>',
			SecondWaitMessage:
				'<speak>Our agents are still busy assisting other callers. Please continue to hold, and your call will be answered as soon as possible.</speak>',
			CallbackPrompt:
				'<speak>If you would like to receive a callback when an agent is available, press 1. Otherwise, please continue to hold.</speak>',
			CallbackCallerIDConfirm:
				'<speak>Press 1 if you want to be called back on the number you are calling from, or press 2 to enter another number.</speak>',
			CallbackEnterNumber:
				'<speak>Please enter the number you want us to call you back on, including the country code and area code.</speak>',
			CallbackInvalidNumber:
				'<speak>Sorry, the number you entered is invalid. Please try again.</speak>',
			CallbackConfirmed:
				'<speak>Your callback is scheduled. We will call you back as soon as an agent is available. Goodbye.</speak>',
		},
	},
	genericEWTNoCBA: {
		metadata: {
			name: 'Generic – EWT Only',
			description: 'Announces expected wait time but no callback option',
			category: 'Queue Management',
		},
		template: {
			NoAgentStaffedMessage: '<speak>There are no agents available at this time.</speak>',
			YourWaitTimeIs_Msg: '<speak>Your expected wait time is </speak>',
			InitialWaitMessage:
				'<speak>Thank you for calling. Please hold and we will connect you shortly.</speak>',
			SecondWaitMessage:
				'<speak>Our agents are still busy assisting other callers. Please continue to hold, and your call will be answered as soon as possible.</speak>',
		},
	},
	genericCBAEWT: {
		metadata: {
			name: 'Generic – Callback and EWT',
			description: 'Enables both callback and expected wait time messaging',
			category: 'Queue Management',
		},
		template: {
			YourWaitTimeIs_Msg: '<speak>Your expected wait time is </speak>',
			InitialWaitMessage:
				'<speak>Please hold, we are connecting you to the next available agent.</speak>',
			SecondWaitMessage:
				'<speak>Our agents are still busy assisting other callers. Please continue to hold, and your call will be answered as soon as possible.</speak>',
			CallbackPrompt:
				"<speak>If you'd like us to call you back when an agent is available, press 1. Otherwise, please remain on the line.</speak>",
			CallbackCallerIDConfirm:
				'<speak>Press 1 to be called back on your current number, or 2 to enter a different number.</speak>',
			CallbackEnterNumber:
				'<speak>Please enter your callback number, including country and area code.</speak>',
			CallbackInvalidNumber: "<speak>That number doesn't look right. Try again.</speak>",
			CallbackConfirmed: "<speak>We've scheduled your callback. Goodbye!</speak>",
		},
	},
	genericCustomCallBackQueue: {
		metadata: {
			name: 'Generic – Custom Callback Queue',
			description: 'Routes callback to a custom queue ARN instead of default',
			category: 'Queue Management',
		},
		template: {
			InitialWaitMessage: '<speak>All agents are currently assisting others. Please hold.</speak>',
			SecondWaitMessage:
				'<speak>Our agents are still busy assisting other callers. Please continue to hold, and your call will be answered as soon as possible.</speak>',
			CallbackPrompt:
				'<speak>To receive a callback, press 1 now. Otherwise, continue to hold.</speak>',
			CallbackCallerIDConfirm: '<speak>Press 1 to use this number, or 2 to enter another.</speak>',
			CallbackEnterNumber: '<speak>Enter your callback number including country code.</speak>',
			CallbackInvalidNumber: '<speak>That number was not valid. Please try again.</speak>',
			CallbackConfirmed: '<speak>Callback scheduled. Thank you and goodbye.</speak>',
			CallbackQueue:
				'arn:aws:connect:us-east-1:123456789012:instance/abcdefg/queue/alt-callback-queue',
		},
	},
	fem: {
		metadata: {
			name: 'FEM – ID and Message',
			description: 'Fetch and play FEM status and message from external source',
			category: 'External Integration',
		},
		template: {
			femStatus: '$.External.femStatus',
			femText: '$.External.femText',
		},
	},
	twoWayVoiceToVoice: {
		metadata: {
			name: 'Two way Voice to Voice',
			description: 'Enables two-way voice translation',
			category: 'Communication',
		},
		template: {
			blocks: [
				{
					name: 'Voice to Voice Configuration',
					fields: {
						EnableVoiceToVoice: 'true',
					},
				},
				{
					name: 'Volume Settings',
					fields: {
						customerSideEchoVolume: '0.01',
						agentSideEchoVolume: '0.01',
					},
				},
				{
					name: 'Language Settings',
					fields: {
						customerLanguage: 'en-US',
						agentLanguage: 'es-ES',
						speechTranslationServices: 'AWS',
						customerTranslatorVoice: 'Joanna',
						agentTranslatorVoice: 'Miguel',
					},
				},
			],
		},
	},
	// Multi-block templates
	multiBlockExample: {
		metadata: {
			name: 'Multi-Block Example',
			description: 'Example of multiple blocks with company info and queue configuration',
			category: 'Multi-Block',
		},
		template: {
			blocks: [
				{
					name: 'Company Information',
					fields: {
						CompanyName: 'ACME Corp',
						CompanyCode: 'ACME001',
						Department: 'Customer Service',
					},
				},
				{
					name: 'Queue Configuration',
					fields: {
						QueueName: '$.Queue.Name',
						QueueId: '$.Queue.Id',
						InitialWaitMessage: '<speak>Please hold while we connect you to an agent.</speak>',
					},
				},
			],
		} as MultiBlockTemplate,
	},
	ctiMultiBlock: {
		metadata: {
			name: 'CTI Multi-Block',
			description: 'CTI configuration split into multiple blocks',
			category: 'Multi-Block',
		},
		template: {
			blocks: [
				{
					name: 'CTI Configuration',
					fields: {
						CTILookupMethod: 'pin_only',
						CTIPrompt: '<speak>Please enter your user ID.</speak>',
						CTI_V2_param_store: '/example.service-now.com',
					},
				},
				{
					name: 'CTI API Settings',
					fields: {
						CTI_V2_apiUrl: '/api/now/table/sys_user',
						CTI_V2_urlParams:
							'?sysparm_query=employee_number={pin}^active=true&sysparm_display_value=true',
						CTITryAgain: '<speak>Invalid user ID. Please try again.</speak>',
					},
				},
			],
		} as MultiBlockTemplate,
	},
	callbackMultiBlock: {
		metadata: {
			name: 'Callback Multi-Block',
			description: 'Callback configuration organized into multiple blocks',
			category: 'Multi-Block',
		},
		template: {
			blocks: [
				{
					name: 'Wait Messages',
					fields: {
						NoAgentStaffedMessage: '<speak>There are no agents available at this time.</speak>',
						InitialWaitMessage: '<speak>Please hold while we connect you to an agent.</speak>',
						SecondWaitMessage:
							'<speak>Our agents are still busy assisting other callers. Please continue to hold, and your call will be answered as soon as possible.</speak>',
					},
				},
				{
					name: 'Callback Configuration',
					fields: {
						CallbackPrompt:
							'<speak>If you would like to receive a callback when an agent is available, press 1. Otherwise, please continue to hold.</speak>',
						CallbackCallerIDConfirm:
							'<speak>Press 1 if you want to be called back on the number you are calling from, or press 2 to enter another number.</speak>',
						CallbackEnterNumber:
							'<speak>Please enter the number you want us to call you back on, including the country code and area code.</speak>',
					},
				},
				{
					name: 'Callback Responses',
					fields: {
						CallbackInvalidNumber:
							'<speak>Sorry, the number you entered is invalid. Please try again.</speak>',
						CallbackConfirmed:
							'<speak>Your callback is scheduled. We will call you back as soon as an agent is available. Goodbye.</speak>',
					},
				},
			],
		} as MultiBlockTemplate,
	},
};
