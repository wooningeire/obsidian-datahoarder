import {App, Editor, MarkdownView, Modal, Notice, Plugin, WorkspaceLeaf} from 'obsidian';
import {DEFAULT_SETTINGS, type MyPluginSettings, SampleSettingTab} from "./settings";
import {createSqljs} from "./sqljs";
import type { Database, SqlJsStatic } from "sql.js";
import { ExampleView, VIEW_TYPE_EXAMPLE } from './HoardView';
import { DatahoarderDbOps } from 'dbOps/DatahoarderDbOps';


const readDb = async (app: App, sqljs: SqlJsStatic) => {
	if (!await app.vault.adapter.exists("./.datahoarder/db.sqlite")) {
		return new sqljs.Database();
	}

	const dbData = await app.vault.adapter.readBinary("./.datahoarder/db.sqlite");
	return new sqljs.Database(new Uint8Array(dbData));
}


export default class DatahoarderPlugin extends Plugin {
	settings: MyPluginSettings;
	private db: Database | null = null;


	async onload() {
		await this.loadSettings();

		const sqljs = await createSqljs(this.app, this.manifest);
		const db = await readDb(this.app, sqljs);
		this.db = db;

		const dbOps = new DatahoarderDbOps(this.app, this.manifest, db);

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf, dbOps),
		);

		this.addRibbonIcon('dice', 'Activate view', () => {
			this.activateView();
		});

		// // This creates an icon in the left ribbon.
		// this.addRibbonIcon('dice', 'Sample', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });

		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');

		this.addCommand({
			id: "set-up-schema",
			name: "Set up schema",
			callback: () => dbOps.setUpSchema(),
		})

		this.addCommand({
			id: "migrate",
			name: "Migrate",
			callback: () => dbOps.migrate(),
		})

		// This adds a simple command that can be triggered anywhere

		// this.addCommand({
		// 	id: 'open-modal-simple',
		// 	name: 'Open modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// // This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'replace-selected',
		// 	name: 'Replace selected content',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		editor.replaceSelection('Sample editor command');
		// 	}
		// });
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-modal-complex',
		// 	name: 'Open modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 		return false;
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	new Notice("Click");
		// });

		// // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

	}

	onunload() {
		this.db?.close();
	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0] ?? null;
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf !== null) {
			workspace.revealLeaf(leaf);
		}
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
