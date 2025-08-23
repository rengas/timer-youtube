# Pomodoro Productivity Plugin for Obsidian

A comprehensive productivity plugin that combines the Pomodoro Technique with integrated note-taking and background music, all within your Obsidian workspace.

<img width="1855" height="956" alt="Screenshot 2025-08-23 at 8 23 03 AM" src="https://github.com/user-attachments/assets/3d0581f5-4ba6-4d92-8dec-d205d5673edc" />



## Features

### 🍅 Pomodoro Timer
- Customizable work sessions (default: 25 minutes)
- Short and long breaks (default: 5 and 15 minutes)
- Visual progress indicators with beautiful gradients
- Audio notifications when sessions complete
- Auto-start options for seamless workflow

### 📝 Integrated Note-Taking
- Session notes directly saved to your vault
- Automatic file creation with timestamps
- Plan your next session while reviewing current progress
- Organized storage in a dedicated folder
- Markdown formatting support

### 🎵 Background Music
- Embedded YouTube player for playlists or individual videos
- Easy URL configuration
- Persistent music settings
- Seamless integration with your workflow

### 🎨 Beautiful Design
- Modern gradient-based interface
- Responsive design for all screen sizes
- Smooth animations and hover effects
- Dark theme support
- Clean, distraction-free layout

## Installation

1. Download the plugin files
2. Copy them to your Obsidian plugins folder: `VaultFolder/.obsidian/plugins/pomodoro-productivity/`
3. Enable the plugin in Obsidian settings
4. Click the clock icon in the ribbon or use the command palette

## Usage

### Starting Your First Session

1. Open the plugin by clicking the clock icon in the ribbon
2. Configure your YouTube playlist URL in the music section
3. Set your session notes and next session plan
4. Click "Start" to begin your first Pomodoro session

### Managing Sessions

- **Work Sessions**: Take notes on what you accomplished
- **Breaks**: Plan what you'll work on next
- **Notes**: Automatically saved to your designated folder
- **Timer**: Visual progress bar and large time display

### Settings

Access plugin settings through Obsidian's settings panel:

- **Timer Durations**: Customize work, break, and long break periods
- **Session Count**: Set how many work sessions before a long break
- **Notifications**: Enable/disable completion alerts
- **Auto-start**: Automatically begin breaks after work sessions
- **Notes Folder**: Choose where session notes are saved
- **Music URL**: Set your default YouTube playlist

## File Structure

Session notes are saved as:
```
[Notes Folder]/Pomodoro [Date].md
```

Each session creates an entry with:
- Session number and timestamp
- Your accomplishments
- Next session plan
- Separating dividers for easy reading

## Tips for Best Results

1. **Plan Ahead**: Use the "next session plan" to maintain focus
2. **Review Progress**: Check your daily Pomodoro files to see accomplishments
3. **Customize Timers**: Adjust durations based on your attention span
4. **Background Music**: Choose instrumental or lo-fi music to avoid distraction
5. **Take Real Breaks**: Step away from your computer during break periods

## Troubleshooting

**YouTube not loading?**
- Ensure you're using a valid YouTube URL
- Check your internet connection
- Try switching between playlist and individual video URLs

**Notes not saving?**
- Verify the notes folder exists or leave empty for vault root
- Check Obsidian permissions
- Ensure you have write access to your vault

**Timer not working?**
- Restart Obsidian if the plugin seems unresponsive
- Check that the plugin is enabled in settings

## Contributing

Found a bug or have a feature request? Please open an issue or submit a pull request on GitHub.

## License

MIT License - feel free to modify and distribute as needed.

---

*Happy productivity! 🍅✨*
