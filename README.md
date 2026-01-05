# My Diary - Personal Journal Application

A beautiful, secure, and feature-rich personal diary application built with React, TypeScript, and Tailwind CSS. My Diary provides a modern digital journaling experience with local encryption, multiple user profiles, and an intuitive interface.

## 🌟 Features

### 🔐 Security & Privacy
- **Local Encryption**: All diary entries are encrypted using XOR encryption with user-specific secret codes
- **Multiple User Profiles**: Support for multiple users with separate encrypted storage
- **Security Questions**: Password reset functionality with security questions
- **Local Storage**: All data is stored locally in the browser - no cloud dependencies

### 📝 Journaling Features
- **Date-based Entries**: Create and organize entries by specific dates
- **Page Types**: Choose between ruled and plain page layouts
- **Rich Text Editor**: Clean, distraction-free writing experience
- **Image Support**: Add up to 5 images per entry to preserve memories
- **Image Viewer**: Click images to view them in full size
- **Word & Character Count**: Track your writing progress
- **Recent Entries**: Quick access to your latest journal entries

### 🎨 User Interface
- **Modern Design**: Beautiful gradient backgrounds and smooth animations
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Easy-to-use interface with clear visual hierarchy
- **Visual Feedback**: Real-time save indicators and loading states

### 📱 Progressive Web App (PWA)
- **Installable**: Can be installed on desktop, Android, and iOS devices
- **Offline Support**: Works completely offline - no internet required
- **Fast Loading**: Cached resources for instant access
- **Native Feel**: Standalone app experience without browser UI
- **Auto-Updates**: Automatically updates when new version is available

### 📊 Statistics & Organization
- **Entry Statistics**: View total entries, monthly counts, and active days
- **Date Selection**: Pick any date to view or create entries
- **Entry Preview**: See entry content snippets in the dashboard

### 💾 Backup & Restore
- **Password-Protected Backups**: All backup files are encrypted with a password you choose
- **Export Data**: Create encrypted backup files containing all your profiles and diary entries
- **Import Data**: Restore your data on a new device from encrypted backup files
- **Merge or Replace**: Choose to merge with existing data or replace everything
- **Cross-Device Support**: Transfer your diary between devices easily and securely
- **Privacy Protection**: Even if someone gets your backup file, they can't read it without your password

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Build Tool**: Vite for fast development and optimized builds
- **Icons**: Lucide React for consistent iconography
- **Storage**: Browser localStorage with custom encryption

