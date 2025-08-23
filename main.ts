import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, Notice } from 'obsidian';

interface PomodoroSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  enableNotifications: boolean;
  youtubePlaylistUrl: string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  enableNotifications: true,
  youtubePlaylistUrl: '',
};

export const VIEW_TYPE_POMODORO = 'pomodoro-view';

export class PomodoroView extends ItemView {
  private plugin: PomodoroPlugin;
  private timer: number | null = null;
  private timeRemaining: number = 0;
  private isActive: boolean = false;
  private isBreak: boolean = false;
  private sessionCount: number = 0;
  private audioContext: AudioContext | null = null;
  private youtubePlayer: HTMLIFrameElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: PomodoroPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.timeRemaining = plugin.settings.workDuration * 60;
  }

  getViewType(): string {
    return VIEW_TYPE_POMODORO;
  }

  getDisplayText(): string {
    return 'Pomodoro Productivity';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { cls: 'pomodoro-container' });
    this.renderView();
  }

  private renderView() {
    const container = this.containerEl.querySelector('.pomodoro-container') as HTMLElement;
    
    // Only clear and rebuild if this is the first render or a major state change
    if (!container.querySelector('.pomodoro-timer-section')) {
      container.empty();
      this.buildInitialView(container);
    } else {
      this.updateTimerDisplay();
    }
  }

  private buildInitialView(container: HTMLElement) {

    // Timer Section
    const timerSection = container.createEl('div', { cls: 'pomodoro-timer-section' });
    
    const timerDisplay = timerSection.createEl('div', { cls: 'pomodoro-timer-display' });
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerProgress = timerSection.createEl('div', { cls: 'pomodoro-progress-container' });
    const progressBar = timerProgress.createEl('div', { cls: 'pomodoro-progress-bar' });
    const totalTime = this.isBreak 
      ? (this.sessionCount % this.plugin.settings.sessionsUntilLongBreak === 0 && this.sessionCount > 0 
        ? this.plugin.settings.longBreakDuration 
        : this.plugin.settings.breakDuration) * 60
      : this.plugin.settings.workDuration * 60;
    const progress = ((totalTime - this.timeRemaining) / totalTime) * 100;
    progressBar.style.width = `${progress}%`;

    const timerControls = timerSection.createEl('div', { cls: 'pomodoro-controls' });
    const startBtn = timerControls.createEl('button', { 
      cls: this.isActive ? 'pomodoro-btn pause' : 'pomodoro-btn start',
      text: this.isActive ? 'Pause' : 'Start'
    });
    startBtn.onclick = () => this.toggleTimer();

    const resetBtn = timerControls.createEl('button', { cls: 'pomodoro-btn reset', text: 'Reset' });
    resetBtn.onclick = () => this.resetTimer();

    const statusDiv = timerSection.createEl('div', { cls: 'pomodoro-status' });
    statusDiv.textContent = this.isBreak ? 'Break Time' : `Work Session ${this.sessionCount + 1}`;

    // YouTube Music Section
    const musicSection = container.createEl('div', { cls: 'pomodoro-music-section' });
    musicSection.createEl('h3', { text: 'Background Music' });

    const youtubeContainer = musicSection.createEl('div', { cls: 'pomodoro-youtube-container' });
    
    if (this.plugin.settings.youtubePlaylistUrl) {
      this.youtubePlayer = youtubeContainer.createEl('iframe', {
        cls: 'pomodoro-youtube-iframe',
        attr: {
          src: this.convertToEmbedUrl(this.plugin.settings.youtubePlaylistUrl),
          frameborder: '0',
          allowfullscreen: 'true',
          allow: 'autoplay; encrypted-media'
        }
      }) as HTMLIFrameElement;
    } else {
      const placeholder = youtubeContainer.createEl('div', { 
        cls: 'pomodoro-youtube-placeholder',
        text: 'Configure YouTube playlist URL in settings'
      });
      this.youtubePlayer = null;
    }

    // Music URL input
    const urlContainer = musicSection.createEl('div', { cls: 'pomodoro-url-container' });
    
    const urlInput = urlContainer.createEl('input', {
      cls: 'pomodoro-url-input',
      attr: {
        type: 'text',
        placeholder: 'Enter YouTube playlist or video URL...'
      }
    }) as HTMLInputElement;
    
    urlInput.value = this.plugin.settings.youtubePlaylistUrl;

    const updateBtn = urlContainer.createEl('button', {
      cls: 'pomodoro-btn update-music',
      text: 'Update Music'
    });
    
    updateBtn.onclick = () => {
      this.plugin.settings.youtubePlaylistUrl = urlInput.value;
      this.plugin.saveSettings();
      this.updateYouTubePlayer();
    };
  }

  private updateTimerDisplay() {
    const timerDisplay = this.containerEl.querySelector('.pomodoro-timer-display') as HTMLElement;
    const progressBar = this.containerEl.querySelector('.pomodoro-progress-bar') as HTMLElement;
    const statusDiv = this.containerEl.querySelector('.pomodoro-status') as HTMLElement;
    const startBtn = this.containerEl.querySelector('.pomodoro-controls button') as HTMLButtonElement;

    if (timerDisplay) {
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    if (progressBar) {
      const totalTime = this.isBreak 
        ? (this.sessionCount % this.plugin.settings.sessionsUntilLongBreak === 0 && this.sessionCount > 0 
          ? this.plugin.settings.longBreakDuration 
          : this.plugin.settings.breakDuration) * 60
        : this.plugin.settings.workDuration * 60;
      const progress = ((totalTime - this.timeRemaining) / totalTime) * 100;
      progressBar.style.width = `${progress}%`;
    }

    if (statusDiv) {
      statusDiv.textContent = this.isBreak ? 'Break Time' : `Work Session ${this.sessionCount + 1}`;
    }

    if (startBtn) {
      startBtn.textContent = this.isActive ? 'Pause' : 'Start';
      startBtn.className = this.isActive ? 'pomodoro-btn pause' : 'pomodoro-btn start';
    }
  }

  private updateYouTubePlayer() {
    const youtubeContainer = this.containerEl.querySelector('.pomodoro-youtube-container') as HTMLElement;
    
    if (youtubeContainer) {
      youtubeContainer.empty();
      
      if (this.plugin.settings.youtubePlaylistUrl) {
        this.youtubePlayer = youtubeContainer.createEl('iframe', {
          cls: 'pomodoro-youtube-iframe',
          attr: {
            src: this.convertToEmbedUrl(this.plugin.settings.youtubePlaylistUrl),
            frameborder: '0',
            allowfullscreen: 'true',
            allow: 'autoplay; encrypted-media',
            id: 'youtube-player'
          }
        }) as HTMLIFrameElement;
      } else {
        const placeholder = youtubeContainer.createEl('div', { 
          cls: 'pomodoro-youtube-placeholder',
          text: 'Configure YouTube playlist URL in settings'
        });
        this.youtubePlayer = null;
      }
    }
  }

  private convertToEmbedUrl(url: string): string {
    if (url.includes('playlist?list=')) {
      const playlistId = url.split('list=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
    } else if (url.includes('watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  }

  private toggleTimer() {
    if (this.isActive) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  private startTimer() {
    this.isActive = true;
    this.timer = window.setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.onTimerComplete();
      }
      this.updateTimerDisplay();
    }, 1000);
    this.updateTimerDisplay();
  }

  private pauseTimer() {
    this.isActive = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.updateTimerDisplay();
  }

  private resetTimer() {
    this.pauseTimer();
    this.timeRemaining = this.isBreak 
      ? (this.sessionCount % this.plugin.settings.sessionsUntilLongBreak === 0 && this.sessionCount > 0 
        ? this.plugin.settings.longBreakDuration 
        : this.plugin.settings.breakDuration) * 60
      : this.plugin.settings.workDuration * 60;
    this.updateTimerDisplay();
  }

  private playNotificationSound() {
    try {
      // Create audio context if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      // Create a pleasant notification sound (3 ascending tones)
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.setValueAtTime(freq, now + index * 0.2);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, now + index * 0.2);
        gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.2 + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + index * 0.2 + 0.3);
        
        oscillator.start(now + index * 0.2);
        oscillator.stop(now + index * 0.2 + 0.3);
      });
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  private async onTimerComplete() {
    this.pauseTimer();
    
    // Play notification sound
    this.playNotificationSound();
    
    if (this.plugin.settings.enableNotifications) {
      new Notice(this.isBreak ? 'Break time is over!' : 'Work session complete!');
    }

    if (!this.isBreak) {
      // Work session completed
      this.sessionCount++;
      
      // Switch to break
      this.isBreak = true;
      const isLongBreak = this.sessionCount % this.plugin.settings.sessionsUntilLongBreak === 0;
      this.timeRemaining = (isLongBreak ? this.plugin.settings.longBreakDuration : this.plugin.settings.breakDuration) * 60;
    } else {
      // Break completed
      this.isBreak = false;
      this.timeRemaining = this.plugin.settings.workDuration * 60;
    }

    if (this.plugin.settings.autoStartBreaks) {
      setTimeout(() => this.startTimer(), 1000);
    }

    this.updateTimerDisplay();
  }

  async onClose() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default class PomodoroPlugin extends Plugin {
  settings: PomodoroSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(
      VIEW_TYPE_POMODORO,
      (leaf) => new PomodoroView(leaf, this)
    );

    this.addRibbonIcon('clock', 'Open Pomodoro Productivity', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-pomodoro-view',
      name: 'Open Pomodoro Productivity',
      callback: () => {
        this.activateView();
      }
    });

    this.addSettingTab(new PomodoroSettingTab(this.app, this));
  }

  async activateView() {
    const { workspace } = this.app;
    
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_POMODORO);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_POMODORO, active: true });
    }

    workspace.revealLeaf(leaf);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class PomodoroSettingTab extends PluginSettingTab {
  plugin: PomodoroPlugin;

  constructor(app: App, plugin: PomodoroPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Pomodoro Productivity Settings' });

    new Setting(containerEl)
      .setName('Work duration')
      .setDesc('Duration of work sessions in minutes')
      .addText(text => text
        .setPlaceholder('25')
        .setValue(this.plugin.settings.workDuration.toString())
        .onChange(async (value) => {
          this.plugin.settings.workDuration = parseInt(value) || 25;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Break duration')
      .setDesc('Duration of short breaks in minutes')
      .addText(text => text
        .setPlaceholder('5')
        .setValue(this.plugin.settings.breakDuration.toString())
        .onChange(async (value) => {
          this.plugin.settings.breakDuration = parseInt(value) || 5;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Long break duration')
      .setDesc('Duration of long breaks in minutes')
      .addText(text => text
        .setPlaceholder('15')
        .setValue(this.plugin.settings.longBreakDuration.toString())
        .onChange(async (value) => {
          this.plugin.settings.longBreakDuration = parseInt(value) || 15;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Sessions until long break')
      .setDesc('Number of work sessions before a long break')
      .addText(text => text
        .setPlaceholder('4')
        .setValue(this.plugin.settings.sessionsUntilLongBreak.toString())
        .onChange(async (value) => {
          this.plugin.settings.sessionsUntilLongBreak = parseInt(value) || 4;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Auto-start breaks')
      .setDesc('Automatically start break timers after work sessions')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoStartBreaks)
        .onChange(async (value) => {
          this.plugin.settings.autoStartBreaks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Enable notifications')
      .setDesc('Show notifications when timers complete')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableNotifications)
        .onChange(async (value) => {
          this.plugin.settings.enableNotifications = value;
          await this.plugin.saveSettings();
        }));


  }
}