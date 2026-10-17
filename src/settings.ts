import {App, Platform, PluginSettingTab, Setting} from "obsidian";
import type DatahoarderPlugin from "./main";
import { DEFAULT_POCKETBASE_API } from "./lib/pb";

export interface MyPluginSettings {
	mySetting: string;
    pocketBaseApiUrl: string;
    pocketBaseAutoStart: boolean;
    pocketBaseDirectory: string;
    pocketBaseExecutablePath: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
    pocketBaseApiUrl: DEFAULT_POCKETBASE_API,
    pocketBaseAutoStart: false,
    pocketBaseDirectory: "pb",
    pocketBaseExecutablePath: "",
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: DatahoarderPlugin;

	constructor(app: App, plugin: DatahoarderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

        new Setting(containerEl)
            .setName("Auto-start PocketBase")
            .setDesc("start a local PocketBase server on plugin load (or reuse one already running); requires reload")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.pocketBaseAutoStart)
                .setDisabled(!Platform.isDesktopApp)
                .onChange(async value => {
                    this.plugin.settings.pocketBaseAutoStart = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("PocketBase folder")
            .setDesc("folder in the vault containing the existing pb_data/data.db (default = `pb`)")
            .addText(text => text
                .setPlaceholder("pb")
                .setValue(this.plugin.settings.pocketBaseDirectory)
                .onChange(async value => {
                    this.plugin.settings.pocketBaseDirectory = value.trim() || "pb";
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("PocketBase executable")
            .setDesc("path of PocketBase executable inside the vault; leave blank to use pocketbase.exe (Windows) or `{PocketBase folder}/pocketbase`")
            .addText(text => text
                .setValue(this.plugin.settings.pocketBaseExecutablePath)
                .onChange(async value => {
                    this.plugin.settings.pocketBaseExecutablePath = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("PocketBase API URL")
            .setDesc("url the PocketBase server listens on")
            .addText(text => text
                .setPlaceholder(DEFAULT_POCKETBASE_API)
                .setValue(this.plugin.settings.pocketBaseApiUrl)
                .onChange(async value => {
                    try {
                        if (!["http:", "https:"].includes(new URL(value).protocol)) return;
                    } catch {
                        return;
                    }
                    this.plugin.settings.pocketBaseApiUrl = value.trim();
                    await this.plugin.saveSettings();
                }));

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