### Project Structure
```
src/
├── components/          # React components
│   ├── DiaryDashboard.tsx    # Main dashboard view
│   ├── DiaryEditor.tsx       # Entry editor component
│   ├── LoginScreen.tsx       # Authentication screen
│   ├── ProfileSelector.tsx   # User profile selection
│   └── BackupRestore.tsx     # Backup and restore functionality
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── encryption.ts   # Encryption/decryption logic
│   └── storage.ts      # Local storage management
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

### Key Components

#### App.tsx
The main application component that manages:
- Application state and view modes
- User authentication flow
- Entry creation and editing
- Data persistence

#### SecureStorage
Handles all data storage operations:
- User profile management
- Encrypted entry storage
- Password reset functionality
- Data re-encryption when passwords change
- Export/import backup functionality
- Data merging and conflict resolution

#### Encryption
Simple XOR-based encryption for local data protection:
- User-specific encryption keys
- Base64 encoding for storage
- Error handling for corrupted data

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd My_Diary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to access the application

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

### Installing as a Progressive Web App (PWA)

**My Diary is a Progressive Web App (PWA)** - this means you can install it on your device and use it completely offline!

#### Desktop Installation (Chrome/Edge)

1. **Open the application** in your browser
2. **Look for the install icon** in the address bar (or a popup will appear)
3. **Click "Install"** when prompted
4. The app will be installed and accessible from your desktop/start menu
5. **Works completely offline** - no internet connection needed!

#### Mobile Installation (Android)

1. **Open the application** in Chrome browser
2. **Tap the menu** (three dots) in the top-right
3. **Select "Add to Home Screen"** or "Install App"
4. **Confirm installation**
5. The app icon will appear on your home screen
6. **Works completely offline** - no internet connection needed!

#### Mobile Installation (iOS/Safari)

1. **Open the application** in Safari browser
2. **Tap the Share button** (square with arrow)
3. **Scroll down and tap "Add to Home Screen"**
4. **Customize the name** if desired
5. **Tap "Add"**
6. The app icon will appear on your home screen
7. **Works completely offline** - no internet connection needed!

#### Offline Features

Once installed, the app works **100% offline**:
- ✅ Create and edit diary entries
- ✅ Add images to entries
- ✅ View all your entries
- ✅ Export/import backups
- ✅ All data stored locally on your device
- ✅ No internet connection required

#### Benefits of Installing

- **Faster access** - Launch like a native app
- **Offline functionality** - Works without internet
- **Home screen icon** - Easy access from your device
- **Standalone window** - No browser UI clutter
- **Better performance** - Cached resources load instantly

## 📖 Usage Guide

### Creating Your First Profile

1. **Launch the application** and you'll see the profile selection screen
2. **Click "Add Profile"** to create a new user profile
3. **Enter your name** and choose a secret code (minimum 4 characters)
4. **Select a security question** and provide an answer for password recovery
5. **Click "Create Profile"** to complete setup

### Writing Your First Entry

1. **Select your profile** from the main screen
2. **Enter your secret code** to access your diary
3. **Choose a date** using the date picker
4. **Click "New Entry"** and select page type (ruled or plain)
5. **Start writing** in the editor
6. **Add images (optional)**: Click "Add Image" to upload photos (up to 5 images per entry, max 5MB each)
7. **Click images** to view them in full size
8. **Click "Save Entry"** when finished

### Managing Multiple Entries

- **View recent entries** in the sidebar
- **Click on any entry** to edit it
- **Use the date picker** to navigate to different dates
- **Check statistics** to see your writing progress

### Password Recovery

1. **Click "Forgot Passcode?"** on the login screen
2. **Enter your profile name** to find your account
3. **Answer your security question** correctly
4. **Create a new secret code**
5. **Your entries will be preserved** and re-encrypted with the new code

### Backup & Restore Your Data

#### Exporting Your Data (Creating a Backup)

**Why backup?** Since all data is stored locally on your device, creating regular backups ensures you won't lose your diary entries if you switch devices, clear browser data, or encounter technical issues.

1. **Log in to your profile** in the diary dashboard
2. **Click the "Backup" button** in the top-right corner (database icon)
3. **Click "Export Backup"** tab if not already selected
4. **Enter a backup password** (minimum 4 characters) - this will encrypt your backup file
5. **Confirm your password** to ensure you remember it correctly
6. **Click "Download Encrypted Backup File"** to save your encrypted backup
7. **Save the file securely** - store it in cloud storage (Google Drive, Dropbox, iCloud), email it to yourself, or save it on an external drive

**🔒 Password Protection:**
- Your backup file is encrypted with the password you choose
- **Remember your password!** You'll need it to restore your data
- Even if someone gets your backup file, they cannot read it without your password
- The password protects all your data including diary entries, secret codes, and security answers

**What gets exported:**
- Your profile information (name, security question)
- Your secret code (encrypted with your backup password)
- All your diary entries with dates and content
- **All images** attached to your entries (stored as base64)
- Entry metadata (page types, creation dates)
- All data is encrypted before being saved to the file

#### Importing Your Data (Restoring from Backup)

1. **Log in to your profile** (or create a new one if starting fresh)
2. **Click the "Backup" button** in the top-right corner
3. **Click "Import Backup"** tab
4. **Choose import mode:**
   - **Merge**: Adds imported data to existing data (skips duplicates)
   - **Replace**: Replaces all existing data with imported data (⚠️ deletes current data)
5. **Click "Select Backup File to Import"**
6. **Choose your encrypted backup JSON file** from your device
7. **Enter your backup password** when prompted (the password you used when creating the backup)
8. **Click "Decrypt & Import"** to restore your data
9. **Wait for confirmation** - you'll see a success message with the number of imported users and entries

**Note:** If you have an old unencrypted backup file, it will still work, but new backups are always encrypted for your privacy.

#### Best Practices for Backups

- **Regular Backups**: Export your data weekly or monthly
- **Strong Passwords**: Use a strong, memorable password for your backups (but different from your diary secret code)
- **Remember Your Password**: Write down your backup password in a secure place - you cannot restore without it!
- **Multiple Copies**: Keep backups in multiple locations (cloud + local)
- **Secure Storage**: Even though backups are encrypted, store them in secure locations
- **Version Naming**: The backup file includes the date, making it easy to track versions
- **Before Major Changes**: Always backup before clearing browser data or switching devices
- **Test Your Backups**: Periodically test restoring from a backup to ensure it works

#### Transferring to a New Device

1. **On your old device**: Export your data using the backup feature
2. **Transfer the backup file** to your new device (via email, cloud storage, USB, etc.)
3. **On your new device**: 
   - Install/access the My Diary application
   - Log in to your profile (or create it if needed)
   - Import the backup file using the restore feature
   - Your entries will be restored and ready to use!

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting
- **Tailwind CSS** for styling

### Adding New Features

1. **Create new components** in the `src/components/` directory
2. **Add TypeScript types** in `src/types/index.ts`
3. **Update the main App.tsx** to include new functionality
4. **Test thoroughly** before committing changes

## 🔒 Security Considerations

### Encryption Details
- Uses XOR encryption with user-specific keys
- All sensitive data is encrypted before storage in the browser
- Encryption keys are derived from user secret codes
- No encryption keys are stored in plain text
- **Backup files are encrypted** with a password you choose, protecting your data even if the file is accessed by others
- Backup encryption uses the same XOR encryption method for consistency

### Data Privacy
- All data is stored locally in the browser
- No data is transmitted to external servers
- User profiles and entries are completely private
- Password reset requires security question verification

### Limitations
- This is a client-side application with local storage
- Data is not automatically synced to the cloud (manual backup required)
- Clearing browser data will remove all entries (unless you have a backup)
- Encryption is basic XOR - not suitable for high-security requirements
- **Important**: Always create backups before switching devices or clearing browser data

## 🐛 Troubleshooting

### Common Issues

**"Failed to load entries" error**
- Check if your secret code is correct
- Try logging out and back in
- Clear browser cache if problems persist

**"No profile found" during password reset**
- Ensure you're using the exact name from your profile
- Check for extra spaces in the name field

**"Incorrect password" or "Failed to decrypt backup"**
- Make sure you're using the exact password you used when creating the backup
- Check for typos or case sensitivity issues
- If you've forgotten your backup password, you cannot restore that backup file
- Always remember or securely store your backup password

**Application not loading**
- Verify Node.js version is 16 or higher
- Clear `node_modules` and run `npm install` again
- Check browser console for error messages

**Install prompt not showing**
- Make sure you're using a supported browser (Chrome, Edge, Safari)
- The app must be served over HTTPS (or localhost for development)
- Clear browser cache and reload
- Check if the app is already installed

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Open an issue on the project repository

---

**My Diary** - Your personal digital journal, secure and beautiful. ✨
